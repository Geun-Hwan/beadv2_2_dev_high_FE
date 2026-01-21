import type { SimilarProductResponse } from "@moreauction/types";

export type SimilarDisplayItem = SimilarProductResponse & {
  source: "similar" | "popular";
};
