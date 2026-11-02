import React from "react";
import { DataGrid } from "@mui/x-data-grid";
import { rows } from "./data";
import { Box, Typography, useTheme } from "@mui/material";
import {
  AdminPanelSettingsOutlined,
  LockOpenOutlined,
  SecurityOutlined,
} from "@mui/icons-material";
import Header from "../../components/Header";

export default function Team() {
  const theme = useTheme();
  const columns = [
    { field: "id", headerName: "ID", width: 50 },
    { field: "Name", headerName: "Name", flex: 1 },
    { field: "Email", headerName: "Email", flex: 2 },
    { field: "Phone", headerName: "Phone", flex: 1 },
    {
      field: "Access",
      headerName: "Access",
      flex: 1,
      renderCell: ({ row: { Access } }) => {
        return (
          <Box
            sx={{
              p: "5px",
              width: "100px",
              borderRadius: "3px",
              textAlign: "center",
              display: "flex",
              justifyContent: "space-evenly",
              alignItems: "center",
              mt: 1,
              backgroundColor:
                Access === "Admin"
                  ? theme.palette.primary.dark
                  : Access === "Manager"
                  ? theme.palette.secondary.dark
                  : "#3da58a",
            }}
          >
            {Access === "Admin" && (
              <AdminPanelSettingsOutlined
                fontSize="small"
                sx={{ color: "#fff" }}
              />
            )}
            {Access === "Manager" && (
              <LockOpenOutlined fontSize="small" sx={{ color: "#fff" }} />
            )}
            {Access === "User" && (
              <SecurityOutlined fontSize="small" sx={{ color: "#fff" }} />
            )}
            <Typography sx={{ fontSize: "14px", color: "#fff" }}>
              {Access}
            </Typography>
          </Box>
        );
      },
    },
  ];

  return (
    <Box>
      <Header title={"TEAM"} subTitle={"Managing the Team Members"} />

      <Box sx={{ height: 600, mx: "auto" }}>
        <DataGrid
          rows={rows}
          // @ts-ignore
          columns={columns}
        />
      </Box>
    </Box>
  );
}
