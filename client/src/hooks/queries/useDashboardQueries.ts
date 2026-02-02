import { useQuery } from "@tanstack/react-query";
import { API } from "../../lib/API";
import { QUERY_KEYS } from "../../lib/queryKeys";
import type { DashboardStats, DashboardResponse } from "../../lib/types";

export const useGetDashboardStats = () => {
  return useQuery<DashboardStats>({
    queryKey: QUERY_KEYS.dashboard.stats(),
    queryFn: async () => {
      const response = await API.get<DashboardResponse>("/dashboard/stats");
      return response.data.data;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};
