import { useMutation, useQueryClient } from "@tanstack/react-query";
import { API } from "../../lib/API";
import type { LoginRequest, LoginResponse } from "../../lib/types";
import { QUERY_KEYS } from "../../lib/queryKeys";

export const useLoginMutation = () => {
  const queryClient = useQueryClient();

  return useMutation<LoginResponse, unknown, LoginRequest>({
    mutationFn: async (credentials: LoginRequest) => {
      // Clear old token first
      localStorage.removeItem("token");
      const response = await API.post<LoginResponse>(
        "/auth/login",
        credentials,
      );
      return response.data;
    },
    onSuccess: (data) => {
      // Store token in localStorage
      localStorage.setItem("token", data.data.token);

      // Keep auth cache in sync immediately to avoid stale role-based redirects.
      queryClient.setQueryData(QUERY_KEYS.auth.currentUser(), data.data.user);
    },
  });
};
