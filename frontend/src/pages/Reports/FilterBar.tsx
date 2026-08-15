import DateRangePicker from "../../components/ui/DateRangePicker";
import { singularOf } from "../../utils/useCurrentUser";

import DoctorFilter from "./DoctorFilter";
import type { DoctorOption } from "./DoctorFilter";
import ExportMenu from "./ExportMenu";
import PresetSelect from "./PresetSelect";
import type { PresetKey } from "./PresetSelect";

type Props = {
  start: string;
  end: string;
  /** datas escolhidas à mão — muda o atalho para "Personalizado" */
  onRangeChange: (start: string, end: string) => void;

  preset: PresetKey;
  onPresetChange: (preset: PresetKey) => void;

  doctors: DoctorOption[];
  doctor: number | "";
  onDoctorChange: (doctor: number | "") => void;
  /** rótulo da vertical: "Médicos" ou "Dentistas" */
  doctorLabel: string;
  /**
   * Nome do profissional a que o usuário está restrito. Preenchido, o seletor
   * dá lugar a um rótulo fixo: o backend só devolve os dados dele, e um
   * seletor de uma opção só sugeriria uma escolha que não existe.
   */
  scopedDoctorName?: string | null;

  onApply: () => void;
  onExportCSV: () => void;
  onPrint: () => void;
};

/**
 * Barra única de filtros dos Relatórios: período, atalho, profissional,
 * Aplicar — divisória — Exportar.
 *
 * Nenhum controle dispara busca: todos só ajustam o estado. A busca acontece
 * no Aplicar, como o botão sempre funcionou.
 */
export default function FilterBar({
  start,
  end,
  onRangeChange,
  preset,
  onPresetChange,
  doctors,
  doctor,
  onDoctorChange,
  doctorLabel,
  scopedDoctorName,
  onApply,
  onExportCSV,
  onPrint,
}: Props) {

  return (
    <div className="filterbar">
      <DateRangePicker
        label="Período"
        start={start}
        end={end}
        onChange={onRangeChange}
        emphasis
      />

      <PresetSelect label="Atalho" value={preset} onChange={onPresetChange} />

      {scopedDoctorName ? (
        <div className="filterbar-field">
          <span className="filterbar-label">
            {singularOf(doctorLabel)}
          </span>
          <span className="filterbar-static" title="Relatório da sua agenda">
            {scopedDoctorName}
          </span>
        </div>
      ) : (
        <DoctorFilter
          label={singularOf(doctorLabel)}
          pluralLabel={doctorLabel}
          options={doctors}
          value={doctor}
          onChange={onDoctorChange}
        />
      )}

      <button type="button" className="btn btn--primary filterbar-apply" onClick={onApply}>
        Aplicar
      </button>

      <span className="filterbar-divider" aria-hidden />

      <ExportMenu onExportCSV={onExportCSV} onPrint={onPrint} />
    </div>
  );
}
