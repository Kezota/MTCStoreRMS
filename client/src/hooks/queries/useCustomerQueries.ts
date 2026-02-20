import { useQuery } from "@tanstack/react-query";
import { API } from "@/lib/API";
import { QUERY_KEYS } from "@/lib/queryKeys";
import type { CustomerResponse, CustomerPurchasesResponse } from "@/lib/types";

interface UseGetCustomersParams {
  page?: number;
  limit?: number;
  search?: string;
  nomorHP?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export const useGetCustomers = (params: UseGetCustomersParams = {}) => {
  return useQuery({
    queryKey: [QUERY_KEYS.customers.list(), params],
    queryFn: async () => {
      const response = await API.get<CustomerResponse>("/customers", {
        params: {
          page: params.page || 1,
          limit: params.limit,
          search: params.search,
          nomorHP: params.nomorHP,
          sortBy: params.sortBy || "createdAt",
          sortOrder: params.sortOrder || "desc",
        },
      });
      return response.data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

interface UseGetCustomerPurchasesParams {
  page?: number;
  limit?: number;
  search?: string;
  nomorHP?: string;
  namaHP?: string;
  imei?: string;
  brand?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export const useGetCustomerPurchases = (
  params: UseGetCustomerPurchasesParams = {},
) => {
  return useQuery({
    queryKey: [QUERY_KEYS.customers.purchases(), params],
    queryFn: async () => {
      const response = await API.get<CustomerPurchasesResponse>(
        "/customers/purchases",
        {
          params: {
            page: params.page || 1,
            limit: params.limit,
            search: params.search,
            nomorHP: params.nomorHP,
            namaHP: params.namaHP,
            imei: params.imei,
            brand: params.brand,
            sortBy: params.sortBy || "tanggal",
            sortOrder: params.sortOrder || "desc",
          },
        },
      );
      return response.data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};
