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

def resume(thread_id, decision):
    return agent_graph.invoke(Command(resume=decision), {'configurable': {'thread_id': thread_id}})
