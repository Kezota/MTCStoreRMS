import type { ReactNode } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useGetCurrentUser } from "../hooks/queries";
import { Loader2 } from "lucide-react";

interface AdminRouteProps {
  children?: ReactNode;
}

export const AdminRoute = ({ children }: AdminRouteProps) => {
  const token = localStorage.getItem("token");
  const { data: user, isLoading } = useGetCurrentUser(!!token);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto" />
          <p className="text-gray-600">Memuat...</p>
        </div>
      </div>
    );
  }

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== "ADMIN") {
    return <Navigate to="/staff/dashboard" replace />;
  }

  return children ? <>{children}</> : <Outlet />;
};
