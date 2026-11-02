import * as React from "react";
import {
  Box,
  Typography,
  Paper,
  Stack,
  Button,
  Divider,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  useMediaQuery,
} from "@mui/material";
import { API } from "../../App";
import FinanceDateRange from "../../components/FinanceDateRange";
import ArrowUpwardOutlinedIcon from "@mui/icons-material/ArrowUpwardOutlined";
import ArrowDownwardOutlinedIcon from "@mui/icons-material/ArrowDownwardOutlined";
const money = (v) =>
  new Intl.NumberFormat("zh-CN", {
    style: "currency",
    currency: "CNY",
    maximumFractionDigits: 0,
  })
    .format(v || 0)
    .replace("CN¥", "¥");
const daysBetween = (a, b) => {
  const out = [];
  for (
    let d = new Date(`${a}T00:00:00`), end = new Date(`${b}T00:00:00`);
    d <= end;
    d.setDate(d.getDate() + 1)
  ) {
    const y = d.getFullYear(),
      m = String(d.getMonth() + 1).padStart(2, "0"),
      day = String(d.getDate()).padStart(2, "0");
    out.push(`${y}-${m}-${day}`);
  }
  return out;
};
const trend = (rows, days, asOf) => {
  const end = new Date(`${asOf}T00:00:00`),
    sum = (offset) => {
      const e = new Date(end);
      e.setDate(e.getDate() - offset);
      const b = new Date(e);
      b.setDate(b.getDate() - days + 1);
      return rows
        .filter((r) => {
          const d = new Date(`${r.stat_date}T00:00:00`);
          return d >= b && d <= e;
        })
        .reduce((a, r) => a + (r.actual_sales || 0), 0);
    },
    a = sum(0),
    b = sum(days),
    v = b ? ((a - b) / Math.abs(b)) * 100 : null;
  return { value: v, up: v === null ? a > 0 : v >= 0 };
};
const shiftDate = (value, days) => {
  const d = new Date(`${value}T00:00:00`);
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
const trendRange = (asOf, days) => {
  const currentStart = shiftDate(asOf, -days + 1),
    previousEnd = shiftDate(asOf, -days),
    previousStart = shiftDate(previousEnd, -days + 1);
  return `本期：${currentStart} 至 ${asOf}；对比期：${previousStart} 至 ${previousEnd}`;
};
const MobileTrend = ({ rows, start, end }) => {
  const map = {};
  rows.forEach((r) => { map[r.stat_date] = (map[r.stat_date] || 0) + (r.actual_sales || 0); });
  const dates = start && end ? daysBetween(start, end) : Object.keys(map).sort();
  const points = dates.map((date) => ({ date, value: map[date] || 0 }));
  if (!points.length) return <Typography color="text.secondary">暂无趋势数据</Typography>;
  const w = 360, h = 190, max = Math.max(...points.map((p) => p.value), 1);
  const x = (i) => 40 + (w - 56) * i / Math.max(points.length - 1, 1), y = (v) => 156 - 130 * v / max;
  const path = points.map((p, i) => `${i ? "L" : "M"} ${x(i)} ${y(p.value)}`).join(" ");
  return <Box sx={{ width: "100%", overflow: "hidden" }}><svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none"><text x="8" y="15" fontSize="10" fill="#6d8279">销售额</text><path d={`M40 156H${w - 16}`} stroke="#dce9e3" /><path d={path} fill="none" stroke="#157a62" strokeWidth="3" />{points.map((p, i) => <g key={p.date}><circle cx={x(i)} cy={y(p.value)} r="4" fill="#157a62"><title>{p.date}：{money(p.value)}</title></circle><text x={x(i)} y="180" textAnchor="middle" fontSize="10" fill="#6d8279">{p.date.slice(5)}</text></g>)}</svg></Box>;
};
if (typeof document !== "undefined") {
  const applyTrendTitles = () => {
    const match = document.body.innerText.match(
      /当前数据日：\s*(\d{4}-\d{2}-\d{2})/,
    );
    if (!match) return;
    document.querySelectorAll("table thead tr").forEach((row) => {
      [...row.children].forEach((cell, index) => {
        if (index >= 3 && index <= 5) {
          const days = [1, 7, 30][index - 3];
          const label = ["近1天", "近7天", "近30天"][index - 3];
          cell.title = `${label}｜${trendRange(match[1], days)}`;
          cell.setAttribute("aria-label", cell.title);
          cell.style.cursor = "help";
        }
      });
    });
  };
  new MutationObserver(applyTrendTitles).observe(document.body, {
    subtree: true,
    childList: true,
  });
  setTimeout(applyTrendTitles, 0);
}
function AxisChart({ points }) {
  const mobile = useMediaQuery("(max-width:899px)");
  const scrollRef = React.useRef(null),
    dragRef = React.useRef(null),
    [hovered, setHovered] = React.useState(null);
  if (!points.length)
    return (
      <Typography sx={{ p: 4 }} color="text.secondary">
        当前日期范围暂无趋势数据
      </Typography>
    );
  const w = mobile ? 330 : Math.max(760, points.length * 28),
    h = mobile ? 230 : 310,
    p = { l: 76, r: 24, t: 28, b: 54 },
    max = Math.max(...points.map((x) => x.sales), 1),
    step = max / 4,
    cx = (i) => p.l + ((w - p.l - p.r) * i) / Math.max(points.length - 1, 1),
    cy = (v) => h - p.b - ((h - p.t - p.b) * v) / max,
    path = points
      .map((x, i) => `${i ? "L" : "M"} ${cx(i)} ${cy(x.sales)}`)
      .join(" ");
  return (
    <Box sx={{ position: "relative" }}>
      {hovered && (
        <Paper
          elevation={4}
          sx={{
            position: "absolute",
            zIndex: 2,
            top: Math.max(8, cy(hovered.sales) - 76),
            left: Math.min(Math.max(8, cx(hovered.index) - 70), w - 178),
            px: 1.5,
            py: 1,
            pointerEvents: "none",
            border: "1px solid #d8e9e1",
            minWidth: 150,
          }}
        >
          <Typography variant="caption" color="text.secondary" display="block">
            {hovered.date}
          </Typography>
          <Typography variant="body2" fontWeight={700} color="primary.main">
            销售额：{money(hovered.sales)}
          </Typography>
          {typeof hovered.profit === "number" && (
            <Typography
              variant="caption"
              color="text.secondary"
              display="block"
            >
              利润：{money(hovered.profit)}
            </Typography>
          )}
        </Paper>
      )}
      <Box
        ref={scrollRef}
        onPointerDown={(e) => {
          if (e.button !== 0) return;
          dragRef.current = {
            x: e.clientX,
            scrollLeft: scrollRef.current.scrollLeft,
          };
          e.currentTarget.setPointerCapture(e.pointerId);
          e.currentTarget.style.cursor = "grabbing";
        }}
        onPointerMove={(e) => {
          if (dragRef.current)
            scrollRef.current.scrollLeft =
              dragRef.current.scrollLeft - (e.clientX - dragRef.current.x);
        }}
        onPointerUp={(e) => {
          dragRef.current = null;
          e.currentTarget.style.cursor = "grab";
        }}
        onPointerCancel={(e) => {
          dragRef.current = null;
          e.currentTarget.style.cursor = "grab";
        }}
        sx={{
          overflowX: mobile ? "hidden" : "auto",
          cursor: mobile ? "default" : "grab",
          userSelect: "none",
          touchAction: mobile ? "auto" : "pan-y",
        }}
      >
        <svg
          viewBox={`0 0 ${w} ${h}`}
          width={mobile ? "100%" : w}
          height={h}
          aria-label="销售额趋势"
        >
          <text x="16" y="18" fontSize="12" fill="#557269">
            销售额（元）
          </text>
          {[0, 1, 2, 3, 4].map((i) => (
            <g key={i}>
              <line
                x1={p.l}
                x2={w - p.r}
                y1={cy(i * step)}
                y2={cy(i * step)}
                stroke="#e4eee9"
              />
              <text
                x={p.l - 10}
                y={cy(i * step) + 4}
                textAnchor="end"
                fontSize="11"
                fill="#6d8279"
              >
                {Math.round(i * step).toLocaleString()}
              </text>
            </g>
          ))}
          <path d={path} fill="none" stroke="#157a62" strokeWidth="3" />
          {points.map((x, i) => (
            <g key={x.date}>
              <circle
                cx={cx(i)}
                cy={cy(x.sales)}
                r="7"
                fill="#157a62"
                stroke="#fff"
                strokeWidth="2"
                tabIndex="0"
                aria-label={`${x.date} 销售额 ${money(x.sales)}`}
                onMouseEnter={() => setHovered({ ...x, index: i })}
                onMouseLeave={() => setHovered(null)}
                onFocus={() => setHovered({ ...x, index: i })}
                onBlur={() => setHovered(null)}
              >
                <title>{`${x.date}：${money(x.sales)}`}</title>
              </circle>
              <text
                x={cx(i)}
                y={h - (i % 2 ? 18 : 32)}
                textAnchor="middle"
                fontSize="10"
                fill="#6d8279"
              >
                {x.date.slice(5)}
              </text>
            </g>
          ))}
        </svg>
      </Box>
    </Box>
  );
}
const SortHead = ({ label, field, sort, setSort, direction, setDirection }) => (
  <TableCell
    align={field === "name" ? "left" : "right"}
    sx={{ whiteSpace: "nowrap" }}
  >
    <Stack
      direction="row"
      justifyContent={field === "name" ? "flex-start" : "flex-end"}
      alignItems="center"
    >
      {label}
      {field !== "name" && (
        <IconButton
          size="small"
          onClick={() =>
            sort === field
              ? setDirection(direction === "desc" ? "asc" : "desc")
              : (setSort(field), setDirection("desc"))
          }
          sx={{
            p: 0.2,
            color: sort === field ? "primary.main" : "text.secondary",
          }}
        >
          {sort === field && direction === "asc" ? (
            <ArrowUpwardOutlinedIcon sx={{ fontSize: 16 }} />
          ) : (
            <ArrowDownwardOutlinedIcon sx={{ fontSize: 16 }} />
          )}
        </IconButton>
      )}
    </Stack>
  </TableCell>
);
export default function AnalysisV2() {
  const n = new Date();
  n.setDate(n.getDate() - 1);
  const pad = (x) => String(x).padStart(2, "0"),
    yesterday = `${n.getFullYear()}-${pad(n.getMonth() + 1)}-${pad(n.getDate())}`,
    first = yesterday,
    today = yesterday;
  const [d, setD] = React.useState(null),
    [start, setStart] = React.useState(first),
    [end, setEnd] = React.useState(today),
    [selected, setSelected] = React.useState(""),
    [sort, setSort] = React.useState("sales"),
    [direction, setDirection] = React.useState("desc"),
    [page, setPage] = React.useState(1),
    [chartRows, setChartRows] = React.useState([]),
    [trendProduct, setTrendProduct] = React.useState("");
  const load = React.useCallback((a, b, trendStart = a, trendEnd = b) => {
    setD(null);
    const request = (x, y) =>
      fetch(`${API}/api/summary?start_date=${x}&end_date=${y}`).then((r) =>
        r.json(),
      );
    Promise.all([request(a, b), request(trendStart, trendEnd)])
      .then(([table, chart]) => {
        setChartRows(chart.rows || []);
        setD(table);
      })
      .catch(() => {
        setChartRows([]);
        setD({ rows: [] });
      });
  }, []);
  React.useEffect(() => {
    load(first, today, shiftDate(today, -6), today);
  }, [load, first, today]);
  if (!d) return <Typography>正在加载产品分析…</Typography>;
  const data = d.rows || [],
    products = [...new Set(data.map((x) => x.product_name).filter(Boolean))],
    asOf = data.reduce((a, x) => (x.stat_date > a ? x.stat_date : a), "");
  const current = products.includes(selected) ? selected : "__all__",
    chartData = chartRows.length ? chartRows : data,
    rows =
      selected && products.includes(selected)
        ? chartData
            .filter((x) => x.product_name === selected)
            .sort((a, b) => a.stat_date.localeCompare(b.stat_date))
        : chartData.sort((a, b) => a.stat_date.localeCompare(b.stat_date)),
    map = {},
    profitMap = {};
  rows.forEach((x) => {
    map[x.stat_date] = (map[x.stat_date] || 0) + x.actual_sales;
    profitMap[x.stat_date] = (profitMap[x.stat_date] || 0) + x.profit;
  });
  const chartRangeStart = start === end ? shiftDate(end, -6) : start;
  const points = daysBetween(chartRangeStart, end).map((date) => ({
    date,
    sales: map[date] || 0,
    profit: profitMap[date] || 0,
  }));
  const trendData = chartRows.length ? chartRows : data;
  const summary = products
    .map((name) => {
      const rs = trendData.filter((x) => x.product_name === name);
      return {
        name,
        sales: rs.reduce((a, r) => a + r.actual_sales, 0),
        profit: rs.reduce((a, r) => a + r.profit, 0),
        t1: trend(rs, 1, asOf),
        t7: trend(rs, 7, asOf),
        t30: trend(rs, 30, asOf),
      };
    })
    .sort((a, b) => {
      const v = (x) =>
        sort === "sales"
          ? x.sales
          : sort === "profit"
            ? x.profit
            : sort === "t1"
              ? (x.t1.value ?? -Infinity)
              : sort === "t7"
                ? (x.t7.value ?? -Infinity)
                : (x.t30.value ?? -Infinity);
      return direction === "desc" ? v(b) - v(a) : v(a) - v(b);
    });
  const pageCount = Math.max(1, Math.ceil(summary.length / 20)),
    visible = summary.slice((page - 1) * 20, page * 20);
  const range = (a, b) => {
    const nextA = a || first,
      nextB = b || today;
    setStart(nextA);
    setEnd(nextB);
    setPage(1);
    if (a && b) {
      setSelected("");
      load(nextA, nextB);
    }
  };
  return (
    <>
      <Typography variant="h4" fontWeight={700} sx={{ mb: 1 }}>
        产品利润贡献
      </Typography>
      <Paper sx={{ p: 2, mb: 2 }}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          gap={1.5}
          alignItems={{ sm: "center" }}
        >
          <FinanceDateRange start={start} end={end} onChange={range} />
          <Button
            variant="contained"
            onClick={() => {
              const a = start || first,
                b = end || today;
              setStart(a);
              setEnd(b);
              setSelected("");
              load(a, b);
            }}
          >
            查询
          </Button>
          <Typography variant="caption" color="text.secondary">
            当前数据日：{asOf || "暂无"}
          </Typography>
        </Stack>
      </Paper>
      <Paper sx={{ p: 2.5, mb: 2 }}>
        <Stack direction="row" justifyContent="space-between">
          <Box>
            <Typography variant="h6" fontWeight={700}>
              {current === "__all__" ? "全部产品" : current}
            </Typography>
          </Box>
          <Button href="/" variant="outlined">
            返回仪表盘
          </Button>
        </Stack>
        {products.length ? <AxisChart points={points} /> : <Box sx={{ minHeight: 230, display: "flex", alignItems: "center", justifyContent: "center" }}><Typography color="text.secondary">当前日期范围暂无产品数据</Typography></Box>}
      </Paper>
      <Paper sx={{ p: 2.5 }}>
        <Stack direction="row" justifyContent="space-between" sx={{ mb: 1 }}>
          <Typography variant="h6" fontWeight={700}>
            产品列表
          </Typography>
        </Stack>
        <Divider />
        {products.length ? <Stack
          spacing={1.25}
          sx={{ display: { xs: "flex", sm: "none" }, mt: 1.5 }}
        >
          {visible.map((x, i) => (
            <Paper
              key={x.name}
              variant="outlined"
              sx={{ p: 1.5, borderRadius: 2 }}
            >
              <Stack direction="row" justifyContent="space-between" gap={1}>
                <Typography fontWeight={700} noWrap>
                  {i + 1}. {x.name}
                </Typography>
                <Button type="button" size="small" onClick={() => setTrendProduct(x.name)} sx={{ minWidth: 0, p: 0, fontSize: "0.68rem", whiteSpace: "nowrap" }}>
                  查看趋势
                </Button>
              </Stack>
              <Stack direction="row" spacing={2} sx={{ mt: 1.25 }}>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="caption" color="text.secondary">
                    累计销售额
                  </Typography>
                  <Typography fontWeight={700}>{money(x.sales)}</Typography>
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="caption" color="text.secondary">
                    累计利润
                  </Typography>
                  <Typography
                    fontWeight={700}
                    color={x.profit < 0 ? "error.main" : "success.main"}
                  >
                    {money(x.profit)}
                  </Typography>
                </Box>
              </Stack>
              <Stack direction="row" spacing={1} sx={{ mt: 1.25 }}>
                {[
                  ["近1天", x.t1],
                  ["近7天", x.t7],
                  ["近30天", x.t30],
                ].map(([label, t]) => (
                  <Box
                    key={label}
                    sx={{
                      flex: 1,
                      p: 0.75,
                      bgcolor: "action.hover",
                      borderRadius: 1,
                    }}
                  >
                    <Typography variant="caption" color="text.secondary">
                      {label}
                    </Typography>
                    <Typography
                      variant="body2"
                      fontWeight={700}
                      color={
                        t.value === null
                          ? "text.secondary"
                          : t.up
                            ? "success.main"
                            : "error.main"
                      }
                    >
                      {t.value === null
                        ? "—"
                        : `${t.up ? "↑" : "↓"}${Math.abs(t.value).toFixed(1)}%`}
                    </Typography>
                  </Box>
                ))}
              </Stack>
            </Paper>
          ))}
        </Stack> : <Box sx={{ minHeight: 180, display: "flex", alignItems: "center", justifyContent: "center" }}><Typography color="text.secondary">当前日期范围暂无产品数据</Typography></Box>}
        <Box sx={{ overflowX: "auto", display: { xs: "none", sm: "block" } }}>
          <Table
            size="small"
            sx={{
              minWidth: { xs: 680, sm: 920 },
              "& th, & td": {
                px: { xs: 0.75, sm: 1.75 },
                fontSize: { xs: "0.68rem", sm: "0.875rem" },
              },
            }}
          >
            <TableHead>
              <TableRow>
                <SortHead
                  label="产品名称"
                  field="name"
                  sort={sort}
                  setSort={setSort}
                  direction={direction}
                  setDirection={setDirection}
                />
                <SortHead
                  label="累计销售额"
                  field="sales"
                  sort={sort}
                  setSort={setSort}
                  direction={direction}
                  setDirection={setDirection}
                />
                <SortHead
                  label="累计利润"
                  field="profit"
                  sort={sort}
                  setSort={setSort}
                  direction={direction}
                  setDirection={setDirection}
                />
                <SortHead
                  label="近1天"
                  field="t1"
                  sort={sort}
                  setSort={setSort}
                  direction={direction}
                  setDirection={setDirection}
                />
                <SortHead
                  label="近7天"
                  field="t7"
                  sort={sort}
                  setSort={setSort}
                  direction={direction}
                  setDirection={setDirection}
                />
                <SortHead
                  label="近30天"
                  field="t30"
                  sort={sort}
                  setSort={setSort}
                  direction={direction}
                  setDirection={setDirection}
                />
              </TableRow>
            </TableHead>
            <TableBody>
              {visible.map((x, i) => (
                <TableRow
                  key={x.name}
                  hover
                  selected={x.name === current}
                  onClick={() => setSelected(x.name)}
                  sx={{ cursor: "pointer" }}
                >
                  <TableCell>
                    {i + 1}. {x.name}
                  </TableCell>
                  <TableCell align="right">{money(x.sales)}</TableCell>
                  <TableCell
                    align="right"
                    sx={{
                      color: x.profit < 0 ? "#c55a45" : "#157a62",
                      fontWeight: 700,
                    }}
                  >
                    {money(x.profit)}
                  </TableCell>
                  {[x.t1, x.t7, x.t30].map((t, j) => (
                    <TableCell
                      key={j}
                      align="right"
                      sx={{
                        color:
                          t.value === null
                            ? "#6d8279"
                            : t.up
                              ? "#157a62"
                              : "#c55a45",
                        fontWeight: 700,
                      }}
                    >
                      {t.value === null
                        ? "—"
                        : `${t.up ? "↑" : "↓"}${Math.abs(t.value).toFixed(1)}%`}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>
        <Stack
          direction="row"
          justifyContent="center"
          alignItems="center"
          gap={1.5}
          sx={{ mt: 2 }}
        >
          <Button
            size="small"
            variant="outlined"
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
          >
            上一页
          </Button>
          <Typography variant="body2" color="text.secondary">
            第 {page} / {pageCount} 页
          </Typography>
          <Button
            size="small"
            variant="outlined"
            disabled={page >= pageCount}
            onClick={() => setPage(page + 1)}
          >
            下一页
          </Button>
        </Stack>
      </Paper>
      <Dialog open={Boolean(trendProduct)} onClose={() => setTrendProduct("")} fullWidth maxWidth="sm">
        <DialogTitle>{trendProduct} · 销售额趋势</DialogTitle>
        <DialogContent><Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>{start === end ? shiftDate(end, -6) : start} 至 {end}</Typography><MobileTrend start={start === end ? shiftDate(end, -6) : start} end={end} rows={trendData.filter((r) => r.product_name === trendProduct)} /></DialogContent>
      </Dialog>
    </>
  );
}
