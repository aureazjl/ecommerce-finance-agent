import unittest
from agent_graph import agent_graph

class GraphTests(unittest.TestCase):
    def test_graph_builds_and_runs(self):
        result = agent_graph.invoke({'question': '昨天按部门统计利润', 'user_name': 'test'})
        self.assertTrue(result['verified'])
        self.assertEqual(result['intent']['dimension'], '部门')
        self.assertEqual(result['intent']['metric'], '利润')
        self.assertGreaterEqual(len(result['trace']), 8)

    def test_product_intent(self):
        result = agent_graph.invoke({'question': '昨天销售额按产品排名', 'user_name': 'test'})
        self.assertEqual(result['intent']['dimension'], '产品')
        self.assertEqual(result['intent']['metric'], '销售额')
        self.assertEqual(result['intent']['type'], 'ranking')

if __name__ == '__main__': unittest.main()
