import type { ReactNode } from "react";
import { Box, Card, CardContent, Typography } from "@mui/material";

type ChartCardProps = {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
};

const ChartCard = ({ title, subtitle, actions, children }: ChartCardProps) => {
  return (
    <Card variant="outlined">
      <CardContent>
        <Box
          sx={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 1,
            mb: subtitle ? 1 : 2,
          }}
        >
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              {title}
            </Typography>
            {subtitle && (
              <Typography variant="caption" color="text.secondary">
                {subtitle}
              </Typography>
            )}
          </Box>
          {actions && <Box>{actions}</Box>}
        </Box>
        {children}
      </CardContent>
    </Card>
  );
};

export default ChartCard;
