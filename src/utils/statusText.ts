import { ProductStatus } from "../types/product";
import { AuctionStatus } from "../types/auction";

/**
 * 공통 상태 텍스트 매핑
 * - 상품/경매에서 공통으로 사용하는 상태값을 한글로 일관되게 변환합니다.
 */
export const getCommonStatusText = (
  status: string | null | undefined
): string => {
  switch (status) {
    case ProductStatus.READY:
    case AuctionStatus.READY:
      return "대기중";
    case ProductStatus.IN_PROGESS:
    case AuctionStatus.IN_PROGRESS:
      return "진행중";
    case ProductStatus.COMPLETE:
    case AuctionStatus.COMPLETED:
      return "종료";
    case ProductStatus.FAILED:
    case AuctionStatus.FAILED:
      return "유찰";
    case ProductStatus.CANCELLED:
    case AuctionStatus.CANCELLED:
      return "취소됨";
    default:
      return "알 수 없음";
  }
};

