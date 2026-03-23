import { api } from "./api";
import type { APIResponse } from "../types/auth";
import type {
  Order,
  CreateOrderRequest,
  OrderPagedResult,
  OrderStatus,
} from "../types/order";

export interface OrderPageQuery {
  page?: number;
  page_size?: number;
  status?: string;
  search?: string;
}

export const orderService = {
  getPaged: async (q: OrderPageQuery): Promise<OrderPagedResult> => {
    const { data } = await api.get<APIResponse<OrderPagedResult>>(
      "/api/v1/orders",
      { params: q }
    );
    return data.data;
  },

  getById: async (id: number): Promise<Order> => {
    const { data } = await api.get<APIResponse<Order>>(
      `/api/v1/orders/${id}`
    );
    return data.data;
  },

  getByCode: async (code: string): Promise<Order> => {
    const { data } = await api.get<APIResponse<Order>>(
      `/api/v1/orders-by-code/${code}`
    );
    return data.data;
  },

  create: async (req: CreateOrderRequest): Promise<Order> => {
    const { data } = await api.post<APIResponse<Order>>(
      "/api/v1/orders",
      req
    );
    return data.data;
  },

  updateStatus: async (id: number, status: OrderStatus): Promise<Order> => {
    const { data } = await api.patch<APIResponse<Order>>(
      `/api/v1/orders/${id}/status`,
      { status }
    );
    return data.data;
  },
};
