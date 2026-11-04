import React from "react";
import { ResponsiveChoropleth } from "@nivo/geo";
import { Box } from "@mui/material";
import Geo from "./Geo";
import Header from "../../components/Header";

const Geography = () => {
  return (
    <Box>
      <Header title="Geography" subTitle="Simple Geography Chart" />

      <Geo />
    </Box>
  );
};

export default Geography;
