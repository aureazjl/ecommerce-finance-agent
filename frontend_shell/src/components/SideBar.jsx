import React from "react";
import List from "@mui/material/List";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import MenuIcon from "@mui/icons-material/Menu";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import InboxIcon from "@mui/icons-material/MoveToInbox";
import MailIcon from "@mui/icons-material/Mail";
import { styled, useTheme, Tooltip, useMediaQuery, Box } from "@mui/material";
import MuiDrawer from "@mui/material/Drawer";
import { HomeOutlined } from "@mui/icons-material";
import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import PeopleOutlinedIcon from "@mui/icons-material/PeopleOutlined";
import ContactsOutlinedIcon from "@mui/icons-material/ContactsOutlined";
import ReceiptOutlinedIcon from "@mui/icons-material/ReceiptOutlined";
import PersonOutlinedIcon from "@mui/icons-material/PersonOutlined";
import CalendarTodayOutlinedIcon from "@mui/icons-material/CalendarTodayOutlined";
import BarChartOutlinedIcon from "@mui/icons-material/BarChartOutlined";
import PieChartOutlineOutlinedIcon from "@mui/icons-material/PieChartOutlineOutlined";
import TimelineOutlinedIcon from "@mui/icons-material/TimelineOutlined";
import MenuOutlinedIcon from "@mui/icons-material/MenuOutlined";
import UploadFileRoundedIcon from "@mui/icons-material/UploadFileRounded";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import MapOutlinedIcon from "@mui/icons-material/MapOutlined";
import { useLocation, useNavigate } from "react-router-dom";
import { grey } from "@mui/material/colors";

const drawerWidth = 240;
const openedMixin = (theme) => ({
  width: drawerWidth,
  transition: theme.transitions.create("width", {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.enteringScreen,
  }),
  overflowX: "hidden",
});

const closedMixin = (theme) => ({
  transition: theme.transitions.create("width", {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  overflowX: "hidden",
  width: `calc(${theme.spacing(7)} + 1px)`,
  [theme.breakpoints.up("sm")]: {
    width: `calc(${theme.spacing(8)} + 1px)`,
  },
});

const Drawer = styled(MuiDrawer, {
  shouldForwardProp: (prop) => prop !== "open",
  // @ts-ignore
})(({ theme, open }) => ({
  width: drawerWidth,
  flexShrink: 0,
  whiteSpace: "nowrap",
  boxSizing: "border-box",
  ...(open && {
    ...openedMixin(theme),
    "& .MuiDrawer-paper": openedMixin(theme),
  }),
  ...(!open && {
    ...closedMixin(theme),
    "& .MuiDrawer-paper": closedMixin(theme),
  }),
}));

const DrawerHeader = styled("div")(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-end",
  padding: theme.spacing(0, 1),
  // necessary for content to be below app bar
  ...theme.mixins.toolbar,
}));

const Array1 = [
  { text: "总览仪表盘", icon: <HomeOutlinedIcon />, path: "/" },
  { text: "利润表", icon: <ReceiptOutlinedIcon />, path: "/profit-table" },
  { text: "导入数据", icon: <UploadFileRoundedIcon />, path: "/import" },
  {
    text: "经营分析",
    icon: <TimelineOutlinedIcon />,
    path: "/analysis",
  },
];

const SideBar = ({ open, handleDrawerClose, handleDrawerOpen, user }) => {
  let location = useLocation();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const items = user?.role === "admin" || user?.username === "admin" ? [...Array1, { text: "后台中控", icon: <SettingsOutlinedIcon />, path: "/admin" }] : Array1;
  const drawerContent = (
    <>
      <DrawerHeader>
        <IconButton onClick={handleDrawerClose}>
          {theme.direction === "rtl" ? <ChevronRightIcon /> : <ChevronLeftIcon />}
        </IconButton>
      </DrawerHeader>
      <Divider />
      <List>
        {items.map((item) => (
          <ListItem key={item.path} disablePadding sx={{ display: "block" }}>
            <Tooltip title={open ? null : item.text} placement="left">
              <ListItemButton
                onClick={() => { navigate(item.path); if (isMobile) handleDrawerClose(); }}
                sx={{ minHeight: 48, justifyContent: open ? "initial" : "center", px: 2.5,
                  bgcolor: location.pathname === item.path ? (theme.palette.mode === "dark" ? grey[800] : grey[300]) : null }}
              >
                <ListItemIcon sx={{ minWidth: 0, mr: open ? 3 : "auto", justifyContent: "center" }}>{item.icon}</ListItemIcon>
                <ListItemText primary={item.text} sx={{ opacity: open ? 1 : 0 }} />
              </ListItemButton>
            </Tooltip>
          </ListItem>
        ))}
      </List>
    </>
  );

  if (isMobile) {
    return (
      <Box sx={{ position: "fixed", right: 16, bottom: 28, zIndex: (theme) => theme.zIndex.drawer + 2, display: "flex", flexDirection: "row-reverse", alignItems: "center", gap: 1 }}>
        <IconButton
          onClick={open ? handleDrawerClose : handleDrawerOpen}
          aria-label={open ? "收起导航" : "展开导航"}
          sx={{ width: 42, height: 42, bgcolor: "primary.main", color: "primary.contrastText", boxShadow: 3, "&:hover": { bgcolor: "primary.dark" } }}
        >
          <MenuOutlinedIcon />
        </IconButton>
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, px: open ? 0.75 : 0, width: open ? "auto" : 0, maxWidth: open ? 310 : 0, overflow: "hidden", opacity: open ? 1 : 0, transform: open ? "translateX(0)" : "translateX(16px)", transition: "all 180ms ease", bgcolor: "background.paper", borderRadius: 3, boxShadow: 3 }}>
          {items.map((item) => (
            <Tooltip key={item.path} title={item.text} placement="top">
              <IconButton
                size="small"
                onClick={() => { navigate(item.path); handleDrawerClose(); }}
                sx={{ color: location.pathname === item.path ? "primary.main" : "text.secondary" }}
              >
                {item.icon}
              </IconButton>
            </Tooltip>
          ))}
        </Box>
      </Box>
    );
  }

  return (
    <Drawer variant="permanent" open={open}>
      {drawerContent}
    </Drawer>
  );
};

export default SideBar;
