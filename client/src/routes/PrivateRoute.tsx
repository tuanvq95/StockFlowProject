import { Navigate, Outlet } from "react-router-dom";
import { useAuthContext } from "../contexts/useAuthContext";
import { ROUTES } from "../constants/routes";

export default function PrivateRoute() {
  const { isAuthenticated, isLoading } = useAuthContext();

  if (isLoading) return null; // wait for getMe() before deciding

  return isAuthenticated ? <Outlet /> : <Navigate to={ROUTES.LOGIN} replace />;
}
