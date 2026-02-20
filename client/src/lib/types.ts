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

// Penjualan (Sales) Types
export interface PenjualanItem {
  id: number;
  tanggal: string;
  inventoryId: number;
  customerId?: number | null;
  hargaJual: string;
  diskon?: string;
  profit: string;
  metodeBayar: string;
  keterangan?: string;
  createdAt: string;
  inventory: InventoryItem;
  customer?: Customer | null;
  user?: {
    id: number;
    username: string;
    nama: string;
    role: string;
  } | null;
}

export interface PenjualanResponse {
  status: string;
  results: number;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  data: PenjualanItem[];
}

export interface CreatePenjualanRequest {
  tanggal: string;
  inventoryId: number;
  customerId?: number | null;
  customerNama?: string;
  customerNomorHP?: string;
  hargaJual: number;
  diskon?: number | null;
  profit: number;
  metodeBayar: string;
  keterangan?: string;
}

export interface UpdatePenjualanRequest {
  tanggal?: string;
  inventoryId?: number;
  customerId?: number | null;
  customerNama?: string;
  customerNomorHP?: string;
  hargaJual?: number;
  diskon?: number | null;
  profit?: number;
  metodeBayar?: string;
  keterangan?: string;
}
// Customer Types
export interface Customer {
  id: number;
  nama: string;
  nomorHP: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerResponse {
  status: string;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  data: Customer[];
}

export interface CreateCustomerRequest {
  nama: string;
  nomorHP?: string;
}

export interface UpdateCustomerRequest {
  nama?: string;
  nomorHP?: string;
}

// Customer Purchase Types (for purchases view)
export interface CustomerPurchase {
  id: number | null;
  tanggal: string | null;
  inventoryId: number | null;
  customerId: number;
  hargaJual: string | null;
  diskon?: string | null;
  profit: string | null;
  metodeBayar: string | null;
  keterangan?: string | null;
  createdAt: string;
  customer: Customer;
  inventory: InventoryItem | null;
}

export interface CustomerPurchasesResponse {
  status: string;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  data: CustomerPurchase[];
}
