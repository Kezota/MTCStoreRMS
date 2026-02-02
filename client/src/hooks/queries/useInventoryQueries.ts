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
    queryKey: [queryKeys.inventory.list, params],
    queryFn: async () => {
      const response = await API.get("/inventory", { params });
      return response.data;
    },
    staleTime: 2 * 60 * 1000,
  });
};
