import os

SOURCE_API = os.getenv('FINANCE_API_BASE', 'http://127.0.0.1:18780').rstrip('/')
AGENT_HOST = os.getenv('AGENT_HOST', '127.0.0.1')
AGENT_PORT = int(os.getenv('AGENT_PORT', '18781'))
AUDIT_DB = os.getenv('AGENT_AUDIT_DB', os.path.join(os.path.dirname(__file__), 'agent_audit.db'))
MODEL_BASE_URL = os.getenv('MODEL_BASE_URL', '').rstrip('/')
MODEL_API_KEY = os.getenv('MODEL_API_KEY', '')
MODEL_NAME = os.getenv('MODEL_NAME', '')
