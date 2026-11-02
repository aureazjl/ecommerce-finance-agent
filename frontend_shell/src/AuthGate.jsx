import * as React from 'react';
import { API } from './App';
import App from './App';
import Login from './pages/auth/Login';

class AppErrorBoundary extends React.Component {
  state = { error: null };
  static getDerivedStateFromError(error) { return { error }; }
  render() {
    if (this.state.error) return <div style={{ padding: 32, color: '#174d3e' }}><h2>页面暂时无法加载</h2><p>登录状态或数据接口已失效，请刷新页面后重试。</p><button onClick={() => window.location.reload()}>刷新页面</button></div>;
    return this.props.children;
  }
}

export default function AuthGate() {
  const [state, setState] = React.useState({ loading: true, setup: false, authenticated: false, user: null });
  const refresh = React.useCallback(async () => {
    const status = await fetch(`${API}/api/auth/status`, { credentials: 'include' }).then(r => r.json());
    if (status.setup_required) return setState({ loading: false, setup: true, authenticated: false });
    const me = await fetch(`${API}/api/auth/me`, { credentials: 'include' });
    const data = me.ok ? await me.json() : null;
    setState({ loading: false, setup: false, authenticated: me.ok, user: data?.user || null });
  }, []);
  React.useEffect(() => { refresh().catch(() => setState({ loading: false, setup: false, authenticated: false })); }, [refresh]);
  if (state.loading) return <div style={{ padding: 24 }}>正在检查登录状态…</div>;
  if (!state.authenticated) return <Login setup={state.setup} onSuccess={refresh} />;
  if (!window.__financeFetchPatched) {
    const nativeFetch = window.fetch.bind(window);
    window.fetch = (input, init = {}) => {
      const url = typeof input === 'string' ? input : input.url;
      return nativeFetch(input, { ...init, credentials: url.startsWith(API) ? 'include' : init.credentials });
    };
    window.__financeFetchPatched = true;
  }
  return <AppErrorBoundary><App user={state.user} /></AppErrorBoundary>;
}
