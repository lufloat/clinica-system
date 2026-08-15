import { useEffect, useMemo, useRef, useState } from "react";

import "./Combobox.css";

export type ComboboxOption = {
  value: number;
  label: string;
  /** texto secundário mostrado na lista (ex.: CPF) */
  hint?: string;
  /** conteúdo extra buscável, além do label (ex.: CPF, telefone) */
  searchText?: string;
};

type Props = {
  options: ComboboxOption[];
  /** id da opção escolhida, como string ("" quando nada escolhido) */
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  emptyText?: string;
  invalid?: boolean;
  /** teto de itens exibidos — a lista não deve virar um paredão */
  maxResults?: number;
};

/** "Otávio" e "otavio" precisam casar: busca sem acento e sem caixa. */
function normalize(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

/** "12345678900" precisa casar com "123.456.789-00". */
function digits(text: string): string {
  return text.replace(/\D/g, "");
}

export default function Combobox({
  options,
  value,
  onChange,
  placeholder = "Buscar…",
  emptyText = "Nenhum resultado.",
  invalid = false,
  maxResults = 10,
}: Props) {

  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(0);

  const boxRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const selected = useMemo(
    () => options.find((option) => String(option.value) === value),
    [options, value]
  );

  /** Reflete escolhas vindas de fora: pré-preenchimento e reset do formulário. */
  useEffect(() => {
    setQuery(selected?.label ?? "");
  }, [selected]);

  useEffect(() => {
    function onClickOutside(event: MouseEvent) {
      if (!boxRef.current?.contains(event.target as Node)) {
        setOpen(false);
        setQuery(selected?.label ?? "");
      }
    }

    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [selected]);

  const matches = useMemo(() => {
    const term = normalize(query).trim();

    // campo intocado desde a escolha: mostra tudo, para poder trocar
    if (!term || query === selected?.label) return options;

    const termDigits = digits(query);

    return options.filter((option) => {
      const haystack = normalize(`${option.label} ${option.searchText ?? ""}`);
      if (haystack.includes(term)) return true;

      // busca numérica: compara só os dígitos, ignorando pontos e traços
      return (
        termDigits.length > 0 &&
        digits(option.searchText ?? "").includes(termDigits)
      );
    });
  }, [query, options, selected]);

  const filtered = useMemo(
    () => matches.slice(0, maxResults),
    [matches, maxResults]
  );

  const hidden = matches.length - filtered.length;

  useEffect(() => {
    setHighlighted(0);
  }, [query]);

  /** Mantém a opção destacada visível ao navegar pelo teclado. */
  useEffect(() => {
    if (!open) return;
    listRef.current
      ?.querySelectorAll("li")
      [highlighted]?.scrollIntoView({ block: "nearest" });
  }, [highlighted, open]);

  function choose(option: ComboboxOption) {
    onChange(String(option.value));
    setQuery(option.label);
    setOpen(false);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      if (!open) return setOpen(true);
      setHighlighted((i) => Math.min(i + 1, filtered.length - 1));
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlighted((i) => Math.max(i - 1, 0));
      return;
    }

    if (event.key === "Enter" && open) {
      event.preventDefault();
      const option = filtered[highlighted];
      if (option) choose(option);
      return;
    }

    if (event.key === "Escape" && open) {
      // sem isto o Escape fecharia o modal inteiro
      event.stopPropagation();
      setOpen(false);
      setQuery(selected?.label ?? "");
    }
  }

  return (
    <div className="combobox" ref={boxRef}>
      <input
        type="text"
        role="combobox"
        aria-expanded={open}
        aria-autocomplete="list"
        autoComplete="off"
        className={invalid ? "combobox-input invalid" : "combobox-input"}
        placeholder={placeholder}
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          setOpen(true);
          if (value) onChange("");
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={handleKeyDown}
      />

      {value && (
        <button
          type="button"
          className="combobox-clear"
          aria-label="Limpar"
          onClick={() => {
            onChange("");
            setQuery("");
            setOpen(true);
          }}
        >
          ×
        </button>
      )}

      {open && (
        <ul className="combobox-list" ref={listRef} role="listbox">
          {filtered.length === 0 && <li className="combobox-empty">{emptyText}</li>}

          {filtered.map((option, index) => (
            <li
              key={option.value}
              role="option"
              aria-selected={String(option.value) === value}
              className={index === highlighted ? "highlighted" : ""}
              onMouseEnter={() => setHighlighted(index)}
              onMouseDown={(event) => {
                // mousedown antes do blur, senão a lista fecha antes do clique
                event.preventDefault();
                choose(option);
              }}
            >
              <span className="combobox-label">{option.label}</span>
              {option.hint && (
                <span className="combobox-hint">{option.hint}</span>
              )}
            </li>
          ))}

          {hidden > 0 && (
            <li className="combobox-more">
              +{hidden} {hidden === 1 ? "outro" : "outros"} — refine a busca
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
