import { api } from "./api";
import type { APIResponse } from "../types/auth";
import type {
  WarehouseTransaction,
  CreateTransactionRequest,
  WPagedResult,
} from "../types/warehouse";

export interface WPageQuery {
  page?: number;
  page_size?: number;
  type?: string;
}

export const warehouseService = {
  getPaged: async (q: WPageQuery): Promise<WPagedResult> => {
    const { data } = await api.get<APIResponse<WPagedResult>>(
      "/api/v1/warehouse/transactions",
      { params: q }
    );
    return data.data;
  },

  getById: async (id: number): Promise<WarehouseTransaction> => {
    const { data } = await api.get<APIResponse<WarehouseTransaction>>(
      `/api/v1/warehouse/transactions/${id}`
    );
    return data.data;
  },

  create: async (req: CreateTransactionRequest): Promise<WarehouseTransaction> => {
    const { data } = await api.post<APIResponse<WarehouseTransaction>>(
      "/api/v1/warehouse/transactions",
      req
    );
    return data.data;
  },

  downloadInvoice: async (id: number): Promise<void> => {
    const res = await api.get(`/api/v1/warehouse/transactions/${id}/invoice`, {
      responseType: "blob",
    });
    const url = URL.createObjectURL(res.data as Blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `invoice_${id}.xlsx`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  },
};
