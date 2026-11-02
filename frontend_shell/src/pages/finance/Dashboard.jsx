import * as React from 'react';
import { Box, Typography, Grid, Paper, Stack, Button, LinearProgress } from '@mui/material';
import { API } from '../../App';
import FinanceDateRange from '../../components/FinanceDateRange';
import DepartmentPie from '../../components/DepartmentPie';

const money = v => new Intl.NumberFormat('zh-CN', { style: 'currency', currency: 'CNY', maximumFractionDigits: 0 }).format(v || 0).replace('CN¥', '¥');
const empty = { summary: { revenue: 0, net_profit: 0, operating_expense: 0, net_margin: 0 }, by_product: [], by_department: [] };

export default function Dashboard() {
  const now = new Date();
  now.setDate(now.getDate() - 1);
  const pad = n => String(n).padStart(2, '0');
  const yesterday = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  const [d, setD] = React.useState(null), [start, setStart] = React.useState(yesterday), [end, setEnd] = React.useState(yesterday);
  const load = React.useCallback((a, b) => fetch(`${API}/api/summary?start_date=${a}&end_date=${b}`).then(r => r.json()).then(data => setD({ ...empty, ...data, summary: { ...empty.summary, ...(data.summary || {}) }, by_product: Array.isArray(data.by_product) ? data.by_product : [], by_department: Array.isArray(data.by_department) ? data.by_department : [] })).catch(() => setD(empty)), []);
  React.useEffect(() => { load(yesterday, yesterday); }, [load, yesterday]);
  const changeRange = (a, b) => { setStart(a); setEnd(b); if (a && b) load(a, b); };
  if (!d) return <Typography>正在加载数据库数据…</Typography>;
  const s = d.summary, max = Math.max(...d.by_product.map(x => x.profit), 1), departments = d.by_department.filter(x => x.revenue > 0);
  const cards = [['累计销售额', money(s.revenue)], ['累计利润', money(s.net_profit)], ['累计运营成本', money(s.operating_expense)], ['利润率', `${s.net_margin}%`]];
  return <><Paper sx={{ p: { xs: 1.5, sm: 2 }, mb: 2 }}><Stack direction={{ xs: 'column', sm: 'row' }} gap={1.5} alignItems={{ sm: 'center' }}><FinanceDateRange start={start} end={end} onChange={changeRange} /><Button variant="contained" onClick={() => load(start, end)}>查询</Button></Stack></Paper><Grid container spacing={2} sx={{ mb: 2 }}>{cards.map(c => <Grid key={c[0]} size={{ xs: 12, sm: 6, lg: 3 }}><Paper sx={{ p: { xs: 1.75, sm: 2.5 }, height: '100%' }}><Typography color="text.secondary">{c[0]}</Typography><Typography variant="h4" fontWeight={800} sx={{ mt: 1.5 }}>{c[1]}</Typography></Paper></Grid>)}</Grid><Grid container spacing={2} alignItems="stretch"><Grid size={{ xs: 12, md: 7 }} sx={{ display: 'flex' }}><Paper sx={{ p: { xs: 1.75, sm: 2.5 }, width: '100%', minHeight: 430, display: 'flex', flexDirection: 'column' }}><Stack direction="row" justifyContent="space-between" alignItems="center"><Typography variant="h6" fontWeight={700}>产品利润贡献</Typography><Button href="/analysis" size="small">查看更多</Button></Stack><Box sx={{ mt: 2, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: d.by_product.length ? 'flex-start' : 'center' }}>{d.by_product.length ? d.by_product.slice(0, 8).map((x, i) => <Box key={x.product_name} sx={{ mb: 2 }}><Stack direction="row" justifyContent="space-between" gap={1}><Typography noWrap sx={{ minWidth: 0 }}>{i + 1}. {x.product_name}</Typography><Typography fontWeight={700} sx={{ flexShrink: 0 }}>{money(x.profit)}</Typography></Stack><LinearProgress variant="determinate" value={Math.max(0, Math.min(100, x.profit / max * 100))} /></Box>) : <Typography color="text.secondary" textAlign="center">当前暂无产品利润数据</Typography>}</Box></Paper></Grid><Grid size={{ xs: 12, md: 5 }} sx={{ display: 'flex' }}><Paper sx={{ p: { xs: 1.75, sm: 2.5 }, width: '100%', minHeight: 430, display: 'flex', flexDirection: 'column' }}><Typography variant="h6" fontWeight={700}>部门业绩</Typography><Typography variant="body2" color="text.secondary" sx={{ mt: .5 }}>按部门销售额占比</Typography><Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{departments.length ? <DepartmentPie items={departments.map(x => ({ label: x.department, value: x.revenue }))} /> : <Typography color="text.secondary">当前暂无部门业绩数据</Typography>}</Box></Paper></Grid></Grid></>;
}
