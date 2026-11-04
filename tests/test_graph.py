import unittest
from agent_graph import agent_graph

class GraphTests(unittest.TestCase):
    def test_graph_builds_and_runs(self):
        result = agent_graph.invoke({'question': '昨天按部门统计利润', 'user_name': 'test'})
        self.assertTrue(result['verified'])
        self.assertEqual(result['intent']['dimension'], '部门')
        self.assertEqual(result['intent']['metric'], '利润')
        self.assertGreaterEqual(len(result['trace']), 8)
        self.assertIn('chart', result['result'])
        self.assertIn('evidence', result['result'])

    def test_product_intent(self):
        result = agent_graph.invoke({'question': '昨天销售额按产品排名', 'user_name': 'test'})
        self.assertEqual(result['intent']['dimension'], '产品')
        self.assertEqual(result['intent']['metric'], '销售额')
        self.assertEqual(result['intent']['type'], 'ranking')

    def test_unrelated_question_does_not_query(self):
        result = agent_graph.invoke({'question': '今天北京天气怎么样', 'user_name': 'test'})
        self.assertFalse(result['relevant'])
        self.assertEqual(result['result']['source']['row_count'], 0)
        self.assertEqual(result['result']['rows'], [])

    def test_profit_chart_defaults_to_product_dimension(self):
        result = agent_graph.invoke({'question': '给我一个利润的柱形图还有表格', 'user_name': 'test'})
        self.assertEqual(result['intent']['metric'], '利润')
        self.assertEqual(result['intent']['dimension'], '产品')
        self.assertEqual(result['result']['chart']['type'], 'bar')
        self.assertGreater(len(result['result']['table']), 0)

    def test_product_sales_alias(self):
        result = agent_graph.invoke({'question': '哪个香水销量好', 'user_name': 'test'})
        self.assertTrue(result['relevant'])
        self.assertEqual(result['intent']['metric'], '销售额')
        self.assertEqual(result['intent']['dimension'], '产品')
        self.assertEqual(result['intent']['operation'], 'ranking')
        self.assertEqual(result['intent']['product_keyword'], '香水')
        self.assertTrue(result['result']['table'])
        self.assertTrue(all('香水' in row['name'] for row in result['result']['table']))

    def test_date_question_selects_line_chart(self):
        result = agent_graph.invoke({'question': '最近7天每天利润趋势', 'user_name': 'test'})
        self.assertEqual(result['result']['chart']['type'], 'line')

if __name__ == '__main__': unittest.main()
