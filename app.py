import json
import os
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlparse
from urllib.request import Request, urlopen

BASE = os.getenv('FINANCE_API_BASE', 'http://127.0.0.1:18780').rstrip('/')
PORT = int(os.getenv('AGENT_PORT', '18781'))


def source(path):
    req = Request(BASE + path, headers={'Accept': 'application/json'})
    with urlopen(req, timeout=10) as res:
        return json.loads(res.read().decode('utf-8'))


class Handler(BaseHTTPRequestHandler):
    def send_json(self, data, status=200):
        body = json.dumps(data, ensure_ascii=False).encode('utf-8')
        self.send_response(status)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        path = urlparse(self.path).path
        if path == '/api/health':
            return self.send_json({'ok': True, 'service': 'ecommerce-finance-agent'})
        if path == '/api/agent/context':
            try:
                return self.send_json({'ok': True, 'source': source('/api/summary')})
            except Exception as exc:
                return self.send_json({'ok': False, 'error': str(exc)}, 502)
        return self.send_json({'error': 'Not found'}, 404)

    def do_POST(self):
        if urlparse(self.path).path != '/api/agent/ask':
            return self.send_json({'error': 'Not found'}, 404)
        length = int(self.headers.get('Content-Length', '0'))
        payload = json.loads(self.rfile.read(length) or '{}')
        question = str(payload.get('question', '')).strip()
        if not question:
            return self.send_json({'error': '请输入问题'}, 400)
        return self.send_json({
            'ok': True,
            'status': 'planned',
            'question': question,
            'message': '智能体入口已建立，下一步接入指标语义层和模型服务。',
            'tools': ['query_summary', 'query_profit_rows', 'group_by_department', 'group_by_product'],
        })


if __name__ == '__main__':
    print(f'Agent service listening on http://127.0.0.1:{PORT}')
    ThreadingHTTPServer(('127.0.0.1', PORT), Handler).serve_forever()
