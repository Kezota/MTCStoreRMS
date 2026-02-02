import { useQuery } from "@tanstack/react-query";
import { API } from "../../lib/API";
import { QUERY_KEYS } from "../../lib/queryKeys";
import type { UsersResponse, User } from "../../lib/types";

export const useGetUsers = () => {
  return useQuery<User[]>({
    queryKey: QUERY_KEYS.users.list(),
    queryFn: async () => {
      const response = await API.get<UsersResponse>("/auth/users");
      return response.data.data;
    },
    staleTime: 2 * 60 * 1000,
  });
};
