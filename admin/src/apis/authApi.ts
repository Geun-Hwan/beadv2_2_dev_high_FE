import type { ApiResponseDto } from "@moreauction/types";
import type { LoginParams, LoginResponse } from "@moreauction/types";
import { authClient } from "./client";

export const authApi = {
  login: async (
    params: LoginParams
  ): Promise<ApiResponseDto<LoginResponse>> => {
    const response = await authClient.post("/auth/login", params);
    return response.data;
  },
  logout: async (): Promise<ApiResponseDto<null>> => {
    const response = await authClient.post("/auth/logout");
    return response.data;
  },
};
