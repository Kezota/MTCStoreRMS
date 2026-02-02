import { useQuery } from "@tanstack/react-query";
import { API } from "../../lib/API";
import { QUERY_KEYS } from "../../lib/queryKeys";
import type { User, AuthResponse } from "../../lib/types";

export const useGetCurrentUser = (enabled = true) => {
  return useQuery<User>({
    queryKey: QUERY_KEYS.auth.currentUser(),
    queryFn: async () => {
      const response = await API.get<AuthResponse>("/auth/me");
      return response.data.data;
    },
    enabled,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};
