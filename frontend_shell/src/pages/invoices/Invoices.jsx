import React from "react";
import { DataGrid, GridToolbar } from "@mui/x-data-grid";
import { Box, Typography } from "@mui/material";
import { rows, columns } from "./data";
import Header from "../../components/Header";

export default function Invoices() {
  return (
    <Box>
      <Header title="INVOICES" subTitle="List of Invoice Balances" />

      <Box sx={{ height: 650, mx: "auto" }}>
        <DataGrid
          checkboxSelection
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
