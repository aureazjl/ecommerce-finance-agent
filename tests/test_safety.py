import unittest
from langgraph.types import Command
from graph_runtime import agent_graph

class SafetyTests(unittest.TestCase):
    def test_risky_request_interrupts(self):
        result = agent_graph.invoke({'question': '删除昨天数据', 'user_name': 'test'}, {'configurable': {'thread_id': 'risk-test'}})
        self.assertTrue(result.get('__interrupt__'))

    def test_rejected_request_does_not_execute(self):
        cfg = {'configurable': {'thread_id': 'risk-reject'}}
        agent_graph.invoke({'question': '删除昨天数据', 'user_name': 'test'}, cfg)
        result = agent_graph.invoke(Command(resume=False), cfg)
        self.assertNotIn('result', result)

if __name__ == '__main__': unittest.main()
