import React from "react";
import {
  Box,
  Button,
  Container,
  Paper,
  Stack,
  Typography,
  useTheme,
} from "@mui/material";
import { Link as RouterLink } from "react-router-dom";

const HomeHowItWorksSection: React.FC = () => {
  const theme = useTheme();
  const buyerSteps = [
    {
      title: "경매 둘러보기",
      body: "홈과 검색에서 진행 중/예정 경매를 둘러보고 마음에 드는 상품을 찜해 두세요.",
    },
    {
      title: "보증금 납부 후 입찰",
      body: "입찰 시 추가 결제는 필요 없습니다. 최소 보증금만 내면 자유롭게 입찰할 수 있어요.",
    },
    {
      title: "낙찰 후 결제",
      body: "결제는 낙찰 이후에 진행합니다. 낙찰되지 않으면 보증금은 환불됩니다.",
    },
    {
      title: "미결제 시 취소",
      body: "낙찰 후 기한 내 미결제 시 구매가 취소되며 보증금은 환급되지 않습니다.",
    },
  ];
  const sellerSteps = [
    {
      title: "판매자 승인 신청",
      body: "간단한 신청 후 승인을 받으면 판매자로 활동할 수 있습니다.",
    },
    {
      title: "상품 등록",
      body: "상품 정보와 경매 조건을 입력해 나만의 경매를 등록하세요.",
    },
    {
      title: "경매 종료 및 낙찰",
      body: "경매 종료 시 최고입찰자가 낙찰자로 확정됩니다.",
    },
    {
      title: "구매 확정 및 정산",
      body: "구매 확정 건을 기준으로 지정일에 정산이 진행됩니다.",
    },
  ];

  return (
    <Box
      sx={{
        py: { xs: 6, md: 8 },
        position: "relative",
        overflow: "hidden",
        "--howitworks-ink": theme.palette.mode === "light" ? "#0f172a" : "#e2e8f0",
        "--howitworks-muted":
          theme.palette.mode === "light" ? "rgba(15, 23, 42, 0.55)" : "rgba(226, 232, 240, 0.6)",
        "--howitworks-accent": theme.palette.mode === "light" ? "#f97316" : "#fb923c",
        "--howitworks-surface":
          theme.palette.mode === "light" ? "rgba(255, 255, 255, 0.9)" : "rgba(15, 23, 42, 0.75)",
        "--howitworks-border":
          theme.palette.mode === "light" ? "rgba(15, 23, 42, 0.08)" : "rgba(148, 163, 184, 0.25)",
        borderTop: "1px solid",
        borderColor:
          theme.palette.mode === "light"
            ? "rgba(15, 23, 42, 0.06)"
            : "rgba(148, 163, 184, 0.25)",
        background:
          theme.palette.mode === "light"
            ? "linear-gradient(120deg, rgba(255, 247, 237, 0.8), rgba(255, 255, 255, 0.9))"
            : "linear-gradient(120deg, rgba(15, 23, 42, 0.95), rgba(30, 41, 59, 0.8))",
        "&::before": {
          content: '""',
          position: "absolute",
          inset: "-20% -10% auto auto",
          width: 320,
          height: 320,
          borderRadius: "50%",
          background:
            theme.palette.mode === "light"
              ? "radial-gradient(circle, rgba(253, 186, 116, 0.35), transparent 70%)"
              : "radial-gradient(circle, rgba(251, 146, 60, 0.25), transparent 70%)",
          filter: "blur(4px)",
        },
        "&::after": {
          content: '""',
          position: "absolute",
          inset: "auto auto -24% -12%",
          width: 360,
          height: 360,
          borderRadius: "50%",
          background:
            theme.palette.mode === "light"
              ? "radial-gradient(circle, rgba(99, 102, 241, 0.18), transparent 70%)"
              : "radial-gradient(circle, rgba(94, 234, 212, 0.18), transparent 70%)",
          filter: "blur(10px)",
        },
      }}
    >
      <Container maxWidth="lg">
        <Stack spacing={1.2} alignItems="center" sx={{ position: "relative", zIndex: 1 }}>
          <Typography
            variant="overline"
            sx={{
              letterSpacing: "0.35em",
              color: "var(--howitworks-muted)",
              fontFamily: '"Space Grotesk", "Pretendard", "Apple SD Gothic Neo", sans-serif',
            }}
          >
            HOW IT WORKS
          </Typography>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 700,
              textAlign: "center",
              color: "var(--howitworks-ink)",
              fontFamily: '"Bodoni Moda", "Playfair Display", "Times New Roman", serif',
            }}
          >
            More Auction 이용 가이드
          </Typography>
          <Typography
            variant="body1"
            sx={{
              textAlign: "center",
              color: "var(--howitworks-muted)",
              maxWidth: 720,
              fontFamily: '"Space Grotesk", "Pretendard", "Apple SD Gothic Neo", sans-serif',
            }}
          >
            구매자와 판매자 모두를 위한 간단하고 명확한 흐름을 안내합니다.
          </Typography>
        </Stack>
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={2.5}
          sx={{ mt: { xs: 4, md: 5 }, position: "relative", zIndex: 1 }}
        >
          <Paper
            elevation={0}
            sx={{
              flex: 1,
              p: { xs: 2.5, md: 3 },
              borderRadius: 4,
              border: "1px solid var(--howitworks-border)",
              background: "var(--howitworks-surface)",
              boxShadow: theme.palette.mode === "light" ? "0 16px 45px rgba(15, 23, 42, 0.12)" : "none",
            }}
          >
            <Stack spacing={2.4}>
              <Stack spacing={0.6}>
                <Typography
                  variant="subtitle2"
                  sx={{
                    color: "var(--howitworks-muted)",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.15em",
                    fontFamily: '"Space Grotesk", "Pretendard", "Apple SD Gothic Neo", sans-serif',
                  }}
                >
                  Buyer Flow
                </Typography>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 700,
                    color: "var(--howitworks-ink)",
                    fontFamily: '"Bodoni Moda", "Playfair Display", "Times New Roman", serif',
                  }}
                >
                  구매자 이용 방법
                </Typography>
              </Stack>
              <Stack spacing={2}>
                {buyerSteps.map((step, index) => (
                  <Stack
                    key={step.title}
                    direction="row"
                    spacing={1.6}
                    sx={{
                      p: 1.4,
                      borderRadius: 2.5,
                      border: "1px dashed var(--howitworks-border)",
                      bgcolor:
                        theme.palette.mode === "light"
                          ? "rgba(255, 255, 255, 0.6)"
                          : "rgba(15, 23, 42, 0.4)",
                      animation: "howitworksFloat 6s ease-in-out infinite",
                      animationDelay: `${index * 0.15}s`,
                      "@keyframes howitworksFloat": {
                        "0%, 100%": { transform: "translateY(0px)" },
                        "50%": { transform: "translateY(-4px)" },
                      },
                    }}
                  >
                    <Box
                      sx={{
                        width: 34,
                        height: 34,
                        borderRadius: "50%",
                        bgcolor: "var(--howitworks-accent)",
                        color: theme.palette.mode === "light" ? "#0f172a" : "#0f172a",
                        fontWeight: 700,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontFamily: '"Space Grotesk", "Pretendard", "Apple SD Gothic Neo", sans-serif',
                        flexShrink: 0,
                      }}
                    >
                      {index + 1}
                    </Box>
                    <Box>
                      <Typography
                        variant="subtitle1"
                        sx={{
                          fontWeight: 700,
                          color: "var(--howitworks-ink)",
                          fontFamily:
                            '"Space Grotesk", "Pretendard", "Apple SD Gothic Neo", sans-serif',
                        }}
                      >
                        {step.title}
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{
                          color: "var(--howitworks-muted)",
                          fontFamily:
                            '"Space Grotesk", "Pretendard", "Apple SD Gothic Neo", sans-serif',
                        }}
                      >
                        {step.body}
                      </Typography>
                    </Box>
                  </Stack>
                ))}
              </Stack>
            </Stack>
          </Paper>
          <Paper
            elevation={0}
            sx={{
              flex: 1,
              p: { xs: 2.5, md: 3 },
              borderRadius: 4,
              border: "1px solid var(--howitworks-border)",
              background:
                theme.palette.mode === "light"
                  ? "linear-gradient(135deg, rgba(255, 255, 255, 0.9), rgba(255, 237, 213, 0.85))"
                  : "linear-gradient(135deg, rgba(15, 23, 42, 0.8), rgba(30, 41, 59, 0.9))",
              boxShadow: theme.palette.mode === "light" ? "0 12px 40px rgba(15, 23, 42, 0.1)" : "none",
            }}
          >
            <Stack spacing={2.4}>
              <Stack spacing={0.6}>
                <Typography
                  variant="subtitle2"
                  sx={{
                    color: "var(--howitworks-muted)",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.15em",
                    fontFamily: '"Space Grotesk", "Pretendard", "Apple SD Gothic Neo", sans-serif',
                  }}
                >
                  Seller Flow
                </Typography>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 700,
                    color: "var(--howitworks-ink)",
                    fontFamily: '"Bodoni Moda", "Playfair Display", "Times New Roman", serif',
                  }}
                >
                  판매자 이용 방법
                </Typography>
              </Stack>
              <Stack spacing={2}>
                {sellerSteps.map((step, index) => (
                  <Stack
                    key={step.title}
                    direction="row"
                    spacing={1.6}
                    sx={{
                      p: 1.4,
                      borderRadius: 2.5,
                      border: "1px solid var(--howitworks-border)",
                      bgcolor:
                        theme.palette.mode === "light"
                          ? "rgba(255, 255, 255, 0.7)"
                          : "rgba(15, 23, 42, 0.4)",
                      transform: "translateX(0)",
                      transition: "transform 220ms ease",
                      "&:hover": { transform: "translateX(6px)" },
                    }}
                  >
                    <Box
                      sx={{
                        width: 34,
                        height: 34,
                        borderRadius: 10,
                        bgcolor:
                          theme.palette.mode === "light"
                            ? "rgba(15, 23, 42, 0.08)"
                            : "rgba(226, 232, 240, 0.12)",
                        color: "var(--howitworks-ink)",
                        fontWeight: 700,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontFamily: '"Space Grotesk", "Pretendard", "Apple SD Gothic Neo", sans-serif',
                        flexShrink: 0,
                      }}
                    >
                      {index + 1}
                    </Box>
                    <Box>
                      <Typography
                        variant="subtitle1"
                        sx={{
                          fontWeight: 700,
                          color: "var(--howitworks-ink)",
                          fontFamily:
                            '"Space Grotesk", "Pretendard", "Apple SD Gothic Neo", sans-serif',
                        }}
                      >
                        {step.title}
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{
                          color: "var(--howitworks-muted)",
                          fontFamily:
                            '"Space Grotesk", "Pretendard", "Apple SD Gothic Neo", sans-serif',
                        }}
                      >
                        {step.body}
                      </Typography>
                    </Box>
                  </Stack>
                ))}
              </Stack>
            </Stack>
          </Paper>
        </Stack>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1.5}
          alignItems="center"
          justifyContent="center"
          sx={{ mt: { xs: 3, md: 4 }, position: "relative", zIndex: 1 }}
        >
          <Typography
            variant="body2"
            sx={{
              color: "var(--howitworks-muted)",
              fontFamily: '"Space Grotesk", "Pretendard", "Apple SD Gothic Neo", sans-serif',
            }}
          >
            더 자세한 이용 방법과 규칙은 가이드에서 확인할 수 있어요.
          </Typography>
          <Button
            component={RouterLink}
            to="/guide"
            variant="contained"
            size="small"
            sx={{
              borderRadius: 999,
              px: 2.5,
              bgcolor: "var(--howitworks-accent)",
              color: "#0f172a",
              fontWeight: 700,
              textTransform: "none",
              boxShadow: "none",
              "&:hover": {
                bgcolor: "var(--howitworks-accent)",
                opacity: 0.9,
                boxShadow: "none",
              },
            }}
          >
            이용 가이드 보기
          </Button>
        </Stack>
      </Container>
    </Box>
  );
};

export default HomeHowItWorksSection;
