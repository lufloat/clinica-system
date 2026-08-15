import type { ComponentType, ReactElement } from "react";

/**
 * Telas exclusivas de uma vertical.
 *
 * Adicionar uma vertical com telas próprias (fisioterapia, psicologia) é uma
 * entrada aqui e uma linha na tabela Vertical — nada de `if` espalhado.
 *
 * O `module` é o que controla a visibilidade: como user_permission_map já
 * interseca cargo × vertical, basta registrar a rota e o menu que ela aparece
 * só para quem deve. Nenhum componente precisa saber qual é a vertical atual.
 */
export type VerticalScreen = {
  path: string;
  module: string;
  label: string;
  Icon: ComponentType;
  element: ReactElement;
};

// Vazio desde que o Odontograma saiu do produto. A estrutura fica: é aqui
// que entra a próxima tela exclusiva de uma vertical.
export const VERTICAL_SCREENS: Record<string, VerticalScreen[]> = {};

/** Todas as telas de vertical, achatadas. */
export const ALL_VERTICAL_SCREENS: VerticalScreen[] = Object.values(
  VERTICAL_SCREENS
).flat();
