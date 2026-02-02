export const QUERY_KEYS = {
  auth: {
    all: ["auth"] as const,
    currentUser: () => [...QUERY_KEYS.auth.all, "currentUser"] as const,
    login: () => [...QUERY_KEYS.auth.all, "login"] as const,
  },
  dashboard: {
    all: ["dashboard"] as const,
    stats: () => [...QUERY_KEYS.dashboard.all, "stats"] as const,
  },
};
