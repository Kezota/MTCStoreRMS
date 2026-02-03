import AppLayout from "./pages/AppLayout";
import HomePage from "./pages/HomePage";
import {
  LoginPage,
  DashboardLayout,
  DashboardPage,
  LaporanPage,
  StaffPage,
  InventoryPage,
  PenjualanPage,
} from "./pages";
import { ProtectedRoute, AdminRoute } from "./components";

export const routes = [
  {
    path: "/",
    element: <AppLayout />,
    children: [
      {
        index: true,
        handle: { title: "Home" },
        element: <HomePage />,
      },
      {
        path: "/login",
        handle: { title: "Login" },
        element: <LoginPage />,
      },
    ],
  },
  {
    path: "/dashboard",
    element: <ProtectedRoute />,
    children: [
      {
        element: <DashboardLayout />,
        children: [
          {
            index: true,
            handle: { title: "Dashboard" },
            element: <DashboardPage />,
          },
          {
            path: "staff",
            handle: { title: "Staff" },
            element: (
              <AdminRoute>
                <StaffPage />
              </AdminRoute>
            ),
          },
          {
            path: "inventory",
            handle: { title: "Inventory" },
            element: <InventoryPage />,
          },
          {
            path: "penjualan",
            handle: { title: "Penjualan" },
            element: <PenjualanPage />,
          },
          {
            path: "laporan",
            handle: { title: "Laporan" },
            element: <LaporanPage />,
          },
        ],
      },
    ],
  },
];
