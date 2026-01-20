import { adminAuctionApi } from "@/apis/adminAuctionApi";
import { adminDashboardApi } from "@/apis/adminDashboardApi";
import { adminOrderApi } from "@/apis/adminOrderApi";
import { AuctionStatus, OrderStatus } from "@moreauction/types";
import { formatWon } from "@moreauction/utils";
import { Box, Chip, Skeleton, Stack, Typography } from "@mui/material";
import {
  keepPreviousData,
  useQueries,
  useQuery,
  type UseQueryResult,
} from "@tanstack/react-query";
import { useMemo } from "react";
import StatCard from "../components/StatCard";
import { adminUserApi } from "@/apis/adminUserApi";
import ChartCard from "../components/ChartCard";
import LineChart from "../components/LineChart";
import BarChart from "../components/BarChart";
import DonutChart from "../components/DonutChart";

export type StatItem = {
  label: string;
  query?: UseQueryResult<any, unknown>;
  getValue?: (data: any) => number;
  staticValue?: number;
};
const AdminDashboard = () => {
  const queryDefaults = {
    staleTime: 20_000,
    placeholderData: keepPreviousData,
  } as const;

  const now = new Date();
  const fromDate = new Date(now);
  fromDate.setDate(now.getDate() - 29);
  fromDate.setHours(0, 0, 0, 0);
  const gmvRange = {
    from: fromDate.toISOString(),
    to: now.toISOString(),
  };

  const results = useQueries({
    queries: [
      {
        ...queryDefaults,
        queryKey: ["admin", "users", "count", "sign-up-today"],
        queryFn: adminUserApi.getTodaySigupCount,
      },
      {
        ...queryDefaults,
        queryKey: ["admin", "auctions", "count", "in-progress"],
        queryFn: () =>
          adminAuctionApi.getAuctionsCount(AuctionStatus.IN_PROGRESS),
      },
      {
        ...queryDefaults,
        queryKey: ["admin", "auctions", "count", "ending-soon"],
        queryFn: adminAuctionApi.getAuctionCountEndingSoon,
      },
      {
        ...queryDefaults,
        queryKey: ["admin", "orders", "count", "unpaid"],
        queryFn: () => adminOrderApi.getOrdersCount(OrderStatus.UNPAID),
      },
    ],
  });

  const stats: StatItem[] = useMemo(
    () => [
      {
        label: "오늘 신규 회원",
        query: results[0],
        getValue: (d) => d?.data ?? 0,
      },
      {
        label: "진행 중 경매",
        query: results[1],
        getValue: (d) => d?.data ?? 0,
      },

      {
        label: "곧 마감되는 경매",
        query: results[2],
        getValue: (d) => d?.data ?? 0,
      },
      {
        label: "구매 대기",
        query: results[3],
        getValue: (d) => d?.data ?? 0,
      },
    ],
    [results]
  );

  const gmvTrendQuery = useQuery({
    ...queryDefaults,
    queryKey: ["admin", "dashboard", "gmv-trend", "day", gmvRange.from],
    queryFn: () =>
      adminDashboardApi.getGmvTrend({ groupBy: "day", ...gmvRange }),
  });

  const auctionStatusRatioQuery = useQuery({
    ...queryDefaults,
    queryKey: ["admin", "dashboard", "auction-status"],
    queryFn: () => adminDashboardApi.getAuctionStatusRatio(),
  });

  const categoryGmvQuery = useQuery({
    ...queryDefaults,
    queryKey: ["admin", "dashboard", "category-product-count", 10],
    queryFn: () => adminDashboardApi.getCategoryProductCount({ limit: 10 }),
  });

  const sellerRankQuery = useQuery({
    ...queryDefaults,
    queryKey: ["admin", "dashboard", "seller-rank", 4],
    queryFn: () => adminDashboardApi.getSellerRank({ limit: 4 }),
  });

  const gmvPoints = gmvTrendQuery.data?.data ?? [];
  const statusItems = auctionStatusRatioQuery.data?.data ?? [];
  const categoryItems = categoryGmvQuery.data?.data ?? [];
  const sellerItems = sellerRankQuery.data?.data ?? [];

  const statusMeta: Record<AuctionStatus, { label: string; color: string }> = {
    [AuctionStatus.READY]: { label: "대기", color: "#90a4ae" },
    [AuctionStatus.IN_PROGRESS]: { label: "진행", color: "#1976d2" },
    [AuctionStatus.COMPLETED]: { label: "완료", color: "#26a69a" },
    [AuctionStatus.FAILED]: { label: "유찰", color: "#ef6c00" },
    [AuctionStatus.CANCELLED]: { label: "취소", color: "#9e9e9e" },
  };

  const statusOrder: AuctionStatus[] = [
    AuctionStatus.READY,
    AuctionStatus.IN_PROGRESS,
    AuctionStatus.COMPLETED,
    AuctionStatus.FAILED,
    AuctionStatus.CANCELLED,
  ];

  const statusCounts = statusItems.reduce<Record<string, number>>(
    (acc, item) => {
      acc[item.status] = item.count;
      return acc;
    },
    {}
  );

  const statusLegend = statusOrder.map((status) => ({
    label: statusMeta[status]?.label ?? status,
    color: statusMeta[status]?.color ?? "#9e9e9e",
    count: statusCounts[status] ?? 0,
  }));

  const topSellers = sellerItems.map((seller) => ({
    id: seller.sellerId,
    name: seller.sellerName || seller.sellerId,
    value: formatWon(seller.gmv),
  }));

  const donutSegments = statusLegend.map((item) => ({
    label: item.label,
    value: item.count,
    color: item.color,
  }));

  const lineSeries = [
    {
      label: "GMV",
      data: gmvPoints,
    },
  ];

  const barItems = categoryItems.map((item) => ({
    label: item.categoryName,
    value: item.count,
  }));

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 700 }}>
        대시보드
      </Typography>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            sm: "repeat(2, 1fr)",
            md: "repeat(4, 1fr)",
          },
          gap: 2,
        }}
      >
        {stats.map((item) => (
          <StatCard key={item.label} item={item} />
        ))}
      </Box>

      <Box
        sx={{
          mt: 3,
          display: "grid",
          gridTemplateColumns: { xs: "1fr", lg: "2fr 1fr" },
          gap: 2,
        }}
      >
        <ChartCard
          title="거래액 추이"
          subtitle="최근 추이"
          actions={<Chip label="일간" size="small" />}
        >
          {gmvTrendQuery.isLoading ? (
            <Skeleton height={220} variant="rounded" />
          ) : (
            <LineChart height={220} series={lineSeries} />
          )}
        </ChartCard>
        <ChartCard title="경매 상태 비율" subtitle="오늘 기준">
          <Stack spacing={2} alignItems="center">
            {auctionStatusRatioQuery.isLoading ? (
              <Skeleton variant="circular" width={170} height={170} />
            ) : (
              <>
                <DonutChart size={170} segments={donutSegments} />
                <Stack direction="row" spacing={1} flexWrap="wrap">
                  {statusLegend.map((item) => (
                    <Stack
                      key={item.label}
                      direction="row"
                      spacing={0.5}
                      alignItems="center"
                    >
                      <Box
                        sx={{
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          bgcolor: item.color,
                        }}
                      />
                      <Typography variant="caption" color="text.secondary">
                        {item.label}
                        {statusItems.length > 0 && ` (${item.count})`}
                      </Typography>
                    </Stack>
                  ))}
                </Stack>
              </>
            )}
          </Stack>
        </ChartCard>
      </Box>

      <Box
        sx={{
          mt: 2,
          display: "grid",
          gridTemplateColumns: { xs: "1fr", lg: "1fr 1fr" },
          gap: 2,
        }}
      >
        <ChartCard
          title="카테고리별 상품 수"
          subtitle="최대 10개 기준 (마우스 오버로 카운트 확인)"
        >
          {categoryGmvQuery.isLoading ? (
            <Skeleton height={220} variant="rounded" />
          ) : (
            <BarChart height={220} items={barItems} valueSuffix="개" />
          )}
          <Stack spacing={1.5} sx={{ mt: 2 }}>
            {categoryGmvQuery.isLoading &&
              Array.from({ length: 4 }).map((_, index) => (
                <Skeleton key={`category-skeleton-${index}`} height={24} />
              ))}
            {categoryItems.slice(0, 4).map((item) => (
              <Stack
                key={`${item.categoryId}`}
                direction="row"
                justifyContent="space-between"
                alignItems="center"
              >
                <Typography variant="body2" color="text.secondary">
                  {item.categoryName}
                </Typography>
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                  {item.count.toLocaleString()}
                </Typography>
              </Stack>
            ))}
          </Stack>
        </ChartCard>
        <ChartCard title="상위 출품자" subtitle="이번 달 누적 거래액">
          <Stack spacing={1.5}>
            {sellerRankQuery.isLoading &&
              Array.from({ length: 4 }).map((_, index) => (
                <Skeleton key={`seller-skeleton-${index}`} height={44} />
              ))}
            {!sellerRankQuery.isLoading && topSellers.length === 0 && (
              <Typography variant="caption" color="text.secondary">
                표시할 데이터가 없습니다.
              </Typography>
            )}
            {topSellers.map((seller, index) => (
              <Stack
                key={seller.id}
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                sx={{
                  px: 1.5,
                  py: 1,
                  borderRadius: 1,
                  bgcolor: "action.hover",
                }}
              >
                <Stack direction="row" spacing={1} alignItems="center">
                  <Chip label={`#${index + 1}`} size="small" />
                  <Typography variant="body2">{seller.name}</Typography>
                </Stack>
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                  {seller.value}
                </Typography>
              </Stack>
            ))}
          </Stack>
        </ChartCard>
      </Box>
    </Box>
  );
};

export default AdminDashboard;
