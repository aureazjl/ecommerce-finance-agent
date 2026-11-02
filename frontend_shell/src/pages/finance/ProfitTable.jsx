import * as React from 'react';
import { Box, Paper, Typography, Table, TableHead, TableRow, TableCell, TableBody, TextField, Stack, MenuItem, Button, ToggleButtonGroup, ToggleButton, IconButton, useMediaQuery } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import ArrowUpwardOutlinedIcon from '@mui/icons-material/ArrowUpwardOutlined';
import ArrowDownwardOutlinedIcon from '@mui/icons-material/ArrowDownwardOutlined';
import { API } from '../../App';
import FinanceDateRange from '../../components/FinanceDateRange';

const money = v => new Intl.NumberFormat('zh-CN', { style: 'currency', currency: 'CNY', maximumFractionDigits: 0 }).format(v || 0).replace('CN¥', '¥');
const plainMoney = v => String(Math.round(Number(v) || 0));
const shortDate = value => value ? value.slice(5) : '—';
const yesterday = () => { const d = new Date(); d.setDate(d.getDate() - 1); const pad = n => String(n).padStart(2, '0'); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };
const opts = (rows, key) => [...new Set(rows.map(r => r[key]).filter(Boolean))].sort();
const SortHead = ({ label, field, sort, direction, onSort }) => <TableCell sx={{ whiteSpace: 'nowrap' }}><Stack direction="row" spacing={0.25} alignItems="center">{label}<IconButton size="small" aria-label={`按${label}排序`} onClick={() => onSort(field)} sx={{ p: 0.25, width: 22, height: 22, flexShrink: 0, color: sort === field ? 'primary.main' : 'text.secondary' }}>{sort === field && direction === 'asc' ? <ArrowUpwardOutlinedIcon sx={{ fontSize: 15 }} /> : <ArrowDownwardOutlinedIcon sx={{ fontSize: 15 }} />}</IconButton></Stack></TableCell>;
const MobileSortHead = ({ label, field, sort, onSort }) => <TableCell onClick={() => onSort(field)} sx={{ whiteSpace: 'nowrap', cursor: 'pointer', userSelect: 'none', color: sort === field ? 'primary.main' : 'inherit' }}>{label}</TableCell>;

export default function ProfitTable() {
  const [rows, setRows] = React.useState([]);
  const [start, setStart] = React.useState(yesterday);
  const [end, setEnd] = React.useState(yesterday);
  const [department, setDepartment] = React.useState('');
  const [manager, setManager] = React.useState('');
  const [product, setProduct] = React.useState('');
  const [showTable, setShowTable] = React.useState(true);
  const [sort, setSort] = React.useState('stat_date');
  const [direction, setDirection] = React.useState('desc');
  const mobile = useMediaQuery(useTheme().breakpoints.down('sm'));

  React.useEffect(() => {
    fetch(API + '/api/profit-rows', { credentials: 'include' })
      .then(r => r.json())
      .then(x => setRows(x.rows || []));
  }, []);

  const filtered = rows.filter(r =>
    (!start || r.stat_date >= start) &&
    (!end || r.stat_date <= end) &&
    (!department || r.department === department) &&
    (!manager || r.manager === manager) &&
    (!product || r.product_name === product)
  );
  const grouped = filtered.reduce((groups, row) => {
    const key = row.department || '未分配部门';
    (groups[key] ||= []).push(row);
    return groups;
  }, {});
  const managerRows = rows.filter(r => !department || r.department === department);
  const productRows = managerRows.filter(r => !manager || r.manager === manager);
  const sorted = [...filtered].sort((a, b) => {
    const numeric = ['actual_sales', 'operating_cost', 'goods_cost', 'other_fee', 'profit'];
    const av = numeric.includes(sort) ? Number(a[sort] || 0) : String(a[sort] || '');
    const bv = numeric.includes(sort) ? Number(b[sort] || 0) : String(b[sort] || '');
    const result = av > bv ? 1 : av < bv ? -1 : 0;
    return direction === 'asc' ? result : -result;
  });
  const onSort = field => { if (sort === field) setDirection(value => value === 'asc' ? 'desc' : 'asc'); else { setSort(field); setDirection('desc'); } };

  return <>
    <Typography variant="h4" fontWeight={700} sx={{ mb: 1 }}>利润表</Typography>
    <Paper sx={{ p: 2, mb: 2 }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} flexWrap="wrap" gap={1.5}>
        <FinanceDateRange start={start} end={end} onChange={(a, b) => { setStart(a); setEnd(b); }} />
        <TextField select size="small" label="部门" value={department} onChange={e => { setDepartment(e.target.value); setManager(''); setProduct(''); }}>
          <MenuItem value="">全部部门</MenuItem>{opts(rows, 'department').map(x => <MenuItem key={x} value={x}>{x}</MenuItem>)}
        </TextField>
        <TextField select size="small" label="主管" value={manager} onChange={e => { setManager(e.target.value); setProduct(''); }} disabled={!department}>
          <MenuItem value="">全部主管</MenuItem>{opts(managerRows, 'manager').map(x => <MenuItem key={x} value={x}>{x}</MenuItem>)}
        </TextField>
        <TextField select size="small" label="产品" value={product} onChange={e => setProduct(e.target.value)} disabled={!department}>
          <MenuItem value="">全部产品</MenuItem>{opts(productRows, 'product_name').map(x => <MenuItem key={x} value={x}>{x}</MenuItem>)}
        </TextField>
      </Stack>
      {mobile && <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1.25 }}>
        <Stack direction="row" spacing={0.75} alignItems="center">
          <Typography variant="caption" color="text.secondary">展示方式</Typography>
          <ToggleButtonGroup value={showTable ? 'table' : 'cards'} exclusive size="small" onChange={(_, value) => value && setShowTable(value === 'table')} sx={{ bgcolor: 'background.default', borderRadius: 2, '& .MuiToggleButton-root': { border: 0, px: 1.25, py: 0.45, fontSize: 12, color: 'text.secondary' }, '& .Mui-selected': { bgcolor: 'primary.main !important', color: '#fff !important', borderRadius: '8px !important' } }}>
            <ToggleButton value="cards">卡片</ToggleButton>
            <ToggleButton value="table">表格</ToggleButton>
          </ToggleButtonGroup>
        </Stack>
      </Box>}
    </Paper>
    {mobile && !showTable ? <Stack spacing={1.5}>
      {Object.entries(grouped).map(([departmentName, departmentRows]) => <Box key={departmentName}>
        <Paper sx={{ p: 1.5 }}>
          <Typography variant="body1" fontWeight={800} color="primary.dark" sx={{ mb: 0.75 }}>{departmentName}</Typography>
          <Stack divider={<Box sx={{ borderBottom: '1px solid', borderColor: 'divider' }} />}>
            {departmentRows.filter(r => sorted.includes(r)).sort((a, b) => sorted.indexOf(a) - sorted.indexOf(b)).map((r, i) => <Box key={`${departmentName}-${i}`} sx={{ py: 1 }}>
              <Stack direction="row" justifyContent="space-between" gap={1}>
                <Typography variant="body2" fontWeight={700} noWrap sx={{ minWidth: 0 }}>{r.product_name}</Typography>
                <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0 }}>{r.stat_date}</Typography>
              </Stack>
              <Stack direction="row" justifyContent="space-between" gap={1} sx={{ mt: 0.45 }}>
                <Typography variant="caption" color="text.secondary" noWrap>主管：{r.manager || '—'}　推广组长：{r.promotion_leader || '—'}</Typography>
                <Typography variant="caption" fontWeight={700} color={r.profit < 0 ? 'error.main' : 'primary.main'} sx={{ flexShrink: 0 }}>利润 {money(r.profit)}</Typography>
              </Stack>
              <Typography variant="caption" color="text.secondary">销售额 {money(r.actual_sales)}</Typography>
            </Box>)}
          </Stack>
        </Paper>
      </Box>)}
    </Stack> : mobile ? (sorted.length ? <Paper className="profit-table-mobile" sx={{ overflow: 'hidden', p: '0 !important', width: '100%' }}>
      <Table size="small" sx={{ display: 'table', width: '100% !important', maxWidth: 'none', minWidth: 0, m: '0 !important', borderCollapse: 'collapse', tableLayout: 'fixed', '& .MuiTableCell-root': { px: 0.15, py: 0.9, fontSize: 10.5, verticalAlign: 'middle', overflow: 'hidden', textOverflow: 'ellipsis' }, '& .MuiTableCell-root:nth-of-type(1)': { width: '12%', whiteSpace: 'nowrap', pl: 1.5, pr: 0.15 }, '& .MuiTableCell-root:nth-of-type(2)': { width: '11%', minWidth: 30, pl: 0.75 }, '& .MuiTableCell-root:nth-of-type(3)': { width: '11%' }, '& .MuiTableCell-root:nth-of-type(4)': { width: '10%' }, '& .MuiTableCell-root:nth-of-type(5)': { width: '30%' }, '& .MuiTableCell-root:nth-of-type(6)': { width: '13%', whiteSpace: 'nowrap', px: 0.15 }, '& .MuiTableCell-root:nth-of-type(7)': { width: '13%', whiteSpace: 'nowrap', px: 0.15 } }}>
        <TableHead><TableRow><TableCell>日期</TableCell><TableCell>部门</TableCell><TableCell>主管</TableCell><TableCell>组长</TableCell><TableCell>产品</TableCell><MobileSortHead label="销售额" field="actual_sales" sort={sort} direction={direction} onSort={onSort} /><MobileSortHead label="利润" field="profit" sort={sort} direction={direction} onSort={onSort} /></TableRow></TableHead>
        <TableBody>{sorted.map((r, i) => <TableRow key={i} hover>{[shortDate(r.stat_date), r.department || '—', r.manager || '—', r.promotion_leader || '—', r.product_name, plainMoney(r.actual_sales), plainMoney(r.profit)].map((x, j) => <TableCell key={j}>{j >= 1 && j <= 4 ? <Box component="span" sx={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{x}</Box> : x}</TableCell>)}</TableRow>)}</TableBody>
      </Table>
    </Paper> : <Paper className="profit-table-mobile" sx={{ p: '18px !important', width: '100%', height: 'calc(100dvh - 390px)', minHeight: 180, maxHeight: 'calc(100dvh - 390px)', boxSizing: 'border-box', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', overflow: 'hidden' }}><Typography color="text.secondary">当前选中时间没有数据</Typography></Paper>) : <Paper sx={{ overflow: 'auto' }}>
      <Table size="small" sx={{ minWidth: 1000, tableLayout: 'fixed', '& .MuiTableCell-root': { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } }}>
        <TableHead><TableRow><SortHead label="日期" field="stat_date" sort={sort} direction={direction} onSort={onSort} /><SortHead label="部门" field="department" sort={sort} direction={direction} onSort={onSort} /><SortHead label="主管" field="manager" sort={sort} direction={direction} onSort={onSort} /><SortHead label="推广组长" field="promotion_leader" sort={sort} direction={direction} onSort={onSort} /><SortHead label="产品名称" field="product_name" sort={sort} direction={direction} onSort={onSort} /><SortHead label="真实销售额" field="actual_sales" sort={sort} direction={direction} onSort={onSort} /><SortHead label="运营成本" field="operating_cost" sort={sort} direction={direction} onSort={onSort} /><SortHead label="货品成本" field="goods_cost" sort={sort} direction={direction} onSort={onSort} /><SortHead label="其他费用" field="other_fee" sort={sort} direction={direction} onSort={onSort} /><SortHead label="利润" field="profit" sort={sort} direction={direction} onSort={onSort} /></TableRow></TableHead>
        <TableBody>{sorted.map((r, i) => <TableRow key={i} hover>{[r.stat_date, r.department || '—', r.manager || '—', r.promotion_leader || '—', r.product_name, money(r.actual_sales), money(r.operating_cost), money(r.goods_cost), money(r.other_fee), money(r.profit)].map((x, j) => <TableCell key={j}>{x}</TableCell>)}</TableRow>)}</TableBody>
      </Table>
    </Paper>}
  </>;
}
