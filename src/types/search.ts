import type { PagedApiResponse } from "./common";

// 백엔드 AuctionDocument 스펙에 맞게 필요한 최소 필드만 정의
export interface AuctionDocument {
  id: string;
  productId: string;
  productName: string;
  auctionId: string;
  status: string;
  imageUrl?: string;
  startBid?: number;
  currentBid?: number;
}

export type PagedAuctionDocument = PagedApiResponse<AuctionDocument>;

