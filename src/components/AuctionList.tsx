import {
  Box,
  Button,
  Card,
  CardContent,
  CardMedia,
  Skeleton,
  Typography,
} from "@mui/material";
import React, { useEffect, useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import { auctionApi } from "../apis/auctionApi";
import {
  type AuctionQueryParams,
  type PagedAuctionResponse,
} from "../types/auction";
import { getCommonStatusText } from "../utils/statusText";
import RemainingTime from "./RemainingTime";

type AuctionSortOption =
  | "ENDING_SOON"
  | "START_SOON"
  | "NEWEST"
  | "HIGHEST_BID";

const sortMap: Record<AuctionSortOption, string[]> = {
  ENDING_SOON: ["auctionEndAt,ASC"],
  START_SOON: ["auctionStartAt,ASC"],
  NEWEST: ["createdAt,DESC"],
  HIGHEST_BID: ["currentBid,DESC"],
};

interface AuctionListProps extends AuctionQueryParams {
  sortOption?: AuctionSortOption;
  /** 최대 표시 개수 (예: 홈에서는 4개만) */
  limit?: number;
}

const AuctionList: React.FC<AuctionListProps> = ({
  status = [],
  sortOption = "ENDING_SOON",
  limit = 4,
}) => {
  const [auctionData, setAuctionData] = useState<PagedAuctionResponse | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAuctions = async () => {
      try {
        setLoading(true);
        setError(null);
        const params: AuctionQueryParams = {
          page: 0,
          size: limit,
          status,
          sort: sortMap[sortOption],
        };
        const response = await auctionApi.getAuctions(params);

        setAuctionData(response.data);
      } catch (error) {
        console.error("경매 목록 조회 실패:", error);
        setError("경매 목록을 불러오는데 실패했습니다.");
      } finally {
        setLoading(false);
      }
    };

    fetchAuctions();
  }, [status]);

  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: {
          xs: "1fr",
          sm: "repeat(2, 1fr)",
          md: "repeat(3, 1fr)",
          lg: "repeat(4, 1fr)",
        },
        gap: 4,
      }}
    >
      {error && !loading && (auctionData?.content?.length ?? 0) === 0 && (
        <Typography color="error" sx={{ gridColumn: "1 / -1" }}>
          {error}
        </Typography>
      )}

      {loading && (auctionData?.content?.length ?? 0) === 0
        ? Array.from({ length: limit }).map((_, i) => (
            <Card
              key={i}
              sx={{
                height: "100%",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <Skeleton variant="rectangular" height={200} />
              <CardContent
                sx={{
                  flexGrow: 1,
                  display: "flex",
                  flexDirection: "column",
                  gap: 1,
                  mt: 1,
                }}
              >
                <Skeleton variant="text" width="80%" />
                <Skeleton variant="text" width="60%" />
                <Skeleton variant="text" width="50%" />
              </CardContent>
            </Card>
          ))
        : auctionData?.content?.map((auction, i) => {
            const effectiveCurrentPrice =
              (auction.currentBid ?? 0) > 0
                ? (auction.currentBid as number)
                : auction.startBid ?? 0;

            return (
              <Card
                key={auction.id || auction.auctionId || i}
                sx={{
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <CardMedia
                  component="img"
                  height="200"
                  image={auction.imageUrl ?? "/images/no_image.png"}
                  alt={auction.productName}
                />
                <CardContent
                  sx={{ flexGrow: 1, display: "flex", flexDirection: "column" }}
                >
                  <Typography
                    gutterBottom
                    variant="h6"
                    component="h2"
                    sx={{
                      fontWeight: 600,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                    title={auction.productName} // 툴팁으로 전체 이름 표시
                  >
                    {auction.productName}
                  </Typography>
                  <Box sx={{ mt: "auto", pt: 1 }}>
                    <Typography
                      variant="body2"
                      sx={{
                        color: "error.main",
                        fontWeight: 600,
                        textAlign: "right",
                        fontSize: "1.1rem",
                        mb: 0.5,
                      }}
                    >
                      현재가: {effectiveCurrentPrice.toLocaleString()}원
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{
                        color: "text.secondary",
                        textAlign: "right",
                        display: "block",
                        mb: 0.5,
                      }}
                    >
                      시작가: {auction.startBid?.toLocaleString()}원
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{
                        color:
                          auction.status === "IN_PROGRESS"
                            ? "warning.main"
                            : "text.secondary",
                        fontWeight: 500,
                        textAlign: "right",
                        display: "block",
                      }}
                    >
                      <RemainingTime
                        auctionStartAt={auction.auctionStartAt}
                        auctionEndAt={auction.auctionEndAt}
                        status={auction.status}
                      />
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{
                        color: "text.secondary",
                        textAlign: "right",
                        display: "block",
                        mt: 0.5,
                      }}
                    >
                      상태: {getCommonStatusText(auction.status)}
                    </Typography>
                  </Box>
                </CardContent>
                <Button
                  size="small"
                  color="primary"
                  component={RouterLink}
                  to={`/auctions/${auction.id || auction.auctionId}`}
                  sx={{ m: 1 }}
                >
                  자세히 보기
                </Button>
              </Card>
            );
          })}
    </Box>
  );
};

export default AuctionList;
