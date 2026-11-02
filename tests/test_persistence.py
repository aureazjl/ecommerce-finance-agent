import unittest
from langgraph.checkpoint.sqlite import SqliteSaver
from agent_graph import build_graph

class PersistenceTests(unittest.TestCase):
    def test_thread_checkpoint_can_resume(self):
        import sqlite3
        with sqlite3.connect(':memory:', check_same_thread=False) as conn:
            saver = SqliteSaver(conn); saver.setup(); graph = build_graph(saver)
            cfg = {'configurable': {'thread_id': 'test-thread'}}
            first = graph.invoke({'question': '昨天按部门统计利润'}, cfg)
            second = graph.invoke({'question': '昨天按产品统计销售额'}, cfg)
            self.assertTrue(first['verified']); self.assertTrue(second['verified']); self.assertEqual(second['intent']['dimension'], '产品')
            self.assertIsNotNone(graph.get_state(cfg).values)

if __name__ == '__main__': unittest.main()
