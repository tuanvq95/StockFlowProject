import { api } from "./api";
import type { APIResponse } from "../types/auth";
import type { Product, CreateProductRequest, PagedResult } from "../types/product";

export interface ProductPageQuery {
  page?: number;
  page_size?: number;
  search?: string;
  min_price?: number;
  max_price?: number;
  min_stock?: number;
  max_stock?: number;
}

export const productService = {
  getAll: async (): Promise<Product[]> => {
    const { data } = await api.get<APIResponse<Product[]>>("/api/v1/products");
    return data.data ?? [];
  },

  getPaged: async (q: ProductPageQuery): Promise<PagedResult<Product>> => {
    const { data } = await api.get<APIResponse<PagedResult<Product>>>("/api/v1/products/paged", {
      params: q,
    });
    return data.data;
  },

  getById: async (id: number): Promise<Product> => {
    const { data } = await api.get<APIResponse<Product>>(`/api/v1/products/${id}`);
    return data.data;
  },

  create: async (req: CreateProductRequest): Promise<Product> => {
    const { data } = await api.post<APIResponse<Product>>("/api/v1/products", req);
    return data.data;
  },

  update: async (id: number, req: Partial<CreateProductRequest>): Promise<Product> => {
    const { data } = await api.put<APIResponse<Product>>(`/api/v1/products/${id}`, req);
    return data.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/api/v1/products/${id}`);
  },
};
