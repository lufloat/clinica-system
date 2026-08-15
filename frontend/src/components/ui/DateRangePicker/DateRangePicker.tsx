import { useEffect, useState } from "react";

import CalendarMonthRoundedIcon from "@mui/icons-material/CalendarMonthRounded";
import ChevronLeftRoundedIcon from "@mui/icons-material/ChevronLeftRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";

import {
  MONTH_NAMES,
  WEEKDAY_NAMES,
  addDays,
  addMonths,
  firstOfMonth,
  formatBR,
  fromISO,
  monthGrid,
  toISO,
} from "../../../utils/dates";
import { useDismissable } from "../../../utils/useDismissable";

import "./DateRangePicker.css";

type Props = {
  /** ISO "AAAA-MM-DD" */
  start: string;
  end: string;
  onChange: (start: string, end: string) => void;
  label: string;
  /** destaca o controle como filtro principal */
  emphasis?: boolean;
};

/**
 * Seletor de intervalo. O projeto não tem DatePicker nem biblioteca de
 * calendário instalada, então este é construído sobre os tokens existentes.
 *
 * Fluxo: o primeiro clique fixa o início e limpa o fim; o segundo fecha o
 * intervalo (invertendo se o usuário clicou de trás para frente).
 */
export default function DateRangePicker({
  start,
  end,
  onChange,
  label,
  emphasis = false,
}: Props) {

  const [open, setOpen] = useState(false);
  const boxRef = useDismissable<HTMLDivElement>(open, () => setOpen(false));

  const [month, setMonth] = useState(() => firstOfMonth(fromISO(start)));
  /** início já escolhido, aguardando o fim */
  const [anchor, setAnchor] = useState<string | null>(null);
  /** dia sob o cursor/foco, para pré-visualizar o intervalo */
  const [preview, setPreview] = useState<string | null>(null);
  /** dia com foco de teclado */
  const [focused, setFocused] = useState(start);

  useEffect(() => {
    if (!open) return;
    setMonth(firstOfMonth(fromISO(start)));
    setAnchor(null);
    setPreview(null);
    setFocused(start);
  }, [open, start]);

  const rangeStart = anchor ?? start;
  const rangeEnd = anchor ? (preview ?? anchor) : end;

  const [lo, hi] = rangeStart <= rangeEnd
    ? [rangeStart, rangeEnd]
    : [rangeEnd, rangeStart];

  function pick(iso: string) {
    if (anchor === null) {
      setAnchor(iso);
      setPreview(iso);
      return;
    }

    const [from, to] = anchor <= iso ? [anchor, iso] : [iso, anchor];
    setAnchor(null);
    setPreview(null);
    onChange(from, to);
    setOpen(false);
  }

  function onKeyDown(event: React.KeyboardEvent) {
    const step: Record<string, number> = {
      ArrowLeft: -1,
      ArrowRight: 1,
      ArrowUp: -7,
      ArrowDown: 7,
    };

    if (event.key in step) {
      event.preventDefault();
      const next = toISO(addDays(fromISO(focused), step[event.key]));
      setFocused(next);
      setMonth(firstOfMonth(fromISO(next)));
      if (anchor) setPreview(next);
      return;
    }

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      pick(focused);
    }
  }

  const days = monthGrid(month);

  return (
    <div className="drp" ref={boxRef}>
      <label className="drp-label" htmlFor="drp-trigger">
        {label}
      </label>

      <button
        id="drp-trigger"
        type="button"
        className={
          "drp-trigger" +
          (open ? " open" : "") +
          (emphasis ? " emphasis" : "")
        }
        onClick={() => setOpen((current) => !current)}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <CalendarMonthRoundedIcon className="drp-trigger-icon" />
        <span className="drp-trigger-value">
          {formatBR(start)} <span className="drp-arrow">→</span> {formatBR(end)}
        </span>
      </button>

      {open && (
        <div className="drp-pop" role="dialog" aria-label={label}>
          <header className="drp-head">
            <button
              type="button"
              className="drp-nav"
              onClick={() => setMonth(addMonths(month, -1))}
              aria-label="Mês anterior"
            >
              <ChevronLeftRoundedIcon fontSize="small" />
            </button>

            <strong>
              {MONTH_NAMES[month.getMonth()]} {month.getFullYear()}
            </strong>

            <button
              type="button"
              className="drp-nav"
              onClick={() => setMonth(addMonths(month, 1))}
              aria-label="Mês seguinte"
            >
              <ChevronRightRoundedIcon fontSize="small" />
            </button>
          </header>

          <div className="drp-weekdays" aria-hidden>
            {WEEKDAY_NAMES.map((name, index) => (
              <span key={index}>{name}</span>
            ))}
          </div>

          {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-to-interactive-role */}
          <div
            className="drp-grid"
            role="grid"
            tabIndex={0}
            onKeyDown={onKeyDown}
            onMouseLeave={() => anchor && setPreview(anchor)}
          >
            {days.map((day) => {
              const iso = toISO(day);
              const outside = day.getMonth() !== month.getMonth();
              const inRange = iso > lo && iso < hi;
              const isEdge = iso === lo || iso === hi;

              return (
                <button
                  key={iso}
                  type="button"
                  tabIndex={-1}
                  className={
                    "drp-day" +
                    (outside ? " outside" : "") +
                    (inRange ? " in-range" : "") +
                    (isEdge ? " edge" : "") +
                    (iso === lo ? " edge-start" : "") +
                    (iso === hi ? " edge-end" : "") +
                    (iso === focused ? " focused" : "")
                  }
                  aria-label={formatBR(iso)}
                  aria-selected={isEdge}
                  onMouseEnter={() => {
                    setFocused(iso);
                    if (anchor) setPreview(iso);
                  }}
                  onClick={() => pick(iso)}
                >
                  {day.getDate()}
                </button>
              );
            })}
          </div>

          <footer className="drp-foot">
            {anchor
              ? "Escolha a data final"
              : `${formatBR(start)} → ${formatBR(end)}`}
          </footer>
        </div>
      )}
    </div>
  );
}
