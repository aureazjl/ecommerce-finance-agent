import json
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlparse
from config import AGENT_HOST, AGENT_PORT
from audit import init_audit, recent
from graph_runtime import invoke, resume
from semantic import catalog
from metadata import knowledge_context

def _interrupt_payload(result):
    items = result.get('__interrupt__') or []
    if not items: return None
    value = getattr(items[0], 'value', items[0])
    return value if isinstance(value, dict) else {'message': str(value)}

def _public_result(result):
    payload = {'ok': True, **result.get('result', {}), 'trace': result.get('trace', [])}
    interrupt_value = _interrupt_payload(result)
    if interrupt_value: payload['interrupt'] = interrupt_value
    return payload

def _report_markdown(payload):
    rows = payload.get('table', payload.get('rows', []))
    lines = ['# 智能经营分析报告', '', f"结论：{payload.get('answer', '')}", '', '| 名称 | 数值 | 行数 |', '|---|---:|---:|']
    lines += [f"| {r.get('name','')} | {r.get('value', 0)} | {r.get('rows','-')} |" for r in rows]
    return '\n'.join(lines)

class Handler(BaseHTTPRequestHandler):
    def json(self, value, status=200):
        body = json.dumps(value, ensure_ascii=False).encode('utf-8')
        self.send_response(status); self.send_header('Content-Type', 'application/json; charset=utf-8'); self.send_header('Access-Control-Allow-Origin', 'http://127.0.0.1:5173'); self.send_header('Access-Control-Allow-Credentials', 'true'); self.send_header('Content-Length', str(len(body))); self.end_headers(); self.wfile.write(body)
    def do_OPTIONS(self):
        self.send_response(204); self.send_header('Access-Control-Allow-Origin', 'http://127.0.0.1:5173'); self.send_header('Access-Control-Allow-Credentials', 'true'); self.send_header('Access-Control-Allow-Headers', 'Content-Type'); self.send_header('Access-Control-Allow-Methods', 'GET,POST,OPTIONS'); self.end_headers()
    def do_GET(self):
        path = urlparse(self.path).path
        if path == '/api/health': return self.json({'ok': True, 'service': 'ecommerce-finance-agent', 'version': '2.0'})
        if path == '/api/agent/catalog': return self.json(catalog())
        if path == '/api/agent/metadata': return self.json(knowledge_context())
        if path == '/api/agent/audit': return self.json({'items': recent()})
        if path == '/api/agent/history': return self.json({'items': recent(50)})
        return self.json({'error': 'Not found'}, 404)
    def do_POST(self):
        path = urlparse(self.path).path
        try:
            length = int(self.headers.get('Content-Length', '0')); payload = json.loads(self.rfile.read(length) or '{}'); question = str(payload.get('question', '')).strip()
            thread_id = payload.get('thread_id') or self.headers.get('X-Agent-Thread', 'default')
            if path == '/api/agent/ask':
                if not question: return self.json({'error': '请输入问题'}, 400)
                result = invoke(question, self.headers.get('X-Agent-User', ''), thread_id, use_model=True)
            elif path == '/api/agent/resume': result = resume(thread_id, payload.get('decision', False))
            elif path == '/api/agent/report':
                if not question: return self.json({'error': '请输入问题'}, 400)
                result = invoke(question, self.headers.get('X-Agent-User', ''), thread_id, use_model=True)
                return self.json({'ok': True, 'report': _report_markdown(_public_result(result))})
            else: return self.json({'error': 'Not found'}, 404)
            return self.json(_public_result(result))
        except Exception as exc:
            return self.json({'ok': False, 'error': str(exc)}, 502)

if __name__ == '__main__':
    init_audit(); print(f'Agent 2.0 listening on http://{AGENT_HOST}:{AGENT_PORT}'); ThreadingHTTPServer((AGENT_HOST, AGENT_PORT), Handler).serve_forever()
