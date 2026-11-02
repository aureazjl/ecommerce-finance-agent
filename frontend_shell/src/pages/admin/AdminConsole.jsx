import * as React from 'react';
import { Alert, Button, Checkbox, Grid, Paper, Stack, Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography } from '@mui/material';
import { API } from '../../App';

const mb = bytes => `${(Number(bytes || 0) / 1024 / 1024).toFixed(2)} MB`;
const yesterday = () => { const d = new Date(); d.setDate(d.getDate() - 1); return d.toISOString().slice(0, 10); };

export default function AdminConsole() {
  const [metrics, setMetrics] = React.useState(null);
  const [start, setStart] = React.useState(yesterday());
  const [end, setEnd] = React.useState(yesterday());
  const [selectedDates, setSelectedDates] = React.useState([]);
  const [message, setMessage] = React.useState('');
  const [error, setError] = React.useState('');

  const load = React.useCallback((a = start, b = end) => {
    setError('');
    fetch(`${API}/api/admin/metrics?start_date=${a}&end_date=${b}`, { credentials: 'include' })
      .then(r => r.ok ? r.json() : r.json().then(x => Promise.reject(new Error(x.error || '加载失败'))))
      .then(setMetrics)
      .catch(e => setError(e.message));
  }, [start, end]);

  React.useEffect(() => { load(); }, [load]);

  const remove = async (dates = []) => {
    setMessage(''); setError('');
    if (!dates.length && (!start || !end || start > end)) return setError('请选择有效的日期范围');
    const prompt = dates.length ? `确认删除选中的 ${dates.length} 天数据吗？` : `确认删除 ${start} 至 ${end} 的全部业务数据吗？`;
    if (!window.confirm(`${prompt}此操作只删除数据记录，不删除表结构。`)) return;
    const body = dates.length ? { dates } : { start_date: start, end_date: end };
    const r = await fetch(`${API}/api/admin/delete-data`, { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const data = await r.json();
    if (!r.ok) return setError(data.error || '删除失败');
    setMessage(`已删除 ${data.deleted} 条数据`);
    setMetrics(data.metrics);
    setSelectedDates([]);
  };

  const daily = metrics?.daily || [];
  const allSelected = daily.length > 0 && selectedDates.length === daily.length;

  return <Stack spacing={2}>
    <Grid container spacing={2}>
      <Grid item xs={12} sm={6}><Paper sx={{ p: 2 }}><Typography color="text.secondary">数据库占用</Typography><Typography variant="h5" fontWeight={700}>{metrics ? mb(metrics.database_bytes) : '加载中...'}</Typography></Paper></Grid>
      <Grid item xs={12} sm={6}><Paper sx={{ p: 2 }}><Typography color="text.secondary">文件上传占用</Typography><Typography variant="h5" fontWeight={700}>{metrics ? mb(metrics.upload_storage_bytes) : '加载中...'}</Typography></Paper></Grid>
      <Grid item xs={12} sm={6}><Paper sx={{ p: 2 }}><Typography color="text.secondary">数据条数</Typography><Typography variant="h5" fontWeight={700}>{metrics ? metrics.row_count : '加载中...'}</Typography></Paper></Grid>
      <Grid item xs={12} sm={6}><Paper sx={{ p: 2 }}><Typography color="text.secondary">数据日期</Typography><Typography variant="h5" fontWeight={700}>{metrics?.daily?.length ? `${metrics.daily.length} 天` : '暂无数据'}</Typography></Paper></Grid>
    </Grid>

    <Paper sx={{ p: { xs: 2, sm: 3 } }}>
      <Typography variant="h6" fontWeight={700} sx={{ mb: 1 }}>数据删除</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>可按天单独删除、勾选多天删除，或选择连续日期范围删除。数据库表结构和账号信息不会删除。</Typography>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ xs: 'stretch', sm: 'center' }} sx={{ mb: 2 }}>
        <Button variant="contained" color="error" disabled={!selectedDates.length} onClick={() => remove(selectedDates)}>删除选中日期</Button>
        <TextField type="date" size="small" label="开始日期" value={start} onChange={e => setStart(e.target.value)} InputLabelProps={{ shrink: true }} />
        <TextField type="date" size="small" label="结束日期" value={end} onChange={e => setEnd(e.target.value)} InputLabelProps={{ shrink: true }} />
        <Button variant="outlined" color="error" onClick={() => remove()}>删除范围数据</Button>
        <Button variant="outlined" onClick={() => load()}>刷新状态</Button>
      </Stack>

      <Table size="small">
        <TableHead><TableRow><TableCell padding="checkbox"><Checkbox checked={allSelected} indeterminate={selectedDates.length > 0 && !allSelected} onChange={e => setSelectedDates(e.target.checked ? daily.map(x => x.stat_date) : [])} /></TableCell><TableCell>日期</TableCell><TableCell>数据行数</TableCell><TableCell align="right">操作</TableCell></TableRow></TableHead>
        <TableBody>{daily.length ? daily.map(row => <TableRow key={row.stat_date} hover><TableCell padding="checkbox"><Checkbox checked={selectedDates.includes(row.stat_date)} onChange={e => setSelectedDates(v => e.target.checked ? [...v, row.stat_date] : v.filter(x => x !== row.stat_date))} /></TableCell><TableCell>{row.stat_date}</TableCell><TableCell>{row.row_count}</TableCell><TableCell align="right"><Button color="error" size="small" onClick={() => remove([row.stat_date])}>删除</Button></TableCell></TableRow>) : <TableRow><TableCell colSpan={4}><Typography color="text.secondary" align="center" sx={{ py: 3 }}>当前范围内暂无数据</Typography></TableCell></TableRow>}</TableBody>
      </Table>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>当前范围：{metrics?.selected_row_count ?? 0} 条</Typography>
      {message && <Alert severity="success" sx={{ mt: 2 }}>{message}</Alert>}
      {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
    </Paper>
  </Stack>;
}
