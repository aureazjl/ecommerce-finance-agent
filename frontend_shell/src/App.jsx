import * as React from "react";
import { createTheme, styled, ThemeProvider } from "@mui/material/styles";
import Box from "@mui/material/Box";
import CssBaseline from "@mui/material/CssBaseline";
import CustomAppBar from "./components/CustomAppBar";
import SideBar from "./components/SideBar";
import { getDesignTokens } from "./theme";
import { Outlet } from "react-router";
import useMediaQuery from "@mui/material/useMediaQuery";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";

export const API = import.meta.env.VITE_API_BASE ?? (import.meta.env.DEV ? "http://127.0.0.1:18780" : "");

const DrawerHeader = styled("div")(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-end",
  padding: theme.spacing(0, 1),
  // necessary for content to be below app bar
  ...theme.mixins.toolbar,
}));

export default function MiniDrawer({ user }) {
  const [mode, setMode] = React.useState(
    localStorage.getItem("currentMode") ?? "light"
  );
  const [open, setOpen] = React.useState(false);

  const handleLogout = React.useCallback(async () => {
    try { await fetch(`${API}/api/auth/logout`, { method: "POST", credentials: "include" }); }
    finally { window.location.assign("/"); }
  }, []);

  const handleDrawerOpen = () => {
    setOpen(true);
  };

  const handleDrawerClose = () => {
    setOpen(false);
  };
  const theme = React.useMemo(() => createTheme(getDesignTokens(mode)), [mode]);
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ display: "flex" }}>
        <CssBaseline />
        {!isMobile && <CustomAppBar
          open={open}
          handleDrawerOpen={handleDrawerOpen}
          setMode={setMode}
          onLogout={handleLogout}
          user={user}
        />}
        <SideBar open={open} handleDrawerClose={handleDrawerClose} handleDrawerOpen={handleDrawerOpen} user={user} />


        <Box component="main" sx={{ flexGrow: 1, p: { xs: 2.25, sm: 3 }, minWidth: 0, overflowX: "hidden", backgroundColor: "background.default", minHeight: "100vh", "@media (min-width:601px)": { "& .MuiTextField-root": { minWidth: 150 } }, "@media (max-width:600px)": { "& .MuiPaper-root": { p: "18px !important" }, "& .profit-table-mobile": { p: "0 !important" }, "& .MuiTypography-h4": { fontSize: "1.8rem", lineHeight: 1.2, letterSpacing: "-0.02em" }, "& .MuiTypography-h6": { fontSize: "1rem", lineHeight: 1.35 }, "& .MuiTypography-body1": { fontSize: "0.9rem" }, "& .MuiTypography-body2": { fontSize: "0.78rem" }, "& .MuiTypography-caption": { fontSize: "0.7rem" }, "& .MuiTableCell-root": { fontSize: "0.75rem" }, "& .MuiLinearProgress-root": { marginTop: "6px" } } }}>
          {isMobile && <Box sx={{ mb: 2, px: 0.5, pt: 0.25 }}>
            <Typography variant="body1" fontWeight={800} color="primary.dark" sx={{ fontSize: "1rem", letterSpacing: 0.3 }}>电商财务分析平台</Typography>
          </Box>}
          <DrawerHeader sx={{ display: { xs: "none", sm: "flex" } }} />
          <Outlet />
        </Box>
      </Box>
    </ThemeProvider>
  );
}
