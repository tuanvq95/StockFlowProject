import { useState, useEffect, type ReactNode } from "react";
import type { User } from "../types/user";
import { authService } from "../services/authService";
import { AuthContext } from "./useAuthContext";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // On mount, try to restore session via httpOnly cookie
    authService
      .getMe()
      .then((u: User) => setUser(u))
      .catch(() => {
        // 401 or network error ? not logged in
      })
      .finally(() => setIsLoading(false));
  }, []);

  const login = async (email: string, password: string) => {
    const u = await authService.login(email, password);
    setUser(u);
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, isAuthenticated: !!user, isLoading, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}
