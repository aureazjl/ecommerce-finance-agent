import os

_ENV_FILE = os.path.join(os.path.dirname(__file__), '.env')
if os.path.exists(_ENV_FILE):
    for _line in open(_ENV_FILE, encoding='utf-8'):
        _line = _line.strip()
        if _line and not _line.startswith('#') and '=' in _line:
            _key, _value = _line.split('=', 1)
            os.environ.setdefault(_key.strip(), _value.strip().strip('"').strip("'"))

DB_PATH = os.getenv('FINANCE_DB_PATH', os.path.join(os.path.dirname(__file__), 'finance.db'))
AGENT_HOST = os.getenv('AGENT_HOST', '127.0.0.1')
AGENT_PORT = int(os.getenv('AGENT_PORT', '18781'))
AUDIT_DB = os.getenv('AGENT_AUDIT_DB', os.path.join(os.path.dirname(__file__), 'agent_audit.db'))
CHECKPOINT_DB = os.getenv('AGENT_CHECKPOINT_DB', os.path.join(os.path.dirname(__file__), 'agent_checkpoint.db'))
MODEL_BASE_URL = os.getenv('MODEL_BASE_URL', 'https://api.deepseek.com').rstrip('/')
MODEL_API_KEY = os.getenv('MODEL_API_KEY', '')
MODEL_NAME = os.getenv('MODEL_NAME', 'deepseek-chat')
ENABLE_DEEPSEEK = os.getenv('ENABLE_DEEPSEEK', 'true').lower() == 'true'
