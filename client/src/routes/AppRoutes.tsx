import { lazy } from "react";
import { Routes, Route } from "react-router-dom";
import MainLayout from "../components/layout/MainLayout";
import PrivateRoute from "./PrivateRoute";
import { ROUTES } from "../constants/routes";

const Dashboard = lazy(() => import("../pages/Dashboard/Dashboard"));
const Product = lazy(() => import("../pages/Product/Product"));
const Warehouse = lazy(() => import("../pages/Warehouse/Warehouse"));
const Order = lazy(() => import("../pages/Order/Order"));
const OrderScan = lazy(() => import("../pages/Order/OrderScan"));
const Login = lazy(() => import("../pages/Login/Login"));
const NotFound = lazy(() => import("../pages/NotFound/NotFound"));

export default function AppRoutes() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path={ROUTES.LOGIN} element={<Login />} />

      {/* Protected routes wrapped in MainLayout */}
      <Route element={<PrivateRoute />}>
        <Route element={<MainLayout />}>
          <Route path={ROUTES.HOME} element={<Dashboard />} />
          <Route path={ROUTES.PRODUCT} element={<Product />} />
          <Route path={ROUTES.WAREHOUSE} element={<Warehouse />} />
          <Route path={ROUTES.ORDER} element={<Order />} />
          <Route path={ROUTES.ORDER_SCAN} element={<OrderScan />} />
        </Route>
      </Route>

      <Route path={ROUTES.NOT_FOUND} element={<NotFound />} />
    </Routes>
  );
}
