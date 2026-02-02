import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Smartphone,
  Package,
  TrendingUp,
  Shield,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { useGetCurrentUser } from "../hooks/queries";

function HomePage() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const { data: user, isLoading } = useGetCurrentUser(!!token);

  useEffect(() => {
    if (user) {
      navigate("/dashboard");
    }
  }, [user, navigate]);

  // Show loading while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto" />
          <p className="text-gray-600">Memuat...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          {/* Logo & Title */}
          <div className="space-y-4">
            <div className="flex justify-center">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                <Smartphone className="w-10 h-10 text-white" />
              </div>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900">
              MTC Store RMS
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 max-w-2xl mx-auto">
              Sistem Manajemen Toko HP yang Modern & Efisien
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-6 mt-12">
            <div className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4 mx-auto">
                <Package className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="font-semibold text-lg mb-2">
                Manajemen Inventory
              </h3>
              <p className="text-gray-600 text-sm">
                Kelola stok HP dengan mudah, tracking IMEI, dan update harga
                real-time
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition">
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4 mx-auto">
                <TrendingUp className="w-6 h-6 text-indigo-600" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Laporan Penjualan</h3>
              <p className="text-gray-600 text-sm">
                Tracking penjualan, profit otomatis, dan laporan lengkap
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4 mx-auto">
                <Shield className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Keamanan Terjamin</h3>
              <p className="text-gray-600 text-sm">
                Sistem autentikasi dan role-based access untuk keamanan data
              </p>
            </div>
          </div>

          {/* CTA Button */}
          <div className="mt-12">
            <button
              onClick={() => navigate("/login")}
              className="cursor-pointer group bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold px-8 py-4 rounded-xl shadow-lg hover:shadow-xl transition duration-200 flex items-center gap-3 mx-auto"
            >
              Masuk ke Sistem
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          {/* Footer Info */}
          <div className="mt-16 pt-8 border-t border-gray-200">
            <p className="text-gray-500 text-sm">
              Dibuat khusus untuk membantu pengelolaan toko HP dengan lebih
              efisien
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HomePage;
