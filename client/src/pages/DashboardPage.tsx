import { useNavigate } from "react-router-dom";
import {
  Package,
  ShoppingCart,
  FileText,
  Users,
  TrendingUp,
  Smartphone,
  DollarSign,
  BarChart3,
  Loader2,
} from "lucide-react";
import { useGetDashboardStats } from "../hooks/queries";
import { formatRupiah } from "../lib/utils";

export const DashboardPage = () => {
  const navigate = useNavigate();
  const { data: stats, isLoading } = useGetDashboardStats();

  const navigationCards = [
    {
      title: "Inventory",
      description: "Kelola stok HP, update harga, dan tracking IMEI",
      icon: Package,
      gradient: "from-blue-500 via-blue-600 to-indigo-600",
      path: "/dashboard/inventory",
    },
    {
      title: "Penjualan",
      description: "Input transaksi penjualan dan tracking profit",
      icon: ShoppingCart,
      gradient: "from-green-500 via-green-600 to-emerald-600",
      path: "/dashboard/penjualan",
    },
    {
      title: "Laporan",
      description: "Lihat laporan penjualan dan analisis bisnis",
      icon: FileText,
      gradient: "from-purple-500 via-purple-600 to-pink-600",
      path: "/dashboard/laporan",
    },
    {
      title: "Staff",
      description: "Manajemen user dan akses sistem",
      icon: Users,
      gradient: "from-orange-500 via-orange-600 to-red-600",
      path: "/dashboard/staff",
    },
  ];

  const statsCards = [
    {
      label: "Total HP Ready",
      value: stats?.totalReady ?? 0,
      icon: Smartphone,
      gradient: "from-blue-500 to-cyan-500",
    },
    {
      label: "HP Terjual Bulan Ini",
      value: stats?.soldThisMonth ?? 0,
      icon: TrendingUp,
      gradient: "from-green-500 to-emerald-500",
    },
    {
      label: "Total Profit Bulan Ini",
      value: formatRupiah(stats?.profitThisMonth ?? 0),
      icon: DollarSign,
      gradient: "from-purple-500 to-pink-500",
    },
    {
      label: "Total Penjualan Bulan Ini",
      value: formatRupiah(stats?.salesThisMonth ?? 0),
      icon: BarChart3,
      gradient: "from-orange-500 to-red-500",
    },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto" />
          <p className="text-gray-600">Memuat data dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
          Dashboard
        </h1>
        <p className="text-sm sm:text-base text-gray-600 mt-1 sm:mt-2">
          Selamat datang di MTC Store Management System
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {statsCards.map((stat, index) => (
          <div
            key={index}
            className={`bg-gradient-to-br ${stat.gradient} rounded-lg sm:rounded-xl p-4 sm:p-6 shadow-lg hover:shadow-xl transition-all transform hover:scale-105`}
          >
            <div className="flex items-center justify-between text-white">
              <div>
                <p className="text-xs sm:text-sm text-white/80 font-medium">
                  {stat.label}
                </p>
                <p className="text-2xl sm:text-3xl font-bold mt-1 sm:mt-2">
                  {stat.value}
                </p>
              </div>
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white/20 backdrop-blur-sm rounded-lg sm:rounded-xl flex items-center justify-center">
                <stat.icon className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Navigation Cards */}
      <div>
        <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4">
          Menu Utama
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
          {navigationCards.map((card, index) => (
            <button
              key={index}
              onClick={() => navigate(card.path)}
              className="cursor-pointer group bg-white rounded-lg sm:rounded-xl p-4 sm:p-6 shadow-sm border border-gray-200 hover:shadow-md hover:border-blue-300 transition-all text-left"
            >
              <div
                className={`w-10 h-10 sm:w-14 sm:h-14 bg-gradient-to-br ${card.gradient} rounded-lg sm:rounded-xl flex items-center justify-center mb-3 sm:mb-4 group-hover:scale-110 transition-transform`}
              >
                <card.icon className="w-5 h-5 sm:w-7 sm:h-7 text-white" />
              </div>
              <h3 className="text-sm sm:text-lg font-semibold text-gray-900 mb-1 sm:mb-2">
                {card.title}
              </h3>
              <p className="text-xs sm:text-sm text-gray-600 hidden sm:block">
                {card.description}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Quick Info */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg sm:rounded-xl p-6 sm:p-8 text-white">
        <h3 className="text-xl sm:text-2xl font-bold mb-1 sm:mb-2">
          Sistem Siap Digunakan!
        </h3>
        <p className="text-sm sm:text-base text-blue-100">
          Pilih menu di atas untuk mulai mengelola inventory, penjualan, atau
          melihat laporan
        </p>
      </div>
    </div>
  );
};
