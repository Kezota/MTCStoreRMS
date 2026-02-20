import AppLayout from "./pages/AppLayout";
import HomePage from "./pages/HomePage";
import {
  LoginPage,
  DashboardLayout,
  DashboardPage,
  LaporanPage,
  StockOpnamePage,
  StaffPage,
  InventoryPage,
  PenjualanPage,
  CustomerPage,
} from "./pages";
import {
  StaffDashboardLayout,
  StaffDashboardPage,
  StaffInventoryPage,
  StaffPenjualanPage,
  StaffStockOpnamePage,
  StaffCustomerPage,
  StaffLaporanPage,
} from "./pages/staff";
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
    element: (
      <AdminRoute>
        <DashboardLayout />
      </AdminRoute>
    ),
    children: [
      {
        index: true,
        handle: { title: "Dashboard" },
        element: <DashboardPage />,
      },
      {
        path: "stock-opname",
        handle: { title: "Stock Opname" },
        element: <StockOpnamePage />,
      },
      {
        path: "staff",
        handle: { title: "Staff" },
        element: <StaffPage />,
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
        path: "customers",
        handle: { title: "Pelanggan" },
        element: <CustomerPage />,
      },
      {
        path: "laporan",
        handle: { title: "Laporan" },
        element: <LaporanPage />,
      },
    ],
  },
  {
    path: "/staff",
    element: <ProtectedRoute />,
    children: [
      {
        element: <StaffDashboardLayout />,
        children: [
          {
            path: "dashboard",
            handle: { title: "Dashboard" },
            element: <StaffDashboardPage />,
          },
          {
            path: "inventory",
            handle: { title: "Inventory" },
            element: <StaffInventoryPage />,
          },
          {
            path: "penjualan",
            handle: { title: "Penjualan" },
            element: <StaffPenjualanPage />,
          },
          {
            path: "stock-opname",
            handle: { title: "Stock Opname" },
            element: <StaffStockOpnamePage />,
          },
          {
            path: "customers",
            handle: { title: "Pelanggan" },
            element: <StaffCustomerPage />,
          },
          {
            path: "laporan",
            handle: { title: "Laporan" },
            element: <StaffLaporanPage />,
          },
        ],
      },
    ],
  },
];
