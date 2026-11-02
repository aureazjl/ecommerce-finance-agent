from typing import Any, TypedDict
from langgraph.graph import END, START, StateGraph
from langgraph.types import interrupt
from engine import ask
from semantic import match_dimension, match_metric, parse_date_range
from config import ENABLE_DEEPSEEK
from model_adapter import OpenAICompatibleModel
from metadata import knowledge_context

class AgentState(TypedDict, total=False):
    question: str
    user_name: str
    intent: dict[str, Any]
    plan: list[str]
    policy: dict[str, Any]
    result: dict[str, Any]
    verified: bool
    answer: str
    errors: list[str]
    confirmed: bool
    trace: list[dict[str, Any]]

def _trace(state, node, status='ok'):
    return [*state.get('trace', []), {'node': node, 'status': status}]

def router_node(state):
    q = state['question']; intent = 'ranking' if any(x in q for x in ('排名', '最高', '最低', '最多', '最少')) else 'summary'
    fallback_intent = {}
    if any(x in q for x in ('\u5356\u5f97\u597d', '\u5356\u5f97\u6700\u597d', '\u7545\u9500', '\u6700\u7545\u9500', '\u70ed\u9500', '\u70ed\u95e8', '\u9500\u91cf', '\u9500\u552e\u8868\u73b0')) or ('\u6700\u597d' in q and dimension_field == 'product_name'):
        intent = 'ranking'; fallback_intent = {'metric': '销售额', 'dimension': '产品', 'operation': 'ranking', 'sort': 'desc'}
    if ENABLE_DEEPSEEK and state.get('use_model') and not state.get('model_intent'):
        try:
            model_intent = OpenAICompatibleModel().json([{'role': 'system', 'content': '你是电商经营分析意图解析器。只返回JSON。字段：intent(summary/ranking/comparison/diagnosis/trend/report/clarification)、metric(销售额/利润/运营成本/货品成本/利润率)、dimension(日期/部门/主管/组长/产品/null)、operation(summary/ranking/comparison/diagnosis/trend)、sort(desc/asc/null)、limit(1-100)、time_type(latest_available/today/yesterday/range/null)、filters(array)。业务语义必须遵守：热门产品、卖得好、畅销、销售表现优先表示按产品销售额；赚钱、盈利、利润贡献表示利润；成本高表示对应成本指标；当前数据、最近数据表示latest_available。不要编造字段。'}, {'role': 'user', 'content': f'问题：{q}\n可用业务元数据：{knowledge_context()}'}])
            intent = model_intent.get('intent', intent) if model_intent.get('intent') in {'summary','ranking','comparison','diagnosis','trend','report','clarification'} else intent
            model_intent['intent'] = intent
            # 对高置信业务词做冲突校验，避免模型把“卖得好/热门”误判为利润。
            if any(x in q for x in ('卖得好', '畅销', '热销', '热门', '销量', '销售表现')):
                model_intent['metric'] = '销售额'; model_intent['operation'] = 'ranking'; model_intent['sort'] = 'desc'
                if not model_intent.get('dimension'): model_intent['dimension'] = '产品'
            return {'intent': {'type': intent}, 'model_intent': model_intent, 'trace': _trace(state, 'router')}
        except Exception:
            pass
    return {'intent': {'type': intent}, 'model_intent': fallback_intent, 'trace': _trace(state, 'router')}

def semantic_node(state):
    q = state['question']; metric, metric_field = match_metric(q); dimension, dimension_field = match_dimension(q); dates = parse_date_range(q)
    model_intent = state.get('model_intent', {})
    if model_intent.get('metric') in {'销售额','利润','运营成本','货品成本','利润率'}:
        metric = model_intent['metric']; metric_field = {'销售额':'actual_sales','利润':'profit','运营成本':'operating_cost','货品成本':'goods_cost','利润率':'profit'}[metric]
    if model_intent.get('dimension') in {'日期','部门','主管','组长','产品'}:
        dimension = model_intent['dimension']; dimension_field = {'日期':'stat_date','部门':'department','主管':'manager','组长':'promotion_leader','产品':'product_name'}[dimension]
    if model_intent.get('time_type') == 'latest_available': dates = parse_date_range('当前数据')
    # 高置信业务表达作为模型输出的最后校验，不扩展成全量关键词规则。
    if any(x in q for x in ('卖得好', '畅销', '热销', '热门', '销量', '销售表现')):
        metric, metric_field = '销售额', 'actual_sales'
        dimension, dimension_field = dimension or '产品', dimension_field or 'product_name'
        model_intent['operation'] = 'ranking'
    if dimension_field == 'product_name' and any(x in q for x in ('哪个', '哪些', '排行', '排名')):
        model_intent['operation'] = 'ranking'
    intent = {**state.get('intent', {}), 'metric': metric, 'metric_field': metric_field, 'dimension': dimension, 'dimension_field': dimension_field, **dates, 'limit': 10}
    intent.update({k: model_intent[k] for k in ('operation','sort','filters') if k in model_intent})
    return {'intent': intent, 'trace': _trace(state, 'semantic')}

def planner_node(state):
    intent = state['intent']; steps = ['读取指定日期范围的利润明细', '按指定维度聚合' if intent.get('dimension_field') else '计算指标汇总', '校验结果并生成解释']
    return {'plan': steps, 'trace': _trace(state, 'planner')}

def policy_node(state):
    risky = any(x in state['question'] for x in ('删除', '导入', '修改', '更新数据', '清空'))
    return {'policy': {'allowed': not risky, 'mode': 'confirmation_required' if risky else 'read_only', 'reason': '高风险操作需要人工确认' if risky else '当前主图仅允许查询'}, 'trace': _trace(state, 'policy')}

def human_input_node(state):
    decision = interrupt({'type': 'confirmation_required', 'question': state['question'], 'message': '该操作可能改变数据，请确认后继续。'})
    return {'confirmed': bool(decision), 'trace': _trace(state, 'human_input')}

def tool_executor_node(state):
    result = ask(state['question'], user_name=state.get('user_name', ''), normalized_intent=state.get('intent', {}))
    return {'result': result, 'trace': _trace(state, 'tool_executor')}

def verify_node(state):
    result = state.get('result', {}); valid = bool(result.get('intent')) and 'rows' in result and 'source' in result
    trace = _trace(state, 'verify', 'ok' if valid else 'failed')
    return {'verified': valid, 'errors': [] if valid else ['结果缺少意图、数据或来源'], 'trace': trace}

def insight_node(state):
    result = state['result']; answer = result['answer']
    if ENABLE_DEEPSEEK and state.get('use_model'):
        try:
            response = OpenAICompatibleModel().chat([{'role': 'system', 'content': '你是电商财务分析助手。只能根据用户问题和给定的真实结果回答，禁止编造数字。用简洁中文说明结论。'}, {'role': 'user', 'content': f"问题：{state['question']}\n真实结果：{result['rows']}\n基础结论：{answer}"}], temperature=0.1)
            answer = response['choices'][0]['message']['content'].strip() or answer
        except Exception:
            pass
    return {'answer': answer, 'result': {**result, 'answer': answer}, 'trace': _trace(state, 'insight')}

def render_node(state):
    result = state['result']; rows = result.get('rows', []); intent = state.get('intent', {}); chart_type = 'bar' if intent.get('dimension_field') else 'metric'
    chart = {'type': chart_type, 'x': 'name', 'y': 'value', 'title': f"{intent.get('metric', '指标')}按{intent.get('dimension') or '时间'}"}
    return {'result': {**result, 'table': rows, 'chart': chart, 'evidence': {'date_range': [intent.get('start_date'), intent.get('end_date')], 'metric': intent.get('metric'), 'dimension': intent.get('dimension')}, 'trace': state.get('trace', []), 'plan': state.get('plan', []), 'policy': state.get('policy', {}), 'confidence': 0.92 if result.get('source', {}).get('row_count', 0) else 0.35}, 'trace': _trace(state, 'render')}

def build_graph(checkpointer=None):
    graph = StateGraph(AgentState)
    for name, node in [('router', router_node), ('semantic', semantic_node), ('planner', planner_node), ('policy', policy_node), ('human_input', human_input_node), ('tool_executor', tool_executor_node), ('verify', verify_node), ('insight', insight_node), ('render', render_node)]: graph.add_node(name, node)
    graph.add_edge(START, 'router'); graph.add_edge('router', 'semantic'); graph.add_edge('semantic', 'planner'); graph.add_edge('planner', 'policy'); graph.add_conditional_edges('policy', lambda s: 'human_input' if not s['policy']['allowed'] else 'tool_executor', {'human_input': 'human_input', 'tool_executor': 'tool_executor'}); graph.add_conditional_edges('human_input', lambda s: 'tool_executor' if s.get('confirmed') else END, {'tool_executor': 'tool_executor', END: END}); graph.add_edge('tool_executor', 'verify'); graph.add_conditional_edges('verify', lambda s: 'insight' if s.get('verified') else END, {'insight': 'insight', END: END}); graph.add_edge('insight', 'render'); graph.add_edge('render', END)
    return graph.compile(checkpointer=checkpointer)

agent_graph = build_graph()
