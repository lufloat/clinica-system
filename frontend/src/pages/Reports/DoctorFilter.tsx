import { useEffect, useState } from "react";

import KeyboardArrowDownRoundedIcon from "@mui/icons-material/KeyboardArrowDownRounded";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import GroupsRoundedIcon from "@mui/icons-material/GroupsRounded";

import { useDismissable } from "../../utils/useDismissable";

import { doctorColor, initials } from "../Appointments/schedule";

export type DoctorOption = {
  id: number;
  name: string;
  specialty: string;
  /** consultas no período — independe do filtro ativo */
  total: number;
};

type Props = {
  options: DoctorOption[];
  /** "" = todos */
  value: number | "";
  onChange: (value: number | "") => void;
  /** rótulo do campo; o plural vem da vertical ("Médicos"/"Dentistas") */
  label: string;
  pluralLabel: string;
};

/**
 * Seletor de profissional. Substitui o <select> nativo, que não aceita estilo
 * na lista, por um listbox com a mesma identidade visual da Agenda: avatar
 * colorido por `doctorColor` e iniciais por `initials`.
 */
export default function DoctorFilter({
  options,
  value,
  onChange,
  label,
  pluralLabel,
}: Props) {

  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const boxRef = useDismissable<HTMLDivElement>(open, () => setOpen(false));

  const selected = options.find((option) => option.id === value) ?? null;

  // índice na lista completa, contando a linha "Todos" na posição 0
  const rows: (DoctorOption | null)[] = [null, ...options];

  useEffect(() => {
    if (open) {
      setActive(rows.findIndex((row) => (row?.id ?? "") === value));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function pick(row: DoctorOption | null) {
    onChange(row ? row.id : "");
    setOpen(false);
  }

  function onKeyDown(event: React.KeyboardEvent) {
    if (!open) {
      if (event.key === "Enter" || event.key === " " || event.key === "ArrowDown") {
        event.preventDefault();
        setOpen(true);
      }
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((current) => Math.min(current + 1, rows.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((current) => Math.max(current - 1, 0));
    } else if (event.key === "Enter") {
      event.preventDefault();
      pick(rows[active] ?? null);
    }
  }

  const allLabel = `Todos os ${pluralLabel.toLowerCase()}`;

  return (
    <div className="doctor-filter" ref={boxRef}>
      <label className="filterbar-label" id="doctor-filter-label">
        {label}
      </label>

      <button
        type="button"
        className={open ? "doctor-filter-trigger open" : "doctor-filter-trigger"}
        onClick={() => setOpen((current) => !current)}
        onKeyDown={onKeyDown}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-labelledby="doctor-filter-label"
      >
        {selected ? (
          <span
            className="doctor-filter-avatar"
            style={{ background: doctorColor(selected.id) }}
          >
            {initials(selected.name)}
          </span>
        ) : (
          <span className="doctor-filter-avatar doctor-filter-avatar-all">
            <GroupsRoundedIcon fontSize="inherit" />
          </span>
        )}

        <span className="doctor-filter-text">
          <strong>{selected ? selected.name : allLabel}</strong>
          <small>{selected ? selected.specialty : "sem filtro"}</small>
        </span>

        {!selected && (
          <span className="doctor-filter-badge">{options.length}</span>
        )}

        <KeyboardArrowDownRoundedIcon className="doctor-filter-chevron" />
      </button>

      {open && (
        <ul className="doctor-filter-menu" role="listbox">
          {rows.map((row, index) => {
            const isSelected = (row?.id ?? "") === value;

            return (
              <li key={row?.id ?? "todos"} role="option" aria-selected={isSelected}>
                <button
                  type="button"
                  className={
                    "doctor-filter-option" +
                    (isSelected ? " selected" : "") +
                    (index === active ? " active" : "")
                  }
                  onMouseEnter={() => setActive(index)}
                  onClick={() => pick(row)}
                >
                  {row ? (
                    <span
                      className="doctor-filter-avatar"
                      style={{ background: doctorColor(row.id) }}
                    >
                      {initials(row.name)}
                    </span>
                  ) : (
                    <span className="doctor-filter-avatar doctor-filter-avatar-all">
                      <GroupsRoundedIcon fontSize="inherit" />
                    </span>
                  )}

                  <span className="doctor-filter-text">
                    <strong>{row ? row.name : allLabel}</strong>
                    <small>{row ? row.specialty : "sem filtro"}</small>
                  </span>

                  <span className="doctor-filter-count">
                    {row ? row.total : options.length}
                  </span>

                  {isSelected && (
                    <CheckRoundedIcon className="doctor-filter-check" />
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
