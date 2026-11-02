import * as React from 'react';
import { Alert, Box, Button, Chip, Paper, Stack, Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography } from '@mui/material';

const AGENT_API = import.meta.env.VITE_AGENT_API_BASE ?? 'http://127.0.0.1:18781';

export default function Agent() {
  const [question, setQuestion] = React.useState('昨天按部门统计利润');
  const [data, setData] = React.useState(null);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState('');
  const ask = async () => {
    setBusy(true); setError('');
    try { const r = await fetch(`${AGENT_API}/api/agent/ask`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ question, thread_id: 'web-demo' }) }); const d = await r.json(); if (!r.ok || !d.ok) throw new Error(d.error || '分析失败'); setData(d); } catch (e) { setError(e.message); } finally { setBusy(false); }
  };
  return <Stack spacing={2}><Typography variant="h4" fontWeight={700}>智能经营分析助手</Typography><Typography color="text.secondary">基于 LangGraph 的电商财务问数、分析和可解释结论。</Typography><Paper sx={{ p: 2.5 }}><Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}><TextField fullWidth value={question} onChange={e => setQuestion(e.target.value)} label="输入你的问题" onKeyDown={e => e.key === 'Enter' && ask()} /><Button variant="contained" onClick={ask} disabled={busy}>{busy ? '分析中…' : '开始分析'}</Button></Stack><Stack direction="row" spacing={1} sx={{ mt: 1.5 }}><Chip label="昨天哪个部门利润最低？" onClick={() => setQuestion('昨天哪个部门利润最低？')} /><Chip label="近7天产品销售额排名" onClick={() => setQuestion('近7天产品销售额排名')} /></Stack></Paper>{error && <Alert severity="error">{error}</Alert>}{data && <Paper sx={{ p: 2.5 }}><Typography variant="h6" fontWeight={700}>{data.answer}</Typography><Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>数据来源：{data.source?.database} / {data.source?.table}，{data.source?.row_count ?? 0} 行</Typography><Box sx={{ overflowX: 'auto', mt: 2 }}><Table size="small"><TableHead><TableRow><TableCell>名称</TableCell><TableCell align="right">数值</TableCell><TableCell align="right">行数</TableCell></TableRow></TableHead><TableBody>{(data.table || data.rows || []).map(row => <TableRow key={row.name}><TableCell>{row.name}</TableCell><TableCell align="right">{Number(row.value || 0).toFixed(2)}</TableCell><TableCell align="right">{row.rows ?? '-'}</TableCell></TableRow>)}</TableBody></Table></Box><Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2 }}>执行轨迹：{(data.trace || []).map(x => x.node).join(' → ')}</Typography></Paper>}</Stack>;
}
