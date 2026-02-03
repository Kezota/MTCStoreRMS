import { useMutation, useQueryClient } from "@tanstack/react-query";
import { API } from "@/lib/API";
import { QUERY_KEYS } from "@/lib/queryKeys";
import { showToast } from "@/lib/toast";
import type {
  CreatePenjualanRequest,
  UpdatePenjualanRequest,
  PenjualanItem,
  SuccessResponse,
} from "@/lib/types";

export const useCreatePenjualanMutation = () => {
  const queryClient = useQueryClient();

  return useMutation<
    SuccessResponse<PenjualanItem>,
    unknown,
    CreatePenjualanRequest
  >({
    mutationFn: async (payload) => {
      const response = await API.post<SuccessResponse<PenjualanItem>>(
        "/penjualan",
        payload,
      );
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.penjualan.list(),
        exact: false,
      });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.inventory.list(),
        exact: false,
      });
      showToast.success(data.message || "Penjualan berhasil ditambahkan");
    },
    onError: (error: any) => {
      showToast.error(
        error?.response?.data?.message || "Gagal menambahkan penjualan",
      );
    },
  });
};

export const useUpdatePenjualanMutation = () => {
  const queryClient = useQueryClient();

  return useMutation<
    SuccessResponse<PenjualanItem>,
    unknown,
    { id: number; payload: UpdatePenjualanRequest }
  >({
    mutationFn: async ({ id, payload }) => {
      const response = await API.patch<SuccessResponse<PenjualanItem>>(
        `/penjualan/${id}`,
        payload,
      );
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.penjualan.list(),
        exact: false,
      });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.inventory.list(),
        exact: false,
      });
      showToast.success(data.message || "Penjualan berhasil diperbarui");
    },
    onError: (error: any) => {
      showToast.error(
        error?.response?.data?.message || "Gagal memperbarui penjualan",
      );
    },
  });
};

export const useDeletePenjualanMutation = () => {
  const queryClient = useQueryClient();

  return useMutation<SuccessResponse<null>, unknown, number>({
    mutationFn: async (id) => {
      const response = await API.delete<SuccessResponse<null>>(
        `/penjualan/${id}`,
      );
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.penjualan.list(),
        exact: false,
      });
      showToast.success(data.message || "Penjualan berhasil dihapus");
    },
    onError: (error: any) => {
      showToast.error(
        error?.response?.data?.message || "Gagal menghapus penjualan",
      );
    },
  });
};
