import { client } from "./client";
import type { Product, Auction, ProductStatus } from "../types/product";

// 상품 목록 조회 시 사용될 쿼리 파라미터 인터페이스 (필요에 따라 확장)
interface ProductQueryParams {
  page?: number;
  size?: number;
  status?: ProductStatus;
  // 기타 필터링 옵션
}

/**
 * 상품 및 경매 관련 API 함수들
 */
export const productApi = {
  /**
   * 전체 상품 목록을 조회합니다.
   * @param params - 페이지네이션, 필터링 등을 위한 쿼리 파라미터
   */
  getProducts: async (
    params?: ProductQueryParams
  ): Promise<{ data: Product[] }> => {
    console.log("상품 목록 조회 API 호출:", params);
    const response = await client.get("/products", { params });
    return response.data;
    // --- Mock 데이터 (실제 API 연결 시 주석 처리 또는 제거) ---
    /*
    const mockProducts: Product[] = [
      {
        id: 'prod_1',
        name: '멋진 의자',
        description: '편안하고 디자인이 뛰어난 의자입니다.',
        status: 'ACTIVE',
        seller_id: 'seller_123',
        deleted_yn: 'N',
        created_at: new Date().toISOString(),
        created_by: 'admin',
        updated_at: new Date().toISOString(),
        updated_by: 'admin',
      },
      {
        id: 'prod_2',
        name: '스마트 책상',
        description: '높이 조절이 가능한 스마트 책상입니다.',
        status: 'PENDING',
        seller_id: 'seller_456',
        deleted_yn: 'N',
        created_at: new Date().toISOString(),
        created_by: 'admin',
        updated_at: new Date().toISOString(),
        updated_by: 'admin',
      },
    ];
    return Promise.resolve({ data: mockProducts });
    */
  },

  /**
   * 특정 ID의 상품 상세 정보를 조회합니다.
   * @param productId - 조회할 상품의 ID
   */
  getProductById: async (productId: string): Promise<{ data: Product }> => {
    console.log(`상품 상세 조회 API 호출 (ID: ${productId})`);
    const response = await client.get(`/products/${productId}`);
    return response.data;
    // --- Mock 데이터 (실제 API 연결 시 주석 처리 또는 제거) ---
    /*
    const mockProduct: Product = {
      id: productId,
      name: '멋진 의자 (상세)',
      description: '정말로 편안하고, 어떤 인테리어에도 잘 어울리는 디자인이 뛰어난 의자입니다. 소재는...',
      status: 'ACTIVE',
      seller_id: 'seller_123',
      deleted_yn: 'N',
      created_at: new Date().toISOString(),
      created_by: 'admin',
      updated_at: new Date().toISOString(),
      updated_by: 'admin',
      categories: [{id: 'cate_1', name: '가구'}]
    };
    return Promise.resolve({ data: mockProduct });
    */
  },

  /**
   * 특정 상품에 대한 경매 내역을 조회합니다.
   * @param productId - 조회할 상품의 ID
   */
  getAuctionsByProductId: async (
    productId: string
  ): Promise<{ data: Auction[] }> => {
    console.log(`상품 관련 경매 내역 조회 API 호출 (ProductID: ${productId})`);
    const response = await client.get(`/products/${productId}/auctions`); // 예시 API 엔드포인트
    const auctions = response.data as Auction[]; // 실제 응답 타입에 따라 변경 필요

    // 요청에 따라 최신 경매가 가장 먼저 오도록 정렬
    auctions.sort(
      (a: Auction, b: Auction) =>
        new Date(b?.createdAt).getTime() - new Date(a?.createdAt).getTime()
    );
    return { data: auctions };
    // --- Mock 데이터 (실제 API 연결 시 주석 처리 또는 제거) ---
    /*
    const mockAuctions: Auction[] = [
        {
            id: 'auc_1',
            productId: productId,
            productName: '멋진 의자',
            start_time: new Date(Date.now() - 3600000 * 2).toISOString(),
            end_time: new Date(Date.now() - 3600000).toISOString(),
            start_price: 50000,
            current_price: 75000,
            bid_count: 5,
            status: 'FINISHED',
        },
        {
            id: 'auc_2',
            productId: productId,
            productName: '멋진 의자',
            start_time: new Date().toISOString(),
            end_time: new Date(Date.now() + 3600000).toISOString(),
            start_price: 60000,
            current_price: 80000,
            bid_count: 3,
            status: 'IN_PROGRESS',
        }
    ];
    mockAuctions.sort((a: Auction, b: Auction) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime());
    return Promise.resolve({ data: mockAuctions });
    */
  },
};
