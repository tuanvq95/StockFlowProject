import { api } from "./api";
import type { APIResponse } from "../types/auth";
import type { DashboardData } from "../types/dashboard";

export const dashboardService = {
  get: async (): Promise<DashboardData> => {
    const { data } = await api.get<APIResponse<DashboardData>>("/api/v1/dashboard");
    return data.data;
  },
};
