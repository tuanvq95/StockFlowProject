import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:6900",
  withCredentials: true, // send httpOnly cookie automatically
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const is401 = err.response?.status === 401;
    const isMeEndpoint = (err.config?.url as string | undefined)?.includes("/auth/me");
    const alreadyOnLogin = window.location.pathname === "/login";

    // Only force-redirect on 401 for real authenticated requests.
    // A 401 from /auth/me is expected when the user is not logged in ?
    // AuthContext handles it silently. Redirecting here causes an infinite loop.
    if (is401 && !isMeEndpoint && !alreadyOnLogin) {
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);