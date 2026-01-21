import { Box, Typography } from "@mui/material";

type DonutSegment = {
  label: string;
  value: number;
  color: string;
};

type DonutChartProps = {
  size?: number;
  segments: DonutSegment[];
  isLoading?: boolean;
};

const DonutChart = ({
  size = 180,
  segments,
  isLoading = false,
}: DonutChartProps) => {
  const radius = 52;
  const strokeWidth = 12;
  const circumference = 2 * Math.PI * radius;
  const visibleSegments = segments.filter((segment) => segment.value > 0);
  const total = visibleSegments.reduce((acc, cur) => acc + cur.value, 0);
  const safeTotal = total === 0 ? 1 : total;
  const showEmptyRing = total === 0;

  let offset = 0;

  return (
    <Box
      sx={{
        position: "relative",
        width: size,
        height: size,
      }}
    >
      <Box
        component="svg"
        viewBox="0 0 120 120"
        sx={{ width: "100%", height: "100%" }}
      >
        <circle
          cx="60"
          cy="60"
          r={radius}
          stroke="#e0e0e0"
          strokeWidth={strokeWidth}
          fill="none"
        />
        {!isLoading && showEmptyRing && (
          <circle
            cx="60"
            cy="60"
            r={radius}
            stroke="#bdbdbd"
            strokeWidth={strokeWidth}
            fill="none"
          />
        )}
        {!isLoading &&
          !showEmptyRing &&
          visibleSegments.map((segment) => {
            const length = (segment.value / safeTotal) * circumference;
            const dash = `${length} ${circumference - length}`;
            const rotate = (offset / safeTotal) * 360 - 90;
            offset += segment.value;
            return (
              <circle
                key={segment.label}
                cx="60"
                cy="60"
                r={radius}
                stroke={segment.color}
                strokeWidth={strokeWidth}
                fill="none"
                strokeDasharray={dash}
                strokeLinecap="butt"
                transform={`rotate(${rotate} 60 60)`}
              />
            );
          })}
      </Box>
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
        }}
      >
        {!isLoading && (
          <>
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              {total}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              총 경매
            </Typography>
          </>
        )}
      </Box>
    </Box>
  );
};

export default DonutChart;
