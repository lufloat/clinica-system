import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";

import Sidebar from "./Sidebar";
import Header from "./Header";

import { useCurrentUser } from "../../utils/useCurrentUser";
import { applyVerticalTheme } from "../../verticals/theme";

function MainLayout() {
  const { user } = useCurrentUser();

  // retraída (rail só de ícones) no desktop — lembra a escolha entre visitas
  const [collapsed, setCollapsed] = useState(
    () => localStorage.getItem("sidebar-collapsed") === "1"
  );
  // gaveta aberta no mobile
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem("sidebar-collapsed", collapsed ? "1" : "0");
  }, [collapsed]);

  // marca da vertical aplicada no :root — vale para todo o CSS existente
  useEffect(() => {
    applyVerticalTheme(user?.vertical ?? null);
  }, [user?.vertical]);

  const classes = [
    "layout",
    collapsed ? "sidebar-collapsed" : "",
    mobileOpen ? "sidebar-mobile-open" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={classes}>
      <Sidebar
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed((v) => !v)}
        onNavigate={() => setMobileOpen(false)}
      />

      {mobileOpen && (
        <div
          className="sidebar-backdrop"
          onClick={() => setMobileOpen(false)}
          aria-hidden
        />
      )}

      <div className="content">
        <Header onOpenMenu={() => setMobileOpen(true)} />

        <main>
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default MainLayout;
