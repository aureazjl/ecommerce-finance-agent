import * as React from "react";
import {
  Toolbar,
  IconButton,
  Stack,
  Box,
  Menu,
  MenuItem,
  Typography,
  Avatar,
  Chip,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import MuiAppBar from "@mui/material/AppBar";
import MenuIcon from "@mui/icons-material/Menu";
import Person2OutlinedIcon from "@mui/icons-material/Person2Outlined";
import VisibilityOffOutlinedIcon from "@mui/icons-material/VisibilityOffOutlined";
import { useNavigate } from "react-router-dom";

const drawerWidth = 240;
const AppBar = styled(MuiAppBar, {
  shouldForwardProp: (prop) => prop !== "open",
})(({ theme, open }) => ({
  zIndex: theme.zIndex.drawer + 1,
  background: theme.palette.background.paper,
  color: theme.palette.text.primary,
  boxShadow: "0 1px 0 rgba(23,54,44,.10)",
  borderBottom: `1px solid ${theme.palette.divider}`,
  transition: theme.transitions.create(["width", "margin"], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  ...(open && {
    [theme.breakpoints.up("sm")]: {
      marginLeft: drawerWidth,
      width: `calc(100% - ${drawerWidth}px)`,
      transition: theme.transitions.create(["width", "margin"], {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.enteringScreen,
      }),
    },
  }),
}));
export default function CustomAppBar({ open, handleDrawerOpen, onHideMobile, onLogout, user }) {
  const navigate = useNavigate();
  const [accountAnchor, setAccountAnchor] = React.useState(null);
  const accountOpen = Boolean(accountAnchor);
  return (
    <AppBar position="fixed" open={open}>
      <Toolbar sx={{ minHeight: { xs: 52, sm: 68 }, px: { xs: 2, sm: 3 } }}>
        <IconButton
          color="inherit"
          aria-label="open drawer"
          onClick={handleDrawerOpen}
          edge="start"
          sx={[
            {
              marginRight: { xs: 1, sm: 5 },
              display: { xs: "none", sm: "inline-flex" },
            },
            open && { display: "none" },
          ]}
        >
          <MenuIcon />
        </IconButton>
        <Stack direction="row" spacing={1.2} alignItems="center">
          <Box sx={{ width: 30, height: 30, borderRadius: 2, display: "grid", placeItems: "center", bgcolor: "primary.main", color: "primary.contrastText", fontWeight: 900 }}>财</Box>
          <Box sx={{ display: { xs: "none", sm: "block" } }}>
            <Typography fontWeight={800} lineHeight={1.1}>电商财务分析平台</Typography>
            <Typography variant="caption" color="text.secondary">经营数据工作台</Typography>
          </Box>
        </Stack>
        <Box flexGrow={1} />

        <Stack direction="row" spacing={1} alignItems="center">
          <Chip size="small" label={user?.role === "admin" || user?.username === "admin" ? "管理员" : "财务"} variant="outlined" sx={{ display: { xs: "none", sm: "inline-flex" }, borderColor: "divider" }} />
          <IconButton color="inherit" onClick={onHideMobile} sx={{ display: { xs: "inline-flex", sm: "none" } }} aria-label="隐藏顶部导航">
            <VisibilityOffOutlinedIcon />
          </IconButton>
          <IconButton color="inherit" onClick={(event) => setAccountAnchor(event.currentTarget)} aria-label="账户菜单" aria-controls={accountOpen ? "account-menu" : undefined} aria-haspopup="true" sx={{ p: 0.4 }}>
            <Avatar sx={{ width: 32, height: 32, bgcolor: "primary.main", fontSize: 14 }}><Person2OutlinedIcon fontSize="small" /></Avatar>
          </IconButton>
        </Stack>
      </Toolbar>
      <Menu id="account-menu" anchorEl={accountAnchor} open={accountOpen} onClose={() => setAccountAnchor(null)} anchorOrigin={{ vertical: "bottom", horizontal: "right" }} transformOrigin={{ vertical: "top", horizontal: "right" }}>
        <MenuItem onClick={() => { setAccountAnchor(null); navigate("/profile"); }}>账户信息</MenuItem>
        <MenuItem onClick={async () => { setAccountAnchor(null); await onLogout(); }}>退出登录</MenuItem>
      </Menu>
    </AppBar>
  );
}
