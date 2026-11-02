import json
from urllib.request import Request, urlopen
from config import MODEL_API_KEY, MODEL_BASE_URL, MODEL_NAME

class OpenAICompatibleModel:
    def __init__(self, base_url=MODEL_BASE_URL, api_key=MODEL_API_KEY, model=MODEL_NAME): self.base_url, self.api_key, self.model = base_url.rstrip('/'), api_key, model
    @property
    def configured(self): return bool(self.base_url and self.model)
    def chat(self, messages, temperature=0):
        if not self.configured: raise RuntimeError('未配置 MODEL_BASE_URL 和 MODEL_NAME')
        body = json.dumps({'model': self.model, 'messages': messages, 'temperature': temperature}).encode('utf-8'); headers = {'Content-Type': 'application/json'}
        if self.api_key: headers['Authorization'] = f'Bearer {self.api_key}'
        with urlopen(Request(self.base_url + '/chat/completions', data=body, headers=headers, method='POST'), timeout=60) as response: return json.loads(response.read().decode('utf-8'))
