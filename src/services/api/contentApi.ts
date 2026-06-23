import type { ContentPage } from "../../content/pageTemplates";
import httpClient from "../httpClient";

export const contentApi = {
  getPublishedPages: async () => {
    const { data } = await httpClient.get<ContentPage[]>("/content/pages");
    return data;
  },

  getPublishedPage: async (slug: string) => {
    const { data } = await httpClient.get<ContentPage>(`/content/pages/${slug}`);
    return data;
  },

  getAdminPages: async () => {
    const { data } = await httpClient.get<ContentPage[]>("/content/pages/admin/all");
    return data;
  },

  createPage: async (page: ContentPage) => {
    const { data } = await httpClient.post<ContentPage>("/content/pages/admin", page);
    return data;
  },

  savePage: async (page: ContentPage) => {
    const { data } = await httpClient.put<ContentPage>(`/content/pages/admin/${page.slug}`, page);
    return data;
  },

  deletePage: async (slug: string) => {
    const { data } = await httpClient.delete<{ message: string }>(`/content/pages/admin/${slug}`);
    return data;
  },
};
