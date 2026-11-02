import * as React from 'react';
import { Alert, Box, Button, Paper, Stack, TextField, Typography, IconButton, InputAdornment } from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { API } from '../../App';

export default function Login({ setup, onSuccess }) {
  const [username, setUsername] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [showPassword, setShowPassword] = React.useState(false);
  const [error, setError] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const submit = async (event) => {
    event.preventDefault(); setBusy(true); setError('');
    try {
      const response = await fetch(`${API}/api/auth/${setup ? 'setup' : 'login'}`, { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, password }) });
      const raw = await response.text();
      let data = {};
      try { data = raw ? JSON.parse(raw) : {}; } catch { data = { error: `服务器返回异常（HTTP ${response.status}）` }; }
      if (!response.ok) throw new Error(data.error || (response.status === 401 ? '账号或密码错误' : `登录失败（HTTP ${response.status}）`));
      if (setup) {
        const login = await fetch(`${API}/api/auth/login`, { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, password }) });
        if (!login.ok) {
          const loginRaw = await login.text();
          let loginData = {}; try { loginData = loginRaw ? JSON.parse(loginRaw) : {}; } catch { /* keep fallback */ }
          throw new Error(loginData.error || '管理员已创建，请重新登录');
        }
      }
      onSuccess();
    } catch (e) { setError(e.message); } finally { setBusy(false); }
  };
  return <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center', bgcolor: '#f4f7f5', p: 2 }}><Paper component="form" onSubmit={submit} sx={{ width: '100%', maxWidth: 420, p: { xs: 3, sm: 4 }, border: '1px solid #d8e5de' }}><Typography variant="h5" fontWeight={800} color="#116f5b">电商财务分析平台</Typography><Typography color="text.secondary" sx={{ mt: 1, mb: 3 }}>{setup ? '首次使用，请创建管理员账号' : '登录后查看财务数据'}</Typography><Stack spacing={2}><TextField label="账号" value={username} onChange={e => setUsername(e.target.value)} autoComplete="username" required inputProps={{ minLength: 3, maxLength: 32 }} /><TextField label="密码" type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} autoComplete={setup ? 'new-password' : 'current-password'} required inputProps={{ minLength: 8, maxLength: 128 }} InputProps={{ endAdornment: <InputAdornment position="end"><IconButton aria-label={showPassword ? '隐藏密码' : '显示密码'} onClick={() => setShowPassword(value => !value)} edge="end">{showPassword ? <VisibilityOff /> : <Visibility />}</IconButton></InputAdornment> }} />{error && <Alert severity="error">{error}</Alert>}<Button type="submit" variant="contained" size="large" disabled={busy}>{busy ? '处理中…' : setup ? '创建并登录' : '登录'}</Button></Stack></Paper></Box>;
}
