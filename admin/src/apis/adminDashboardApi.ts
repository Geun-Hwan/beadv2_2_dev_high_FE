import { client } from "@/apis/client";
import type {
  ApiResponseDto,
  DashboardAuctionStatusRatioItem,
  DashboardBidDistributionBucket,
  DashboardCategoryCountItem,
  DashboardCategoryGmvItem,
  DashboardOverviewResponse,
  DashboardProductRankItem,
  DashboardSellerRankItem,
  DashboardTrendPoint,
} from "@moreauction/types";

type TrendGroupBy = "day" | "week" | "month";

type OverviewParams = {
  from?: string;
  to?: string;
  timezone?: string;
};

type TrendParams = {
  from?: string;
  to?: string;
  groupBy?: TrendGroupBy;
  timezone?: string;
};

type CategoryGmvParams = {
  from?: string;
  to?: string;
  limit?: number;
  timezone?: string;
};

type CategoryCountParams = {
  from?: string;
  to?: string;
  limit?: number;
  timezone?: string;
};

type RankParams = {
  from?: string;
  to?: string;
  limit?: number;
  timezone?: string;
};

type ProductRankParams = RankParams & {
  sort?: "gmv" | "bids" | "views";
};

type BidDistributionParams = {
  from?: string;
  to?: string;
  bucketSize?: number;
  timezone?: string;
};

type AuctionStatusRatioParams = {
  asOf?: string;
  timezone?: string;
};

export const adminDashboardApi = {
  getOverview: async (
    params?: OverviewParams
  ): Promise<ApiResponseDto<DashboardOverviewResponse>> => {
    const response = await client.get("/dashboard/metrics/overview", {
      params,
    });
    return response.data;
  },
  getGmvTrend: async (
    params?: TrendParams
  ): Promise<ApiResponseDto<DashboardTrendPoint[]>> => {
    const response = await client.get("/orders/dashboard/gmv-trend", {
      params,
    });
    return response.data;
  },
  getOrdersTrend: async (
    params?: TrendParams
  ): Promise<ApiResponseDto<DashboardTrendPoint[]>> => {
    const response = await client.get("/dashboard/charts/orders-trend", {
      params,
    });
    return response.data;
  },
  getCategoryGmv: async (
    params?: CategoryGmvParams
  ): Promise<ApiResponseDto<DashboardCategoryGmvItem[]>> => {
    const response = await client.get("/dashboard/charts/category-gmv", {
      params,
    });
    return response.data;
  },
  getCategoryProductCount: async (
    params?: CategoryCountParams
  ): Promise<ApiResponseDto<DashboardCategoryCountItem[]>> => {
    const response = await client.get(
      "/products/dashboard/charts/category-product-count",
      {
        params,
      }
    );
    return response.data;
  },
  getSellerRank: async (
    params?: RankParams
  ): Promise<ApiResponseDto<DashboardSellerRankItem[]>> => {
    const response = await client.get("/orders/dashboard/rank/sellers", {
      params,
    });
    return response.data;
  },
  getProductRank: async (
    params?: ProductRankParams
  ): Promise<ApiResponseDto<DashboardProductRankItem[]>> => {
    const response = await client.get("/dashboard/rank/products", {
      params,
    });
    return response.data;
  },
  getBidDistribution: async (
    params?: BidDistributionParams
  ): Promise<ApiResponseDto<DashboardBidDistributionBucket[]>> => {
    const response = await client.get("/auctions/dashboard/bid-distribution", {
      params,
    });
    return response.data;
  },
  getAuctionStatusRatio: async (
    params?: AuctionStatusRatioParams
  ): Promise<ApiResponseDto<DashboardAuctionStatusRatioItem[]>> => {
    const response = await client.get("/auctions/dashboard/status-ratio", {
      params,
    });
    return response.data;
  },
};
