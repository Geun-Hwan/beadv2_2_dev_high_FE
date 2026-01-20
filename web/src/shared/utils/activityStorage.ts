type ActivityType =
  | "viewedProduct"
  | "viewedAuction"
  | "participatedAuction"
  | "wishlistedProduct";

type ActivityEntry = {
  id: string;
  productId?: string;
  at: number;
};

type ActivityStore = Record<ActivityType, ActivityEntry[]>;

const STORAGE_KEY = "moreauction.activity";
const MAX_ITEMS: Record<ActivityType, number> = {
  viewedProduct: 20,
  viewedAuction: 20,
  participatedAuction: 20,
  wishlistedProduct: 20,
};

const DEDUPE_KEY: Partial<Record<ActivityType, "id" | "productId">> = {
  viewedProduct: "id",
  viewedAuction: "productId",
  wishlistedProduct: "id",
};

const DEFAULT_WEIGHTS: Record<ActivityType, number> = {
  viewedProduct: 1,
  viewedAuction: 1.2,
  participatedAuction: 3,
  wishlistedProduct: 2,
};

const emptyStore: ActivityStore = {
  viewedProduct: [],
  viewedAuction: [],
  participatedAuction: [],
  wishlistedProduct: [],
};

const isBrowser = () => typeof window !== "undefined";

const normalizeEntries = (value: unknown): ActivityEntry[] => {
  if (!Array.isArray(value)) return [];
  return value
    .filter(
      (item): item is ActivityEntry =>
        !!item &&
        typeof item === "object" &&
        typeof (item as ActivityEntry).id === "string" &&
        typeof (item as ActivityEntry).at === "number"
    )
    .sort((a, b) => b.at - a.at);
};

const normalizeStore = (value: unknown): ActivityStore => {
  if (!value || typeof value !== "object") return { ...emptyStore };
  const record = value as Partial<ActivityStore>;
  return {
    viewedProduct: normalizeEntries(record.viewedProduct),
    viewedAuction: normalizeEntries(record.viewedAuction),
    participatedAuction: normalizeEntries(record.participatedAuction),
    wishlistedProduct: normalizeEntries(record.wishlistedProduct),
  };
};

const readStore = (): ActivityStore => {
  if (!isBrowser()) return { ...emptyStore };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...emptyStore };
    return normalizeStore(JSON.parse(raw));
  } catch (error) {
    console.warn("Failed to read activity storage:", error);
    return { ...emptyStore };
  }
};

const writeStore = (store: ActivityStore) => {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch (error) {
    console.warn("Failed to write activity storage:", error);
  }
};

const recordActivity = (
  type: ActivityType,
  params: { id?: string | null; productId?: string | null }
) => {
  const id = params.id ?? null;
  if (!id) return;
  const store = readStore();
  const dedupeKey = DEDUPE_KEY[type];
  const next = dedupeKey
    ? store[type].filter((entry) => {
        if (dedupeKey === "productId") {
          return (entry.productId ?? entry.id) !== (params.productId ?? id);
        }
        return entry.id !== id;
      })
    : [...store[type]];
  next.unshift({ id, productId: params.productId ?? undefined, at: Date.now() });
  store[type] = next.slice(0, MAX_ITEMS[type]);
  writeStore(store);
};

const removeActivity = (
  type: ActivityType,
  params: { id?: string | null; productId?: string | null }
) => {
  const id = params.id ?? null;
  if (!id) return;
  const store = readStore();
  const dedupeKey = DEDUPE_KEY[type];
  store[type] = store[type].filter((entry) => {
    if (dedupeKey === "productId") {
      return (entry.productId ?? entry.id) !== (params.productId ?? id);
    }
    return entry.id !== id;
  });
  writeStore(store);
};
const listActivity = (type: ActivityType, limit?: number): ActivityEntry[] => {
  const store = readStore();
  const items = store[type];
  if (typeof limit === "number") return items.slice(0, limit);
  return items;
};

const toUniqueProductIds = (entries: ActivityEntry[]): string[] => {
  const seen = new Set<string>();
  const result: string[] = [];
  entries.forEach((entry) => {
    const productId = entry.productId ?? entry.id;
    if (!productId || seen.has(productId)) return;
    seen.add(productId);
    result.push(productId);
  });
  return result;
};

const getWeightedProductScores = (options?: {
  limit?: number;
  weights?: Partial<Record<ActivityType, number>>;
}) => {
  const weights = { ...DEFAULT_WEIGHTS, ...(options?.weights ?? {}) };
  const scoreMap = new Map<string, number>();
  (Object.keys(emptyStore) as ActivityType[]).forEach((type) => {
    const list = listActivity(type);
    list.forEach((entry) => {
      const productId = entry.productId ?? entry.id;
      if (!productId) return;
      const next = (scoreMap.get(productId) ?? 0) + weights[type];
      scoreMap.set(productId, next);
    });
  });
  const scored = Array.from(scoreMap.entries())
    .map(([productId, score]) => ({ productId, score }))
    .sort((a, b) => b.score - a.score);
  if (typeof options?.limit === "number") {
    return scored.slice(0, options.limit);
  }
  return scored;
};

const toScoreMap = (weights?: Partial<Record<ActivityType, number>>) =>
  new Map(
    getWeightedProductScores({ weights }).map((item) => [
      item.productId,
      item.score,
    ])
  );

const getTopProductIdsByActivityType = (
  type: ActivityType,
  limit = 5,
  weights?: Partial<Record<ActivityType, number>>
): string[] => {
  const scoreMap = toScoreMap(weights);
  const entries = listActivity(type);
  const ranked = entries
    .map((entry) => ({
      productId: entry.productId ?? entry.id,
      score: scoreMap.get(entry.productId ?? entry.id) ?? 0,
      at: entry.at,
    }))
    .filter((item) => item.productId)
    .sort((a, b) => b.score - a.score || b.at - a.at);
  const seen = new Set<string>();
  const result: string[] = [];
  ranked.forEach((item) => {
    if (seen.has(item.productId)) return;
    seen.add(item.productId);
    result.push(item.productId);
  });
  return result.slice(0, limit);
};

export const activityStorage = {
  recordViewedProduct: (productId?: string | null) =>
    recordActivity("viewedProduct", { id: productId, productId }),
  recordWishlistedProduct: (productId?: string | null) =>
    recordActivity("wishlistedProduct", { id: productId, productId }),
  removeWishlistedProduct: (productId?: string | null) =>
    removeActivity("wishlistedProduct", { id: productId, productId }),
  recordViewedAuction: (params: {
    auctionId?: string | null;
    productId?: string | null;
  }) =>
    recordActivity("viewedAuction", {
      id: params.auctionId,
      productId: params.productId,
    }),
  recordParticipatedAuction: (params: {
    auctionId?: string | null;
    productId?: string | null;
  }) =>
    recordActivity("participatedAuction", {
      id: params.auctionId,
      productId: params.productId,
    }),
  getRecentViewedProductIds: (limit?: number) =>
    listActivity("viewedProduct", limit).map((entry) => entry.id),
  getRecentViewedAuctionProductIds: (limit?: number) =>
    toUniqueProductIds(listActivity("viewedAuction", limit)),
  getRecentViewedAuctionIds: (limit?: number) =>
    listActivity("viewedAuction", limit).map((entry) => entry.id),
  getRecentParticipatedAuctionIds: (limit?: number) =>
    listActivity("participatedAuction", limit).map((entry) => entry.id),
  getRecentWishlistedProductIds: (limit?: number) =>
    listActivity("wishlistedProduct", limit).map((entry) => entry.id),
  getTopProductIdsByActivityType,
  getWeightedProductScores,
};
