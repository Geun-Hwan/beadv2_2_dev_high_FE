/**
 * 상품 상태
 * - PENDING: 판매 대기
 * - ACTIVE: 판매 중
 * - SOLD_OUT: 품절
 * - CANCELED: 판매 취소
 */
export type ProductStatus = "READY";

/**
 * 상품 카테고리 인터페이스
 */
export interface ProductCategory {
  id: string;
  name: string;
}

/**
 * 상품 정보 인터페이스 (product.product 테이블 기반)
 */
export interface Product {
  id: string;

  name: string;
  description?: string;
  status: ProductStatus;

  categories?: ProductCategory[]; // 상품-카테고리 관계
}

/**
 * 경매 정보 인터페이스 (가정)
 * TODO: 백엔드 API 명세에 따라 필드 구체화 필요
 */
export interface Auction {
  id: string;
  productId: string;
  productName: string;
  createdAt: string;
  status: "READY" | "IN_PROGRESS";
}
