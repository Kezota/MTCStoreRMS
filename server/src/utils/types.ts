// Enums
export enum Role {
  ADMIN = "ADMIN",
  STAFF = "STAFF",
}

export enum Status {
  READY = "READY",
  TERJUAL = "TERJUAL",
}

// User types
export interface User {
  id: number;
  username: string;
  password: string;
  nama: string;
  role: Role;
  createdAt: Date;
}

export interface UserWithoutPassword extends Omit<User, "password"> {}

export interface CreateUserInput {
  username: string;
  password: string;
  nama: string;
  role?: Role;
}

export interface UpdateUserInput {
  username?: string;
  password?: string;
  nama?: string;
  role?: Role;
}

// InventoryHP types
export interface InventoryHP {
  id: number;
  tanggalMasuk: Date;
  imei: string;
  brand: string;
  namaHP: string;
  warna: string | null;
  modalAwal: number;
  cashback: number | null;
  modalFinal: number;
  status: Status;
  createdAt: Date;
}

export interface CreateInventoryInput {
  tanggalMasuk: string; // YYYY-MM-DD format
  imei: string;
  brand: string;
  namaHP: string;
  warna?: string | null;
  modalAwal: number;
  cashback?: number | null;
  modalFinal?: number;
}

export interface UpdateInventoryInput {
  tanggalMasuk?: string; // YYYY-MM-DD format
  imei?: string;
  brand?: string;
  namaHP?: string;
  warna?: string | null;
  modalAwal?: number;
  cashback?: number | null;
  modalFinal?: number;
  status?: Status;
}

// Penjualan (Sales) types
export interface Penjualan {
  id: number;
  tanggal: Date;
  inventoryId: number;
  hargaJual: number;
  diskon: number | null;
  profit: number;
  metodeBayar: string;
  keterangan: string | null;
  createdAt: Date;
}

export interface CreatePenjualanInput {
  tanggal: string; // YYYY-MM-DD format
  inventoryId: number;
  hargaJual: number;
  diskon?: number | null;
  profit: number;
  metodeBayar: string;
  keterangan?: string | null;
}

export interface UpdatePenjualanInput {
  tanggal?: string; // YYYY-MM-DD format
  inventoryId?: number;
  hargaJual?: number;
  diskon?: number | null;
  profit?: number;
  metodeBayar?: string;
  keterangan?: string | null;
}

// Query/Filter types
export interface InventoryQueryParams {
  status?: Status;
  brand?: string;
  search?: string;
  warna?: string;
  minModalAwal?: string;
  maxModalAwal?: string;
  minModalFinal?: string;
  maxModalFinal?: string;
  startDate?: string;
  endDate?: string;
  page?: string;
  limit?: string;
  sortBy?: string;
  sortOrder?: string;
}

export interface PaginationParams {
  page: number;
  limit?: number;
  skip: number;
}

export interface SortParams {
  field: string;
  order: "asc" | "desc";
}
