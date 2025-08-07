import { routes } from "@/routes";
import { useEffect } from "react";
import { useLocation, matchRoutes } from "react-router-dom";

interface RouteHandle {
  title?: string;
}

export function usePageTitle(defaultTitle = "Website") {
  const location = useLocation();

  useEffect(() => {
    const matches = matchRoutes(routes, location.pathname);
    const currentPage =
      (matches &&
        (matches[matches.length - 1]?.route as { handle?: RouteHandle })
          .handle) ||
      {};
    const title = currentPage.title || defaultTitle;
    document.title = title;
  }, [location.pathname, defaultTitle]);
}
