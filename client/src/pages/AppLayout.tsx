import { Outlet } from "react-router-dom";
import { usePageTitle } from "@/hooks/usePageTitle";
import { useScrollToTop } from "@/hooks/useScrollToTop";

function AppLayout() {
  usePageTitle();
  useScrollToTop();

  return (
    <>
      <main>
        <Outlet />
      </main>
    </>
  );
}

export default AppLayout;
