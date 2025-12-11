export const DepositType = {
  CHARGE: "CHARGE", // 경매 대기 (시작 전)
  USAGE: "USAGE", // 경매 진행
} as const;

export type DepositType = (typeof DepositType)[keyof typeof DepositType];
export interface DepositInfo {
  userId: string;
  balance: number; //현재잔액
}
export interface DepositHstRequest {
  userId?: string;
  depositOrderId?: string;
  type: DepositType;
  amount: number;
}
