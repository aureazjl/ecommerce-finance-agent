import * as React from 'react';import{Box,Typography,Paper,Stack,Button,Table,TableHead,TableRow,TableCell,TableBody}from '@mui/material';import{API}from '../../App';import FinanceDateRange from '../../components/FinanceDateRange';
const money=v=>new Intl.NumberFormat('zh-CN',{style:'currency',currency:'CNY',maximumFractionDigits:0}).format(v||0).replace('CN¥','¥');
const daysBetween=(a,b)=>{const out=[];for(let d=new Date(`${a}T00:00:00`),end=new Date(`${b}T00:00:00`);d<=end;d.setDate(d.getDate()+1))out.push(d.toISOString().slice(0,10));return out};
function Chart({ points }) {
  const scrollRef = React.useRef(null);
  const dragRef = React.useRef(null);
  const width = Math.max(760, points.length * 28);
  const height = 310;
  const pad = { left: 76, right: 24, top: 28, bottom: 54 };
  const max = Math.max(...points.map((item) => item.sales), 1);
  const step = max / 4;
  const x = (index) => pad.left + ((width - pad.left - pad.right) * index) / Math.max(points.length - 1, 1);
  const y = (value) => height - pad.bottom - ((height - pad.top - pad.bottom) * value) / max;
  const path = points.map((item, index) => `${index ? 'L' : 'M'} ${x(index)} ${y(item.sales)}`).join(' ');
  return (
    <Box
      ref={scrollRef}
      onPointerDown={(event) => {
        if (event.button !== 0) return;
        dragRef.current = { x: event.clientX, scrollLeft: scrollRef.current.scrollLeft };
        event.currentTarget.setPointerCapture(event.pointerId);
        event.currentTarget.style.cursor = 'grabbing';
      }}
      onPointerMove={(event) => {
        if (!dragRef.current) return;
        scrollRef.current.scrollLeft = dragRef.current.scrollLeft - (event.clientX - dragRef.current.x);
      }}
      onPointerUp={(event) => {
        dragRef.current = null;
        event.currentTarget.style.cursor = 'grab';
      }}
      onPointerCancel={(event) => {
        dragRef.current = null;
        event.currentTarget.style.cursor = 'grab';
      }}
      sx={{ overflowX: 'auto', cursor: 'grab', userSelect: 'none', touchAction: 'pan-y' }}
    >
      <svg viewBox={`0 0 ${width} ${height}`} width={width} height={height}>
        <text x="16" y="18" fontSize="12" fill="#557269">销售额（元）</text>
        {[0, 1, 2, 3, 4].map((index) => (
          <g key={index}>
            <line x1={pad.left} x2={width - pad.right} y1={y(index * step)} y2={y(index * step)} stroke="#e4eee9" />
            <text x={pad.left - 10} y={y(index * step) + 4} textAnchor="end" fontSize="11" fill="#6d8279">
              {Math.round(index * step).toLocaleString()}
            </text>
          </g>
        ))}
        <path d={path} fill="none" stroke="#157a62" strokeWidth="3" />
        {points.map((item, index) => (
          <g key={item.date}>
            <circle cx={x(index)} cy={y(item.sales)} r="3" fill="#157a62">
              <title>{`${item.date}：${money(item.sales)}`}</title>
            </circle>
            {(index === 0 || index === points.length - 1 || points.length <= 31) ? (
              <text x={x(index)} y={height - (index % 2 ? 18 : 32)} textAnchor="middle" fontSize="10" fill="#6d8279">
                {item.date.slice(5)}
              </text>
            ) : null}
          </g>
        ))}
      </svg>
    </Box>
  );
}
export default function AnalysisV3(){const n=new Date(),pad=x=>String(x).padStart(2,'0'),m=`${n.getFullYear()}-${pad(n.getMonth()+1)}`,first=`${m}-01`,today=`${m}-${pad(n.getDate())}`;const[d,setD]=React.useState(null),[start,setStart]=React.useState(first),[end,setEnd]=React.useState(today),[selected,setSelected]=React.useState('');const load=React.useCallback((a,b)=>{setD(null);fetch(`${API}/api/summary?start_date=${a}&end_date=${b}`).then(r=>r.json()).then(setD)},[]);React.useEffect(()=>{load(first,today)},[load,first,today]);if(!d)return <Typography>正在加载产品分析…</Typography>;const data=d.rows||[],products=[...new Set(data.map(x=>x.product_name).filter(Boolean))];if(!products.length)return <Paper sx={{p:3}}>当前日期范围暂无产品数据</Paper>;const current=products.includes(selected)?selected:products[0],rows=data.filter(x=>x.product_name===current),by={};rows.forEach(x=>by[x.stat_date]=(by[x.stat_date]||0)+x.actual_sales);const points=daysBetween(start,end).map(date=>({date,sales:by[date]||0}));return <><Typography variant="h4" fontWeight={700} sx={{mb:1}}>产品利润贡献</Typography><Paper sx={{p:2,mb:2}}><Stack direction={{xs:'column',sm:'row'}} gap={1.5} alignItems={{sm:'center'}}><FinanceDateRange start={start} end={end} onChange={(a,b)=>{setStart(a);setEnd(b);if(a&&b){setSelected('');load(a,b)}}}/><Button variant="contained" onClick={()=>load(start,end)}>查询</Button><Typography variant="caption" color="text.secondary">时间轴：{start} 至 {end}</Typography></Stack></Paper><Paper sx={{p:2.5,mb:2}}><Stack direction="row" justifyContent="space-between"><Box><Typography variant="h6" fontWeight={700}>{current}</Typography><Typography color="text.secondary">销售额趋势（无数据日期按 0 展示）</Typography></Box><Button href="/" variant="outlined">返回仪表盘</Button></Stack><Chart points={points}/></Paper><Paper sx={{p:2.5}}><Typography variant="h6" fontWeight={700} sx={{mb:1}}>产品列表</Typography><Table size="small"><TableHead><TableRow><TableCell>产品名称</TableCell><TableCell align="right">销售额</TableCell><TableCell align="right">利润</TableCell></TableRow></TableHead><TableBody>{products.map((name,i)=>{const rs=data.filter(x=>x.product_name===name);return <TableRow key={name} hover selected={name===current} onClick={()=>setSelected(name)} sx={{cursor:'pointer'}}><TableCell>{i+1}. {name}</TableCell><TableCell align="right">{money(rs.reduce((a,r)=>a+r.actual_sales,0))}</TableCell><TableCell align="right">{money(rs.reduce((a,r)=>a+r.profit,0))}</TableCell></TableRow>})}</TableBody></Table></Paper></>}
