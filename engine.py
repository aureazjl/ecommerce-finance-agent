import re, time, sqlite3
from datetime import date, timedelta
from config import DB_PATH
from semantic import match_dimension, match_metric
from audit import record
def yesterday(): return (date.today() - timedelta(days=1)).isoformat()
def resolve_dates(question):
    found = re.findall(r'20\d{2}[-/]\d{1,2}[-/]\d{1,2}', question); found = [x.replace('/', '-') for x in found]
    if len(found) >= 2: return found[0], found[1]
    if '近7天' in question or '最近7天' in question:
        end = date.today() - timedelta(days=1); return (end - timedelta(days=6)).isoformat(), end.isoformat()
    if '今天' in question: return date.today().isoformat(), date.today().isoformat()
    return yesterday(), yesterday()
def ask(question, cookie='', user_name=''):
    started = time.perf_counter(); metric_name, metric_field = match_metric(question); dimension_name, dimension_field = match_dimension(question); start, end = resolve_dates(question)
    with sqlite3.connect(DB_PATH) as db:
        db.row_factory = sqlite3.Row
        rows = [dict(x) for x in db.execute('SELECT * FROM product_profit_daily WHERE stat_date>=? AND stat_date<=? ORDER BY stat_date DESC, id', (start, end)).fetchall()]
    if dimension_field:
        groups = {}
        for row in rows:
            key = row.get(dimension_field) or '未分类'; item = groups.setdefault(key, {'name': key, 'value': 0, 'rows': 0}); item['value'] += float(row.get(metric_field) or 0); item['rows'] += 1
        result_rows = sorted(groups.values(), key=lambda x: x['value'], reverse=True)[:10]
    else: result_rows = [{'name': metric_name, 'value': round(sum(float(x.get(metric_field) or 0) for x in rows), 2), 'rows': len(rows)}]
    total = round(sum(x['value'] for x in result_rows), 2) if dimension_field else result_rows[0]['value']; intent = {'metric': metric_name, 'metric_field': metric_field, 'dimension': dimension_name, 'dimension_field': dimension_field, 'start_date': start, 'end_date': end, 'limit': 10}; elapsed = int((time.perf_counter() - started) * 1000)
    record(user_name, question, intent, 'finance.db:product_profit_daily', len(rows), elapsed)
    return {'answer': f'{start} 至 {end}，{metric_name}为 {total:,.2f}。', 'intent': intent, 'rows': result_rows, 'source': {'database': 'finance.db', 'table': 'product_profit_daily', 'row_count': len(rows), 'duration_ms': elapsed}}
