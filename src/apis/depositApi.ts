import type { DepositHstRequest, DepositInfo } from "../types/deposit";
import { client, type ApiResponseDto } from "./client";

export const depositApi = {
  /**
   * 사용자 예치금계좌조회
   */
  getAccount: async (userId?: string): Promise<DepositInfo> => {
    console.log("사용자 예치금 계좌 조회 API 호출:", userId);
    const response = await client.get(`/deposit/${userId}`);
    return response.data;
  },

  /**
   * 예치금계좌 생성 (최초 1회)
   * @param userId - user ID
   */
  createAccount: async (userId: string): Promise<DepositInfo> => {
    console.log(`예치금 계좌 생성 API 호출 (ID: ${userId})`);
    const response = await client.post(`/deposit`, { userId });
    return response.data;
  },

  /**
   *
   * @param userId
   * @returns
   */
  createDepositHst: async (params: DepositHstRequest): Promise<DepositInfo> => {
    const response = await client.post(`/deposit/histories`, params);
    return response.data;
  },
};
