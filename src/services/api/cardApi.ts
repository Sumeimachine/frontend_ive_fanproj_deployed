import httpClient from "../httpClient";
import type { CardCatalogItem } from "../../types/api";

export const cardApi = {
  getAll: async () => {
    const { data } = await httpClient.get<CardCatalogItem[]>("/Cards");
    return data;
  },
};
