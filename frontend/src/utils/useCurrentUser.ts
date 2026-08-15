import { useEffect, useState } from "react";

import { getMe } from "../services/authService";

/** {módulo: [ações]} — ex.: { agenda: ["view","create"] } */
export type PermissionMap = Record<string, string[]>;

/** Marca da vertical. Vira CSS custom property em applyVerticalTheme. */
export type VerticalTheme = {
  primary?: string;
  primaryDark?: string;
  sidebar?: string;
  logo?: string;
};

/** Linha de produto do colaborador. Nulo = enxerga todas (admin geral). */
export type Vertical = {
  slug: string;
  name: string;
  modules: string[];
  labels: Record<string, string>;
  theme: VerticalTheme;
};

/** Profissional que o login representa (médico ou dentista). */
export type LinkedDoctor = {
  id: number;
  name: string;
  council: string;
  specialty: string;
};

export type CurrentUser = {
  username: string;
  email: string;
  role: string | null;
  is_admin: boolean;
  must_change_password: boolean;
  permissions: PermissionMap;
  vertical: Vertical | null;
  /** Áreas que ele pode escolher. Menos de duas = não há seletor a oferecer. */
  verticals: { slug: string; name: string }[];
  /** Preenchido = só enxerga os próprios atendimentos. */
  doctor: LinkedDoctor | null;
};

/**
 * true quando o usuário está restrito aos próprios atendimentos.
 *
 * Serve para não oferecer o que a API vai recusar — o seletor de
 * profissional, o botão de novo agendamento. Nunca é a única proteção: o
 * recorte de verdade acontece nas queries do backend (core/scoping.py).
 */
export function isScopedToOwnData(user: CurrentUser | null): boolean {
  return Boolean(user?.doctor);
}

/** true se o usuário pode fazer `action` no `module`. */
export function can(
  user: CurrentUser | null,
  module: string,
  action = "view"
): boolean {
  if (!user) return false;

  // A vertical recorta antes do cargo — inclusive para admin. Sem isto, um
  // administrador de odontologia veria os módulos da clínica médica.
  if (user.vertical && !user.vertical.modules.includes(module)) return false;

  if (user.is_admin) return true;
  return (user.permissions?.[module] ?? []).includes(action);
}

/**
 * Singular do rótulo, para títulos de coluna e botões.
 *
 * "Profissionais" → "Profissional"; "Médicos" → "Médico". Cortar só o "s"
 * final não serve: os plurais em -ais perdem a sílaba e viram "Profissionai".
 */
export function singularOf(plural: string): string {
  if (plural.endsWith("ais")) return `${plural.slice(0, -3)}al`;
  return plural.replace(/s$/, "");
}

/** Rótulo do módulo na vertical: "Médicos" vira "Dentistas" na odonto. */
export function labelFor(
  user: CurrentUser | null,
  module: string,
  fallback: string
): string {
  return user?.vertical?.labels?.[module] ?? fallback;
}

/**
 * Cache em nível de módulo: Sidebar e Header consomem o mesmo usuário,
 * mas só uma requisição a /me é disparada. O logout faz reload da página
 * (window.location), então o cache é naturalmente descartado.
 */
let cache: CurrentUser | null = null;
let inflight: Promise<CurrentUser> | null = null;

/** Descarta o cache — usado após a troca de senha, que muda o perfil. */
export function clearCurrentUserCache() {
  cache = null;
  inflight = null;
}

export function useCurrentUser(): {
  user: CurrentUser | null;
  loading: boolean;
} {
  const [user, setUser] = useState<CurrentUser | null>(cache);
  const [loading, setLoading] = useState<boolean>(!cache);

  useEffect(() => {
    if (cache) {
      setUser(cache);
      setLoading(false);
      return;
    }

    let active = true;
    setLoading(true);

    if (!inflight) {
      inflight = getMe();
    }

    inflight
      .then((data: CurrentUser) => {
        cache = data;
        if (active) {
          setUser(data);
          setLoading(false);
        }
      })
      .catch(() => {
        // token inválido/expirado — o axios trata o 401 (redireciona ao login)
        inflight = null;
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  return { user, loading };
}

/** "Dra. Helena Prado" → "HP"; "maria" → "MA". */
export function initialsOf(user: CurrentUser | null): string {
  const base = user?.username || user?.email || "";
  const parts = base
    .replace(/@.*/, "")
    .split(/[.\s_-]+/)
    .filter(Boolean);

  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }

  return base.slice(0, 2).toUpperCase() || "US";
}

/** Primeiro nome para a saudação: "Maria Eduarda" → "Maria". */
export function firstNameOf(user: CurrentUser | null): string {
  if (!user) return "";
  const base = user.username || user.email.replace(/@.*/, "");
  return base.split(/[.\s_-]+/).filter(Boolean)[0] ?? base;
}
