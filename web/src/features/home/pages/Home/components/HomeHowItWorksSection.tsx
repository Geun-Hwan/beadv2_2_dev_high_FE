import React from "react";
import { Box, Container, Paper, Stack, Typography, useTheme } from "@mui/material";

const HomeHowItWorksSection: React.FC = () => {
  const theme = useTheme();

  return (
    <Box
      sx={{
        py: 6,
        borderTop: "1px solid",
        borderColor:
          theme.palette.mode === "light"
            ? "rgba(15, 23, 42, 0.06)"
            : "rgba(148, 163, 184, 0.25)",
      }}
    >
      <Container maxWidth="lg">
        <Typography
          variant="h6"
          sx={{ mb: 3, fontWeight: 700, textAlign: "center" }}
        >
          More Auction 이렇게 이용해 보세요
        </Typography>
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={3}
          alignItems="stretch"
        >
          <Paper
            elevation={1}
            sx={{ p: 3, flex: 1, display: "flex", flexDirection: "column" }}
          >
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
              1. 경매 둘러보기
            </Typography>
            <Typography variant="body2" color="text.secondary">
              홈과 검색 화면에서 진행 중/예정 경매를 확인하고 관심 있는 상품을
              찜해 두세요.
            </Typography>
          </Paper>
          <Paper
            elevation={1}
            sx={{ p: 3, flex: 1, display: "flex", flexDirection: "column" }}
          >
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
              2. 예치금 충전 후 입찰
            </Typography>
            <Typography variant="body2" color="text.secondary">
              마이페이지에서 예치금을 충전한 뒤, 실시간 경매에 참여해 원하는
              가격에 입찰할 수 있습니다.
            </Typography>
          </Paper>
          <Paper
            elevation={1}
            sx={{ p: 3, flex: 1, display: "flex", flexDirection: "column" }}
          >
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
              3. 낙찰 및 정산
            </Typography>
            <Typography variant="body2" color="text.secondary">
              낙찰 후 주문/정산 내역을 통해 거래 현황을 확인하고, 판매자는
              정산 내역에서 입금 정보를 확인할 수 있습니다.
            </Typography>
          </Paper>
        </Stack>
      </Container>
    </Box>
  );
};

export default HomeHowItWorksSection;
