import { api } from "./api";
import type { APIResponse } from "../types/auth";
import type { User } from "../types/user";

export const authService = {
  login: async (email: string, password: string): Promise<User> => {
    // Server sets httpOnly cookie, returns UserInfo only
    const { data } = await api.post<APIResponse<User>>("/api/v1/auth/login", {
      email,
      password,
    });
    return data.data;
  },

  logout: async (): Promise<void> => {
    await api.post("/api/v1/auth/logout");
  },

  getMe: async (): Promise<User> => {
    const { data } = await api.get<APIResponse<User>>("/api/v1/auth/me");
    return data.data;
  },
};
