METRICS = {
    '销售额': {'field': 'actual_sales', 'aliases': ['销售额', '销售', '营业额', '成交额']},
    '利润': {'field': 'profit', 'aliases': ['利润', '净利润', '盈利']},
    '运营成本': {'field': 'operating_cost', 'aliases': ['运营成本', '运营费']},
}
DIMENSIONS = {
    '日期': {'field': 'stat_date', 'aliases': ['日期', '每天', '按天']},
    '部门': {'field': 'department', 'aliases': ['部门']},
    '主管': {'field': 'manager', 'aliases': ['主管']},
    '组长': {'field': 'promotion_leader', 'aliases': ['组长', '推广组长']},
    '产品': {'field': 'product_name', 'aliases': ['产品', '商品']},
}
def match_metric(question):
    for name, item in METRICS.items():
        if any(alias in question for alias in item['aliases']): return name, item['field']
    return '利润', 'profit'
def match_dimension(question):
    for name, item in DIMENSIONS.items():
        if any(alias in question for alias in item['aliases']): return name, item['field']
    return None, None
def catalog(): return {'metrics': METRICS, 'dimensions': DIMENSIONS}
