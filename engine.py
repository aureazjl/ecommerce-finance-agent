import time
from datetime import date, timedelta
from config import DB_PATH
from semantic import extract_product_keyword, match_dimension, match_metric, parse_date_range
from tools import QueryArgs, aggregate
from audit import record
from metadata import latest_data_date

def _diagnosis(question, query, current_rows):
    keywords = ('为什么', '原因', '下降', '上涨', '变化', '异常', '拖累')
    if not any(x in question for x in keywords): return None
    span = (date.fromisoformat(query.end_date) - date.fromisoformat(query.start_date)).days + 1
    previous_end = date.fromisoformat(query.start_date) - timedelta(days=1)
    previous_start = previous_end - timedelta(days=max(span - 1, 0))
    previous = aggregate(query.model_copy(update={'start_date': previous_start.isoformat(), 'end_date': previous_end.isoformat()}))
    current_total = round(sum(float(x.get('value') or 0) for x in current_rows), 2)
    previous_total = round(sum(float(x.get('value') or 0) for x in previous.get('rows', [])), 2)
    delta = round(current_total - previous_total, 2)
    return {'current': current_total, 'previous': previous_total, 'delta': delta, 'direction': '上升' if delta > 0 else '下降' if delta < 0 else '持平', 'comparison_range': [previous_start.isoformat(), previous_end.isoformat()]}
def ask(question, cookie='', user_name='', normalized_intent=None):
    started = time.perf_counter(); metric_name, metric_field = match_metric(question); dimension_name, dimension_field = match_dimension(question); dates = parse_date_range(question); start, end = dates['start_date'], dates['end_date']
    normalized_intent = normalized_intent or {}
    metric_name = normalized_intent.get('metric', metric_name); metric_field = normalized_intent.get('metric_field', metric_field)
    dimension_name = normalized_intent.get('dimension', dimension_name); dimension_field = normalized_intent.get('dimension_field', dimension_field)
    start = normalized_intent.get('start_date', start); end = normalized_intent.get('end_date', end)
    product_keyword = normalized_intent.get('product_keyword') or extract_product_keyword(question)
    query = QueryArgs(start_date=start, end_date=end, metric=metric_field if metric_field in {'actual_sales', 'profit', 'operating_cost', 'goods_cost', 'total_cost'} else 'profit', dimension=dimension_field, limit=int(normalized_intent.get('limit', 10)), product_keyword=product_keyword)
    data = aggregate(query); result_rows = data['rows']; row_count = sum(int(x.get('rows', 0)) for x in result_rows) if dimension_field else len(result_rows)
    if not dimension_field:
        if metric_field == 'total_cost':
            cost_fields = ('goods_cost', 'operating_cost', 'express_fee', 'onsite_promotion_fee', 'pugongying_fee', 'qianfan_fee', 'content_comment_fee', 'dou_plus_fee', 'props_competitor_fee', 'qa_fee', 'member_fee', 'other_fee')
            total_value = sum(sum(float(x.get(field) or 0) for field in cost_fields) for x in result_rows)
        else:
            total_value = sum(float(x.get(metric_field) or 0) for x in result_rows)
        result_rows = [{'name': metric_name, 'value': round(total_value, 2), 'rows': row_count}]
    total = round(sum(x['value'] for x in result_rows), 2) if dimension_field else result_rows[0]['value']; intent = {'metric': metric_name, 'metric_field': metric_field, 'dimension': dimension_name, 'dimension_field': dimension_field, 'start_date': start, 'end_date': end, 'limit': 10, 'product_keyword': product_keyword}; elapsed = int((time.perf_counter() - started) * 1000)
    diagnosis = _diagnosis(question, query, result_rows)
    ranking = normalized_intent.get('operation') in {'ranking', 'forecast'} and dimension_field
    if not result_rows: answer = f'{start} 至 {end} 没有可分析数据，最近有数据日期为 {latest_data_date() or "无"}。'
    elif ranking:
        top = result_rows[0]
        answer = (f'基于现有历史数据，{start} - {end} 的{dimension_name}{metric_name}最高是 {top["name"]}，数值为 {float(top["value"]):,.2f}。这只是历史表现参考，不代表确定的未来预测。' if normalized_intent.get('operation') == 'forecast' else f'{start} - {end}: {dimension_name} {metric_name} top is {top["name"]}, value {float(top["value"]):,.2f}.')
    elif diagnosis: answer = f'{start} 至 {end}，{metric_name}{diagnosis["direction"]}{abs(diagnosis["delta"]):,.2f}，当前 {diagnosis["current"]:,.2f}，对比期间 {diagnosis["previous"]:,.2f}。'
    else: answer = f'{start} 至 {end}，{metric_name}为 {total:,.2f}。'
    record(user_name, question, intent, 'finance.db:product_profit_daily', row_count, elapsed)
    return {'answer': answer, 'intent': intent, 'rows': result_rows, 'diagnosis': diagnosis, 'source': {'database': 'finance.db', 'table': 'product_profit_daily', 'row_count': row_count, 'duration_ms': elapsed}}
