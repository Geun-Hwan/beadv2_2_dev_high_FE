import { useQuery } from "@tanstack/react-query";
import { userApi } from "@/apis/userApi";
import { queryKeys } from "@/shared/queries/queryKeys";
import type { UserAddress } from "@moreauction/types";

const normalizeAddressList = (payload: unknown): UserAddress[] => {
  if (Array.isArray(payload)) {
    return payload as UserAddress[];
  }
  const data = (payload as { data?: unknown })?.data;
  if (Array.isArray(data)) {
    return data as UserAddress[];
  }
  return [];
};

export const useUserAddresses = (enabled: boolean) =>
  useQuery({
    queryKey: queryKeys.user.addresses(),
    queryFn: async () => {
      const response = await userApi.getAddressList();
      return normalizeAddressList(response.data);
    },
    enabled,
    staleTime: 60_000,
  });
