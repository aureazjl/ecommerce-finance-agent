from typing import Any, TypedDict
from langgraph.graph import END, START, StateGraph
from langgraph.types import interrupt
from engine import ask
from semantic import match_dimension, match_metric, parse_date_range
from config import ENABLE_DEEPSEEK
from model_adapter import OpenAICompatibleModel

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
    if ENABLE_DEEPSEEK and state.get('use_model') and not state.get('model_intent'):
        try:
            model_intent = OpenAICompatibleModel().json([{'role': 'system', 'content': '你是电商财务分析路由器。只返回 JSON，字段只能是 intent，取值 summary、ranking、comparison、diagnosis、trend、report、clarification。'}, {'role': 'user', 'content': q}])
            intent = model_intent.get('intent', intent) if model_intent.get('intent') in {'summary','ranking','comparison','diagnosis','trend','report','clarification'} else intent
        except Exception:
            pass
    return {'intent': {'type': intent}, 'trace': _trace(state, 'router')}

def semantic_node(state):
    q = state['question']; metric, metric_field = match_metric(q); dimension, dimension_field = match_dimension(q); dates = parse_date_range(q)
    intent = {**state.get('intent', {}), 'metric': metric, 'metric_field': metric_field, 'dimension': dimension, 'dimension_field': dimension_field, **dates, 'limit': 10}
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
    result = ask(state['question'], user_name=state.get('user_name', ''))
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
    return {'result': {**result, 'table': rows, 'chart': chart, 'evidence': {'date_range': [intent.get('start_date'), intent.get('end_date')], 'metric': intent.get('metric'), 'dimension': intent.get('dimension')}, 'trace': state.get('trace', []), 'plan': state.get('plan', []), 'policy': state.get('policy', {})}, 'trace': _trace(state, 'render')}

def build_graph(checkpointer=None):
    graph = StateGraph(AgentState)
    for name, node in [('router', router_node), ('semantic', semantic_node), ('planner', planner_node), ('policy', policy_node), ('human_input', human_input_node), ('tool_executor', tool_executor_node), ('verify', verify_node), ('insight', insight_node), ('render', render_node)]: graph.add_node(name, node)
    graph.add_edge(START, 'router'); graph.add_edge('router', 'semantic'); graph.add_edge('semantic', 'planner'); graph.add_edge('planner', 'policy'); graph.add_conditional_edges('policy', lambda s: 'human_input' if not s['policy']['allowed'] else 'tool_executor', {'human_input': 'human_input', 'tool_executor': 'tool_executor'}); graph.add_conditional_edges('human_input', lambda s: 'tool_executor' if s.get('confirmed') else END, {'tool_executor': 'tool_executor', END: END}); graph.add_edge('tool_executor', 'verify'); graph.add_conditional_edges('verify', lambda s: 'insight' if s.get('verified') else END, {'insight': 'insight', END: END}); graph.add_edge('insight', 'render'); graph.add_edge('render', END)
    return graph.compile(checkpointer=checkpointer)

agent_graph = build_graph()
