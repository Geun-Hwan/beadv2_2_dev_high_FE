import { useMemo } from "react";
import {
  keepPreviousData,
  useQuery,
  type UseQueryResult,
} from "@tanstack/react-query";
import type {
  AuctionRankingResponse,
  Product,
  ProductRecommendSummaryResponse,
} from "@moreauction/types";
import { getProductImageUrls } from "@moreauction/utils";
import { auctionApi } from "@/apis/auctionApi";
import { fileApi } from "@/apis/fileApi";
import { productApi } from "@/apis/productApi";
import { wishlistApi } from "@/apis/wishlistApi";
import { activityStorage } from "@/shared/utils/activityStorage";
import { queryKeys } from "@/shared/queries/queryKeys";

export type ActivityRecommendations = ProductRecommendSummaryResponse & {
  sourceCount: number;
};

const ACTIVITY_TYPES = [
  "viewedProduct",
  "viewedAuction",
  "participatedAuction",
  "wishlistedProduct",
] as const;

type ActivityType = (typeof ACTIVITY_TYPES)[number];

const DEFAULT_WEIGHTS: Record<ActivityType, number> = {
  viewedProduct: 3,
  viewedAuction: 2,
  participatedAuction: 1.5,
  wishlistedProduct: 1.2,
};

const FRESH_WINDOW_MS = 1000 * 60 * 60 * 24 * 30;
const MAX_RECOMMENDATION_IDS = 20;

const buildRecommendationIds = (options: {
  limitPerSource: number;
  weights: Record<ActivityType, number>;
  freshWindowMs: number;
  maxIds: number;
}) => {
  const now = Date.now();
  const scoreMap = new Map<
    string,
    { score: number; latestAt: number }
  >();

  ACTIVITY_TYPES.forEach((type) => {
    const entries = activityStorage.getActivityEntries(
      type,
      options.limitPerSource
    );
    entries.forEach((entry) => {
      const ageMs = now - entry.at;
      if (ageMs > options.freshWindowMs) return;
      const productId = entry.productId ?? entry.id;
      if (!productId) return;
      const recencyScore = Math.max(0, 1 - ageMs / options.freshWindowMs);
      const score = options.weights[type] * (1 + recencyScore);
      const current = scoreMap.get(productId) ?? { score: 0, latestAt: 0 };
      scoreMap.set(productId, {
        score: current.score + score,
        latestAt: Math.max(current.latestAt, entry.at),
      });
    });
  });

  return Array.from(scoreMap.entries())
    .map(([productId, meta]) => ({
      productId,
      score: meta.score,
      latestAt: meta.latestAt,
    }))
    .sort((a, b) => b.score - a.score || b.latestAt - a.latestAt)
    .slice(0, options.maxIds)
    .map((item) => item.productId);
};

const normalizeCategories = (categories?: Product["categories"]) => {
  if (!categories) return [];
  return categories
    .map((category) =>
      typeof category === "string"
        ? category
        : category?.name ?? category?.categoryName ?? ""
    )
    .filter((label) => label.length > 0);
};

const fetchPopularRecommendations = async (
  limit: number
): Promise<ActivityRecommendations> => {
  const topAuctionsResponse = await auctionApi.getTopAuctions(limit * 2);
  const rankings = topAuctionsResponse.data ?? [];
  const auctions = rankings
    .map((ranking) => ranking.auction)
    .filter((auction): auction is AuctionRankingResponse["auction"] => !!auction);

  if (auctions.length === 0) {
    return { items: [], summary: "", sourceCount: 0 };
  }

  const productIds = Array.from(
    new Set(auctions.map((auction) => auction.productId))
  );
  const productsResponse = await productApi.getProductsByIds(productIds);
  const products = productsResponse.data ?? [];
  const productMap = new Map(products.map((product) => [product.id, product]));

  const fileGroupIds = Array.from(
    new Set(
      auctions
        .map((auction) => {
          const product = productMap.get(auction.productId);
          return auction.fileGroupId ?? product?.fileGroupId ?? null;
        })
        .filter((id): id is string | number => !!id)
        .map((id) => String(id))
    )
  );
  const fileGroupsResponse = fileGroupIds.length
    ? await fileApi.getFileGroupsByIds(fileGroupIds)
    : null;
  const fileGroups = fileGroupsResponse?.data ?? [];
  const fileGroupMap = new Map(
    fileGroups.map((group) => [String(group.fileGroupId), group])
  );

  const items = auctions.slice(0, limit).map((auction) => {
    const product = productMap.get(auction.productId);
    const fileGroupId = auction.fileGroupId ?? product?.fileGroupId ?? null;
    const fileGroup = fileGroupId
      ? fileGroupMap.get(String(fileGroupId)) ?? null
      : null;
    const imageUrl = getProductImageUrls(fileGroup)[0] ?? "";

    return {
      productId: auction.productId,
      productName: auction.productName ?? product?.name ?? "인기 상품",
      categories: normalizeCategories(product?.categories),
      description: product?.description ?? "",
      imageUrl,
      startPrice: auction.startBid ?? 0,
      depositAmount: auction.depositAmount ?? 0,
      status: auction.status,
      sellerId: auction.sellerId ?? "",
      auctionStartAt: auction.auctionStartAt ?? "",
      auctionEndAt: auction.auctionEndAt ?? "",
      score: 0,
    };
  });

  return {
    items,
    summary: "최근 활동이 없어 인기 상품을 추천드려요.",
    sourceCount: 0,
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
  freshWindowMs?: number;
}): UseQueryResult<ActivityRecommendations, Error> {
  const limitPerSource = options?.limitPerSource ?? 5;
  const freshWindowMs = options?.freshWindowMs ?? FRESH_WINDOW_MS;
  const weights = useMemo(
    () => ({
      viewedProduct:
        options?.weights?.viewedProduct ?? DEFAULT_WEIGHTS.viewedProduct,
      viewedAuction:
        options?.weights?.viewedAuction ?? DEFAULT_WEIGHTS.viewedAuction,
      participatedAuction:
        options?.weights?.participatedAuction ??
        DEFAULT_WEIGHTS.participatedAuction,
      wishlistedProduct:
        options?.weights?.wishlistedProduct ?? DEFAULT_WEIGHTS.wishlistedProduct,
    }),
    [
      options?.weights?.participatedAuction,
      options?.weights?.viewedAuction,
      options?.weights?.viewedProduct,
      options?.weights?.wishlistedProduct,
    ]
  );

  return useQuery<ActivityRecommendations, Error, ActivityRecommendations>({
    queryKey: [
      ...queryKeys.wishlist.activityRecommendations(options?.userId),
      limitPerSource,
      freshWindowMs,
      weights,
    ],
    queryFn: async () => {
      const recommendationIds = buildRecommendationIds({
        limitPerSource,
        weights,
        freshWindowMs,
        maxIds: MAX_RECOMMENDATION_IDS,
      });

      if (recommendationIds.length === 0) {
        return fetchPopularRecommendations(4);
      }

      const response = await wishlistApi.getWishlistRecommendations(
        recommendationIds
      );

      return {
        items: response.data.items ?? [],
        summary: response.data.summary ?? "",
        sourceCount: 1,
      };
    },
    enabled: Boolean(options?.userId),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
    refetchOnWindowFocus: false,
    placeholderData: keepPreviousData,
  });
}
