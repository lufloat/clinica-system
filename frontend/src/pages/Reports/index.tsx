import { useCallback, useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

import StatusChart from "../../components/dashboard/StatusChart";
import VerticalTabs from "../../components/ui/VerticalTabs";
import type { VerticalOption } from "../../components/ui/VerticalTabs";
import FilterBar from "./FilterBar";
import type { DoctorOption } from "./DoctorFilter";
import type { PresetKey } from "./PresetSelect";
import { getReport } from "../../services/reportService";
import {
  labelFor,
  singularOf,
  useCurrentUser,
} from "../../utils/useCurrentUser";
import {
  addDays,
  firstOfMonth,
  formatBR,
  toISO,
} from "../../utils/dates";

import "./Reports.css";

const STATUS_LABELS: Record<string, string> = {
  AGENDADA: "Agendada",
  FINALIZADA: "Finalizada",
  CANCELADA: "Cancelada",
};

type ReportData = {
  start: string;
  end: string;
  /** áreas que o usuário pode escolher; menos de duas = sem seletor */
  verticals: VerticalOption[];
  vertical: string | null;
  vertical_name: string | null;
  /** opções do filtro — já recortadas pela vertical do usuário */
  doctors: DoctorOption[];
  doctor: number | null;
  doctor_name: string | null;
  summary: {
    total: number;
    agendada: number;
    finalizada: number;
    cancelada: number;
    finalization_rate: number;
    cancellation_rate: number;
  };
  by_status: { status: string; label: string; total: number }[];
  by_doctor: {
    doctor_id: number;
    doctor: string;
    total: number;
    finalizada: number;
    cancelada: number;
  }[];
  by_office: { office: string; total: number }[];
  daily: { date: string; label: string; total: number }[];
  appointments: {
    id: number;
    appointment_date: string;
    appointment_time: string;
    patient_name: string;
    doctor_name: string;
    office_name: string;
    status: string;
  }[];
};

/** Datas do preset. "custom" não tem range próprio: mantém o que já está. */
function rangeForPreset(preset: PresetKey): [string, string] | null {
  const now = new Date();
  const end = toISO(now);

  if (preset === "today") return [end, end];
  if (preset === "7d") return [toISO(addDays(now, -6)), end];
  if (preset === "30d") return [toISO(addDays(now, -29)), end];
  if (preset === "month") return [toISO(firstOfMonth(now)), end];

  return null;
}

function Reports() {
  const { user } = useCurrentUser();
  /** "Médicos"/"Dentistas" conforme a vertical, e o singular para colunas. */
  const doctorLabel = labelFor(user, "medicos", "Profissionais");
  const doctorLabelSingular = singularOf(doctorLabel);
  const [start, setStart] = useState(() => toISO(firstOfMonth()));
  const [end, setEnd] = useState(() => toISO(new Date()));
  /** "" = todos os profissionais */
  const [doctor, setDoctor] = useState<number | "">("");
  /** "" = todas as áreas somadas */
  const [vertical, setVertical] = useState("");
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [preset, setPreset] = useState<PresetKey>("month");

  const load = useCallback(
    async (s: string, e: string, d: number | "", v: string) => {
      setLoading(true);
      try {
        const response = await getReport(s, e, d, v);
        setData(response);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    load(start, end, doctor, vertical);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Trocar de área recarrega na hora, ao contrário dos filtros da barra: é
   * uma mudança de contexto, não um recorte. O profissional selecionado é
   * descartado junto — ele pertencia à área anterior.
   */
  function changeVertical(slug: string) {
    setVertical(slug);
    setDoctor("");
    load(start, end, "", slug);
  }

  /** O atalho só preenche o range; a busca fica para o Aplicar. */
  function changePreset(key: PresetKey) {
    setPreset(key);

    const range = rangeForPreset(key);
    if (range) {
      setStart(range[0]);
      setEnd(range[1]);
    }
  }

  /** Escolher datas à mão desliga o atalho. */
  function changeRange(nextStart: string, nextEnd: string) {
    setStart(nextStart);
    setEnd(nextEnd);
    setPreset("custom");
  }

  function exportCSV() {
    if (!data) return;
    const header = [
      "Data", "Hora", "Paciente", doctorLabelSingular, "Consultório", "Status",
    ];
    const rows = data.appointments.map((a) => [
      formatBR(a.appointment_date),
      a.appointment_time?.slice(0, 5),
      a.patient_name,
      a.doctor_name,
      a.office_name,
      STATUS_LABELS[a.status] ?? a.status,
    ]);
    const csv = [header, ...rows]
      .map((r) => r.map((c) => `"${(c ?? "").toString().replace(/"/g, '""')}"`).join(";"))
      .join("\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    // Área e profissional entram no nome: dois exports do mesmo período
    // seriam indistinguíveis na pasta de downloads.
    const slug = (text: string) => `_${text.replace(/[^\p{L}\p{N}]+/gu, "-")}`;
    const area = data.vertical_name ? slug(data.vertical_name) : "";
    const who = data.doctor_name ? slug(data.doctor_name) : "";

    link.download = `relatorio_${start}_a_${end}${area}${who}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="reports">
      <div className="reports-header">
        <div>
          <h1>Relatórios</h1>
          {data && (
            <p className="subtitle">
              Período: {formatBR(data.start)} até {formatBR(data.end)}
              {data.vertical_name ? ` · ${data.vertical_name}` : ""}
              {data.doctor_name ? ` · ${data.doctor_name}` : ""}
            </p>
          )}
        </div>
      </div>

      <VerticalTabs
        options={data?.verticals ?? []}
        value={vertical}
        onChange={changeVertical}
      />

      <FilterBar
        start={start}
        end={end}
        onRangeChange={changeRange}
        preset={preset}
        onPresetChange={changePreset}
        doctors={data?.doctors ?? []}
        doctor={doctor}
        onDoctorChange={setDoctor}
        doctorLabel={doctorLabel}
        scopedDoctorName={user?.doctor?.name ?? null}
        onApply={() => load(start, end, doctor, vertical)}
        onExportCSV={exportCSV}
        onPrint={() => window.print()}
      />

      {loading ? (
        <div className="metric-grid">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="reports-skeleton" />
          ))}
        </div>
      ) : data ? (
        <>
          <div className="metric-grid">
            <div className="metric-card">
              <div className="metric-card__label">Total de Consultas</div>
              <div className="metric-card__value">{data.summary.total}</div>
              <div className="metric-card__hint">no período selecionado</div>
            </div>

            <div className="metric-card">
              <div className="metric-card__label">Finalizadas</div>
              <div className="metric-card__value" style={{ color: "#047857" }}>
                {data.summary.finalizada}
              </div>
              <div className="metric-card__hint">
                {data.summary.finalization_rate}% do total
              </div>
              <div className="metric-card__bar">
                <span style={{ width: `${data.summary.finalization_rate}%`, background: "#10B981" }} />
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-card__label">Canceladas</div>
              <div className="metric-card__value" style={{ color: "#BE123C" }}>
                {data.summary.cancelada}
              </div>
              <div className="metric-card__hint">
                {data.summary.cancellation_rate}% do total
              </div>
              <div className="metric-card__bar">
                <span style={{ width: `${data.summary.cancellation_rate}%`, background: "#F43F5E" }} />
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-card__label">Agendadas (em aberto)</div>
              <div className="metric-card__value" style={{ color: "#4F46E5" }}>
                {data.summary.agendada}
              </div>
              <div className="metric-card__hint">aguardando atendimento</div>
            </div>
          </div>

          <section className="panel">
            <h2 className="panel__title">Volume de Consultas por Dia</h2>
            {data.summary.total === 0 ? (
              <p className="empty-state">Sem consultas no período.</p>
            ) : (
              <div style={{ width: "100%", height: 260 }}>
                <ResponsiveContainer>
                  <BarChart data={data.daily} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#EEF2F7" vertical={false} />
                    <XAxis dataKey="label" tick={{ fontSize: 12, fill: "#64748B" }} tickLine={false} axisLine={false} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: "#64748B" }} tickLine={false} axisLine={false} />
                    <Tooltip
                      cursor={{ fill: "rgba(99,102,241,.08)" }}
                      labelFormatter={(l) => `Dia ${l}`}
                      formatter={(v) => [`${v}`, "Consultas"]}
                    />
                    <Bar dataKey="total" fill="#6366F1" radius={[4, 4, 0, 0]} maxBarSize={44} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </section>

          <div className="reports-panels">
            <section className="panel">
              <h2 className="panel__title">Distribuição por Status</h2>
              <StatusChart data={data.by_status} />
            </section>

            <section className="panel">
              <h2 className="panel__title">
                Consultas por {doctorLabelSingular}
              </h2>
              {data.by_doctor.length === 0 ? (
                <p className="empty-state">Sem dados no período.</p>
              ) : (
                <div>
                  {data.by_doctor.map((doc) => {
                    const max = data.by_doctor[0].total || 1;
                    return (
                      <div key={doc.doctor_id} className="doctor-row">
                        <span className="doctor-row__name">{doc.doctor}</span>
                        <span className="doctor-row__total">{doc.total}</span>
                        <div className="doctor-row__bar">
                          <span style={{ width: `${(doc.total / max) * 100}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </div>

          <section className="panel">
            <h2 className="panel__title">
              Detalhamento ({data.appointments.length})
            </h2>
            {data.appointments.length === 0 ? (
              <p className="empty-state">Nenhuma consulta no período selecionado.</p>
            ) : (
              <div className="report-table-wrap">
                <table className="report-table">
                  <thead>
                    <tr>
                      <th>Data</th>
                      <th>Hora</th>
                      <th>Paciente</th>
                      <th>{doctorLabelSingular}</th>
                      <th>Consultório</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.appointments.map((a) => (
                      <tr key={a.id}>
                        <td>{formatBR(a.appointment_date)}</td>
                        <td>{a.appointment_time?.slice(0, 5)}</td>
                        <td>{a.patient_name}</td>
                        <td>{a.doctor_name}</td>
                        <td>{a.office_name}</td>
                        <td>
                          <span className={`badge badge--${a.status}`}>
                            {STATUS_LABELS[a.status] ?? a.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      ) : (
        <p className="empty-state">Não foi possível carregar o relatório.</p>
      )}
    </div>
  );
}

export default Reports;
