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

export interface ErrorResponse {
  status: string;
  message: string;
}
