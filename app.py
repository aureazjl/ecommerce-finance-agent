import json
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlparse
from config import AGENT_HOST, AGENT_PORT
from audit import init_audit, recent
from agent_graph import agent_graph
from semantic import catalog

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
        if path == '/api/agent/audit': return self.json({'items': recent()})
        return self.json({'error': 'Not found'}, 404)
    def do_POST(self):
        if urlparse(self.path).path != '/api/agent/ask': return self.json({'error': 'Not found'}, 404)
        try:
            length = int(self.headers.get('Content-Length', '0')); payload = json.loads(self.rfile.read(length) or '{}'); question = str(payload.get('question', '')).strip()
            if not question: return self.json({'error': '请输入问题'}, 400)
            result = agent_graph.invoke({'question': question, 'user_name': self.headers.get('X-Agent-User', '')})
            return self.json({'ok': True, **result.get('result', {}), 'trace': result.get('trace', [])})
        except Exception as exc:
            return self.json({'ok': False, 'error': str(exc)}, 502)

if __name__ == '__main__':
    init_audit(); print(f'Agent 2.0 listening on http://{AGENT_HOST}:{AGENT_PORT}'); ThreadingHTTPServer((AGENT_HOST, AGENT_PORT), Handler).serve_forever()
