import { useMutation, useQueryClient } from "@tanstack/react-query";
import { API } from "@/lib/API";
import { QUERY_KEYS } from "@/lib/queryKeys";
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
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.penjualan.list(),
        exact: false,
      });
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
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.penjualan.list(),
        exact: false,
      });
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
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.penjualan.list(),
        exact: false,
      });
    },
  });
};
