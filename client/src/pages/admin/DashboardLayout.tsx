import { Link, useNavigate, useLocation, Outlet } from "react-router-dom";
import { LogOut, Menu, X } from "lucide-react";
import { showToast } from "../../lib/toast";
import { useState } from "react";
import { useGetCurrentUser } from "../../hooks/queries";

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
    // { name: "Dashboard", path: "/dashboard" },
    { name: "Inventory", path: "/dashboard/inventory" },
    { name: "Penjualan", path: "/dashboard/penjualan" },
    { name: "Laporan", path: "/dashboard/laporan" },
    { name: "Stock Opname", path: "/dashboard/stock-opname" },
    { name: "Customer", path: "/dashboard/customers" },
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
        <div className="w-full mx-auto px-4 sm:px-8 lg:px-14 xl:px-20">
          <div className="flex items-center justify-between h-12 sm:h-16">
            {/* Logo */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              <img
                src="/logo mtc.jpeg"
                alt="Logo"
                className="w-10 h-4 object-cover"
              />
              <span className="text-base sm:text-xl font-bold text-gray-900">
                Store
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
                aria-label="Logout"
                title="Logout"
                className="flex h-8 sm:h-9 items-center justify-center gap-1.5 px-2 sm:px-2.5 rounded-lg border border-slate-200 text-slate-600 hover:border-red-200 hover:bg-red-50 hover:text-red-600 active:bg-red-100 transition font-medium text-sm"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                aria-label={isMobileMenuOpen ? "Tutup menu" : "Buka menu"}
                aria-expanded={isMobileMenuOpen}
                className="md:hidden -mr-1.5 flex min-h-9 min-w-9 items-center justify-center rounded-lg hover:bg-gray-100 active:bg-gray-200 transition"
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
            <div className="md:hidden pb-2 border-t border-gray-200 pt-1.5">
              <div className="flex flex-col gap-0.5">
                {visibleNavLinks.map((link) => {
                  const isActive = location.pathname === link.path;
                  return (
                    <Link
                      key={link.path}
                      to={link.path}
                      onClick={() => setIsMobileMenuOpen(false)}
                      aria-current={isActive ? "page" : undefined}
                      className={`flex items-center min-h-9 px-3 py-2 rounded-md text-sm transition ${
                        isActive
                          ? "bg-blue-600 text-white font-semibold shadow-sm"
                          : "text-gray-700 font-medium hover:bg-gray-100 active:bg-gray-200"
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
      <main className="w-full mx-auto px-4 py-4 sm:px-8 sm:py-5 lg:px-14 xl:px-20">
        <Outlet />
      </main>
    </div>
  );
};
