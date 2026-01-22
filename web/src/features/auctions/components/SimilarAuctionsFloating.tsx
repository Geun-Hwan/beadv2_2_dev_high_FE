import type { AuctionDetailResponse, Product } from "@moreauction/types";
import { AuctionStatus } from "@moreauction/types";
import MouseIcon from "@mui/icons-material/Mouse";
import {
  Box,
  Card,
  CardContent,
  Paper,
  Skeleton,
  Stack,
  Typography,
} from "@mui/material";
import React, { useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import { formatWon } from "@moreauction/utils";
import { ImageWithFallback } from "@/shared/components/common/ImageWithFallback";
import type { SimilarDisplayItem } from "@/features/auctions/types/similar";

type SimilarAuctionsFloatingProps = {
  items: SimilarDisplayItem[];
  loading: boolean;
  auctionsById: Map<string, AuctionDetailResponse>;
  productsById: Map<string, Product>;
};

const SimilarAuctionsFloating: React.FC<SimilarAuctionsFloatingProps> = ({
  items,
  loading,
  auctionsById,
  productsById,
}) => {
  const [isHover, setIsHover] = useState(false);

  const getSimilarityLabel = (score: number) => {
    if (score >= 0.85) return "매우 유사";
    if (score >= 0.7) return "유사";
    if (score >= 0.55) return "약간 유사";
    return "추천";
  };

  return (
    <Box
      sx={{
        position: "fixed",
        bottom: { xs: 12, sm: 16 },
        left: "50%",
        zIndex: 1200,
        transform: "translateX(-50%)",
        display: "flex",
        flexDirection: "column-reverse",
        alignItems: "center",
        gap: 0.4,
        px: 0.4,
        pb: 0.9,
        pt: 0.2,
        pointerEvents: "none",
      }}
    >
        <Paper
          variant="outlined"
          onMouseEnter={() => setIsHover(true)}
          onMouseLeave={() => setIsHover(false)}
          sx={{
            position: "relative",
            px: 1.2,
            py: 0.6,
            borderRadius: 999,
            bgcolor: "background.paper",
            opacity: isHover ? 0 : 0.7,
            transform: isHover ? "translateY(14px)" : "translateY(0)",
            transition: "opacity 300ms ease, transform 350ms ease",
            cursor: "pointer",
            pointerEvents: "auto",
            "@keyframes similarPulse": {
              "0%": { transform: "scale(0.9)", opacity: 0.6 },
              "70%": { transform: "scale(1.6)", opacity: 0 },
              "100%": { transform: "scale(1.6)", opacity: 0 },
            },
            "&::before": {
              content: '""',
              position: "absolute",
              inset: -4,
              borderRadius: 999,
              border: "1px solid",
              borderColor: "primary.main",
              opacity: isHover ? 0 : 0.35,
              animation:
                isHover ? "none" : "similarPulse 2.4s ease-out infinite",
            },
          }}
        >
          <Stack direction="row" spacing={0.75} alignItems="center">
            <MouseIcon
              fontSize="small"
              sx={{
                color: "primary.contrastText",
                bgcolor: "primary.main",
                borderRadius: "50%",
                boxShadow: 2,
                p: 0.4,
              }}
            />
            <Typography
              variant="caption"
              sx={{ color: "text.secondary", whiteSpace: "nowrap" }}
            >
              추천 경매 확인
            </Typography>
          </Stack>
        </Paper>
        <Paper
          onMouseEnter={() => setIsHover(true)}
          onMouseLeave={() => setIsHover(false)}
          sx={{
            p: { xs: 2, sm: 2.5 },
            borderRadius: 2.5,
            border: "1px solid",
            borderColor: "divider",
            bgcolor: "background.paper",
            backdropFilter: "blur(8px)",
            boxShadow: 4,
            width: { xs: "calc(100vw - 16px)", sm: 560, md: 680 },
            opacity: { xs: 1, sm: isHover ? 1 : 0 },
            transform: {
              xs: "none",
              sm: isHover ? "translateY(16px)" : "translateY(24px)",
            },
            transition: "opacity 450ms ease, transform 350ms ease",
            pointerEvents: isHover ? "auto" : "none",
          }}
        >
          <Box sx={{ mb: 1.5 }}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              추천 경매
            </Typography>
            <Typography variant="body2" color="text.secondary">
              유사한 항목과 인기 경매를 함께 보여드려요.
            </Typography>
          </Box>
          <Box
            sx={{
              maxHeight: { xs: 520, sm: isHover ? 320 : 140 },
              overflow: "hidden",
              transition: "max-height 200ms ease",
            }}
          >
            {loading && (
              <Stack direction="row" spacing={1.5} sx={{ overflowX: "auto" }}>
                {Array.from({ length: 3 }).map((_, idx) => (
                  <Card
                    key={`similar-auction-${idx}`}
                    sx={{
                      minWidth: 200,
                      flex: "0 0 auto",
                      borderRadius: 2.5,
                    }}
                  >
                    <Skeleton variant="rectangular" height={110} />
                    <CardContent
                      sx={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 0.5,
                      }}
                    >
                      <Skeleton variant="text" width="80%" />
                      <Skeleton variant="text" width="60%" />
                    </CardContent>
                  </Card>
                ))}
              </Stack>
            )}
            {!loading && items.length === 0 && (
              <Paper
                variant="outlined"
                sx={{
                  p: 2,
                  borderRadius: 2,
                  color: "text.secondary",
                  textAlign: "center",
                }}
              >
                추천 경매가 없어요.
              </Paper>
            )}
            {!loading && items.length > 0 && (
              <Stack direction="row" spacing={1.5} sx={{ overflowX: "auto" }}>
                {items.map((item, idx) => {
                  const hasAuction = !!item.auctionId;
                  const auctionDetail = item.auctionId
                    ? auctionsById.get(item.auctionId)
                    : undefined;
                  const product = productsById.get(item.productId);
                  const title =
                    auctionDetail?.productName ??
                    product?.name ??
                    item.productId;
                  const targetPath = hasAuction
                    ? `/auctions/${item.auctionId}`
                    : `/products/${item.productId}`;
                  const isInProgress =
                    auctionDetail?.status === AuctionStatus.IN_PROGRESS;
                  const isReady = auctionDetail?.status === AuctionStatus.READY;
                  const priceLabel = auctionDetail
                    ? isInProgress
                      ? "현재가"
                      : "시작가"
                    : null;

                  return (
                    <Paper
                      key={`similar-floating-${item.productId}-${idx}`}
                      variant="outlined"
                      sx={{
                        minWidth: 220,
                        flex: "0 0 auto",
                        borderRadius: 2.5,
                        overflow: "hidden",
                        bgcolor: "background.paper",
                      }}
                    >
                      <ImageWithFallback
                        src={item.imageUrl}
                        alt="유사 경매 이미지"
                        height={110}
                        sx={{ objectFit: "cover", width: "100%" }}
                      />
                      <Box sx={{ p: 1.25 }}>
                        <Typography
                          fontWeight={700}
                          component={RouterLink}
                          to={targetPath}
                          sx={{
                            textDecoration: "none",
                            color: "inherit",
                            "&:hover": { textDecoration: "underline" },
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                          }}
                        >
                          {title}
                        </Typography>
                        <Stack
                          spacing={0.25}
                          sx={{ mt: 0.5 }}
                          alignItems="flex-start"
                        >
                          <Typography variant="caption" color="text.secondary">
                            {item.source === "similar"
                              ? getSimilarityLabel(item.score)
                              : "인기 경매"}
                          </Typography>
                          {auctionDetail && (isInProgress || isReady) && (
                            <Typography variant="caption" color="text.secondary">
                              {priceLabel} {formatWon(auctionDetail.startBid)}
                            </Typography>
                          )}
                          {auctionDetail && !isInProgress && !isReady && (
                            <Typography variant="caption" color="text.secondary">
                              진행중 경매 아님
                            </Typography>
                          )}
                          {!auctionDetail && (
                            <Typography variant="caption" color="text.secondary">
                              진행 중 경매 없음
                            </Typography>
                          )}
                        </Stack>
                      </Box>
                    </Paper>
                  );
                })}
              </Stack>
            )}
          </Box>
        </Paper>
    </Box>
  );
};

export default SimilarAuctionsFloating;
