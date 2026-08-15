import { useState } from "react";

import KeyboardArrowDownRoundedIcon from "@mui/icons-material/KeyboardArrowDownRounded";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";

import { useDismissable } from "../../utils/useDismissable";

/** "custom" nunca é escolhido pelo usuário: aparece quando ele mexe nas datas. */
export type PresetKey = "today" | "7d" | "month" | "30d" | "custom";

export const PRESETS: { key: PresetKey; label: string }[] = [
  { key: "today", label: "Hoje" },
  { key: "7d", label: "7 dias" },
  { key: "month", label: "Este mês" },
  { key: "30d", label: "30 dias" },
  { key: "custom", label: "Personalizado" },
];

type Props = {
  value: PresetKey;
  onChange: (value: PresetKey) => void;
  label: string;
};

export default function PresetSelect({ value, onChange, label }: Props) {

  const [open, setOpen] = useState(false);
  const boxRef = useDismissable<HTMLDivElement>(open, () => setOpen(false));
  const [active, setActive] = useState(0);

  const selected = PRESETS.find((preset) => preset.key === value) ?? PRESETS[2];

  function pick(key: PresetKey) {
    onChange(key);
    setOpen(false);
  }

  function onKeyDown(event: React.KeyboardEvent) {
    if (!open) {
      if (event.key === "Enter" || event.key === " " || event.key === "ArrowDown") {
        event.preventDefault();
        setActive(PRESETS.findIndex((preset) => preset.key === value));
        setOpen(true);
      }
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((current) => Math.min(current + 1, PRESETS.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((current) => Math.max(current - 1, 0));
    } else if (event.key === "Enter") {
      event.preventDefault();
      pick(PRESETS[active].key);
    }
  }

  return (
    <div className="preset-select" ref={boxRef}>
      <label className="filterbar-label" id="preset-label">
        {label}
      </label>

      <button
        type="button"
        className={open ? "preset-trigger open" : "preset-trigger"}
        onClick={() => setOpen((current) => !current)}
        onKeyDown={onKeyDown}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-labelledby="preset-label"
      >
        <span>{selected.label}</span>
        <KeyboardArrowDownRoundedIcon className="preset-chevron" />
      </button>

      {open && (
        <ul className="preset-menu" role="listbox">
          {PRESETS.map((preset, index) => {
            const isSelected = preset.key === value;

            return (
              <li key={preset.key} role="option" aria-selected={isSelected}>
                <button
                  type="button"
                  className={
                    "preset-option" +
                    (isSelected ? " selected" : "") +
                    (index === active ? " active" : "")
                  }
                  onMouseEnter={() => setActive(index)}
                  onClick={() => pick(preset.key)}
                >
                  <span>{preset.label}</span>
                  {isSelected && <CheckRoundedIcon className="preset-check" />}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
