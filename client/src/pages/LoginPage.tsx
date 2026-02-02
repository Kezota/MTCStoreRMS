import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLoginMutation } from "../hooks/mutations";
import { AlertCircle, Eye, EyeOff, Loader2 } from "lucide-react";
import { Toaster } from "react-hot-toast";
import { showToast } from "../lib/toast";
import { isAxiosError } from "axios";

export const LoginPage = () => {
  const navigate = useNavigate();
  const loginMutation = useLoginMutation();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!username.trim() || !password.trim()) {
      setError("Username dan password tidak boleh kosong");
      return;
    }

    loginMutation.mutate(
      { username, password },
      {
        onSuccess: (data) => {
          showToast.success(
            data.message || `Selamat datang, ${data.data.user.nama}!`,
          );
          setTimeout(() => navigate("/"), 500);
        },
        onError: (error: unknown) => {
          let errorMessage = "Login gagal. Silakan coba lagi.";

          if (isAxiosError(error) && error.response?.data) {
            const data = error.response.data as { message?: string };
            errorMessage = data.message || errorMessage;
          }

          setError(errorMessage);
          showToast.error(errorMessage);
        },
      },
    );
  };

  return (
    <>
      <Toaster />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Card */}
          <div className="bg-white rounded-lg shadow-xl p-8 space-y-6">
            {/* Header */}
            <div className="text-center space-y-2">
              <div className="flex justify-center mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-xl">📱</span>
                </div>
              </div>
              <h1 className="text-3xl font-bold text-gray-900">MTC Store</h1>
              <p className="text-gray-500 text-sm">Sistem Manajemen Toko HP</p>
            </div>

            {/* Error Alert */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Username Input */}
              <div className="space-y-2">
                <label
                  htmlFor="username"
                  className="block text-sm font-medium text-gray-700"
                >
                  Username
                </label>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Masukkan username"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  disabled={loginMutation.isPending}
                />
              </div>

              {/* Password Input */}
              <div className="space-y-2">
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700"
                >
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Masukkan password"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    disabled={loginMutation.isPending}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    disabled={loginMutation.isPending}
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Login Button */}
              <button
                type="submit"
                disabled={loginMutation.isPending || !username || !password}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-400 text-white font-semibold py-2.5 rounded-lg transition duration-200 flex items-center justify-center gap-2"
              >
                {loginMutation.isPending && (
                  <Loader2 className="w-5 h-5 animate-spin" />
                )}
                {loginMutation.isPending ? "Sedang login..." : "Login"}
              </button>
            </form>

            {/* Footer */}
            <div className="text-center text-xs text-gray-500 pt-4 border-t border-gray-200">
              <p>Gunakan kredensial yang diberikan oleh administrator</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
