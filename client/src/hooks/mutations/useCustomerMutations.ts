import { useMutation, useQueryClient } from "@tanstack/react-query";
import { API } from "@/lib/API";
import { QUERY_KEYS } from "@/lib/queryKeys";
import { showToast } from "@/lib/toast";
import type {
  CreateCustomerRequest,
  UpdateCustomerRequest,
  Customer,
  SuccessResponse,
} from "@/lib/types";

export const useCreateCustomerMutation = () => {
  const queryClient = useQueryClient();

  return useMutation<SuccessResponse<Customer>, unknown, CreateCustomerRequest>(
    {
      mutationFn: async (payload) => {
        const response = await API.post<SuccessResponse<Customer>>(
          "/customers",
          payload,
        );
        return response.data;
      },
      onSuccess: (data) => {
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.customers.list(),
          exact: false,
        });
        showToast.success(data.message || "Customer berhasil ditambahkan");
      },
      onError: (error: any) => {
        showToast.error(
          error?.response?.data?.message || "Gagal menambahkan customer",
        );
      },
    },
  );
};

export const useUpdateCustomerMutation = () => {
  const queryClient = useQueryClient();

  return useMutation<
    SuccessResponse<Customer>,
    unknown,
    { id: number; payload: UpdateCustomerRequest }
  >({
    mutationFn: async ({ id, payload }) => {
      const response = await API.patch<SuccessResponse<Customer>>(
        `/customers/${id}`,
        payload,
      );
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.customers.list(),
        exact: false,
      });
      showToast.success(data.message || "Customer berhasil diperbarui");
    },
    onError: (error: any) => {
      showToast.error(
        error?.response?.data?.message || "Gagal memperbarui customer",
      );
    },
  });
};

export const useDeleteCustomerMutation = () => {
  const queryClient = useQueryClient();

  return useMutation<SuccessResponse<null>, unknown, number>({
    mutationFn: async (id) => {
      const response = await API.delete<SuccessResponse<null>>(
        `/customers/${id}`,
      );
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.customers.list(),
        exact: false,
      });
      showToast.success(data.message || "Customer berhasil dihapus");
    },
    onError: (error: any) => {
      showToast.error(
        error?.response?.data?.message || "Gagal menghapus customer",
      );
    },
  });
};
