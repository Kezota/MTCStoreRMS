import { useMutation, useQueryClient } from "@tanstack/react-query";
import { API } from "@/lib/API";
import { QUERY_KEYS } from "@/lib/queryKeys";
import { showToast } from "@/lib/toast";
import type {
  CreateInventoryRequest,
  UpdateInventoryRequest,
  InventoryItem,
  SuccessResponse,
} from "@/lib/types";

export const useCreateInventoryMutation = () => {
  const queryClient = useQueryClient();

  return useMutation<
    SuccessResponse<InventoryItem>,
    unknown,
    CreateInventoryRequest
  >({
    mutationFn: async (payload) => {
      const response = await API.post<SuccessResponse<InventoryItem>>(
        "/inventory",
        payload,
      );
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.inventory.list(),
        exact: false,
      });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.penjualan.list(),
        exact: false,
      });
      showToast.success(data.message || "Inventory berhasil ditambahkan");
    },
    onError: (error: any) => {
      showToast.error(
        error?.response?.data?.message || "Gagal menambahkan inventory",
      );
    },
  });
};

export const useCreateBulkInventoryMutation = () => {
  const queryClient = useQueryClient();

  return useMutation<
    SuccessResponse<InventoryItem[]>,
    unknown,
    { items: CreateInventoryRequest[] }
  >({
    mutationFn: async (payload) => {
      const response = await API.post<SuccessResponse<InventoryItem[]>>(
        "/inventory/bulk",
        payload,
      );
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.inventory.list(),
        exact: false,
      });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.penjualan.list(),
        exact: false,
      });
      showToast.success(data.message || "Bulk inventory berhasil ditambahkan");
    },
    onError: (error: any) => {
      showToast.error(
        error?.response?.data?.message || "Gagal menambahkan bulk inventory",
      );
    },
  });
};

export const useUpdateInventoryMutation = () => {
  const queryClient = useQueryClient();

  return useMutation<
    SuccessResponse<InventoryItem>,
    unknown,
    { id: number; payload: UpdateInventoryRequest }
  >({
    mutationFn: async ({ id, payload }) => {
      const response = await API.patch<SuccessResponse<InventoryItem>>(
        `/inventory/${id}`,
        payload,
      );
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.inventory.list(),
        exact: false,
      });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.penjualan.list(),
        exact: false,
      });
      showToast.success(data.message || "Inventory berhasil diperbarui");
    },
    onError: (error: any) => {
      showToast.error(
        error?.response?.data?.message || "Gagal memperbarui inventory",
      );
    },
  });
};

export const useDeleteInventoryMutation = () => {
  const queryClient = useQueryClient();

  return useMutation<SuccessResponse<null>, unknown, number>({
    mutationFn: async (id) => {
      const response = await API.delete<SuccessResponse<null>>(
        `/inventory/${id}`,
      );
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.inventory.list(),
        exact: false,
      });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.penjualan.list(),
        exact: false,
      });
      showToast.success(data.message || "Inventory berhasil dihapus");
    },
    onError: (error: any) => {
      showToast.error(
        error?.response?.data?.message || "Gagal menghapus inventory",
      );
    },
  });
};
