import json, sqlite3
from datetime import datetime
from config import AUDIT_DB
def init_audit():
    with sqlite3.connect(AUDIT_DB) as c: c.execute('''CREATE TABLE IF NOT EXISTS agent_audit (id INTEGER PRIMARY KEY, user_name TEXT, question TEXT NOT NULL, intent_json TEXT, source_path TEXT, row_count INTEGER DEFAULT 0, duration_ms INTEGER DEFAULT 0, status TEXT, created_at TEXT NOT NULL)''')
def record(user_name, question, intent, source_path, row_count, duration_ms, status='success'):
    with sqlite3.connect(AUDIT_DB) as c: c.execute('INSERT INTO agent_audit(user_name,question,intent_json,source_path,row_count,duration_ms,status,created_at) VALUES(?,?,?,?,?,?,?,?)', (user_name, question, json.dumps(intent, ensure_ascii=False), source_path, row_count, duration_ms, status, datetime.now().isoformat(timespec='seconds')))
def recent(limit=20):
    with sqlite3.connect(AUDIT_DB) as c:
        c.row_factory = sqlite3.Row
        return [dict(row) for row in c.execute('SELECT * FROM agent_audit ORDER BY id DESC LIMIT ?', (limit,))]
