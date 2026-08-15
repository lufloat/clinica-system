import { useEffect, useState } from "react";

import Modal from "../../components/ui/Modal";

import type { Patient } from "./patient.types";
import { createPatient, updatePatient } from "../../services/patientService";
import { extractErrorMessage } from "../../utils/errors";

type Props = {
  open: boolean;
  /** quando presente, o formulário edita em vez de criar */
  patient: Patient | null;
  onClose: () => void;
  onSaved: () => void;
};

const EMPTY: Patient = {
  name: "",
  cpf: "",
  phone: "",
  email: "",
  birth_date: "",
};

const REQUIRED: Array<keyof Patient> = ["name", "cpf", "birth_date"];

const LABELS: Record<string, string> = {
  name: "Nome",
  cpf: "CPF",
  birth_date: "Data de nascimento",
};

export default function PatientForm({ open, patient, onClose, onSaved }: Props) {

  const [form, setForm] = useState<Patient>(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm(patient ?? EMPTY);
    setErrors({});
  }, [open, patient]);

  function setField(field: keyof Patient, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: "" }));
  }

  function validate(): boolean {
    const found: Record<string, string> = {};

    for (const field of REQUIRED) {
      if (!String(form[field] ?? "").trim()) {
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

      if (patient?.id) {
        await updatePatient(patient.id, form);
      } else {
        await createPatient(form);
      }

      onSaved();
      onClose();

    } catch (error) {
      setErrors({ form: extractErrorMessage(error) });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      title={patient ? "Editar paciente" : "Novo paciente"}
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="modal-body" noValidate>

        {errors.form && (
          <p className="form-error form-error-banner">{errors.form}</p>
        )}

        <label className="field">
          <span>Nome *</span>
          <input
            value={form.name}
            className={errors.name ? "invalid" : ""}
            onChange={(e) => setField("name", e.target.value)}
            placeholder="Nome completo"
          />
          {errors.name && <p className="form-error">{errors.name}</p>}
        </label>

        <div className="field-row">
          <label className="field">
            <span>CPF *</span>
            <input
              value={form.cpf}
              className={errors.cpf ? "invalid" : ""}
              onChange={(e) => setField("cpf", e.target.value)}
              placeholder="000.000.000-00"
            />
            {errors.cpf && <p className="form-error">{errors.cpf}</p>}
          </label>

          <label className="field">
            <span>Data de nascimento *</span>
            <input
              type="date"
              value={form.birth_date}
              className={errors.birth_date ? "invalid" : ""}
              onChange={(e) => setField("birth_date", e.target.value)}
            />
            {errors.birth_date && (
              <p className="form-error">{errors.birth_date}</p>
            )}
          </label>
        </div>

        <div className="field-row">
          <label className="field">
            <span>Telefone</span>
            <input
              value={form.phone}
              onChange={(e) => setField("phone", e.target.value)}
              placeholder="(00) 00000-0000"
            />
          </label>

          <label className="field">
            <span>E-mail</span>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setField("email", e.target.value)}
              placeholder="Opcional"
            />
          </label>
        </div>

        <footer className="modal-foot">
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Cancelar
          </button>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? "Salvando…" : "Salvar paciente"}
          </button>
        </footer>

      </form>
    </Modal>
  );
}
