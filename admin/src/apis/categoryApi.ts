import { createCategoryApi } from "@moreauction/api-client";
import { authClient } from "@/apis/client";

export const categoryApi = createCategoryApi(authClient);
