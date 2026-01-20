import { Box, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { useState } from "react";

type LineSeriesPoint = {
  date: string;
  value: number | string;
};

type LineSeries = {
  label: string;
  data: LineSeriesPoint[];
};

type LineChartProps = {
  height?: number;
  series: LineSeries[];
  isLoading?: boolean;
};

const formatShortDate = (value: string) => {
  const [datePart] = value.split("T");
  const parts = datePart.split("-");
  if (parts.length < 3) return value;
  return `${parts[1]}/${parts[2]}`;
};

const parseNumberValue = (value: number | string) => {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const normalized = value.replace(/[^0-9.-]/g, "");
    return Number(normalized) || 0;
  }
  return 0;
};

const pickTickIndexes = (length: number, ticks = 5) => {
  if (length <= 1) return [0];
  if (length <= ticks) return Array.from({ length }, (_, i) => i);
  const step = Math.max(1, Math.floor((length - 1) / (ticks - 1)));
  const indexes = Array.from({ length: ticks }, (_, i) => i * step).map(
    (value) => Math.min(length - 1, value)
  );
  return Array.from(new Set([0, ...indexes, length - 1])).sort((a, b) => a - b);
};

const getYAxisTicks = (minPositive: number, maxValue: number) => {
  if (maxValue <= 0) return [0];
  const ticks = [0];
  if (minPositive > 0) {
    ticks.push(minPositive);
  }
  const minPow = Math.max(0, Math.floor(Math.log10(minPositive || 1)));
  const maxPow = Math.floor(Math.log10(maxValue));
  for (let exp = minPow; exp <= maxPow; exp += 1) {
    const value = 10 ** exp;
    if (value !== minPositive && value !== maxValue) {
      ticks.push(value);
    }
  }
  if (Math.round(maxValue) !== ticks[ticks.length - 1]) {
    ticks.push(Math.round(maxValue));
  }
  return Array.from(new Set(ticks));
};

const LineChart = ({
  height = 220,
  series,
  isLoading = false,
}: LineChartProps) => {
  const [hovered, setHovered] = useState<{
    x: number;
    y: number;
    date: string;
    value: number;
    color: string;
  } | null>(null);
  const theme = useTheme();
  const palette = [
    theme.palette.primary.main,
    theme.palette.success.main,
    theme.palette.warning.main,
    theme.palette.info.main,
  ];
  const viewWidth = 640;
  const viewHeight = 260;
  const paddingX = 52;
  const paddingTop = 28;
  const paddingBottom = 44;
  const chartWidth = viewWidth - paddingX * 2;
  const chartHeight = viewHeight - paddingTop - paddingBottom;

  const points = series.flatMap((item) => item.data);
  const values = points.map((item) => parseNumberValue(item.value));
  const maxValue = Math.max(...values, 0);
  const minPositive = Math.min(...values.filter((value) => value > 0), maxValue || 1);
  const safeMax = maxValue === 0 ? 1 : maxValue;
  const logMin = Math.log10(minPositive || 1);
  const logMax = Math.log10(safeMax || 1);
  const logRange = logMax - logMin || 1;

  const hasData = points.length > 0;
  const gridLines = 4;
  const primarySeries = series[0]?.data ?? [];
  const tickIndexes = pickTickIndexes(primarySeries.length);
  const rawTicks = getYAxisTicks(minPositive, maxValue);
  const labelMinGap = 14;
  const tickPositions = rawTicks
    .map((tick) => ({
      tick,
      y:
        tick <= 0
          ? paddingTop + chartHeight
          : paddingTop +
            chartHeight -
            ((Math.log10(tick) - logMin) / logRange) * chartHeight,
    }))
    .sort((a, b) => a.y - b.y);
  const yTicks: number[] = [];
  let lastY = -Infinity;
  tickPositions.forEach(({ tick, y }) => {
    if (y - lastY >= labelMinGap) {
      yTicks.push(tick);
      lastY = y;
    }
  });

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
        {Array.from({ length: gridLines + 1 }).map((_, index) => {
          const y = paddingTop + (chartHeight / gridLines) * index;
          return (
            <line
              key={`grid-${index}`}
              x1={paddingX}
              x2={viewWidth - paddingX}
              y1={y}
              y2={y}
              stroke={alpha(theme.palette.divider, 0.7)}
              strokeWidth="1"
            />
          );
        })}
        <line
          x1={paddingX}
          x2={viewWidth - paddingX}
          y1={paddingTop + chartHeight}
          y2={paddingTop + chartHeight}
          stroke={alpha(theme.palette.text.secondary, 0.6)}
          strokeWidth="1"
        />
        {yTicks.map((tick) => {
          const y =
            tick <= 0
              ? paddingTop + chartHeight
              : paddingTop +
                chartHeight -
                ((Math.log10(tick) - logMin) / logRange) * chartHeight;
          return (
            <text
              key={`y-label-${tick}`}
              x={paddingX - 8}
              y={y}
              textAnchor="end"
              dominantBaseline="middle"
              fill={theme.palette.text.secondary}
              fontSize="11"
            >
              {Math.round(tick).toLocaleString()}
            </text>
          );
        })}
        {series.map((item, seriesIndex) => {
          if (item.data.length === 0) return null;
          const count = item.data.length;
          const pointsText = item.data
            .map((point, index) => {
              const x =
                paddingX +
                (count === 1 ? chartWidth / 2 : (index / (count - 1)) * chartWidth);
              const pointValue = parseNumberValue(point.value);
              const y =
                pointValue <= 0
                  ? paddingTop + chartHeight
                  : paddingTop +
                    chartHeight -
                    ((Math.log10(pointValue) - logMin) / logRange) *
                      chartHeight;
              return `${x},${y}`;
            })
            .join(" ");
          const stroke = palette[seriesIndex % palette.length];
          return (
            <polyline
              key={item.label}
              points={pointsText}
              fill="none"
              stroke={stroke}
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          );
        })}
        {series.map((item, seriesIndex) => {
          if (item.data.length === 0) return null;
          const count = item.data.length;
          const stroke = palette[seriesIndex % palette.length];
          return item.data.map((point, index) => {
            const pointValue = parseNumberValue(point.value);
            const x =
              paddingX +
              (count === 1 ? chartWidth / 2 : (index / (count - 1)) * chartWidth);
            const y =
              pointValue <= 0
                ? paddingTop + chartHeight
                : paddingTop +
                  chartHeight -
                  ((Math.log10(pointValue) - logMin) / logRange) *
                    chartHeight;
            return (
              <g key={`${item.label}-${point.date}-${index}`}>
                <circle
                  cx={x}
                  cy={y}
                  r={4}
                  fill={stroke}
                  stroke={theme.palette.background.paper}
                  strokeWidth={1}
                />
                <circle
                  cx={x}
                  cy={y}
                  r={12}
                  fill={stroke}
                  opacity={0}
                  pointerEvents="all"
                  onMouseEnter={() =>
                    setHovered({
                      x,
                      y,
                      date: point.date,
                      value: pointValue,
                      color: stroke,
                    })
                  }
                  onMouseLeave={() => setHovered(null)}
                >
                  <title>
                    {formatShortDate(point.date)} ·{" "}
                    {pointValue.toLocaleString()}
                  </title>
                </circle>
              </g>
            );
          });
        })}
        {primarySeries.length > 0 &&
          tickIndexes.map((index) => {
            const point = primarySeries[index];
            if (!point) return null;
            const count = primarySeries.length;
            const x =
              paddingX +
              (count === 1 ? chartWidth / 2 : (index / (count - 1)) * chartWidth);
            const y = paddingTop + chartHeight + 22;
            return (
              <text
                key={`x-label-${point.date}-${index}`}
                x={x}
                y={y}
                textAnchor="middle"
                fill={theme.palette.text.secondary}
                fontSize="11"
              >
                {formatShortDate(point.date)}
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
          {formatShortDate(hovered.date)} ·{" "}
          {hovered.value.toLocaleString()}
        </Box>
      )}
    </Box>
  );
};

export default LineChart;
