import json
from urllib.request import Request, urlopen
from config import MODEL_API_KEY, MODEL_BASE_URL, MODEL_NAME, MODEL_TIMEOUT_SECONDS

class OpenAICompatibleModel:
    def __init__(self, base_url=MODEL_BASE_URL, api_key=MODEL_API_KEY, model=MODEL_NAME): self.base_url, self.api_key, self.model = base_url.rstrip('/'), api_key, model
    @property
    def configured(self): return bool(self.base_url and self.model)
    def chat(self, messages, temperature=0, response_format=None):
        if not self.configured: raise RuntimeError('未配置 MODEL_BASE_URL 和 MODEL_NAME')
        payload = {'model': self.model, 'messages': messages, 'temperature': temperature}
        if response_format: payload['response_format'] = response_format
        body = json.dumps(payload).encode('utf-8'); headers = {'Content-Type': 'application/json'}
        if self.api_key: headers['Authorization'] = f'Bearer {self.api_key}'
        with urlopen(Request(self.base_url + '/chat/completions', data=body, headers=headers, method='POST'), timeout=MODEL_TIMEOUT_SECONDS) as response: return json.loads(response.read().decode('utf-8'))
    def json(self, messages):
        data = self.chat(messages, temperature=0, response_format={'type': 'json_object'})
        return json.loads(data['choices'][0]['message']['content'])
