/**
 * Datas em fuso local.
 *
 * `toISOString()` converte para UTC: no Brasil (UTC-3), às 22h ele devolve o
 * dia seguinte. O preset "Hoje" à noite pegava amanhã. Aqui tudo é local.
 */

export function toISO(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

export function fromISO(iso: string): Date {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(year, (month ?? 1) - 1, day ?? 1);
}

/** "2026-07-01" → "01/07/2026" */
export function formatBR(iso: string): string {
  const [year, month, day] = iso.split("-");
  return `${day}/${month}/${year}`;
}

export function today(): Date {
  return new Date();
}

export function firstOfMonth(date = new Date()): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function addDays(date: Date, days: number): Date {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

export function addMonths(date: Date, months: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + months, 1);
}

export function sameDay(a: Date, b: Date): boolean {
  return toISO(a) === toISO(b);
}

export const MONTH_NAMES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

/** Domingo primeiro, como o calendário brasileiro. */
export const WEEKDAY_NAMES = ["D", "S", "T", "Q", "Q", "S", "S"];

/**
 * Grade de 6 semanas do mês, preenchida com os dias vizinhos para não
 * "pular" linhas conforme o mês muda de tamanho.
 */
export function monthGrid(month: Date): Date[] {
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const start = addDays(first, -first.getDay());

  return Array.from({ length: 42 }, (_, index) => addDays(start, index));
}
