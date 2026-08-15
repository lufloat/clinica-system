import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";

import { useCurrentUser, can } from "../utils/useCurrentUser";

function Loader() {
  return <div className="route-loader">Carregando…</div>;
}

/**
 * Porta de entrada das rotas protegidas: exige token, e força a troca de
 * senha no 1º acesso. `allowPasswordChange` libera a própria tela de troca.
 */
export function RequireAuth({
  children,
  allowPasswordChange = false,
}: {
  children: ReactNode;
  allowPasswordChange?: boolean;
}) {
  const token = localStorage.getItem("token");
  const { user, loading } = useCurrentUser();

  if (!token) return <Navigate to="/login" replace />;
  if (loading) return <Loader />;

  if (user?.must_change_password && !allowPasswordChange) {
    return <Navigate to="/trocar-senha" replace />;
  }

  return <>{children}</>;
}

/** Bloqueia a rota se o usuário não pode visualizar o módulo. */
export function RequirePermission({
  module,
  children,
}: {
  module: string;
  children: ReactNode;
}) {
  const { user, loading } = useCurrentUser();

  if (loading) return <Loader />;
  if (!can(user, module, "view")) return <Navigate to="/sem-acesso" replace />;

  return <>{children}</>;
}

/** Somente administradores (grupo Administração). */
export function RequireAdmin({ children }: { children: ReactNode }) {
  const { user, loading } = useCurrentUser();

  if (loading) return <Loader />;
  if (!user?.is_admin) return <Navigate to="/sem-acesso" replace />;

  return <>{children}</>;
}
