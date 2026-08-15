export type VerticalOption = {
  slug: string;
  name: string;
};

type Props = {
  /** Áreas que o usuário pode escolher, como vêm da API. */
  options: VerticalOption[];
  /** "" = todas somadas. */
  value: string;
  onChange: (slug: string) => void;
  /** Rótulo da opção consolidada. */
  allLabel?: string;
};

/**
 * Seletor de área (Clínica Médica / Odontologia) do Dashboard e dos
 * Relatórios.
 *
 * Só aparece para quem enxerga mais de uma: o colaborador com vertical
 * própria recebe uma opção só da API, e nesse caso não há escolha a oferecer
 * — o backend ignoraria o parâmetro de qualquer forma.
 */
export default function VerticalTabs({
  options,
  value,
  onChange,
  allLabel = "Geral",
}: Props) {

  if (options.length < 2) return null;

  const rows = [{ slug: "", name: allLabel }, ...options];

  return (
    <div className="type-tabs" role="tablist" aria-label="Área da clínica">
      {rows.map((row) => (
        <button
          key={row.slug || "todas"}
          type="button"
          role="tab"
          aria-selected={value === row.slug}
          className={value === row.slug ? "type-tab active" : "type-tab"}
          onClick={() => onChange(row.slug)}
        >
          {row.name}
        </button>
      ))}
    </div>
  );
}
