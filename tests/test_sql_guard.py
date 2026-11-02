import unittest
from sql_guard import validate_readonly_sql

class SqlGuardTests(unittest.TestCase):
    def test_allows_bounded_select(self):
        self.assertIn('SELECT', validate_readonly_sql('SELECT product_name FROM product_profit_daily LIMIT 10'))
    def test_rejects_write(self):
        with self.assertRaises(ValueError): validate_readonly_sql('DELETE FROM product_profit_daily LIMIT 1')
    def test_rejects_unknown_table(self):
        with self.assertRaises(ValueError): validate_readonly_sql('SELECT * FROM users LIMIT 10')

if __name__ == '__main__': unittest.main()
