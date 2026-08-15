import { useEffect, useState } from "react";

import Modal from "../../components/ui/Modal";

import type { Council, Doctor } from "./doctor.types";
import { createDoctor, updateDoctor } from "../../services/doctorService";
import { extractErrorMessage } from "../../utils/errors";
import { useCurrentUser } from "../../utils/useCurrentUser";

type Props = {
  open: boolean;
  /** quando presente, o formulário edita em vez de criar */
  doctor: Doctor | null;
  onClose: () => void;
  onSaved: () => void;
};

/**
 * Cada vertical usa um conselho só, e o backend recusa o par errado. Quem tem
 * vertical não escolhe; o administrador geral escolhe.
 */
const COUNCIL_BY_VERTICAL: Record<string, Council> = {
  medicina: "CRM",
  odontologia: "CRO",
};

const EMPTY: Doctor = {
  name: "",
  council: "CRM",
  council_code: "",
  specialty: "",
  phone: "",
  email: "",
};

const REQUIRED: Array<keyof Doctor> = ["name", "council_code", "specialty"];

export default function DoctorForm({ open, doctor, onClose, onSaved }: Props) {

  const { user } = useCurrentUser();
  const fixedCouncil = user?.vertical
    ? COUNCIL_BY_VERTICAL[user.vertical.slug]
    : undefined;

  const [form, setForm] = useState<Doctor>(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  // o próprio conselho é o rótulo do campo de registro: "CRM" ou "CRO"
  const councilLabel = form.council;

  const labels: Record<string, string> = {
    name: "Nome",
    council_code: councilLabel,
    specialty: "Especialidade",
  };

  useEffect(() => {
    if (!open) return;
    setForm(doctor ?? { ...EMPTY, council: fixedCouncil ?? "CRM" });
    setErrors({});
  }, [open, doctor, fixedCouncil]);

  function setField(field: keyof Doctor, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: "" }));
  }

  function validate(): boolean {
    const found: Record<string, string> = {};

    for (const field of REQUIRED) {
      if (!String(form[field] ?? "").trim()) {
        found[field] = `${labels[field]} é obrigatório.`;
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

      if (doctor?.id) {
        await updateDoctor(doctor.id, form);
      } else {
        await createDoctor(form);
      }

      onSaved();
      onClose();

    } catch (error) {
      setErrors({ form: extractErrorMessage(error) });
    } finally {
      setSaving(false);
    }
  }

  const noun = form.council === "CRO" ? "dentista" : "profissional";

  return (
    <Modal
      open={open}
      title={doctor ? `Editar ${noun}` : `Novo ${noun}`}
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
            placeholder={
              form.council === "CRO"
                ? "Ex.: Dr. Caio Menezes"
                : "Ex.: Dra. Helena Prado"
            }
          />
          {errors.name && <p className="form-error">{errors.name}</p>}
        </label>

        <div className="field-row">
          {/* sem vertical (administrador geral) o conselho é escolhido à mão */}
          {!fixedCouncil && (
            <label className="field">
              <span>Conselho *</span>
              <select
                value={form.council}
                onChange={(e) => setField("council", e.target.value)}
              >
                <option value="CRM">CRM</option>
                <option value="CRO">CRO</option>
              </select>
            </label>
          )}

          <label className="field">
            <span>{councilLabel} *</span>
            <input
              value={form.council_code}
              className={errors.council_code ? "invalid" : ""}
              onChange={(e) => setField("council_code", e.target.value)}
              placeholder={`Ex.: ${councilLabel}-SP-12345`}
            />
            {errors.council_code && (
              <p className="form-error">{errors.council_code}</p>
            )}
          </label>

          <label className="field">
            <span>Especialidade *</span>
            <input
              value={form.specialty}
              className={errors.specialty ? "invalid" : ""}
              onChange={(e) => setField("specialty", e.target.value)}
              placeholder={
                form.council === "CRO" ? "Ex.: Ortodontia" : "Ex.: Cardiologia"
              }
            />
            {errors.specialty && (
              <p className="form-error">{errors.specialty}</p>
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
            {saving ? "Salvando…" : `Salvar ${noun}`}
          </button>
        </footer>

      </form>
    </Modal>
  );
}
