from typing import Any, TypedDict
import time
from langgraph.graph import END, START, StateGraph
from langgraph.types import interrupt
from engine import ask
from semantic import match_dimension, match_metric, parse_date_range
from config import ENABLE_DEEPSEEK
from model_adapter import OpenAICompatibleModel
from metadata import knowledge_context

def _has_explicit_time(question):
    q = question or ''
    return any(x in q for x in ('今天', '今日', '昨天', '昨日', '前一天', '近7天', '最近7天', '近七天', '最近七天', '近一周', '最近一周', '近30天', '最近30天', '本月', '202'))

def _is_follow_up(question):
    q = ''.join((question or '').split())
    return q in {'为什么', '为何', '原因', '怎么回事', '为什么这样', '为什么会这样'}

def _apply_business_constraints(question, intent):
    """只校正高置信业务同义表达，避免模型偶发把“畅销”误判为利润。"""
    q = question or ''
    if any(x in q for x in ('畅销', '卖得好', '卖得最好', '销量最好', '销量最高', '热销', '热门商品', '热门产品')):
        intent.update(metric='销售额', metric_field='actual_sales', dimension='产品', dimension_field='product_name', operation='ranking', sort='desc')
    if any(x in q for x in ('最赚钱', '赚钱最多', '利润最高', '盈利最好')):
        intent.update(metric='利润', metric_field='profit', dimension='产品', dimension_field='product_name', operation='ranking', sort='desc')
    return intent

class AgentState(TypedDict, total=False):
    question: str
    user_name: str
    use_model: bool
    model_intent: dict[str, Any]
    model_status: str
    started_at: float
    conversation_context: str
    previous_intent: dict[str, Any]
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
    elapsed = round((time.perf_counter() - state.get('started_at', time.perf_counter())) * 1000, 1)
    return [*state.get('trace', []), {'node': node, 'status': status, 'duration_ms': elapsed}]

def router_node(state):
    q = state['question']; intent = 'ranking' if any(x in q for x in ('排名', '最高', '最低', '最多', '最少')) else 'summary'
    if ENABLE_DEEPSEEK and state.get('use_model') and not state.get('model_intent'):
        try:
            model_intent = OpenAICompatibleModel().json([{'role': 'system', 'content': '你是企业经营分析规划器，不是关键词分类器。把任意自然语言问题转换为可执行的结构化分析计划，只返回JSON。字段：intent(summary/ranking/comparison/diagnosis/trend/report/clarification)、metric(销售额/利润/运营成本/货品成本/利润率)、dimension(日期/部门/主管/组长/产品/null)、operation(summary/ranking/comparison/diagnosis/trend)、sort(desc/asc/null)、limit(1-100)、time_type(latest_available/today/yesterday/range/null)、filters(array)、steps(array)。根据语义推断，不要求用户使用字段原名。例：哪个产品畅销/卖得好的商品/热门商品 -> 产品+销售额+ranking；哪个产品最赚钱 -> 产品+利润+ranking；为什么利润下降 -> 利润+diagnosis；最近表现 -> latest_available。若本轮问题省略了主体，继承会话上下文。不要编造业务字段。'}, {'role': 'user', 'content': f'问题：{q}\n会话上下文：{state.get("conversation_context", "无")}\n可用业务元数据：{knowledge_context()}'}])
            intent = model_intent.get('intent', intent) if model_intent.get('intent') in {'summary','ranking','comparison','diagnosis','trend','report','clarification'} else intent
            model_intent['intent'] = intent
            return {'intent': {'type': intent}, 'model_intent': model_intent, 'model_status': 'called', 'trace': _trace(state, 'router[DeepSeek]')}
        except Exception:
            return {'intent': {'type': intent}, 'model_intent': {}, 'model_status': 'fallback', 'trace': _trace(state, 'router[本地兜底]','fallback')}
    return {'intent': {'type': intent}, 'model_intent': {}, 'model_status': 'disabled', 'trace': _trace(state, 'router[本地兜底]','fallback')}

def semantic_node(state):
    q = state['question']; metric, metric_field = match_metric(q); dimension, dimension_field = match_dimension(q); dates = parse_date_range(q)
    previous = state.get('previous_intent', {})
    if _is_follow_up(q) and previous:
        metric = previous.get('metric', metric); metric_field = previous.get('metric_field', metric_field); dimension = previous.get('dimension', dimension); dimension_field = previous.get('dimension_field', dimension_field)
        dates = {k: previous[k] for k in ('start_date', 'end_date') if k in previous} | {'source': 'conversation'}
    model_intent = state.get('model_intent', {})
    if model_intent.get('metric') in {'销售额','利润','运营成本','货品成本','利润率'}:
        metric = model_intent['metric']; metric_field = {'销售额':'actual_sales','利润':'profit','运营成本':'operating_cost','货品成本':'goods_cost','利润率':'profit'}[metric]
    if model_intent.get('dimension') in {'日期','部门','主管','组长','产品'}:
        dimension = model_intent['dimension']; dimension_field = {'日期':'stat_date','部门':'department','主管':'manager','组长':'promotion_leader','产品':'product_name'}[dimension]
    if not _has_explicit_time(q): dates = parse_date_range('当前数据')
    # 高置信业务表达作为模型输出的最后校验，不扩展成全量关键词规则。
    intent = {**state.get('intent', {}), 'metric': metric, 'metric_field': metric_field, 'dimension': dimension, 'dimension_field': dimension_field, **dates, 'limit': 10}
    intent.update({k: model_intent[k] for k in ('operation','sort','filters') if k in model_intent})
    if _is_follow_up(q) and previous: intent.update(metric=metric, metric_field=metric_field, dimension=dimension, dimension_field=dimension_field, operation='diagnosis', start_date=previous.get('start_date', intent['start_date']), end_date=previous.get('end_date', intent['end_date']))
    return {'intent': _apply_business_constraints(q, intent), 'trace': _trace(state, 'semantic')}

def planner_node(state):
    intent = state['intent']; steps = ['读取指定日期范围的利润明细', '按指定维度聚合' if intent.get('dimension_field') else '计算指标汇总', '校验结果并生成解释']
    return {'plan': steps, 'trace': _trace(state, 'planner')}

def intent_validate_node(state):
    intent = dict(state.get('intent', {}))
    if ENABLE_DEEPSEEK and state.get('use_model'):
        try:
            corrected = OpenAICompatibleModel().json([{'role': 'system', 'content': '你是最终分析计划校验器。检查用户问题和候选计划是否匹配，只返回JSON：metric、dimension、operation、sort、time_type、limit、filters。把卖得最好、畅销、热门理解为产品销售额排名；把赚钱、盈利理解为产品利润排名；把为什么、原因、下降理解为诊断分析。没有明确日期时使用latest_available。'}, {'role': 'user', 'content': f'用户问题：{state["question"]}\n候选计划：{intent}'}])
            metrics = {'销售额':'actual_sales','利润':'profit','运营成本':'operating_cost','货品成本':'goods_cost','利润率':'profit'}; dims = {'日期':'stat_date','部门':'department','主管':'manager','组长':'promotion_leader','产品':'product_name'}
            if corrected.get('metric') in metrics: intent.update(metric=corrected['metric'], metric_field=metrics[corrected['metric']])
            if corrected.get('dimension') in dims: intent.update(dimension=corrected['dimension'], dimension_field=dims[corrected['dimension']])
            for key in ('operation','sort','filters'):
                if key in corrected: intent[key] = corrected[key]
            # 日期必须尊重用户原话。模型若把“近七天”误判成 latest_available，不能覆盖已解析的相对日期。
            if not _has_explicit_time(state['question']) and corrected.get('time_type') in (None, 'latest_available'):
                intent.update(parse_date_range('当前数据'))
            elif _has_explicit_time(state['question']):
                intent.update(parse_date_range(state['question']))
        except Exception:
            pass
    previous = state.get('previous_intent', {})
    if _is_follow_up(state['question']) and previous: intent.update(metric=previous.get('metric', intent.get('metric')), metric_field=previous.get('metric_field', intent.get('metric_field')), dimension=previous.get('dimension'), dimension_field=previous.get('dimension_field'), start_date=previous.get('start_date'), end_date=previous.get('end_date'), operation='diagnosis')
    return {'intent': _apply_business_constraints(state['question'], intent), 'trace': _trace(state, 'intent_validate[DeepSeek]' if ENABLE_DEEPSEEK and state.get('use_model') else 'intent_validate[本地]')}

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
    follow_ups = [f'为什么{intent.get("metric", "指标")}会这样？', '按部门重新比较', '查看明细数据']
    return {'result': {**result, 'question': state.get('question', ''), 'table': rows, 'chart': chart, 'evidence': {'date_range': [intent.get('start_date'), intent.get('end_date')], 'metric': intent.get('metric'), 'dimension': intent.get('dimension')}, 'model': {'provider': 'DeepSeek' if state.get('model_status') == 'called' else 'local_fallback', 'status': state.get('model_status', 'unknown')}, 'model_status': state.get('model_status', 'unknown'), 'trace': state.get('trace', []), 'plan': state.get('plan', []), 'policy': state.get('policy', {}), 'follow_ups': follow_ups, 'confidence': 0.92 if result.get('source', {}).get('row_count', 0) else 0.35}, 'trace': _trace(state, 'render')}

def build_graph(checkpointer=None):
    graph = StateGraph(AgentState)
    for name, node in [('router', router_node), ('semantic', semantic_node), ('intent_validate', intent_validate_node), ('planner', planner_node), ('policy', policy_node), ('human_input', human_input_node), ('tool_executor', tool_executor_node), ('verify', verify_node), ('insight', insight_node), ('render', render_node)]: graph.add_node(name, node)
    graph.add_edge(START, 'router'); graph.add_edge('router', 'semantic'); graph.add_edge('semantic', 'intent_validate'); graph.add_edge('intent_validate', 'planner'); graph.add_edge('planner', 'policy'); graph.add_conditional_edges('policy', lambda s: 'human_input' if not s['policy']['allowed'] else 'tool_executor', {'human_input': 'human_input', 'tool_executor': 'tool_executor'}); graph.add_conditional_edges('human_input', lambda s: 'tool_executor' if s.get('confirmed') else END, {'tool_executor': 'tool_executor', END: END}); graph.add_edge('tool_executor', 'verify'); graph.add_conditional_edges('verify', lambda s: 'insight' if s.get('verified') else END, {'insight': 'insight', END: END}); graph.add_edge('insight', 'render'); graph.add_edge('render', END)
    return graph.compile(checkpointer=checkpointer)

agent_graph = build_graph()
