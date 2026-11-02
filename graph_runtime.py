import sqlite3
from langgraph.checkpoint.sqlite import SqliteSaver
from langgraph.types import Command
from agent_graph import build_graph
from config import CHECKPOINT_DB

_connection = sqlite3.connect(CHECKPOINT_DB, check_same_thread=False)
_checkpointer = SqliteSaver(_connection)
_checkpointer.setup()
agent_graph = build_graph(_checkpointer)

def invoke(question, user_name='', thread_id='default'):
    return agent_graph.invoke({'question': question, 'user_name': user_name}, {'configurable': {'thread_id': thread_id}})

def resume(thread_id, decision):
    return agent_graph.invoke(Command(resume=decision), {'configurable': {'thread_id': thread_id}})
