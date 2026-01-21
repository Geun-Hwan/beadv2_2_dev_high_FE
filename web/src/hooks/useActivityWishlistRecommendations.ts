import { useMemo } from "react";
import {
  keepPreviousData,
  useQuery,
  type UseQueryResult,
} from "@tanstack/react-query";
import type {
  ProductRecommendationResponse,
  ProductRecommendSummaryResponse,
} from "@moreauction/types";
import { wishlistApi } from "@/apis/wishlistApi";
import { activityStorage } from "@/shared/utils/activityStorage";
import { queryKeys } from "@/shared/queries/queryKeys";

export type ActivityRecommendations = ProductRecommendSummaryResponse & {
  sourceCount: number;
};

const buildRecommendations = (
  responses: ProductRecommendSummaryResponse[]
): ActivityRecommendations => {
  const seen = new Set<string>();
  const items: ProductRecommendationResponse[] = [];
  const summaries: string[] = [];

  responses.forEach((response) => {
    if (response.summary) summaries.push(response.summary);
    response.items.forEach((item) => {
      if (seen.has(item.productId)) return;
      seen.add(item.productId);
      items.push(item);
    });
  });

  return {
    items,
    summary: summaries.filter(Boolean).join(" / "),
    sourceCount: responses.length,
  };
};

export function useActivityWishlistRecommendations(options?: {
  userId?: string | null;
  limitPerSource?: number;
  weights?: Partial<
    Record<
      | "viewedProduct"
      | "viewedAuction"
      | "participatedAuction"
      | "wishlistedProduct",
      number
    >
  >;
}): UseQueryResult<ActivityRecommendations, Error> {
  const limitPerSource = options?.limitPerSource ?? 5;
  const viewedProductIds = activityStorage.getTopProductIdsByActivityType(
    "viewedProduct",
    limitPerSource,
    options?.weights
  );
  const viewedAuctionProductIds =
    activityStorage.getTopProductIdsByActivityType(
      "viewedAuction",
      limitPerSource,
      options?.weights
    );
  const participatedAuctionProductIds =
    activityStorage.getTopProductIdsByActivityType(
      "participatedAuction",
      limitPerSource,
      options?.weights
    );
  const wishlistedProductIds = activityStorage.getTopProductIdsByActivityType(
    "wishlistedProduct",
    limitPerSource,
    options?.weights
  );

  const requestGroups = useMemo(
    () => [
      { key: "viewedProduct", ids: viewedProductIds },
      { key: "viewedAuction", ids: viewedAuctionProductIds },
      { key: "participatedAuction", ids: participatedAuctionProductIds },
      { key: "wishlistedProduct", ids: wishlistedProductIds },
    ],
    [
      participatedAuctionProductIds,
      viewedAuctionProductIds,
      viewedProductIds,
      wishlistedProductIds,
    ]
  );

  return useQuery<ActivityRecommendations, Error, ActivityRecommendations>({
    queryKey: [
      ...queryKeys.wishlist.activityRecommendations(options?.userId),
      requestGroups.map((group) => group.ids),
    ],
    queryFn: async () => {
      const activeGroups = requestGroups.filter(
        (group) => group.ids.length > 0
      );
      if (activeGroups.length === 0) {
        return { items: [], summary: "", sourceCount: 0 };
      }

      const responses = await Promise.all(
        activeGroups.map(async (group) => {
          const res = await wishlistApi.getWishlistRecommendations(group.ids);
          return res.data;
        })
      );

      return buildRecommendations(responses);
    },
    enabled: requestGroups.some((group) => group.ids.length > 0),
    staleTime: 60000,
    placeholderData: keepPreviousData,
  });
}
