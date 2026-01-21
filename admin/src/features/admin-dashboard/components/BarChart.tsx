import { Box, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { useState } from "react";

type BarItem = {
  label: string;
  value: number;
};

type BarChartProps = {
  height?: number;
  items: BarItem[];
  isLoading?: boolean;
  valueSuffix?: string;
};


const BarChart = ({
  height = 220,
  items,
  isLoading = false,
  valueSuffix = "",
}: BarChartProps) => {
  const [hovered, setHovered] = useState<{
    x: number;
    y: number;
    label: string;
    value: number;
    color: string;
  } | null>(null);
  const theme = useTheme();
  const palette = [
    theme.palette.primary.main,
    theme.palette.success.main,
    theme.palette.warning.main,
    theme.palette.info.main,
    theme.palette.secondary.main,
    "#8e24aa",
    "#f4511e",
    "#43a047",
    "#3949ab",
  ];
  const viewWidth = 640;
  const viewHeight = 260;
  const paddingX = 40;
  const paddingTop = 28;
  const paddingBottom = 44;
  const chartWidth = viewWidth - paddingX * 2;
  const chartHeight = viewHeight - paddingTop - paddingBottom;

  const maxValue = Math.max(
    ...items.map((item) => Number(item.value) || 0),
    0
  );
  const safeMax = maxValue === 0 ? 1 : maxValue;
  const hasData = items.length > 0;

  const barGap = 8;
  const barCount = items.length || 1;
  const barWidth = (chartWidth - barGap * (barCount - 1)) / barCount;
  const labelStep = 1;

  return (
    <Box sx={{ width: "100%", height, position: "relative" }}>
      <Box
        component="svg"
        viewBox={`0 0 ${viewWidth} ${viewHeight}`}
        preserveAspectRatio="none"
        sx={{ width: "100%", height: "100%" }}
      >
        <rect
          x={0}
          y={0}
          width={viewWidth}
          height={viewHeight}
          fill={theme.palette.background.default}
          stroke={theme.palette.divider}
          strokeWidth="1"
          rx="8"
        />
        <line
          x1={paddingX}
          x2={viewWidth - paddingX}
          y1={paddingTop + chartHeight}
          y2={paddingTop + chartHeight}
          stroke={alpha(theme.palette.text.secondary, 0.6)}
          strokeWidth="1"
        />
        {items.map((item, index) => {
          const heightValue = (item.value / safeMax) * chartHeight;
          const x = paddingX + index * (barWidth + barGap);
          const y = paddingTop + chartHeight - heightValue;
          const color = palette[index % palette.length];
          return (
            <rect
              key={`${item.label}-${index}`}
              x={x}
              y={y}
              width={barWidth}
              height={heightValue}
              fill={color}
              rx="4"
              onMouseEnter={() =>
                setHovered({
                  x: x + barWidth / 2,
                  y,
                  label: item.label,
                  value: Number(item.value) || 0,
                  color,
                })
              }
              onMouseLeave={() => setHovered(null)}
            />
          );
        })}
        {items.map((item, index) => {
          if (index % labelStep !== 0) return null;
          const x = paddingX + index * (barWidth + barGap) + barWidth / 2;
          const y = paddingTop + chartHeight + 22;
          const label =
            item.label.length > 6 ? `${item.label.slice(0, 6)}...` : item.label;
          return (
            <text
              key={`bar-label-${item.label}-${index}`}
              x={x}
              y={y}
              textAnchor="middle"
              fill={theme.palette.text.secondary}
              fontSize="11"
            >
              {label}
            </text>
          );
        })}
      </Box>
      {!isLoading && !hasData && (
        <Typography variant="caption" color="text.secondary">
          데이터 없음
        </Typography>
      )}
      {hovered && (
        <Box
          sx={{
            position: "absolute",
            left: `${(hovered.x / viewWidth) * 100}%`,
            top: `${(hovered.y / viewHeight) * 100}%`,
            transform: "translate(-50%, -120%)",
            bgcolor: theme.palette.background.paper,
            color: theme.palette.text.primary,
            px: 1,
            py: 0.5,
            borderRadius: 1,
            border: `1px solid ${theme.palette.divider}`,
            boxShadow: theme.shadows[2],
            pointerEvents: "none",
            whiteSpace: "nowrap",
            fontSize: 12,
          }}
        >
          <Box
            component="span"
            sx={{
              display: "inline-block",
              width: 8,
              height: 8,
              borderRadius: "50%",
              bgcolor: hovered.color,
              mr: 0.5,
            }}
          />
          {hovered.label} · {hovered.value.toLocaleString()}
          {valueSuffix}
        </Box>
      )}
    </Box>
  );
};

export default BarChart;
