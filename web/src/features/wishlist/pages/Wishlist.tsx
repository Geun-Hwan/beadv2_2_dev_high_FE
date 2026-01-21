import type {
  ApiResponseDto,
  FileGroup,
  Product,
  ProductRecommendationResponse,
  ProductRecommendSummaryResponse,
} from "@moreauction/types";
import { getProductImageUrls } from "@moreauction/utils";
import {
  Alert,
  Box,
  Button,
  Container,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import type { InfiniteData } from "@tanstack/react-query";
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import { fileApi } from "@/apis/fileApi";
import { productApi } from "@/apis/productApi";
import {
  wishlistApi,
  type PagedWishlistResponse,
  type WishlistEntry,
} from "@/apis/wishlistApi";
import { useAuth } from "@moreauction/auth";
import WishlistItemRow from "@/features/wishlist/components/WishlistItemRow";
import WishlistListSkeleton from "@/features/wishlist/components/WishlistListSkeleton";
import WishlistRecommendationsFloating from "@/features/wishlist/components/WishlistRecommendationsFloating";
import { queryKeys } from "@/shared/queries/queryKeys";
import { seedFileGroupCache } from "@/shared/queries/seedFileGroupCache";
import { getErrorMessage } from "@/shared/utils/getErrorMessage";
import { activityStorage } from "@/shared/utils/activityStorage";

type WishlistPageResponse = ApiResponseDto<PagedWishlistResponse>;

const Wishlist: React.FC = () => {
  const { isAuthenticated, user } = useAuth();
  const [removingId, setRemovingId] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const listContainerRef = useRef<HTMLDivElement | null>(null);
  const pageSize = 10;
  const wishlistQueryKey = useMemo(
    () => [...queryKeys.wishlist.list(user?.userId), "infinite"] as const,
    [user?.userId]
  );

  const wishlistQuery = useInfiniteQuery<
    WishlistPageResponse,
    Error,
    InfiniteData<WishlistPageResponse>,
    typeof wishlistQueryKey,
    number
  >({
    queryKey: wishlistQueryKey,
    initialPageParam: 0,
    queryFn: async ({ pageParam = 0 }) => {
      const data = await wishlistApi.getMyWishlist({
        page: pageParam,
        size: pageSize,
      });
      return data;
    },
    getNextPageParam: (lastPage) => {
      const page = lastPage?.data;
      if (!page || page.last) return undefined;
      return page.number + 1;
    },
    enabled: isAuthenticated && !!user?.userId,
    staleTime: 30_000,
  });

  const errorMessage = useMemo(() => {
    if (!wishlistQuery.isError) return null;
    return getErrorMessage(
      wishlistQuery.error,
      "찜 목록을 불러오는데 실패했습니다."
    );
  }, [wishlistQuery.error, wishlistQuery.isError]);

  const removeMutation = useMutation({
    mutationFn: (productId: string) => wishlistApi.remove(productId),
    onSuccess: (_, productId) => {
      queryClient.setQueryData(
        wishlistQueryKey,
        (prev: InfiniteData<WishlistPageResponse> | undefined) => {
          if (!prev) return prev;
          return {
            ...prev,
            pages: prev.pages.map((page) => ({
              ...page,
              data: {
                ...page.data,
                content: page.data.content.filter(
                  (entry) => entry.productId !== productId
                ),
              },
            })),
          };
        }
      );
    },
  });

  const handleRemoveWishlist = async (productId: string) => {
    if (removingId) return;
    try {
      setRemovingId(productId);
      activityStorage.removeWishlistedProduct(productId);
      await removeMutation.mutateAsync(productId);
    } catch (err) {
      console.error("찜 삭제 실패:", err);
      alert("찜 삭제에 실패했습니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      setRemovingId(null);
    }
  };

  const pages = wishlistQuery.data?.pages ?? [];
  const entries = useMemo<WishlistEntry[]>(
    () => pages.flatMap((page) => page.data?.content ?? []),
    [pages]
  );
  const entryProductIds = useMemo<string[]>(
    () => entries.map((entry) => entry.productId),
    [entries]
  );
  const totalCount =
    wishlistQuery.data?.pages?.[0]?.data?.totalElements ?? entries.length;
  const firstPageEntries = useMemo(
    () => pages[0]?.data?.content ?? [],
    [pages]
  );
  const recommendationProductIds = useMemo<string[]>(() => {
    const ids = firstPageEntries
      .map((entry) => entry.productId)
      .filter((productId) => productId && productId.length > 0);
    return Array.from(new Set(ids)).sort();
  }, [firstPageEntries]);

  useEffect(() => {
    if (firstPageEntries.length === 0) return;
    [...firstPageEntries]
      .reverse()
      .forEach((entry) =>
        activityStorage.recordWishlistedProduct(entry.productId)
      );
  }, [firstPageEntries]);
  const productsQuery = useQuery<Product[], Error>({
    queryKey: [
      ...queryKeys.products.many(entryProductIds),
      "wishlist",
    ],
    queryFn: async () => {
      if (entries.length === 0) return [];
      const uniqueProductIds = Array.from(
        new Set(entries.map((entry) => entry.productId))
      );

      const cachedProducts = uniqueProductIds
        .map((productId) =>
          queryClient.getQueryData<Product>(
            queryKeys.products.detail(productId)
          )
        )
        .filter((product): product is Product => !!product);

      const cachedProductIds = new Set(
        cachedProducts.map((product) => product.id)
      );
      const missingProductIds = uniqueProductIds.filter(
        (productId) => !cachedProductIds.has(productId)
      );

      const fetchedProducts = missingProductIds.length
        ? await Promise.all(
            missingProductIds.map(async (productId) => {
              try {
                const res = await productApi.getProductById(productId);
                queryClient.setQueryData(
                  queryKeys.products.detail(productId),
                  res.data
                );
                return res.data;
              } catch (err) {
                console.error("상품 조회 실패:", productId, err);
                return null;
              }
            })
          )
        : [];

      const productMap = new Map(
        [...cachedProducts, ...fetchedProducts]
          .filter((result): result is Product => result !== null)
          .map((product) => [product.id, product])
      );

      return entries.map((entry) => {
        const product = productMap.get(entry.productId);
        if (product) return product;
        return {
          id: entry.productId,
          name: "상품 정보를 불러오지 못했습니다.",
          createdAt: undefined,
        } as Product;
      });
    },
    enabled: entries.length > 0,
    staleTime: 30_000,
  });
  const products = productsQuery.data ?? [];

  useEffect(() => {
    if (!loadMoreRef.current) return;
    if (!wishlistQuery.hasNextPage) return;
    const element = loadMoreRef.current;
    const root = listContainerRef.current;
    const observer = new IntersectionObserver(
      (entriesList) => {
        if (
          entriesList.some((entry) => entry.isIntersecting) &&
          wishlistQuery.hasNextPage &&
          !wishlistQuery.isFetchingNextPage
        ) {
          wishlistQuery.fetchNextPage();
        }
      },
      { rootMargin: "120px", root: root ?? null }
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [
    wishlistQuery.hasNextPage,
    wishlistQuery.isFetchingNextPage,
    wishlistQuery.fetchNextPage,
  ]);
  const recommendationsQuery = useQuery<ProductRecommendSummaryResponse, Error>({
    queryKey: [
      ...queryKeys.wishlist.recommendations(user?.userId),
      recommendationProductIds,
    ],
    queryFn: async () => {
      const response = await wishlistApi.getWishlistRecommendations(
        recommendationProductIds
      );
      return response.data;
    },
    enabled: recommendationProductIds.length > 0 && wishlistQuery.isSuccess,
    staleTime: 30_000,
  });
  const recommendedItems =
    recommendationsQuery.data?.items ?? ([] as ProductRecommendationResponse[]);
  const recommendationSummary = recommendationsQuery.data?.summary ?? "";

  const fileGroupIds = useMemo(() => {
    const ids = products
      .map((product) => product.fileGroupId)
      .filter((id): id is string => id != null && id !== "")
      .map((id) => String(id));
    return Array.from(new Set(ids));
  }, [products]);

  const cachedFileGroups = useMemo(
    () =>
      fileGroupIds
        .map(
          (id) =>
            queryClient.getQueryData<ApiResponseDto<FileGroup>>(
              queryKeys.files.group(id)
            )?.data
        )
        .filter((group): group is FileGroup => !!group),
    [fileGroupIds, queryClient]
  );
  const cachedFileGroupIds = useMemo(
    () => new Set(cachedFileGroups.map((group) => String(group.fileGroupId))),
    [cachedFileGroups]
  );
  const missingFileGroupIds = useMemo(
    () => fileGroupIds.filter((id) => !cachedFileGroupIds.has(id)),
    [cachedFileGroupIds, fileGroupIds]
  );
  const fileGroupsQuery = useQuery({
    queryKey: queryKeys.files.groups(missingFileGroupIds),
    queryFn: async () => {
      const response = await fileApi.getFileGroupsByIds(missingFileGroupIds);
      seedFileGroupCache(queryClient, response);
      return response.data ?? [];
    },
    enabled: missingFileGroupIds.length > 0,
    staleTime: 30_000,
  });
  const fileGroupMap = useMemo(() => {
    const list = [...cachedFileGroups, ...(fileGroupsQuery.data ?? [])];
    return new Map(list.map((group) => [String(group.fileGroupId), group]));
  }, [cachedFileGroups, fileGroupsQuery.data]);
  const isImageLoading =
    wishlistQuery.isLoading ||
    productsQuery.isLoading ||
    fileGroupsQuery.isLoading;
  const isListLoading =
    wishlistQuery.isLoading || (productsQuery.isLoading && products.length === 0);

  if (!isAuthenticated) {
    return (
      <Container maxWidth="md">
        <Box sx={{ my: 4 }}>
          <Typography variant="h4" component="h1" sx={{ mb: 2 }}>
            찜 목록 (Wishlist)
          </Typography>
          <Paper sx={{ p: 2 }}>
            <Alert severity="info">
              로그인 후 찜한 상품을 확인할 수 있습니다.
            </Alert>
          </Paper>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="md">
      <Box sx={{ my: 4 }}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          alignItems={{ xs: "flex-start", sm: "center" }}
          justifyContent="space-between"
          spacing={1}
          sx={{ mb: 1 }}
        >
          <Typography variant="h4" component="h1">
            찜 목록 (Wishlist)
          </Typography>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Typography variant="body2" color="text.secondary">
              총 {totalCount}개
            </Typography>
          </Stack>
        </Stack>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
          찜한 상품을 모아보고, 관심 경매 시작 알림을 받아보세요.
        </Typography>
        <WishlistRecommendationsFloating
          summary={recommendationSummary}
          items={recommendedItems}
          isLoading={recommendationsQuery.isLoading}
        />
        <Paper sx={{ p: { xs: 2, sm: 3 }, borderRadius: 3 }}>
          {isListLoading && products.length === 0 && !errorMessage && (
            <WishlistListSkeleton count={4} />
          )}

          {!isListLoading && errorMessage && (
            <Alert severity="error">{errorMessage}</Alert>
          )}
          {!isListLoading && !errorMessage && entries.length === 0 && (
              <Box
                sx={{
                  textAlign: "center",
                  py: 6,
                  px: 2,
                  borderRadius: 3,
                  border: "1px dashed",
                  borderColor: "divider",
                }}
              >
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                  아직 찜한 상품이 없습니다
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 3 }}
                >
                  마음에 드는 상품을 찜해두면 빠르게 확인할 수 있어요.
                </Typography>
                <Button component={RouterLink} to="/search" variant="contained">
                  상품 둘러보기
                </Button>
              </Box>
            )}
          {!isListLoading && !errorMessage && products.length > 0 && (
            <Box
              ref={listContainerRef}
              sx={{
                maxHeight: { xs: 560, sm: 640 },
                overflowY: "auto",
                pr: 0.5,
              }}
            >
              <Stack spacing={1.5}>
              {products.map((product) => {
                const fileGroupId = product.fileGroupId
                  ? String(product.fileGroupId)
                  : null;
                const imageUrls = fileGroupId
                  ? getProductImageUrls(fileGroupMap.get(fileGroupId) ?? null)
                  : [];
                const coverImage = imageUrls[0];

                return (
                  <WishlistItemRow
                    key={product.id}
                    product={product}
                    imageUrl={coverImage}
                    isImageLoading={isImageLoading}
                    isRemoving={removingId === product.id}
                    onRemove={() => handleRemoveWishlist(product.id)}
                  />
                );
              })}
              <Box ref={loadMoreRef} sx={{ height: 1 }} />
              {wishlistQuery.isFetchingNextPage && (
                <WishlistListSkeleton count={2} />
              )}
              </Stack>
            </Box>
          )}
        </Paper>
      </Box>
    </Container>
  );
};

export default Wishlist;
