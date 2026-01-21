import { createCategoryApi } from "@moreauction/api-client";
import { client } from "@/apis/client";

export const categoryApi = createCategoryApi(client);
