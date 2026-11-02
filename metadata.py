"""轻量元数据知识层：先用 SQLite，后续可平滑替换为 Qdrant/ES。"""
import sqlite3
from config import DB_PATH

METADATA = {
    'table': 'product_profit_daily',
    'description': '按日记录的电商产品利润明细',
    'columns': {
        'stat_date': '统计日期', 'department': '部门', 'manager': '主管',
        'promotion_leader': '推广组长', 'product_name': '产品名称',
        'actual_sales': '真实销售额', 'operating_cost': '运营成本',
        'goods_cost': '货品成本', 'profit': '利润'
    },
    'metrics': {
        '销售额': 'SUM(actual_sales)', '利润': 'SUM(profit)',
        '运营成本': 'SUM(operating_cost)', '货品成本': 'SUM(goods_cost)',
        '利润率': 'SUM(profit) / NULLIF(SUM(actual_sales), 0)'
    }
}

def latest_data_date():
    with sqlite3.connect(DB_PATH) as db:
        row = db.execute('SELECT MAX(stat_date) FROM product_profit_daily').fetchone()
    return row[0] if row and row[0] else None

def available_dates(limit=30):
    with sqlite3.connect(DB_PATH) as db:
        return [r[0] for r in db.execute('SELECT DISTINCT stat_date FROM product_profit_daily ORDER BY stat_date DESC LIMIT ?', (limit,))]

def knowledge_context():
    return {**METADATA, 'latest_data_date': latest_data_date(), 'available_dates': available_dates()}
