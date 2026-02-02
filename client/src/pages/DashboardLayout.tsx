import { Link, useNavigate, useLocation, Outlet } from "react-router-dom";
import { LogOut, Smartphone, Menu, X } from "lucide-react";
import { showToast } from "../lib/toast";
import { useState } from "react";

export const DashboardLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
    { name: "Staff", path: "/dashboard/staff" },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <Smartphone className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">MTC Store</span>
            </div>

            {/* Navigation Links - Desktop */}
            <div className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => {
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
                className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition font-medium"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition"
              >
                {isMobileMenuOpen ? (
                  <X className="w-6 h-6 text-gray-700" />
                ) : (
                  <Menu className="w-6 h-6 text-gray-700" />
                )}
              </button>
            </div>
          </div>

          {/* Mobile Navigation Menu */}
          {isMobileMenuOpen && (
            <div className="md:hidden pb-3 border-t border-gray-200 pt-3">
              <div className="flex flex-col gap-1">
                {navLinks.map((link) => {
                  const isActive = location.pathname === link.path;
                  return (
                    <Link
                      key={link.path}
                      to={link.path}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`px-4 py-2.5 rounded-lg text-sm transition font-medium ${
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
