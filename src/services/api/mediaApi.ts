import httpClient from "../httpClient";

export interface MediaUploadResponse {
  url: string;
  path: string;
}

export interface MediaLibraryFile {
  fileName: string;
  folder: string;
  relativePath: string;
  url: string;
  sizeBytes: number;
  updatedAtUtc: string;
}

export interface MediaLibraryResponse {
  totalFiles: number;
  totalBytes: number;
  files: MediaLibraryFile[];
}

export const MAX_IMAGE_UPLOAD_SIZE_BYTES = 1024 * 1024 * 1024;
export const MAX_VIDEO_UPLOAD_SIZE_BYTES = 1024 * 1024 * 1024;

export const getMediaUploadLimit = (file: File) =>
  file.type.startsWith("image/") ? MAX_IMAGE_UPLOAD_SIZE_BYTES : MAX_VIDEO_UPLOAD_SIZE_BYTES;

export const getMediaUploadLimitLabel = (file: File) =>
  file.type.startsWith("image/") ? "1 GB image limit" : "1 GB video limit";

export const mediaApi = {
  uploadMedia: async (file: File, folder = "quiz") => {
    if (file.size > getMediaUploadLimit(file)) {
      throw new Error(`File exceeds the ${getMediaUploadLimitLabel(file)}.`);
    }
    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", folder);

    const { data } = await httpClient.post<MediaUploadResponse>("/admin/media/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return data;
  },

  deleteMediaByUrl: async (url: string) => {
    const { data } = await httpClient.delete<{ message: string }>("/admin/media", {
      params: { url },
    });

    return data;
  },

  getLibrary: async () => {
    const { data } = await httpClient.get<MediaLibraryResponse>("/admin/media/library");
    return data;
  },

  renameMedia: async (url: string, newFileNameWithoutExtension: string) => {
    const { data } = await httpClient.patch<{
      message: string;
      url: string;
      relativePath: string;
      fileName: string;
      previousUrl?: string;
      previousRelativePath?: string;
    }>("/admin/media/rename", { url, newFileNameWithoutExtension });

    return data;
  },
};
