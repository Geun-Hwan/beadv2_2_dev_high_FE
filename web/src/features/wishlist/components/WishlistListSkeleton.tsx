import { Box, Paper, Skeleton, Stack } from "@mui/material";
import React from "react";

type WishlistListSkeletonProps = {
  count?: number;
};

const WishlistListSkeleton: React.FC<WishlistListSkeletonProps> = ({
  count = 4,
}) => {
  return (
    <Stack spacing={1.5}>
      {Array.from({ length: count }).map((_, idx) => (
        <Paper
          key={`wishlist-skeleton-${idx}`}
          variant="outlined"
          sx={{
            p: 1.5,
            borderRadius: 2.5,
            display: "flex",
            gap: 1.5,
            alignItems: "stretch",
          }}
        >
          <Skeleton variant="rounded" width={88} height={88} />
          <Box sx={{ flexGrow: 1 }}>
            <Skeleton width="60%" />
            <Skeleton width="40%" />
          </Box>
        </Paper>
      ))}
    </Stack>
  );
};

export default WishlistListSkeleton;
