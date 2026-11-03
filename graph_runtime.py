import sqlite3
import time
from langgraph.checkpoint.sqlite import SqliteSaver
from langgraph.types import Command
from agent_graph import build_graph
from config import CHECKPOINT_DB

_connection = sqlite3.connect(CHECKPOINT_DB, check_same_thread=False)
_checkpointer = SqliteSaver(_connection)
_checkpointer.setup()
agent_graph = build_graph(_checkpointer)

def invoke(question, user_name='', thread_id='default', use_model=False):
    config = {'configurable': {'thread_id': thread_id}}
    previous = agent_graph.get_state(config).values or {}
    prior_intent = previous.get('intent', {})
    context = f"上一轮问题：{previous.get('question', '')}；上一轮分析：指标={prior_intent.get('metric', '')}，维度={prior_intent.get('dimension', '')}，日期={prior_intent.get('start_date', '')}至{prior_intent.get('end_date', '')}"
    return agent_graph.invoke({'question': question, 'user_name': user_name, 'use_model': use_model, 'conversation_context': context, 'previous_intent': prior_intent, 'trace': [], 'started_at': time.perf_counter()}, config)

def invoke_stream(question, user_name='', thread_id='default', use_model=False):
    """Stream only the five user-facing phases from real LangGraph updates."""
    config = {'configurable': {'thread_id': thread_id}}
    previous = agent_graph.get_state(config).values or {}
    prior_intent = previous.get('intent', {})
    context = f"上一轮问题：{previous.get('question', '')}；上一轮分析：指标={prior_intent.get('metric', '')}，维度={prior_intent.get('dimension', '')}，日期={prior_intent.get('start_date', '')}至{prior_intent.get('end_date', '')}"
    initial = {'question': question, 'user_name': user_name, 'use_model': use_model, 'conversation_context': context, 'previous_intent': prior_intent, 'trace': [], 'started_at': time.perf_counter()}
    phase = {'router': '理解问题', 'semantic': '理解问题', 'intent_validate': '生成分析计划', 'planner': '生成分析计划', 'policy': '生成分析计划', 'tool_executor': '查询业务数据', 'verify': '校验结果', 'insight': '生成结论', 'render': '生成结论'}
    iterator = agent_graph.stream(initial, config, stream_mode='updates')
    current = None
    started = None
    for update in iterator:
        actual = next(iter(update), '') if isinstance(update, dict) else ''
        label = phase.get(actual)
        if not label:
            continue
        now = time.perf_counter()
        if label != current:
            if current is not None:
                yield {'type': 'progress', 'stage': current, 'status': 'done', 'duration_ms': round((now - started) * 1000)}
            current, started = label, now
            yield {'type': 'progress', 'stage': current, 'status': 'running'}
    if current is not None:
        yield {'type': 'progress', 'stage': current, 'status': 'done', 'duration_ms': round((time.perf_counter() - started) * 1000)}
    yield {'type': 'final', 'result': agent_graph.get_state(config).values}

def resume(thread_id, decision):
    return agent_graph.invoke(Command(resume=decision), {'configurable': {'thread_id': thread_id}})
