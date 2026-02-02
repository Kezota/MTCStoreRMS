import { useQuery } from "@tanstack/react-query";
import { API } from "@/lib/API";
import { queryKeys } from "@/lib/queryKeys";

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
  data: InventoryItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface InventoryModalsResponse {
  status: string;
  results: number;
  data: {
    namaHP: string;
    modals: string[];
  };
}

interface GetInventoryParams {
  page?: number;
  limit?: number;
  status?: "READY" | "TERJUAL";
  brand?: string;
  search?: string;
  imei?: string;
  namaHP?: string;
  warna?: string;
  minModalAwal?: string;
  maxModalAwal?: string;
  minModalFinal?: string;
  maxModalFinal?: string;
  startDate?: string;
  endDate?: string;
  sortBy?: string;
  sortOrder?: string;
}

export const useGetInventory = (params: GetInventoryParams = {}) => {
  return useQuery<InventoryResponse>({
    queryKey: [...queryKeys.inventory.list(), params],
    queryFn: async () => {
      const response = await API.get("/inventory", { params });
      return response.data;
    },
    staleTime: 2 * 60 * 1000,
  });
};

export const useGetInventoryModalsByNamaHP = (namaHP?: string) => {
  return useQuery<InventoryModalsResponse>({
    queryKey: queryKeys.inventory.modalsByNama(namaHP || ""),
    queryFn: async () => {
      const response = await API.get("/inventory/by-nama", {
        params: { namaHP },
      });
      return response.data;
    },
    enabled: Boolean(namaHP && namaHP.trim()),
    staleTime: 2 * 60 * 1000,
  });
};

export const useGetNamaHPByBrand = (brand?: string) => {
  return useQuery<{
    status: string;
    results: number;
    data: { brand: string; namaHPs: string[] };
  }>({
    queryKey: ["inventory", "namaByBrand", brand],
    queryFn: async () => {
      const response = await API.get("/inventory/nama-by-brand", {
        params: { brand },
      });
      return response.data;
    },
    enabled: Boolean(brand && brand.trim()),
    staleTime: 2 * 60 * 1000,
  });
};
