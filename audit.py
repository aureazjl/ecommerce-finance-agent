import json, sqlite3
from datetime import datetime
from config import AUDIT_DB
def init_audit():
    with sqlite3.connect(AUDIT_DB) as c:
        c.execute('''CREATE TABLE IF NOT EXISTS agent_audit (id INTEGER PRIMARY KEY, user_name TEXT, question TEXT NOT NULL, intent_json TEXT, source_path TEXT, row_count INTEGER DEFAULT 0, duration_ms INTEGER DEFAULT 0, status TEXT, created_at TEXT NOT NULL)''')
        c.execute('''CREATE TABLE IF NOT EXISTS agent_saved_queries (id INTEGER PRIMARY KEY, user_name TEXT, title TEXT NOT NULL, question TEXT NOT NULL, result_json TEXT NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL)''')
def record(user_name, question, intent, source_path, row_count, duration_ms, status='success'):
    init_audit()
    with sqlite3.connect(AUDIT_DB) as c: c.execute('INSERT INTO agent_audit(user_name,question,intent_json,source_path,row_count,duration_ms,status,created_at) VALUES(?,?,?,?,?,?,?,?)', (user_name, question, json.dumps(intent, ensure_ascii=False), source_path, row_count, duration_ms, status, datetime.now().isoformat(timespec='seconds')))
def recent(limit=20):
    init_audit()
    with sqlite3.connect(AUDIT_DB) as c:
        c.row_factory = sqlite3.Row
        return [dict(row) for row in c.execute('SELECT * FROM agent_audit ORDER BY id DESC LIMIT ?', (limit,))]
def save_query(user_name, title, question, result):
    init_audit()
    now = datetime.now().isoformat(timespec='seconds')
    with sqlite3.connect(AUDIT_DB) as c:
        c.execute('INSERT INTO agent_saved_queries(user_name,title,question,result_json,created_at,updated_at) VALUES(?,?,?,?,?,?)', (user_name, title, question, json.dumps(result, ensure_ascii=False), now, now))
def saved_queries(user_name='', limit=50):
    init_audit()
    with sqlite3.connect(AUDIT_DB) as c:
        c.row_factory = sqlite3.Row
        query = 'SELECT id,user_name,title,question,result_json,created_at,updated_at FROM agent_saved_queries WHERE user_name=? OR ?="" ORDER BY id DESC LIMIT ?'
        return [dict(row) for row in c.execute(query, (user_name, user_name, limit))]
