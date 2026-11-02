import React from "react";
import { Box, Paper, Stack, Typography, useTheme } from "@mui/material";
import { ResponsivePie } from "@nivo/pie";

const Card = ({ icon, title, subTitle, increase, data, scheme }) => {
  const theme = useTheme();
  const isPositive = typeof increase === "string" && increase.trim().startsWith("+");
  const trendArrow = isPositive ? "↑" : "↓";

  return (
    <Paper
      sx={{
        flexGrow: 1,
        minWidth: "333px",
        p: 1.5,
        display: "flex",
        justifyContent: "space-between",
        borderRadius: 2,
        boxShadow:
          theme.palette.mode === "dark"
            ? "0 6px 18px rgba(0,0,0,0.6)"
            : "0 6px 18px rgba(15,23,42,0.15)",
        transition: "transform 0.3s ease, box-shadow 0.3s ease",
        "&:hover": {
          transform: "scale(1.02)",
          boxShadow:
            theme.palette.mode === "dark"
              ? "0 12px 30px rgba(0,0,0,0.8)"
              : "0 12px 30px rgba(15,23,42,0.25)",
        },
      }}
    >
      <Stack gap={1}>
        {icon}
        <Typography variant="body2" sx={{ fontSize: "13px", fontWeight: 600 }}>
          {title}
        </Typography>
        <Typography variant="body2" sx={{ fontSize: "13px", color: "text.secondary" }}>
          {subTitle}
        </Typography>
      </Stack>

      <Stack alignItems={"center"}>
        <Box height={"70px"} width={"87px"}>
          <ResponsivePie
            data={data}
            margin={{ top: 10, right: 0, bottom: 10, left: 0 }}
            innerRadius={0.7}
            theme={{
              text: {
                fontSize: 11,
                fill: "#333333",
                outlineWidth: 0,
                outlineColor: "#ffffff",
              },

              axis: {
                domain: {
                  line: {
                    stroke: theme.palette.divider,
                    strokeWidth: 1,
                  },
                },
                legend: {
                  text: {
                    fontSize: 12,
                    fill: theme.palette.text.primary,
                  },
                },
                ticks: {
                  line: {
                    stroke: theme.palette.divider,
                    strokeWidth: 1,
                  },
                  text: {
                    fontSize: 11,
                    fill: theme.palette.text.secondary,
                  },
                },
              },
              grid: {
                line: {
                  stroke: theme.palette.divider,
                  strokeWidth: 1,
                },
              },
              legends: {
                title: {
                  text: {
                    fontSize: 11,
                    fill: theme.palette.text.primary,
                  },
                },
                text: {
                  fontSize: 11,
                  fill: theme.palette.text.primary,
                },
                ticks: {
                  line: {},
                  text: {
                    fontSize: 10,
                    fill: theme.palette.text.primary,
                  },
                },
              },
              annotations: {
                text: {
                  fontSize: 13,
                  fill: theme.palette.text.primary,
                  outlineWidth: 2,
                  outlineColor: "#ffffff",
                  outlineOpacity: 1,
                },
                link: {
                  stroke: "#000000",
                  strokeWidth: 1,
                  outlineWidth: 2,
                  outlineColor: "#ffffff",
                  outlineOpacity: 1,
                },
                outline: {
                  stroke: "#000000",
                  strokeWidth: 2,
                  outlineWidth: 2,
                  outlineColor: "#ffffff",
                  outlineOpacity: 1,
                },
                symbol: {
                  fill: "#000000",
                  outlineWidth: 2,
                  outlineColor: "#ffffff",
                  outlineOpacity: 1,
                },
              },
              tooltip: {
                container: {
                  background: theme.palette.background.default,
                  color: theme.palette.text.primary,
                  fontSize: 12,
                },
                basic: {},
                chip: {},
                table: {},
                tableCell: {},
                tableCellValue: {},
              },
            }}
            colors={{ scheme: scheme }}
            enableArcLabels={false}
            enableArcLinkLabels={false}
            padAngle={0.7}
            cornerRadius={3}
            activeOuterRadiusOffset={8}
            borderWidth={1}
            borderColor={{
              from: "color",
              modifiers: [["darker", 0.2]],
            }}
            defs={[
              {
                id: "dots",
                type: "patternDots",
                background: "inherit",
                color: "rgba(255, 255, 255, 0.3)",
                size: 4,
                padding: 1,
                stagger: true,
              },
              {
                id: "lines",
                type: "patternLines",
                background: "inherit",
                color: "rgba(255, 255, 255, 0.3)",
                rotation: -45,
                lineWidth: 6,
                spacing: 10,
              },
            ]}
            animate={true}
            motionConfig="gentle"
          />
        </Box>
        <Typography
          variant="body2"
          sx={{
            mt: 0.5,
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            gap: 0.5,
            color: isPositive ? theme.palette.success.main : theme.palette.error.main,
          }}
        >
          {increase}
          <span style={{ fontSize: 12 }}>{trendArrow}</span>
        </Typography>
      </Stack>
    </Paper>
  );
};

export default Card;
