export interface SuccessResponse<T> {
  status: string;
  message: string;
  data: T;
}

export interface ErrorResponse {
  status: string;
  statusCode: number;
  message: string;
  stack?: string;
}

// Authentication Types
export interface User {
  id: number;
  username: string;
  nama: string;
  role: "ADMIN" | "STAFF";
  createdAt: string;
}

export interface UsersResponse {
  status: string;
  results: number;
  data: User[];
}

export interface CreateUserRequest {
  username: string;
  password: string;
  nama: string;
  role: "ADMIN" | "STAFF";
}

export interface UpdateUserRequest {
  username?: string;
  password?: string;
  nama?: string;
  role?: "ADMIN" | "STAFF";
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  status: string;
  message: string;
  data: { user: User; token: string };
}

export interface AuthResponse {
  status: string;
  message: string;
  data: User;
}

// Dashboard Types
export interface DashboardStats {
  totalReady: number;
  soldThisMonth: number;
  profitThisMonth: number;
  salesThisMonth: number;
}

export interface DashboardResponse {
  status: string;
  data: DashboardStats;
}

// Inventory Types
export interface InventoryItem {
  id: number;
  tanggalMasuk: string;
  imei: string;
  brand: string;
  namaHP: string;
  warna?: string;
  modalAwal: string;
  cashback?: string;
  modalFinal: string;
  status: "READY" | "TERJUAL";
  createdAt: string;
  penjualan?: Array<{
    id: number;
    tanggal: string;
    hargaJual: string;
    diskon?: string;
    profit: string;
    metodeBayar: string;
    keterangan?: string;
    createdAt: string;
  }>;
}

export interface InventoryResponse {
  status: string;
  results: number;
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  data: InventoryItem[];
}

export interface CreateInventoryRequest {
  tanggalMasuk: string;
  imei: string;
  brand: string;
  namaHP: string;
  warna?: string;
  modalAwal: number;
  cashback?: number | null;
  modalFinal?: number;
  status?: "READY" | "TERJUAL";
}

export interface UpdateInventoryRequest {
  tanggalMasuk?: string;
  imei?: string;
  brand?: string;
  namaHP?: string;
  warna?: string;
  modalAwal?: number;
  cashback?: number | null;
  modalFinal?: number;
  status?: "READY" | "TERJUAL";
}

export interface ErrorResponse {
  status: string;
  message: string;
}
