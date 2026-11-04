import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { API } from "@/lib/API";
import { queryKeys } from "@/lib/queryKeys";
import type { PenjualanResponse } from "@/lib/types";

interface GetPenjualanParams {
  page?: number;
  limit?: number;
  inventoryId?: string;
  metodeBayar?: string;
  search?: string;
  minHargaJual?: string;
  maxHargaJual?: string;
  minProfit?: string;
  maxProfit?: string;
  startDate?: string;
  endDate?: string;
  sortBy?: string;
  sortOrder?: string;
}

export const useGetPenjualan = (params: GetPenjualanParams = {}) => {
  return useQuery<PenjualanResponse>({
    queryKey: [...queryKeys.penjualan.list(), params],
    queryFn: async () => {
      const response = await API.get("/penjualan", { params });
      return response.data;
    },
    // Keep the old rows on screen while a new sort/filter loads
    placeholderData: keepPreviousData,
    staleTime: 2 * 60 * 1000,
  });
};
