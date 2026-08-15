import { useEffect, useMemo, useState } from "react";

import "./odontograma.css";

import type { Patient } from "../Patients/patient.types";
import { getPatients } from "../../services/patientService";
import {
  createToothRecord,
  deleteToothRecord,
  getChartByPatient,
} from "../../services/dentalService";
import { extractErrorMessage } from "../../utils/errors";

import {
  CONDITION_LABEL,
  FACE_LABEL,
  QUADRANTS,
  STATUS_LABEL,
} from "./dental.types";
import type {
  Condition,
  DentalChart,
  Face,
  RecordStatus,
  ToothRecord,
} from "./dental.types";

/** Cor por condição. Cinza = sem lançamento. */
const CONDITION_COLOR: Record<Condition, string> = {
  SAUDAVEL: "#22C55E",
  CARIE: "#EF4444",
  RESTAURADO: "#3B82F6",
  FRATURADO: "#F59E0B",
  AUSENTE: "#94A3B8",
  IMPLANTE: "#8B5CF6",
  PROTESE: "#EC4899",
};

const NO_RECORD_COLOR = "#E2E8F0";

export default function Odontograma() {

  const [patients, setPatients] = useState<Patient[]>([]);
  const [patientId, setPatientId] = useState<number | null>(null);

  const [chart, setChart] = useState<DentalChart | null>(null);
  const [tooth, setTooth] = useState<number | null>(null);

  const [loadError, setLoadError] = useState("");
  const [saving, setSaving] = useState(false);

  // formulário do lançamento
  const [face, setFace] = useState<Face>("TODO");
  const [condition, setCondition] = useState<Condition>("CARIE");
  const [status, setStatus] = useState<RecordStatus>("PLANEJADO");
  const [procedure, setProcedure] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    getPatients()
      .then(setPatients)
      .catch((error) => setLoadError(extractErrorMessage(error)));
  }, []);

  useEffect(() => {
    if (patientId === null) {
      setChart(null);
      return;
    }

    setTooth(null);
    getChartByPatient(patientId)
      .then((data) => {
        setChart(data);
        setLoadError("");
      })
      .catch((error) => setLoadError(extractErrorMessage(error)));
  }, [patientId]);

  /** Último lançamento de cada dente — define a cor exibida. */
  const latestByTooth = useMemo(() => {
    const map = new Map<number, ToothRecord>();

    for (const record of chart?.tooth_records ?? []) {
      if (record.status === "CANCELADO") continue;
      // a API já ordena por -created_at dentro do dente
      if (!map.has(record.tooth)) map.set(record.tooth, record);
    }

    return map;
  }, [chart]);

  const toothRecords = useMemo(
    () =>
      (chart?.tooth_records ?? []).filter((record) => record.tooth === tooth),
    [chart, tooth]
  );

  async function reload() {
    if (patientId === null) return;
    setChart(await getChartByPatient(patientId));
  }

  async function handleAdd(event: React.FormEvent) {
    event.preventDefault();

    if (!chart || tooth === null || saving) return;

    try {
      setSaving(true);
      setLoadError("");

      await createToothRecord({
        chart: chart.id,
        tooth,
        face,
        condition,
        procedure,
        status,
        notes,
        appointment: null,
      });

      setProcedure("");
      setNotes("");
      await reload();

    } catch (error) {
      setLoadError(extractErrorMessage(error));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number) {
    try {
      await deleteToothRecord(id);
      await reload();
    } catch (error) {
      setLoadError(extractErrorMessage(error));
    }
  }

  function colorOf(number: number) {
    const record = latestByTooth.get(number);
    return record ? CONDITION_COLOR[record.condition] : NO_RECORD_COLOR;
  }

  return (
    <div className="page">

      <header className="page-head">
        <div>
          <h1>Odontograma</h1>
          <p className="page-sub">
            {chart
              ? `Paciente: ${chart.patient_name}`
              : "Escolha um paciente para ver o mapa dental"}
          </p>
        </div>

        <div className="page-head-actions">
          <select
            className="page-search"
            value={patientId ?? ""}
            onChange={(event) =>
              setPatientId(event.target.value ? Number(event.target.value) : null)
            }
          >
            <option value="">Selecione o paciente…</option>
            {patients.map((patient) => (
              <option key={patient.id} value={patient.id}>
                {patient.name}
              </option>
            ))}
          </select>
        </div>
      </header>

      {loadError && <p className="form-error form-error-banner">{loadError}</p>}

      {!chart ? (
        <section className="page-card">
          <p className="odo-empty" style={{ padding: "1.5rem" }}>
            Nenhum paciente selecionado.
          </p>
        </section>
      ) : (
        <div className="odo-layout">

          <section className="page-card" style={{ padding: "1rem" }}>
            <div className="odo-arches">
              {QUADRANTS.map((quadrant) => (
                <div key={quadrant.label}>
                  <p className="odo-quadrant-label">{quadrant.label}</p>
                  <div className="odo-teeth">
                    {quadrant.teeth.map((number) => {
                      const count = (chart.tooth_records ?? []).filter(
                        (record) => record.tooth === number
                      ).length;

                      return (
                        <button
                          key={number}
                          type="button"
                          className={
                            tooth === number
                              ? "odo-tooth selected"
                              : "odo-tooth"
                          }
                          onClick={() => setTooth(number)}
                          title={`Dente ${number}`}
                        >
                          <span
                            className="odo-tooth-dot"
                            style={{ background: colorOf(number) }}
                          />
                          <strong>{number}</strong>
                          <span className="odo-tooth-count">
                            {count > 0 ? count : ""}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="odo-legend">
              {(Object.keys(CONDITION_LABEL) as Condition[]).map((key) => (
                <span key={key} className="odo-legend-item">
                  <span
                    className="odo-tooth-dot"
                    style={{ background: CONDITION_COLOR[key] }}
                  />
                  {CONDITION_LABEL[key]}
                </span>
              ))}
            </div>
          </section>

          <aside className="odo-panel">
            {tooth === null ? (
              <p className="odo-empty">
                Clique em um dente para lançar condição ou procedimento.
              </p>
            ) : (
              <>
                <h3>Dente {tooth}</h3>

                <form onSubmit={handleAdd}>
                  <label className="field">
                    <span>Face</span>
                    <select
                      value={face}
                      onChange={(e) => setFace(e.target.value as Face)}
                    >
                      {(Object.keys(FACE_LABEL) as Face[]).map((key) => (
                        <option key={key} value={key}>
                          {FACE_LABEL[key]}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="field">
                    <span>Condição</span>
                    <select
                      value={condition}
                      onChange={(e) =>
                        setCondition(e.target.value as Condition)
                      }
                    >
                      {(Object.keys(CONDITION_LABEL) as Condition[]).map(
                        (key) => (
                          <option key={key} value={key}>
                            {CONDITION_LABEL[key]}
                          </option>
                        )
                      )}
                    </select>
                  </label>

                  <label className="field">
                    <span>Procedimento</span>
                    <input
                      value={procedure}
                      onChange={(e) => setProcedure(e.target.value)}
                      placeholder="Ex.: Restauração em resina"
                    />
                  </label>

                  <label className="field">
                    <span>Situação</span>
                    <select
                      value={status}
                      onChange={(e) =>
                        setStatus(e.target.value as RecordStatus)
                      }
                    >
                      {(Object.keys(STATUS_LABEL) as RecordStatus[]).map(
                        (key) => (
                          <option key={key} value={key}>
                            {STATUS_LABEL[key]}
                          </option>
                        )
                      )}
                    </select>
                  </label>

                  <label className="field">
                    <span>Observação</span>
                    <input
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Opcional"
                    />
                  </label>

                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={saving}
                    style={{ width: "100%", marginTop: ".5rem" }}
                  >
                    {saving ? "Salvando…" : "Lançar"}
                  </button>
                </form>

                <h3 style={{ marginTop: "1.25rem" }}>
                  Histórico ({toothRecords.length})
                </h3>

                {toothRecords.length === 0 ? (
                  <p className="odo-empty">Nenhum lançamento neste dente.</p>
                ) : (
                  toothRecords.map((record) => (
                    <div key={record.id} className="odo-record">
                      <div className="odo-record-head">
                        <strong>{CONDITION_LABEL[record.condition]}</strong>
                        <button
                          type="button"
                          className="table-delete"
                          onClick={() => handleDelete(record.id!)}
                        >
                          Excluir
                        </button>
                      </div>
                      {record.procedure && <div>{record.procedure}</div>}
                      <div className="odo-record-meta">
                        {FACE_LABEL[record.face]} ·{" "}
                        {STATUS_LABEL[record.status]}
                        {record.notes ? ` · ${record.notes}` : ""}
                      </div>
                    </div>
                  ))
                )}
              </>
            )}
          </aside>
        </div>
      )}
    </div>
  );
}
