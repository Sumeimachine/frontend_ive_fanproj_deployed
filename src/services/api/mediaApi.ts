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

export const mediaApi = {
  uploadImage: async (file: File, folder = "quiz") => {
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

  deleteImageByUrl: async (url: string) => {
    const { data } = await httpClient.delete<{ message: string }>("/admin/media", {
      params: { url },
    });

    return data;
  },

  getLibrary: async () => {
    const { data } = await httpClient.get<MediaLibraryResponse>("/admin/media/library");
    return data;
  },

  renameImage: async (url: string, newFileNameWithoutExtension: string) => {
    const { data } = await httpClient.patch<{
      message: string;
      url: string;
      relativePath: string;
      fileName: string;
    }>("/admin/media/rename", { url, newFileNameWithoutExtension });

    return data;
  },
};
