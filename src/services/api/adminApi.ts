import httpClient from "../httpClient";

interface UploadFileResponse {
  id: string;
  fileName: string;
  storedName: string;
  url: string;
}

export const adminApi = {
  uploadFile: async (file: File, category = "general") => {
    const formData = new FormData();
    formData.append("file", file);

    const { data } = await httpClient.post<UploadFileResponse>(
      "/Admin/upload-file",
      formData,
      { params: { category } },
    );

    return data;
  },

  deleteFile: async (filePath: string) => {
    const { data } = await httpClient.delete<string>("/Admin/delete-file", {
      params: { filePath },
    });

    return data;
  },
};
