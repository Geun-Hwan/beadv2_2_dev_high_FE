import React from "react";
import { Box, Button, Container, Stack, Typography } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import { AuctionStatus } from "@moreauction/types";
import AuctionList from "@/features/auctions/components/AuctionList";

type HomeAuctionStatusSectionProps = {
  title: string;
  description: string;
  status: AuctionStatus[];
  to: string;
  emptyTitle: string;
  emptyDescription: string;
};

const HomeAuctionStatusSection: React.FC<HomeAuctionStatusSectionProps> = ({
  title,
  description,
  status,
  to,
  emptyTitle,
  emptyDescription,
}) => {
  return (
    <Box sx={{ py: 6 }}>
      <Container maxWidth="lg">
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="flex-end"
          sx={{ mb: 3 }}
        >
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
              {title}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {description}
            </Typography>
          </Box>
          <Button component={RouterLink} to={to} size="small">
            더 찾아보기
          </Button>
        </Stack>

        <AuctionList
          status={status}
          showEmptyState
          emptyTitle={emptyTitle}
          emptyDescription={emptyDescription}
        />
      </Container>
    </Box>
  );
};

export default HomeAuctionStatusSection;
