import { Link, useNavigate, useLocation, Outlet } from "react-router-dom";
import { LogOut, Smartphone, Menu, X } from "lucide-react";
import { showToast } from "../lib/toast";
import { useState } from "react";
import { useGetCurrentUser } from "../hooks/queries";

export const DashboardLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { data: currentUser } = useGetCurrentUser(true);

  const handleLogout = () => {
    localStorage.removeItem("token");
    showToast.success("Logout berhasil");
    navigate("/login");
  };

  const navLinks = [
    { name: "Dashboard", path: "/dashboard" },
    { name: "Inventory", path: "/dashboard/inventory" },
    { name: "Penjualan", path: "/dashboard/penjualan" },
    { name: "Laporan", path: "/dashboard/laporan" },
    { name: "Stock Opname", path: "/dashboard/stock-opname" },
    { name: "Staff", path: "/dashboard/staff" },
  ];

  const visibleNavLinks =
    currentUser?.role === "ADMIN"
      ? navLinks
      : navLinks.filter((link) => link.path !== "/dashboard/staff");

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-2 sm:px-4">
          <div className="flex items-center justify-between h-12 sm:h-16">
            {/* Logo */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              <img
                src="/logo mtc.jpeg"
                alt="Logo"
                className="w-8 h-8 object-cover rounded-lg"
              />
              <span className="text-base sm:text-xl font-bold text-gray-900">
                MTC Store
              </span>
            </div>

            {/* Navigation Links - Desktop */}
            <div className="hidden md:flex items-center gap-1">
              {visibleNavLinks.map((link) => {
                const isActive = location.pathname === link.path;
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`px-4 py-2 rounded-lg transition font-medium ${
                      isActive
                        ? "bg-blue-50 text-blue-600 border border-blue-200"
                        : "text-gray-700 hover:bg-gray-100 hover:text-blue-600"
                    }`}
                  >
                    {link.name}
                  </Link>
                );
              })}
            </div>

            {/* Right Side - Logout & Mobile Menu Button */}
            <div className="flex items-center gap-2">
              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-1.5 sm:py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition font-medium text-xs sm:text-sm"
              >
                <LogOut className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden p-1.5 rounded-lg hover:bg-gray-100 transition"
              >
                {isMobileMenuOpen ? (
                  <X className="w-5 h-5 text-gray-700" />
                ) : (
                  <Menu className="w-5 h-5 text-gray-700" />
                )}
              </button>
            </div>
          </div>

          {/* Mobile Navigation Menu */}
          {isMobileMenuOpen && (
            <div className="md:hidden pb-2 border-t border-gray-200 pt-2">
              <div className="flex flex-col gap-0.5">
                {visibleNavLinks.map((link) => {
                  const isActive = location.pathname === link.path;
                  return (
                    <Link
                      key={link.path}
                      to={link.path}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`px-3 py-2 rounded-lg text-xs transition font-medium ${
                        isActive
                          ? "bg-blue-50 text-blue-600 border border-blue-200"
                          : "text-gray-700 hover:bg-gray-100 hover:text-blue-600"
                      }`}
                    >
                      {link.name}
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
};
