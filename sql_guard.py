"""只读 SQL 审核器，为后续 NL2SQL 接入提供统一安全边界。"""
import re
ALLOWED_TABLES = {'product_profit_daily'}
FORBIDDEN = re.compile(r'\b(insert|update|delete|drop|alter|create|replace|attach|detach|pragma|vacuum)\b|;|--|/\*', re.I)

def validate_readonly_sql(sql):
    text = ' '.join(str(sql or '').strip().split())
    if not text or not text.lower().startswith('select '): raise ValueError('只允许执行SELECT查询')
    if FORBIDDEN.search(text): raise ValueError('SQL包含禁止操作或多语句内容')
    tables = set(re.findall(r'\b(?:from|join)\s+([A-Za-z_][A-Za-z0-9_]*)', text, re.I))
    if not tables.issubset(ALLOWED_TABLES): raise ValueError('SQL访问了未授权数据表')
    if ' limit ' not in f' {text.lower()} ': raise ValueError('查询必须包含LIMIT')
    return text
