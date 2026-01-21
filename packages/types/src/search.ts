import type { PagedApiResponse } from "./common";

// 백엔드 AuctionDocument 스펙에 맞게 필요한 최소 필드만 정의
export interface AuctionDocument {
  auctionId: string;
  productId: string;
  productName: string;
  categories?: string[];
  description?: string;
  startPrice?: number;
  depositAmount?: number;
  sellerId?: string;
  auctionStartAt?: string;
  auctionEndAt?: string;
  status: string;
  imageUrl?: string;
  fileGroupId?: string | null;
}

export type PagedAuctionDocument = PagedApiResponse<AuctionDocument>;

export interface SimilarProductResponse {
  productId: string;
  auctionId: string | null;
  imageUrl: string | null;
  score: number;
}

export type ProductRecommendSummaryResponse = {
  items: ProductRecommendationResponse[];
  summary: string;
};
export interface ProductRecommendationResponse {
  productId: string;
  productName: string;
  categories: string[];
  description: string;
  imageUrl: string;
  startPrice: number;
  depositAmount: number;
  status: string;
  sellerId: string;
  auctionStartAt: string;
  auctionEndAt: string;
  score: number;
}
// /recommendation/wishlist
