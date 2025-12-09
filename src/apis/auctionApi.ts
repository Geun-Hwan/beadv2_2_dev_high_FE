import { client } from "./client";

// 경매 목록 조회 시 사용될 쿼리 파라미터 인터페이스 (필요에 따라 확장)
export interface AuctionQueryParams {
  page?: number;
  size?: number;
  // 예: status?: 'active' | 'scheduled';
}

/**
 * 경매 관련 API 함수들
 */
export const auctionApi = {
  // 예시: 경매 목록 가져오기
  getAuctions: async (params: AuctionQueryParams) => {
    console.log("경매 목록 조회 API 호출:", params);
    const res = await client.get("/auctions", { params });

    return res.data;
  },
};
