import { createFileApi } from "@moreauction/api-client";
import { authClient } from "@/apis/client";

export const fileApi = createFileApi(authClient);
