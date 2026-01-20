import type { ApiResponseDto, FileGroup } from "@moreauction/types";
import { client } from "@/apis/client";

export const adminFileApi = {
  getFiles: async (fileGroupId: string): Promise<ApiResponseDto<FileGroup>> => {
    const response = await client.get(`/files/groups/${fileGroupId}`);
    return response.data;
  },
  getFileGroupsByIds: async (
    fileGroupIds: string[]
  ): Promise<ApiResponseDto<FileGroup[]>> => {
    const ids = fileGroupIds.filter(Boolean).map(encodeURIComponent).join(",");
    const response = await client.get(`/files/groups/${ids}/many`);
    return response.data;
  },
};
