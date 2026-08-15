import { useEffect, useState } from "react";

import Combobox from "../../components/ui/Combobox";
import Modal from "../../components/ui/Modal";
import { createAppointment } from "../../services/appointmentService";
import { extractErrorMessage } from "../../utils/errors";

export type Option = {
  value: number;
  label: string;
  /** texto secundário na lista de busca (ex.: CPF do paciente) */
  hint?: string;
  /** conteúdo extra buscável além do label (ex.: CPF, telefone) */
  searchText?: string;
};

export type Prefill = {
  doctor?: number;
  appointment_date?: string;
  appointment_time?: string;
};

type Props = {
  open: boolean;
  prefill: Prefill;
  doctors: Option[];
  patients: Option[];
  offices: Option[];
  onClose: () => void;
  onCreated: () => void;
};

type FormState = {
  patient: string;
  doctor: string;
  office: string;
  appointment_date: string;
  appointment_time: string;
  observations: string;
};

const EMPTY: FormState = {
  patient: "",
  doctor: "",
  office: "",
  appointment_date: "",
  appointment_time: "",
  observations: "",
};

const REQUIRED: Array<keyof FormState> = [
  "patient",
  "doctor",
  "office",
  "appointment_date",
  "appointment_time",
];

const LABELS: Record<string, string> = {
  patient: "Paciente",
  doctor: "Médico",
  office: "Consultório",
  appointment_date: "Data",
  appointment_time: "Hora",
};

export default function AppointmentModal({
  open,
  prefill,
  doctors,
  patients,
  offices,
  onClose,
  onCreated,
}: Props) {

  const [form, setForm] = useState<FormState>(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;

    setForm({
      ...EMPTY,
      doctor: prefill.doctor ? String(prefill.doctor) : "",
      appointment_date: prefill.appointment_date ?? "",
      appointment_time: prefill.appointment_time ?? "",
    });

    setErrors({});
  }, [open, prefill]);

  function setField(field: keyof FormState, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: "" }));
  }

  function validate(): boolean {
    const found: Record<string, string> = {};

    for (const field of REQUIRED) {
      if (!form[field]) {
        found[field] = `${LABELS[field]} é obrigatório.`;
      }
    }

    setErrors(found);
    return Object.keys(found).length === 0;
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (saving || !validate()) return;

    try {
      setSaving(true);

      await createAppointment({
        patient: Number(form.patient),
        doctor: Number(form.doctor),
        office: Number(form.office),
        appointment_date: form.appointment_date,
        appointment_time: form.appointment_time,
        observations: form.observations,
      });

      onCreated();
      onClose();

    } catch (error) {
      setErrors({ form: extractErrorMessage(error) });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} title="Nova consulta" onClose={onClose}>

        <form onSubmit={handleSubmit} className="modal-body" noValidate>

          {errors.form && (
            <p className="form-error form-error-banner">{errors.form}</p>
          )}

          <div className="field">
            <span>Paciente *</span>
            <Combobox
              options={patients}
              value={form.patient}
              onChange={(value) => setField("patient", value)}
              placeholder="Digite o nome do paciente…"
              emptyText="Nenhum paciente encontrado."
              invalid={Boolean(errors.patient)}
            />
            {errors.patient && <p className="form-error">{errors.patient}</p>}
          </div>

          <label className="field">
            <span>Médico *</span>
            <select
              value={form.doctor}
              onChange={(e) => setField("doctor", e.target.value)}
            >
              <option value="">Selecione…</option>
              {doctors.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {errors.doctor && <p className="form-error">{errors.doctor}</p>}
          </label>

          <label className="field">
            <span>Consultório *</span>
            <select
              value={form.office}
              onChange={(e) => setField("office", e.target.value)}
            >
              <option value="">Selecione…</option>
              {offices.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {errors.office && <p className="form-error">{errors.office}</p>}
          </label>

          <div className="field-row">
            <label className="field">
              <span>Data *</span>
              <input
                type="date"
                value={form.appointment_date}
                onChange={(e) => setField("appointment_date", e.target.value)}
              />
              {errors.appointment_date && (
                <p className="form-error">{errors.appointment_date}</p>
              )}
            </label>

            <label className="field">
              <span>Hora *</span>
              <input
                type="time"
                value={form.appointment_time}
                onChange={(e) => setField("appointment_time", e.target.value)}
              />
              {errors.appointment_time && (
                <p className="form-error">{errors.appointment_time}</p>
              )}
            </label>
          </div>

          <label className="field">
            <span>Observações</span>
            <textarea
              rows={3}
              value={form.observations}
              onChange={(e) => setField("observations", e.target.value)}
              placeholder="Opcional"
            />
          </label>

          <footer className="modal-foot">
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? "Agendando…" : "Agendar consulta"}
            </button>
          </footer>

        </form>
    </Modal>
  );
}
