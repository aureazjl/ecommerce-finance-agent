import React from "react";
import { ResponsiveChoropleth } from "@nivo/geo";
import { Box } from "@mui/material";
import { geo } from "./world_countries";
import { data } from "./data";
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
