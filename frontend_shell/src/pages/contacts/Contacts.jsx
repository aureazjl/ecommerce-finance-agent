import React from "react";
import { DataGrid } from "@mui/x-data-grid";
import { Box, Typography } from "@mui/material";
import { rows, columns } from "./data";
import { GridToolbar } from "@mui/x-data-grid/internals";
import Header from "../../components/Header";

export default function Contacts() {
  return (
    <Box>
      <Header
        title="CONTACTS"
        subTitle="List of Contacts for Future Reference"
      />

      <Box sx={{ height: 650, width: "99%", mx: "auto" }}>
        <DataGrid
          slots={{
            toolbar: GridToolbar,
          }}
          rows={rows}
          // @ts-ignore
          columns={columns}
        />
      </Box>
    </Box>
  );
}
