import { useMutation } from "@tanstack/react-query";
import { API } from "../../lib/API";
import type { LoginRequest, LoginResponse } from "../../lib/types";

export const useLoginMutation = () => {
  return useMutation<LoginResponse, unknown, LoginRequest>({
    mutationFn: async (credentials: LoginRequest) => {
      const response = await API.post<LoginResponse>(
        "/api/auth/login",
        credentials,
      );
      return response.data;
    },
    onSuccess: (data) => {
      // Store token in localStorage
      localStorage.setItem("token", data.data.token);
    },
  });
};
