import time
from config import DB_PATH
from semantic import match_dimension, match_metric, parse_date_range
from tools import QueryArgs, aggregate
from audit import record
def ask(question, cookie='', user_name='', normalized_intent=None):
    started = time.perf_counter(); metric_name, metric_field = match_metric(question); dimension_name, dimension_field = match_dimension(question); dates = parse_date_range(question); start, end = dates['start_date'], dates['end_date']
    normalized_intent = normalized_intent or {}
    metric_name = normalized_intent.get('metric', metric_name); metric_field = normalized_intent.get('metric_field', metric_field)
    dimension_name = normalized_intent.get('dimension', dimension_name); dimension_field = normalized_intent.get('dimension_field', dimension_field)
    start = normalized_intent.get('start_date', start); end = normalized_intent.get('end_date', end)
    query = QueryArgs(start_date=start, end_date=end, metric=metric_field if metric_field in {'actual_sales', 'profit', 'operating_cost', 'goods_cost'} else 'profit', dimension=dimension_field, limit=int(normalized_intent.get('limit', 10)))
    data = aggregate(query); result_rows = data['rows']; row_count = sum(int(x.get('rows', 0)) for x in result_rows) if dimension_field else len(result_rows)
    if not dimension_field: result_rows = [{'name': metric_name, 'value': round(sum(float(x.get(metric_field) or 0) for x in result_rows), 2), 'rows': row_count}]
    total = round(sum(x['value'] for x in result_rows), 2) if dimension_field else result_rows[0]['value']; intent = {'metric': metric_name, 'metric_field': metric_field, 'dimension': dimension_name, 'dimension_field': dimension_field, 'start_date': start, 'end_date': end, 'limit': 10}; elapsed = int((time.perf_counter() - started) * 1000)
    record(user_name, question, intent, 'finance.db:product_profit_daily', row_count, elapsed)
    return {'answer': f'{start} 至 {end}，{metric_name}为 {total:,.2f}。', 'intent': intent, 'rows': result_rows, 'source': {'database': 'finance.db', 'table': 'product_profit_daily', 'row_count': row_count, 'duration_ms': elapsed}}
