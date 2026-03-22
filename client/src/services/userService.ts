import { api } from "./api";
import type { User } from "../types/user";

export const userService = {
  getAll: async (): Promise<User[]> => {
    const { data } = await api.get<User[]>("/api/v1/users");
    return data;
  },

  getById: async (id: number): Promise<User> => {
    const { data } = await api.get<User>(`/api/v1/users/${id}`);
    return data;
  },

  update: async (id: number, payload: Partial<User>): Promise<User> => {
    const { data } = await api.put<User>(`/api/v1/users/${id}`, payload);
    return data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/api/v1/users/${id}`);
  },
};
