import type { User } from "./user";

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  expires_at: string;
  user: User;
}

export interface APIResponse<T> {
  success: boolean;
  data: T;
  error?: string;
}
