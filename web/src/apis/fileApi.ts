import type {
  FileGroupUploadResponse,
  UploadedFileInfo,
} from "@moreauction/api-client";
import { createFileApi } from "@moreauction/api-client";
import { client } from "@/apis/client";

export type { UploadedFileInfo, FileGroupUploadResponse };

export const fileApi = createFileApi(client);
