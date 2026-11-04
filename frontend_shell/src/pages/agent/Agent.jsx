import * as React from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  Collapse,
  CircularProgress,
  LinearProgress,
  Divider,
  IconButton,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import HistoryRoundedIcon from "@mui/icons-material/HistoryRounded";
import DataObjectRoundedIcon from "@mui/icons-material/DataObjectRounded";
import InsightsRoundedIcon from "@mui/icons-material/InsightsRounded";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";

const AGENT_API =
  import.meta.env.VITE_AGENT_API_BASE ?? "http://127.0.0.1:18781";
const stages = [
  "理解问题",
  "生成分析计划",
  "查询业务数据",
  "校验结果",
  "生成结论",
];
const coreNodes = new Set([
  "router[DeepSeek]",
  "router[本地兜底]",
  "semantic",
  "intent_validate[DeepSeek]",
  "intent_validate[本地]",
  "tool_executor",
  "insight",
  "render",
]);
function Markdown({ text }) {
  return (
    <Stack spacing={0.35}>
      {String(text || "")
        .split("\n")
        .map((line, i) => (
          <Typography
            key={i}
            variant={line.startsWith("#") ? "h6" : "body1"}
            sx={{ lineHeight: 1.7, whiteSpace: "pre-wrap" }}
          >
            {line
              .split(/(\*\*[^*]+\*\*)/g)
              .map((part, j) =>
                part.startsWith("**") ? (
                  <strong key={j}>{part.slice(2, -2)}</strong>
                ) : (
                  part
                ),
              )}
          </Typography>
        ))}
    </Stack>
  );
}
function Section({ title, icon, children, defaultOpen = true }) {
  const [open, setOpen] = React.useState(defaultOpen);
  return (
    <Box>
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{ mb: 1 }}
      >
        <Stack direction="row" spacing={0.8} alignItems="center">
          {icon}
          <Typography fontWeight={700}>{title}</Typography>
        </Stack>
        <IconButton size="small" onClick={() => setOpen((x) => !x)}>
          <ExpandMoreRoundedIcon
            sx={{ transform: open ? "rotate(0)" : "rotate(-90deg)" }}
          />
        </IconButton>
      </Stack>
      <Collapse in={open}>{children}</Collapse>
    </Box>
  );
}
function Flow({ active, elapsed = 0, stageTimes = {} }) {
  const index = stages.indexOf(active);
  return (
    <Box sx={{ overflowX: "auto", py: 0.5, whiteSpace: "nowrap" }}>
      <Stack
        direction="row"
        alignItems="center"
        justifyContent={{ sm: "center" }}
        sx={{ minWidth: 620, px: 1 }}
      >
        {stages.map((stage, i) => (
          <React.Fragment key={stage}>
            <Stack
              direction="row"
              spacing={0.55}
              alignItems="center"
              sx={{ flexShrink: 0 }}
            >
              <Typography variant="body2" fontWeight={i === index ? 700 : 500}>
                {stage}
              </Typography>
              {i === index && <CircularProgress size={14} thickness={5} />}
              {i === index && (
                <Typography variant="caption" color="text.secondary">
                  {elapsed}s
                </Typography>
              )}
              {stageTimes[stage] != null && i !== index && (
                <Typography variant="caption" color="text.secondary">
                  {stageTimes[stage]}ms
                </Typography>
              )}
            </Stack>
            {i < stages.length - 1 && (
              <Typography
                sx={{
                  px: 0.8,
                  color: i < index ? "success.main" : "text.disabled",
                  fontSize: 20,
                }}
              >
                →
              </Typography>
            )}
          </React.Fragment>
        ))}
      </Stack>
    </Box>
  );
}
function ChartWithAxes({ rows, type }) {
  const items = rows.slice(0, 10).map((row) => ({ ...row, value: Number(row.value || 0) }));
  const width = 760;
  const height = 300;
  const plot = { left: 64, right: 24, top: 24, bottom: 76 };
  const plotWidth = width - plot.left - plot.right;
  const plotHeight = height - plot.top - plot.bottom;
  const max = Math.max(...items.map((row) => Math.abs(row.value)), 1);
  const barGap = 18;
  const barGroupWidth = items.length * 70 + Math.max(items.length - 1, 0) * barGap;
  const barStart = plot.left + Math.max(0, (plotWidth - barGroupWidth) / 2);
  const ticks = [0, 0.25, 0.5, 0.75, 1];
  const x = (index) => plot.left + ((index + 0.5) * plotWidth) / Math.max(items.length, 1);
  const y = (value) => plot.top + plotHeight - (Math.abs(value) / max) * plotHeight;
  return (
    <Box sx={{ width: "100%", maxWidth: 640, mx: "auto" }}>
      <svg viewBox={`0 0 ${width} ${height}`} width="100%" height="300" role="img" aria-label="带坐标轴的产品数据图表">
        {ticks.map((tick) => {
          const yy = plot.top + plotHeight * (1 - tick);
          return <g key={tick}><line x1={plot.left} x2={width - plot.right} y1={yy} y2={yy} stroke="#dce9e3" /><text x={plot.left - 8} y={yy + 4} textAnchor="end" fontSize="11" fill="#60756d">{(max * tick).toFixed(0)}</text></g>;
        })}
        <line x1={plot.left} x2={plot.left} y1={plot.top} y2={plot.top + plotHeight} stroke="#789188" />
        <line x1={plot.left} x2={width - plot.right} y1={plot.top + plotHeight} y2={plot.top + plotHeight} stroke="#789188" />
        <text x="14" y={plot.top + plotHeight / 2} transform={`rotate(-90 14 ${plot.top + plotHeight / 2})`} textAnchor="middle" fontSize="11" fill="#526b61">数值</text>
        {type === "line" && items.length > 1 && <polyline points={items.map((row, index) => `${x(index)},${y(row.value)}`).join(" ")} fill="none" stroke="#157a62" strokeWidth="3" />}
        {items.map((row, index) => {
          const barX = barStart + index * (70 + barGap);
          const barWidth = 70;
          const yy = y(row.value);
          return <g key={row.name}>
            {type === "line" ? <circle cx={x(index)} cy={yy} r="5" fill="#157a62"><title>{`${row.name}: ${row.value.toFixed(2)}`}</title></circle> : <><rect x={barX} y={yy} width={barWidth} height={plot.top + plotHeight - yy} rx="4" fill={row.value < 0 ? "#c55a45" : "#157a62"}><title>{`${row.name}: ${row.value.toFixed(2)}`}</title></rect><text x={barX + barWidth / 2} y={Math.max(plot.top + 12, yy - 6)} textAnchor="middle" fontSize="11" fill="#29483d">{row.value.toFixed(0)}</text></>}
            <text x={barX + barWidth / 2} y={height - 42} textAnchor="middle" fontSize="11" fill="#526b61" transform={`rotate(-28 ${barX + barWidth / 2} ${height - 42})`}>{row.name}</text>
          </g>;
        })}
      </svg>
    </Box>
  );
}
function DataChart({ rows, initialType }) {
  const [type, setType] = React.useState(initialType || "bar");
  React.useEffect(() => setType(initialType || "bar"), [initialType]);
  if (type === "bar" || type === "line") return <><Stack direction="row" spacing={0.75} sx={{ mb: 1.5, flexWrap: "wrap", gap: 0.75 }}><Chip size="small" label="柱状图" color={type === "bar" ? "primary" : "default"} variant={type === "bar" ? "filled" : "outlined"} onClick={() => setType("bar")} /><Chip size="small" label="折线图" color={type === "line" ? "primary" : "default"} variant={type === "line" ? "filled" : "outlined"} onClick={() => setType("line")} /><Chip size="small" label="占比图" color="default" variant="outlined" onClick={() => setType("pie")} /></Stack><ChartWithAxes rows={rows} type={type} /></>;
  const items = rows.slice(0, 10).map((row) => ({ ...row, value: Number(row.value || 0) }));
  const max = Math.max(...items.map((row) => Math.abs(row.value)), 1);
  const total = items.reduce((sum, row) => sum + Math.abs(row.value), 0) || 1;
  const points = items.map((row, index) => `${20 + (index * 360) / Math.max(items.length - 1, 1)},${112 - (Math.abs(row.value) / max) * 92}`).join(" ");
  const pie = items.reduce((parts, row, index) => { const start = parts.end; const end = start + (Math.abs(row.value) / total) * 360; parts.stops.push(`${['#157a62', '#2d9b7d', '#6bc3a6', '#b5e1cf', '#e5f4ed'][index % 5]} ${start}deg ${end}deg`); parts.end = end; return parts; }, { end: 0, stops: [] }).stops.join(", ");
  return <Box sx={{ mt: 1 }}><Stack direction="row" spacing={0.75} sx={{ mb: 1.5, flexWrap: "wrap", gap: 0.75 }}><Chip size="small" label="柱状图" color={type === "bar" ? "primary" : "default"} variant={type === "bar" ? "filled" : "outlined"} onClick={() => setType("bar")} /><Chip size="small" label="折线图" color={type === "line" ? "primary" : "default"} variant={type === "line" ? "filled" : "outlined"} onClick={() => setType("line")} /><Chip size="small" label="占比图" color={type === "pie" ? "primary" : "default"} variant={type === "pie" ? "filled" : "outlined"} onClick={() => setType("pie")} /></Stack>{type === "pie" ? <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems="center" justifyContent="center"><Box role="img" aria-label="数据占比图" sx={{ width: 190, height: 190, borderRadius: "50%", background: `conic-gradient(${pie})`, position: "relative", "&::after": { content: '""', position: "absolute", inset: 48, bgcolor: "background.paper", borderRadius: "50%" } }} /><Stack spacing={0.5}>{items.slice(0, 6).map((row, index) => <Stack direction="row" spacing={0.7} alignItems="center" key={row.name}><Box sx={{ width: 9, height: 9, borderRadius: "50%", bgcolor: ['#157a62', '#2d9b7d', '#6bc3a6', '#b5e1cf', '#e5f4ed'][index % 5] }} /><Typography variant="caption" sx={{ maxWidth: 220 }} noWrap>{row.name} · {(Math.abs(row.value) / total * 100).toFixed(1)}%</Typography></Stack>)}</Stack></Stack> : <Box sx={{ height: 190, width: "100%", overflowX: "auto" }}>{type === "line" ? <svg viewBox="0 0 400 130" width="100%" height="190" role="img" aria-label="数据趋势图"><path d="M20 112H380" stroke="#dce9e3" />{points && <polyline points={points} fill="none" stroke="#157a62" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />}{items.map((row, index) => <g key={row.name}><circle cx={20 + (index * 360) / Math.max(items.length - 1, 1)} cy={112 - (Math.abs(row.value) / max) * 92} r="4" fill="#157a62"><title>{`${row.name}: ${row.value.toFixed(2)}`}</title></circle></g>)}</svg> : <Stack direction="row" alignItems="end" justifyContent="center" gap={0.8} sx={{ height: 150, px: 1 }}>{items.map((row) => <Box key={row.name} title={`${row.name}: ${row.value.toFixed(2)}`} sx={{ flex: 1, minWidth: 12, maxWidth: 72, height: `${Math.max(8, (Math.abs(row.value) / max) * 100)}%`, bgcolor: row.value < 0 ? "error.main" : "primary.main", borderRadius: "5px 5px 0 0", transition: "height 180ms ease" }} />)}</Stack>}</Box>}</Box>;
}
function ChartDataTable({ rows }) {
  return (
    <Box sx={{ mt: 1, borderTop: "1px solid", borderColor: "divider", pt: 1 }}>
      <Typography variant="caption" color="text.secondary">
        横轴：产品名称　·　纵轴：数值
      </Typography>
      <Box sx={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) 120px 80px", gap: 0.5, mt: 0.5 }}>
        {rows.slice(0, 10).map((row) => (
          <React.Fragment key={`chart-${row.name}`}>
            <Typography variant="caption" noWrap title={row.name}>{row.name}</Typography>
            <Typography variant="caption" align="right" fontWeight={700}>{Number(row.value || 0).toFixed(2)}</Typography>
            <Typography variant="caption" align="right" color="text.secondary">{row.rows ?? "-"} 行</Typography>
          </React.Fragment>
        ))}
      </Box>
    </Box>
  );
}
function EvidenceSummary({ evidence, source, modelStatus }) {
  const range = evidence.date_range?.filter(Boolean).join(" 至 ") || "未识别";
  const status = modelStatus === "called" ? "AI 已参与" : "本地规则";
  return (
    <Box
      sx={{
        mt: 2,
        p: { xs: 1.5, sm: 2 },
        borderRadius: 2.5,
        bgcolor: "rgba(21,122,98,.055)",
        border: "1px solid rgba(21,122,98,.14)",
      }}
    >
      <Stack
        direction={{ xs: "column", sm: "row" }}
        justifyContent="space-between"
        gap={1}
        sx={{ mb: 1.5 }}
      >
        <Box>
          <Typography variant="subtitle2" fontWeight={800}>
            数据依据
          </Typography>
          <Typography variant="caption" color="text.secondary">
            本次结论使用的范围与口径
          </Typography>
        </Box>
        <Chip
          size="small"
          label={status}
          color={modelStatus === "called" ? "success" : "default"}
          variant="outlined"
        />
      </Stack>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(4, 1fr)" },
          gap: 1,
        }}
      >
        <Box sx={{ p: 1.25, bgcolor: "background.paper", borderRadius: 1.75 }}>
          <Typography variant="caption" color="text.secondary">
            分析范围
          </Typography>
          <Typography variant="body2" fontWeight={700} sx={{ mt: 0.35 }}>
            {range}
          </Typography>
        </Box>
        <Box sx={{ p: 1.25, bgcolor: "background.paper", borderRadius: 1.75 }}>
          <Typography variant="caption" color="text.secondary">
            指标
          </Typography>
          <Typography variant="body2" fontWeight={700} sx={{ mt: 0.35 }}>
            {evidence.metric || "综合指标"}
          </Typography>
        </Box>
        <Box sx={{ p: 1.25, bgcolor: "background.paper", borderRadius: 1.75 }}>
          <Typography variant="caption" color="text.secondary">
            分析维度
          </Typography>
          <Typography variant="body2" fontWeight={700} sx={{ mt: 0.35 }}>
            {evidence.dimension || "整体汇总"}
          </Typography>
        </Box>
        <Box sx={{ p: 1.25, bgcolor: "background.paper", borderRadius: 1.75 }}>
          <Typography variant="caption" color="text.secondary">
            证据行数
          </Typography>
          <Typography variant="body2" fontWeight={700} sx={{ mt: 0.35 }}>
            {evidence.row_count ?? source?.row_count ?? 0} 行
              {(evidence.duration_ms ?? source?.duration_ms) != null && (
              <Typography
                component="span"
                variant="caption"
                color="text.secondary"
              >
                {" "}· 查询 {evidence.duration_ms ?? source.duration_ms}ms
              </Typography>
            )}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
export default function Agent() {
  const [question, setQuestion] = React.useState("");
  const [data, setData] = React.useState(null);
  const [busy, setBusy] = React.useState(false);
  const [progress, setProgress] = React.useState("");
  const [stageTimes, setStageTimes] = React.useState({});
  const [elapsed, setElapsed] = React.useState(0);
  const startedAt = React.useRef(0);
  const [error, setError] = React.useState("");
  const [interrupt, setInterrupt] = React.useState(null);
  const [history, setHistory] = React.useState([]);
  const [showTrace, setShowTrace] = React.useState(false);
  React.useEffect(() => {
    if (!busy) {
      startedAt.current = 0;
      return undefined;
    }
    startedAt.current = performance.now();
    const timer = setInterval(
      () =>
        setElapsed(((performance.now() - startedAt.current) / 1000).toFixed(1)),
      100,
    );
    return () => clearInterval(timer);
  }, [busy]);
  React.useEffect(() => {
    fetch(`${AGENT_API}/api/agent/history`)
      .then((r) => r.json())
      .then((x) => {
        const seen = new Set();
        setHistory(
          (x.items || [])
            .filter(
              (item) =>
                item.question &&
                !seen.has(item.question) &&
                seen.add(item.question),
            )
            .slice(0, 3)
            .map((item) => ({
              question: item.question,
              answer: "",
              result: (() => {
                try {
                  return JSON.parse(item.result_json || "null");
                } catch {
                  return null;
                }
              })(),
            })),
        );
      })
      .catch(() => {});
  }, []);
  const ask = async (value = question) => {
    const q = value.trim();
    if (!q || busy) return;
    setQuestion(q);
    setBusy(true);
    setProgress(stages[0]);
    setStageTimes({});
    setError("");
    let timeout;
    try {
      const controller = new AbortController();
      timeout = setTimeout(() => controller.abort(), 60000);
      const r = await fetch(`${AGENT_API}/api/agent/ask-stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q, thread_id: "web-demo" }),
        signal: controller.signal,
      });
      if (!r.ok || !r.body) throw new Error("流式分析连接失败");
      const reader = r.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let result = null;
      while (true) {
        const part = await reader.read();
        if (part.done) break;
        buffer += decoder.decode(part.value, { stream: true });
        const events = buffer.split("\n\n");
        buffer = events.pop() || "";
        for (const raw of events) {
          const line = raw.split("\n").find((x) => x.startsWith("data: "));
          if (!line) continue;
          const event = JSON.parse(line.slice(6));
          if (event.type === "progress") {
            setProgress(event.stage);
            if (event.status === "done")
              setStageTimes((x) => ({
                ...x,
                [event.stage]: event.duration_ms,
              }));
          }
          if (event.type === "result") {
            result = event;
            setData(event);
            setInterrupt(event.interrupt || null);
            setBusy(false);
            setProgress("");
            setHistory((h) =>
              [
                {
                  question: q,
                  answer: event.answer || "等待确认",
                  result: event,
                },
                ...h.filter((item) => item.question !== q),
              ].slice(0, 3),
            );
          }
        }
      }
      if (!result?.ok) throw new Error(result?.error || "分析失败");
      setData(result);
      setInterrupt(result.interrupt || null);
      setHistory((h) =>
        [
          { question: q, answer: result.answer || "等待确认", result },
          ...h.filter((item) => item.question !== q),
        ].slice(0, 3),
      );
    } catch (e) {
      setError(e.name === "AbortError" ? "分析超过 60 秒，已停止等待，请稍后重试。" : e.message);
    } finally {
      clearTimeout(timeout);
      setBusy(false);
      setProgress("");
    }
  };
  const resume = async (decision) => {
    setInterrupt(null);
    const r = await fetch(`${AGENT_API}/api/agent/resume`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ thread_id: "web-demo", decision }),
    });
    const d = await r.json();
    if (d.ok) setData(d);
    else setError(d.error || "确认失败");
  };
  const saveCurrent = async () => {
    if (!data) return;
    const r = await fetch(`${AGENT_API}/api/agent/save`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: data.question || question,
        question: data.question || question,
        result: data,
      }),
    });
    if (!r.ok) setError("保存分析失败");
  };
  const rows = data?.table || data?.rows || [];
  const trace = (data?.trace || []).filter((x) => coreNodes.has(x.node));
  const evidence = data?.evidence || {};
  const dateRange =
    evidence.date_range?.filter(Boolean).join(" 至 ") || "未识别";
  const modelLabel =
    data?.model_status === "called" ||
    trace.some((x) => x.node.includes("DeepSeek"))
      ? "ChatGPT 已调用"
      : "本地兜底";
  return (
    <Box sx={{ maxWidth: 1480, mx: "auto", pb: 4 }}>
      <Stack spacing={2}>
        <Box>
          <Typography variant="h4" fontWeight={800}>
            智能经营分析助手
          </Typography>
        </Box>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              lg: "210px minmax(0, 1fr) 250px",
            },
            gap: 2,
            alignItems: "start",
          }}
        >
          <Paper sx={{ p: 1.5, position: { lg: "sticky" }, top: 16 }}>
            <Section
              title="分析空间"
              icon={<HistoryRoundedIcon color="primary" />}
            >
              <Button
                fullWidth
                variant="contained"
                sx={{ mb: 1.5 }}
                onClick={() => {
                  setData(null);
                  setQuestion("");
                }}
              >
                新建分析
              </Button>
              <Typography variant="caption" color="text.secondary">
                最近问题
              </Typography>
              <Stack spacing={0.5} sx={{ mt: 0.5 }}>
                {history.length ? (
                  history.map((h, i) => (
                    <Button
                      key={i}
                      size="small"
                      sx={{
                        justifyContent: "flex-start",
                        textAlign: "left",
                        color: "text.primary",
                      }}
                      onClick={() => {
                        setQuestion(h.question);
                        setData(h.result || null);
                        setInterrupt(h.result?.interrupt || null);
                      }}
                    >
                      {h.question}
                    </Button>
                  ))
                ) : (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ py: 1 }}
                  >
                    暂无历史问题
                  </Typography>
                )}
              </Stack>
            </Section>
          </Paper>
          <Stack spacing={2}>
            <Paper sx={{ p: { xs: 1.5, sm: 2.5 } }}>
              <TextField
                fullWidth
                multiline
                maxRows={3}
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                label="问问你的经营数据"
                placeholder="例如：近七天哪些产品销量最好？"
                onKeyDown={(e) =>
                  e.key === "Enter" &&
                  !e.shiftKey &&
                  (e.preventDefault(), ask())
                }
              />
              <Stack
                direction="row"
                spacing={1}
                sx={{ mt: 1.5, flexWrap: "wrap", gap: 1 }}
              >
                <Chip
                  label="昨天哪个部门利润最低？"
                  onClick={() => ask("昨天哪个部门利润最低？")}
                />
                <Chip
                  label="近7天产品销售额排名"
                  onClick={() => ask("近7天产品销售额排名")}
                />
                <Button
                  variant="contained"
                  onClick={() => ask()}
                  disabled={busy}
                >
                  {busy ? progress || "分析中…" : "开始分析"}
                </Button>
              </Stack>
              {busy && (
                <Box sx={{ mt: 1.5 }}>
                  <Flow
                    active={progress}
                    elapsed={elapsed}
                    stageTimes={stageTimes}
                  />
                  <LinearProgress sx={{ mt: 1, borderRadius: 1 }} />
                </Box>
              )}
            </Paper>
            {error && (
              <Alert
                severity="error"
                action={
                  <Button
                    color="inherit"
                    size="small"
                    onClick={() => ask(question)}
                  >
                    重试
                  </Button>
                }
              >
                {error}
              </Alert>
            )}
            {data && (
              <Paper sx={{ p: { xs: 1.5, sm: 2.5 }, overflow: "hidden" }}>
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                  sx={{ mb: 1.5 }}
                >
                  <Stack direction="row" spacing={1} alignItems="center">
                    <InsightsRoundedIcon color="primary" />
                    <Typography variant="h6" fontWeight={800}>
                      分析结论
                    </Typography>
                  </Stack>
                  <Chip
                    size="small"
                    label={modelLabel}
                    color={modelLabel.includes("已") ? "success" : "default"}
                  />
                </Stack>
                <Markdown text={data.answer} />
                <EvidenceSummary
                  evidence={evidence}
                  source={data.source}
                  modelStatus={data.model_status}
                />
                {rows.length > 0 && (
                  <>
                    <Typography variant="subtitle2" sx={{ mt: 2, mb: 0.75 }}>
                      结果明细
                    </Typography>
                    <Box sx={{ overflowX: "auto" }}>
                      <Table size="small" sx={{ maxWidth: 900, mx: "auto" }}>
                        <TableHead>
                          <TableRow>
                            <TableCell>名称</TableCell>
                            <TableCell align="right">数值</TableCell>
                            <TableCell align="right">行数</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {rows.slice(0, 10).map((row) => (
                            <TableRow key={row.name}>
                              <TableCell
                                sx={{
                                  maxWidth: 360,
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                {row.name}
                              </TableCell>
                              <TableCell align="right">
                                {Number(row.value || 0).toFixed(2)}
                              </TableCell>
                              <TableCell align="right">
                                {row.rows ?? "-"}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </Box>
                    <Typography variant="subtitle2" sx={{ mt: 2.5, mb: 0.5 }}>
                      可视化趋势
                    </Typography>
                    <DataChart rows={rows} initialType={data.chart?.type} />
                  </>
                )}
                <Box sx={{ mt: 2 }}>
                  <Stack direction="row" spacing={1}>
                    <Button
                      size="small"
                      onClick={() => setShowTrace((x) => !x)}
                    >
                      {showTrace ? "收起执行详情" : "查看执行详情"}
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={saveCurrent}
                    >
                      保存分析
                    </Button>
                  </Stack>
                  <Collapse in={showTrace}>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ display: "block", mt: 1, lineHeight: 1.8 }}
                    >
                      {trace
                        .map((x) => `${x.node.replaceAll("DeepSeek", "ChatGPT")} · ${x.duration_ms}ms`)
                        .join(" → ")}
                    </Typography>
                  </Collapse>
                </Box>
              </Paper>
            )}
          </Stack>
          <Paper sx={{ p: 2, position: { lg: "sticky" }, top: 16 }}>
            <Section
              title="分析上下文"
              icon={<DataObjectRoundedIcon color="primary" />}
            >
              <Stack spacing={1.2}>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    当前日期范围
                  </Typography>
                  <Typography variant="body2">{dateRange}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    分析指标
                  </Typography>
                  <Typography variant="body2">
                    {evidence.metric || "等待提问"}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    分析维度
                  </Typography>
                  <Typography variant="body2">
                    {evidence.dimension || "等待提问"}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    数据来源
                  </Typography>
                  <Typography variant="body2">
                    {data?.source
                      ? `${data.source.database} / ${data.source.table}`
                      : "等待查询"}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    模型状态
                  </Typography>
                  <Typography variant="body2">
                    {data ? modelLabel : "等待查询"}
                  </Typography>
                </Box>
              </Stack>
            </Section>
            {data?.plan?.length > 0 && (
              <>
                <Divider sx={{ my: 2 }} />
                <Section
                  title="分析计划"
                  icon={<InsightsRoundedIcon color="primary" />}
                >
                  <Stack spacing={0.7}>
                    {data.plan.map((step, i) => (
                      <Typography variant="body2" key={i}>
                        {i + 1}. {step}
                      </Typography>
                    ))}
                  </Stack>
                </Section>
              </>
            )}
          </Paper>
        </Box>
      </Stack>
      <Dialog open={Boolean(interrupt)} onClose={() => resume(false)}>
        <DialogTitle>需要确认</DialogTitle>
        <DialogContent>
          {interrupt?.message || "该操作可能改变数据，请确认后继续。"}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => resume(false)}>取消</Button>
          <Button variant="contained" onClick={() => resume(true)}>
            确认继续
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
