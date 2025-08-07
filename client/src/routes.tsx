import AppLayout from "./pages/AppLayout";
import HomePage from "./pages/HomePage";

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
    ],
  },
];
