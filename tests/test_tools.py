import unittest
from pydantic import ValidationError
from tools import QueryArgs, aggregate

class ToolTests(unittest.TestCase):
    def test_query_args_defaults(self):
        args = QueryArgs(start_date='2026-10-27', end_date='2026-10-27'); self.assertEqual(args.metric, 'profit'); self.assertEqual(args.limit, 10)
    def test_dimension_allowed(self): self.assertEqual(QueryArgs(start_date='2026-10-27', end_date='2026-10-27', dimension='department').dimension, 'department')
    def test_dimension_blocked(self):
        with self.assertRaises(ValidationError): QueryArgs(start_date='2026-10-27', end_date='2026-10-27', dimension='users')
    def test_limit_lower_bound(self):
        with self.assertRaises(ValidationError): QueryArgs(start_date='2026-10-27', end_date='2026-10-27', limit=0)
    def test_limit_upper_bound(self):
        with self.assertRaises(ValidationError): QueryArgs(start_date='2026-10-27', end_date='2026-10-27', limit=101)
    def test_date_order(self):
        with self.assertRaises(ValidationError): QueryArgs(start_date='2026-10-28', end_date='2026-10-27')
    def test_metric_blocked(self):
        with self.assertRaises(ValidationError): QueryArgs(start_date='2026-10-27', end_date='2026-10-27', metric='password')
    def test_aggregate_returns_contract(self):
        result = aggregate(QueryArgs(start_date='2026-10-27', end_date='2026-10-27', dimension='department')); self.assertIn('rows', result); self.assertEqual(result['dimension'], 'department')

if __name__ == '__main__': unittest.main()
