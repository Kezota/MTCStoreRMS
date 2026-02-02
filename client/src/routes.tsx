import AppLayout from "./pages/AppLayout";
import HomePage from "./pages/HomePage";
import { LoginPage, DashboardLayout, DashboardPage } from "./pages";
import { ProtectedRoute } from "./components";

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
        ],
      },
    ],
  },
];
