/** `color` pinta borda/badge; `soft` é o fundo do card, com texto escuro por cima. */
export const STATUS = {
  AGENDADA: { label: "Agendada", color: "#d97706", soft: "#fffbeb", ink: "#92400e" },
  FINALIZADA: { label: "Finalizada", color: "#059669", soft: "#ecfdf5", ink: "#065f46" },
  CANCELADA: { label: "Cancelada", color: "#e11d48", soft: "#fff1f2", ink: "#9f1239" },
} as const;

export type StatusKey = keyof typeof STATUS;

export const STATUS_KEYS = Object.keys(STATUS) as StatusKey[];

export function isStatusKey(value: string): value is StatusKey {
  return value in STATUS;
}

/** Cores de destaque por médico, atribuídas de forma estável a partir do id. */
const DOCTOR_COLORS = [
  "#6366f1", "#06b6d4", "#8b5cf6", "#ec4899",
  "#14b8a6", "#f97316", "#84cc16", "#0ea5e9",
];

export function doctorColor(doctorId: number): string {
  return DOCTOR_COLORS[doctorId % DOCTOR_COLORS.length];
}

/** Iniciais para o avatar: "Dra. Helena Prado" → "HP". */
export function initials(name: string): string {
  const parts = name
    .replace(/^(Dra?\.|Dr\.)\s*/i, "")
    .trim()
    .split(/\s+/);

  return (parts[0]?.[0] ?? "") + (parts.at(-1)?.[0] ?? "");
}

/** Faixa exibida na grade. Mais larga que o expediente para o hachurado aparecer. */
export const GRID_START_HOUR = 7;
export const GRID_END_HOUR = 19;
export const SLOT_MINUTES = 30;

/**
 * Precisa acompanhar --hour-h no Appointments.css: é o que posiciona a
 * linha do horário atual.
 */
export const HOUR_HEIGHT = 112;
export const SLOT_HEIGHT = (HOUR_HEIGHT * SLOT_MINUTES) / 60;

/**
 * Expediente do médico. O modelo Doctor ainda não guarda isso — enquanto não
 * guardar, todos seguem o mesmo horário. Trocar por dado real é mudar só aqui.
 */
const DEFAULT_WORKING_HOURS = { start: 8, end: 18 };

export function workingHours(_doctorId: number) {
  return DEFAULT_WORKING_HOURS;
}

export function buildSlots(): string[] {
  const slots: string[] = [];

  for (let h = GRID_START_HOUR; h < GRID_END_HOUR; h++) {
    for (let m = 0; m < 60; m += SLOT_MINUTES) {
      slots.push(
        `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`
      );
    }
  }

  return slots;
}

export function isWithinWorkingHours(slot: string, doctorId: number): boolean {
  const hour = Number(slot.slice(0, 2));
  const { start, end } = workingHours(doctorId);
  return hour >= start && hour < end;
}

/** "14:30:00" e "14:30" devem casar com o slot "14:30". */
export function normalizeTime(time: string): string {
  return time.slice(0, 5);
}

export function todayISO(): string {
  return new Date().toLocaleDateString("sv-SE");
}

/**
 * Deslocamento em px da linha de "agora" dentro da grade.
 * Devolve null fora da faixa exibida — aí a linha não é desenhada.
 */
export function nowOffset(now: Date): number | null {
  const minutes = (now.getHours() - GRID_START_HOUR) * 60 + now.getMinutes();
  const total = (GRID_END_HOUR - GRID_START_HOUR) * 60;

  if (minutes < 0 || minutes > total) return null;

  return (minutes / 60) * HOUR_HEIGHT;
}

export function formatClock(now: Date): string {
  return now.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function shiftDate(iso: string, days: number): string {
  const date = new Date(`${iso}T12:00:00`);
  date.setDate(date.getDate() + days);
  return date.toLocaleDateString("sv-SE");
}

export function formatLongDate(iso: string): string {
  const text = new Date(`${iso}T12:00:00`).toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  return text.charAt(0).toUpperCase() + text.slice(1);
}
