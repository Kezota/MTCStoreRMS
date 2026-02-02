import { useMutation, useQueryClient } from "@tanstack/react-query";
import { API } from "../../lib/API";
import { QUERY_KEYS } from "../../lib/queryKeys";
import type {
  CreateUserRequest,
  UpdateUserRequest,
  SuccessResponse,
  User,
} from "../../lib/types";

export const useCreateUserMutation = () => {
  const queryClient = useQueryClient();

  return useMutation<SuccessResponse<User>, unknown, CreateUserRequest>({
    mutationFn: async (payload) => {
      const response = await API.post<SuccessResponse<User>>(
        "/auth/users",
        payload,
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.users.list() });
    },
  });
};

export const useUpdateUserMutation = () => {
  const queryClient = useQueryClient();

  return useMutation<
    SuccessResponse<User>,
    unknown,
    { id: number; payload: UpdateUserRequest }
  >({
    mutationFn: async ({ id, payload }) => {
      const response = await API.patch<SuccessResponse<User>>(
        `/auth/users/${id}`,
        payload,
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.users.list() });
    },
  });
};

export const useDeleteUserMutation = () => {
  const queryClient = useQueryClient();

  return useMutation<SuccessResponse<null>, unknown, number>({
    mutationFn: async (id) => {
      const response = await API.delete<SuccessResponse<null>>(
        `/auth/users/${id}`,
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.users.list() });
    },
  });
};
