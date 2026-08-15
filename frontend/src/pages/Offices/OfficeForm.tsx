import { useEffect, useState } from "react";

import Modal from "../../components/ui/Modal";

import type { Office } from "./office.types";
import { createOffice, updateOffice } from "../../services/officeService";
import { extractErrorMessage } from "../../utils/errors";

type Props = {
  open: boolean;
  /** quando presente, o formulário edita em vez de criar */
  office: Office | null;
  onClose: () => void;
  onSaved: () => void;
};

const EMPTY: Office = {
  name: "",
  room: "",
  floor: "",
  observations: "",
};

const REQUIRED: Array<keyof Office> = ["name", "room"];

const LABELS: Record<string, string> = {
  name: "Nome",
  room: "Sala",
};

export default function OfficeForm({ open, office, onClose, onSaved }: Props) {

  const [form, setForm] = useState<Office>(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm(office ?? EMPTY);
    setErrors({});
  }, [open, office]);

  function setField(field: keyof Office, value: string) {
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

      if (office?.id) {
        await updateOffice(office.id, form);
      } else {
        await createOffice(form);
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
      title={office ? "Editar consultório" : "Novo consultório"}
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
            placeholder="Ex.: Consultório 1"
          />
          {errors.name && <p className="form-error">{errors.name}</p>}
        </label>

        <div className="field-row">
          <label className="field">
            <span>Sala *</span>
            <input
              value={form.room}
              className={errors.room ? "invalid" : ""}
              onChange={(e) => setField("room", e.target.value)}
              placeholder="Ex.: 101"
            />
            {errors.room && <p className="form-error">{errors.room}</p>}
          </label>

          <label className="field">
            <span>Andar</span>
            <input
              value={form.floor}
              onChange={(e) => setField("floor", e.target.value)}
              placeholder="Ex.: 1º andar"
            />
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
            {saving ? "Salvando…" : "Salvar consultório"}
          </button>
        </footer>

      </form>
    </Modal>
  );
}
