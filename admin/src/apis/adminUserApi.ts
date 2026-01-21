import type {
  AdminUser,
  ApiResponseDto,
  PagedApiResponse,
  SellerApprovalItem,
  SellerStatus,
  UserStatus,
} from "@moreauction/types";
import { client } from "./client";

const extractData = <T>(payload: ApiResponseDto<T> | T): T => {
  if (payload && typeof payload === "object" && "data" in payload) {
    return (payload as ApiResponseDto<T>).data;
  }
  return payload as T;
};

export type UserSearchFilter = {
  status?: UserStatus;
  keyword?: string;
  signupDateFrom?: string | null;
  signupDateTo?: string | null;
  deletedYn?: "Y" | "N" | null;
};

type UserListParams = {
  page?: number;
  size?: number;
  sort?: string | string[];
  filter?: UserSearchFilter;
};

type SellerListParams = {
  userId?: string;
  status?: SellerStatus;
  bankName?: string;
  bankAccount?: string;
  deletedYn?: "Y" | "N" | null;
  page?: number;
  size?: number;
  sort?: string | string[];
};

export const adminUserApi = {
  getUsers: async (
    params: UserListParams
  ): Promise<PagedApiResponse<AdminUser>> => {
    const response = await client.get("/users", {
      params: {
        page: params.page,
        size: params.size,
        sort: params.sort,
        ...(params.filter ?? {}),
      },
    });
    return extractData<PagedApiResponse<AdminUser>>(response.data);
  },
  getTodaySigupCount: async (): Promise<ApiResponseDto<number>> => {
    const response = await client.get("/users/count/today-signup");
    return response.data;
  },
  getSellers: async (
    params: SellerListParams
  ): Promise<PagedApiResponse<SellerApprovalItem>> => {
    const response = await client.get("/sellers", {
      params,
    });
    return extractData<PagedApiResponse<SellerApprovalItem>>(response.data);
  },
  approveSellerSelected: async (payload: {
    sellerIds: string[];
  }): Promise<ApiResponseDto<any>> => {
    const response = await client.post("/sellers/approve/selected", payload);
    return response.data;
  },
  approveSellerBatch: async (): Promise<ApiResponseDto<any>> => {
    const response = await client.post("/sellers/approve/batch");
    return response.data;
  },
};
