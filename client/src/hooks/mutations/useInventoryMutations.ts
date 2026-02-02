import { useMutation, useQueryClient } from "@tanstack/react-query";
import { API } from "@/lib/API";
import { QUERY_KEYS } from "@/lib/queryKeys";
import type {
  CreateInventoryRequest,
  UpdateInventoryRequest,
  InventoryItem,
  SuccessResponse,
} from "@/lib/types";

export const useCreateInventoryMutation = () => {
  const queryClient = useQueryClient();

  return useMutation<SuccessResponse<InventoryItem>, unknown, CreateInventoryRequest>(
    {
      mutationFn: async (payload) => {
        const response = await API.post<SuccessResponse<InventoryItem>>(
          "/inventory",
          payload,
        );
        return response.data;
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.inventory.list() });
      },
    },
  );
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.inventory.list() });
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.inventory.list() });
    },
  });
};
