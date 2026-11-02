import * as React from 'react';
import { Paper, Typography } from '@mui/material';
import { API } from '../../App';
import AnalysisV2 from './AnalysisV2';

export default function AnalysisEmptyGuard() {
  const [state, setState] = React.useState({ loading: true, empty: false });
  React.useEffect(() => {
    let active = true;
    fetch(`${API}/api/summary`)
      .then((response) => response.json())
      .then((data) => {
        if (!active) return;
        setState({ loading: false, empty: !Array.isArray(data?.rows) || data.rows.length === 0 });
      })
      .catch(() => active && setState({ loading: false, empty: true }));
    return () => { active = false; };
  }, []);
  if (state.loading) return <Typography>正在加载产品分析…</Typography>;
  if (state.empty) return <Paper sx={{ p: 3 }}><Typography>当前暂无产品数据，请先导入利润表。</Typography></Paper>;
  return <AnalysisV2 />;
}
