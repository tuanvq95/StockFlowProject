import { api } from "./api";
import type { APIResponse } from "../types/auth";

export interface ExchangeRate {
  usd_to_vnd_rate: number;
}

export const configService = {
  getExchangeRate: async (): Promise<ExchangeRate> => {
    const { data } = await api.get<APIResponse<ExchangeRate>>("/api/v1/config/exchange-rate");
    return data.data;
  },

  updateExchangeRate: async (rate: number): Promise<ExchangeRate> => {
    const { data } = await api.put<APIResponse<ExchangeRate>>("/api/v1/config/exchange-rate", {
      usd_to_vnd_rate: rate,
    });
    return data.data;
  },
};
