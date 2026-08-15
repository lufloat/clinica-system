import type { Vertical, VerticalTheme } from "../utils/useCurrentUser";

/**
 * Chave do tema → CSS custom property de styles/variables.css.
 * Adicionar uma cor à marca é uma linha aqui e uma no tema da vertical.
 */
const CSS_VARS: Record<keyof VerticalTheme, string | null> = {
  primary: "--primary",
  primaryDark: "--primary-dark",
  sidebar: "--sidebar",
  logo: null, // não é cor: consumido direto pela Sidebar
};

/**
 * Repinta o sistema com a marca da vertical.
 *
 * variables.css define --primary como indireção sobre --indigo-600, então
 * sobrescrever no :root em runtime propaga para todo o CSS existente.
 * Sem vertical (admin geral), remove as sobrescritas e o tema padrão volta.
 */
export function applyVerticalTheme(vertical: Vertical | null) {
  const root = document.documentElement;
  const theme = vertical?.theme ?? {};

  (Object.keys(CSS_VARS) as (keyof VerticalTheme)[]).forEach((key) => {
    const cssVar = CSS_VARS[key];
    if (!cssVar) return;

    const value = theme[key];
    if (value) {
      root.style.setProperty(cssVar, value);
    } else {
      root.style.removeProperty(cssVar);
    }
  });
}
