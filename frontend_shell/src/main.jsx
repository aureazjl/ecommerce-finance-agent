import React from "react";
import { createRoot } from "react-dom/client";
import "dayjs/locale/zh-cn";
import "./styles/finance-date-range.css";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import {
  createBrowserRouter,
  createRoutesFromElements,
  Route,
  RouterProvider,
} from "react-router-dom";
import AuthGate from "./AuthGate";
import Dashboard from "./pages/finance/Dashboard";
import ProfitTable from "./pages/finance/ProfitTable";
import ImportData from "./pages/finance/ImportData";
import Analysis from "./pages/finance/Analysis";
import AnalysisEmptyGuard from "./pages/finance/AnalysisEmptyGuard";
import AnalysisV3 from "./pages/finance/AnalysisV3";
import AdminConsole from "./pages/admin/AdminConsole";

const router = createBrowserRouter(
  createRoutesFromElements(
    <Route path="/" element={<AuthGate />}>
      <Route index element={<Dashboard />} />
      <Route path="profit-table" element={<ProfitTable />} />
      <Route path="import" element={<ImportData />} />
      <Route path="analysis" element={<AnalysisEmptyGuard />} />
      <Route path="admin" element={<AdminConsole />} />
    </Route>
  ),
  { basename: import.meta.env.BASE_URL }
);

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="zh-cn">
      <RouterProvider router={router} />
    </LocalizationProvider>
  </React.StrictMode>
);
