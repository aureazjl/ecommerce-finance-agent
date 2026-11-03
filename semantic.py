import re
import json
import os
from datetime import date, timedelta
from metadata import latest_data_date

METRICS = {
    '销售额': {'field': 'actual_sales', 'aliases': ['销售额', '销售', '营业额', '成交额', '实收销售额'], 'aggregation': 'sum', 'unit': '元'},
    '利润': {'field': 'profit', 'aliases': ['利润', '净利润', '盈利', '赚了多少'], 'aggregation': 'sum', 'unit': '元'},
    '运营成本': {'field': 'operating_cost', 'aliases': ['运营成本', '运营费', '运营费用'], 'aggregation': 'sum', 'unit': '元'},
    '货品成本': {'field': 'goods_cost', 'aliases': ['货品成本', '商品成本', '进货成本'], 'aggregation': 'sum', 'unit': '元'},
    '总成本': {'field': 'total_cost', 'aliases': ['成本', '总成本', '全部成本', '所有费用', '费用合计'], 'aggregation': 'sum', 'unit': '元'},
    '利润率': {'field': 'profit', 'aliases': ['利润率', '净利率'], 'aggregation': 'margin', 'unit': '%', 'numerator': 'profit', 'denominator': 'actual_sales'},
}

DIMENSIONS = {
    '日期': {'field': 'stat_date', 'aliases': ['日期', '每天', '按天', '每日']},
    '部门': {'field': 'department', 'aliases': ['部门', '团队']},
    '主管': {'field': 'manager', 'aliases': ['主管', '负责人']},
    '组长': {'field': 'promotion_leader', 'aliases': ['组长', '推广组长', '推广负责人']},
    '产品': {'field': 'product_name', 'aliases': ['产品', '商品', '产品名称']},
}

DATE_ALIASES = {'昨天': 'yesterday', '昨日': 'yesterday', '前一天': 'yesterday', '今天': 'today', '今日': 'today'}
CATALOG_PATH = os.path.join(os.path.dirname(__file__), 'semantic_catalog.json')

def normalize_question(question):
    return re.sub(r'\s+', '', str(question or '').strip()).lower()

def match_metric(question):
    question = normalize_question(question)
    for name, item in METRICS.items():
        if any(alias in question for alias in item['aliases']): return name, item['field']
    return '利润', 'profit'

def match_dimension(question):
    question = normalize_question(question)
    for name, item in DIMENSIONS.items():
        if any(alias in question for alias in item['aliases']): return name, item['field']
    return None, None

def parse_date_range(question, today=None):
    question = normalize_question(question); today = today or date.today()
    if any(x in question for x in ('当前数据', '最新数据', '最近数据', '目前数据')):
        latest = latest_data_date()
        if latest: return {'start_date': latest, 'end_date': latest, 'source': 'latest_available'}
    found = [x.replace('/', '-') for x in re.findall(r'20\d{2}[-/]\d{1,2}[-/]\d{1,2}', question)]
    if len(found) >= 2: return {'start_date': found[0], 'end_date': found[1], 'source': 'explicit'}
    if len(found) == 1: return {'start_date': found[0], 'end_date': found[0], 'source': 'explicit'}
    if '近30天' in question or '最近30天' in question: end = today - timedelta(days=1); return {'start_date': (end - timedelta(days=29)).isoformat(), 'end_date': end.isoformat(), 'source': 'relative'}
    if any(x in question for x in ('近7天', '最近7天', '近七天', '最近七天', '近一周', '最近一周')): end = today - timedelta(days=1); return {'start_date': (end - timedelta(days=6)).isoformat(), 'end_date': end.isoformat(), 'source': 'relative'}
    if '本月' in question: return {'start_date': today.replace(day=1).isoformat(), 'end_date': today.isoformat(), 'source': 'relative'}
    key = next((key for key in DATE_ALIASES if key in question), '昨天')
    target = today if DATE_ALIASES[key] == 'today' else today - timedelta(days=1)
    return {'start_date': target.isoformat(), 'end_date': target.isoformat(), 'source': 'relative'}

def metric_definition(name): return METRICS[name]
def dimension_definition(name): return DIMENSIONS[name]
def catalog():
    try:
        with open(CATALOG_PATH, encoding='utf-8') as f: business = json.load(f)
    except (OSError, json.JSONDecodeError): business = {}
    return {'metrics': METRICS, 'dimensions': DIMENSIONS, 'date_aliases': DATE_ALIASES, 'business_catalog': business}
