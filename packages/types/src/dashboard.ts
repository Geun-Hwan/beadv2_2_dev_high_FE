import type { AuctionStatus } from "./auction";

export type DashboardOverviewResponse = {
  gmv: number;
  orders: number;
  avgOrderValue: number;
  refundAmount: number;
};

export type DashboardTrendPoint = {
  date: string;
  value: number;
};

export type DashboardCategoryGmvItem = {
  categoryId: number | string;
  categoryName: string;
  value: number;
};

export type DashboardSellerRankItem = {
  sellerId: string;
  sellerName: string;
  gmv: number;
};

export type DashboardProductRankItem = {
  productId: string;
  productName: string;
  gmv?: number;
  bids?: number;
  views?: number;
};

export type DashboardBidDistributionBucket = {
  range: string;
  count: number;
};

export type DashboardAuctionStatusRatioItem = {
  status: AuctionStatus;
  count: number;
};

export type DashboardCategoryCountItem = {
  categoryId: number | string;
  categoryName: string;
  count: number;
};
