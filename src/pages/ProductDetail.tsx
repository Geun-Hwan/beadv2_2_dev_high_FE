import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  CardMedia,
  Chip,
  Container,
  IconButton,
  Skeleton,
  Stack,
  Typography,
} from "@mui/material";
import FavoriteIcon from "@mui/icons-material/Favorite";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import { Link as RouterLink, useNavigate, useParams } from "react-router-dom";
import { productApi } from "../apis/productApi";
import { auctionApi } from "../apis/auctionApi";
import { wishlistApi } from "../apis/wishlistApi";
import type { Product } from "../types/product";
import { AuctionStatus, type Auction } from "../types/auction";
import { useAuth } from "../contexts/AuthContext";
import RemainingTime from "../components/RemainingTime";
import { getCommonStatusText } from "../utils/statusText";

const ProductDetail: React.FC = () => {
  const { id: productId } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isWish, setIsWish] = useState(false);
  const [wishLoading, setWishLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!productId) {
        setError("Product ID is missing.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const productResponse = await productApi.getProductById(productId);
        setProduct(productResponse.data);

        const auctionsResponse = await auctionApi.getAuctionsByProductId(
          productId
        );

        let auctionData: Auction[] = [];
        if (
          auctionsResponse.data &&
          Array.isArray(auctionsResponse.data.content)
        ) {
          auctionData = auctionsResponse.data.content;
        } else if (Array.isArray(auctionsResponse.data)) {
          auctionData = auctionsResponse.data;
        }
        setAuctions(auctionData);
      } catch (err) {
        console.error("Error fetching product details or auctions:", err);
        setError("Failed to load product details or auctions.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [productId]);

  const activeAuction = useMemo(
    () =>
      auctions.find((a) => a.status === AuctionStatus.IN_PROGRESS) ||
      auctions.find((a) => a.status === AuctionStatus.READY) ||
      auctions.find((a) => a.status === AuctionStatus.COMPLETED),
    [auctions]
  );

  // 이전 경매 이력(종료/유찰/취소 등)만 별도로 보여줌
  const otherAuctions = useMemo(
    () =>
      auctions.filter(
        (a) =>
          a !== activeAuction &&
          a.status !== AuctionStatus.IN_PROGRESS &&
          a.status !== AuctionStatus.READY
      ),
    [auctions, activeAuction]
  );

  const isOwnerOrAdmin =
    user &&
    product &&
    (user.role === "ADMIN" || user.userId === product.sellerId);

  const canEditProduct =
    !!activeAuction &&
    activeAuction.status === AuctionStatus.READY &&
    !!isOwnerOrAdmin;

  const canReregisterAuction =
    ((!activeAuction && auctions.length > 0) || auctions.length === 0) &&
    !!isOwnerOrAdmin;

  useEffect(() => {
    const fetchWishlistStatus = async () => {
      if (!productId || !user) return;
      try {
        const res = await wishlistApi.getMyWishlist({
          page: 0,
          size: 100,
        });
        const items = res.data?.content ?? [];
        const exists = items.some((item) => item.productId === productId);
        setIsWish(exists);
      } catch (e) {
        console.error("찜 상태 조회 실패:", e);
      }
    };
    fetchWishlistStatus();
  }, [productId, user]);

  if (loading) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ my: 4 }}>
          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={4}
            alignItems="flex-start"
          >
            {/* 상품 카드 스켈레톤 */}
            <Box flex={{ xs: "1 1 auto", md: "0 0 40%" }}>
              <Card>
                <Skeleton variant="rectangular" height={260} />
                <CardContent>
                  <Skeleton variant="text" width="70%" />
                  <Skeleton variant="text" width="90%" />
                  <Skeleton variant="text" width="80%" />
                </CardContent>
              </Card>
            </Box>

            {/* 경매 영역 스켈레톤 */}
            <Box flex={1}>
              <Stack spacing={3}>
                <Card>
                  <CardContent>
                    <Skeleton variant="text" width="40%" />
                    <Skeleton variant="text" width="60%" />
                    <Skeleton variant="text" width="50%" />
                  </CardContent>
                </Card>
                <Card>
                  <CardContent>
                    <Skeleton variant="text" width="30%" />
                    <Skeleton variant="text" width="80%" />
                    <Skeleton variant="text" width="75%" />
                    <Skeleton variant="text" width="65%" />
                  </CardContent>
                </Card>
              </Stack>
            </Box>
          </Stack>
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container sx={{ mt: 4 }}>
        <Typography color="error">{error}</Typography>
      </Container>
    );
  }

  if (!product) {
    return (
      <Container sx={{ mt: 4 }}>
        <Typography>상품을 찾을 수 없습니다.</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          mb={3}
        >
          <Typography variant="h4">상품 상세</Typography>
          {canEditProduct && (
            <Button
              variant="outlined"
              color="secondary"
              component={RouterLink}
              to={`/products/${product.id}/edit`}
            >
              상품 / 경매 수정
            </Button>
          )}
        </Stack>

        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={4}
          alignItems="flex-start"
        >
          {/* 상품 기본 정보 */}
          <Box flex={{ xs: "1 1 auto", md: "0 0 40%" }}>
            <Card>
              {
                <CardMedia
                  component="img"
                  height="260"
                  image={product.imageUrl || "/images/no_image.png"}
                  alt={product.name}
                  sx={{ objectFit: "contain" }}
                />
              }
              <CardContent>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "flex-start",
                    justifyContent: "space-between",
                    gap: 1,
                  }}
                >
                  <Typography variant="h5" gutterBottom noWrap>
                    {product.name}
                  </Typography>
                  <IconButton
                    size="small"
                    onClick={async () => {
                      if (!user) {
                        alert("로그인 후 찜하기를 사용할 수 있습니다.");
                        navigate("/login");
                        return;
                      }
                      if (!product || wishLoading) return;
                      try {
                        setWishLoading(true);
                        if (isWish) {
                          await wishlistApi.remove(product.id);
                          setIsWish(false);
                        } else {
                          await wishlistApi.add(product.id);
                          setIsWish(true);
                        }
                      } catch (err: any) {
                        console.error("찜 토글 실패:", err);
                        alert(
                          err?.response?.data?.message ??
                            "찜하기 처리 중 오류가 발생했습니다."
                        );
                      } finally {
                        setWishLoading(false);
                      }
                    }}
                    disabled={wishLoading}
                  >
                    {isWish ? (
                      <FavoriteIcon color="error" fontSize="small" />
                    ) : (
                      <FavoriteBorderIcon fontSize="small" />
                    )}
                  </IconButton>
                </Box>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 2, whiteSpace: "pre-line" }}
                >
                  {product.description || "설명 없음"}
                </Typography>
              </CardContent>
            </Card>
          </Box>

          {/* 경매 영역 */}
          <Box flex={1}>
            <Stack spacing={3}>
              <Card>
                <CardContent>
                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                    mb={2}
                  >
                    <Typography variant="h6">
                      {activeAuction
                        ? activeAuction.status === AuctionStatus.IN_PROGRESS
                          ? "진행 중인 경매"
                          : activeAuction.status === AuctionStatus.READY
                          ? "예정된 경매"
                          : "최근 경매"
                        : "진행 중인 경매 없음"}
                    </Typography>
                    {activeAuction && (
                      <Chip
                        label={getCommonStatusText(activeAuction.status)}
                        color={
                          activeAuction.status === AuctionStatus.IN_PROGRESS
                            ? "success"
                            : "default"
                        }
                        size="small"
                      />
                    )}
                  </Stack>

                  {activeAuction ? (
                    <>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mb: 1 }}
                      >
                        시작가: {activeAuction.startBid.toLocaleString()}원
                      </Typography>
                      <Typography variant="h4" fontWeight="bold" sx={{ mb: 1 }}>
                        현재가:{" "}
                        {(
                          activeAuction.currentBid ?? activeAuction.startBid
                        ).toLocaleString()}
                        원
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        남은 시간:{" "}
                        <RemainingTime
                          auctionStartAt={activeAuction.auctionStartAt}
                          auctionEndAt={activeAuction.auctionEndAt}
                          status={activeAuction.status}
                        />
                      </Typography>
                      <Box sx={{ mt: 2, textAlign: "right" }}>
                        <Button
                          variant="contained"
                          color="primary"
                          component={RouterLink}
                          to={`/auctions/${
                            activeAuction.auctionId ?? activeAuction.id
                          }`}
                        >
                          {activeAuction.status === AuctionStatus.IN_PROGRESS
                            ? "경매 참여하기"
                            : activeAuction.status === AuctionStatus.READY
                            ? "경매 상세보기"
                            : "경매 결과 보기"}
                        </Button>
                      </Box>
                    </>
                  ) : (
                    <>
                      <Typography variant="body2" color="text.secondary">
                        이 상품에 진행 중인 경매가 없습니다.
                      </Typography>
                      {canReregisterAuction && (
                        <Box sx={{ mt: 2, textAlign: "right" }}>
                          <Button
                            variant="contained"
                            color="primary"
                            component={RouterLink}
                            to={`/auctions/re-register/${product.id}`}
                          >
                            경매 재등록
                          </Button>
                        </Box>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>

              <Box>
                <Typography variant="subtitle1" sx={{ mb: 1 }}>
                  다른 경매 이력
                </Typography>
                {auctions.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    연관된 경매가 없습니다.
                  </Typography>
                ) : otherAuctions.length === 0 && activeAuction ? (
                  <Typography variant="body2" color="text.secondary">
                    이외의 경매 이력이 없습니다.
                  </Typography>
                ) : (
                  <Stack spacing={2}>
                    {otherAuctions.map((auction) => (
                      <Card
                        key={auction.auctionId ?? auction.id}
                        variant="outlined"
                      >
                        <CardContent>
                          <Stack
                            direction="row"
                            justifyContent="space-between"
                            alignItems="center"
                            mb={1}
                          >
                            <Typography variant="subtitle2">
                              {getCommonStatusText(auction.status)}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {Math.max(
                                auction.currentBid ?? 0,
                                auction.startBid
                              ).toLocaleString()}
                              원
                            </Typography>
                          </Stack>
                          <Button
                            size="small"
                            component={RouterLink}
                            to={`/auctions/${auction.auctionId ?? auction.id}`}
                          >
                            상세 보기
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </Stack>
                )}
              </Box>
            </Stack>
          </Box>
        </Stack>
      </Box>
    </Container>
  );
};

export default ProductDetail;
