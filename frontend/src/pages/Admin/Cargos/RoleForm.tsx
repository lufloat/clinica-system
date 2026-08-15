import { useEffect, useState } from "react";

import Modal from "../../../components/ui/Modal";
import type { Role } from "../../../services/roleService";
import { createRole, updateRole } from "../../../services/roleService";
import { extractErrorMessage } from "../../../utils/errors";

type Props = {
  open: boolean;
  role: Role | null;
  onClose: () => void;
  onSaved: () => void;
};

export default function RoleForm({ open, role, onClose, onSaved }: Props) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName(role?.name ?? "");
    setDescription(role?.description ?? "");
    setErrors({});
  }, [open, role]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (saving) return;
    if (!name.trim()) {
      setErrors({ name: "Nome do cargo é obrigatório." });
      return;
    }

    try {
      setSaving(true);
      if (role) {
        await updateRole(role.id, { name, description });
      } else {
        await createRole({ name, description, permissions: {} });
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
      title={role ? "Editar cargo" : "Novo cargo"}
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="modal-body" noValidate>
        {errors.form && (
          <p className="form-error form-error-banner">{errors.form}</p>
        )}

        <label className="field">
          <span>Nome do cargo *</span>
          <input
            value={name}
            className={errors.name ? "invalid" : ""}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex.: Enfermagem"
          />
          {errors.name && <p className="form-error">{errors.name}</p>}
        </label>

        <label className="field">
          <span>Descrição</span>
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Breve descrição do cargo"
          />
        </label>

        <p className="field-hint">
          As permissões deste cargo são definidas na aba <strong>Permissões</strong>.
        </p>

        <footer className="modal-foot">
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Cancelar
          </button>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? "Salvando…" : "Salvar cargo"}
          </button>
        </footer>
      </form>
    </Modal>
  );
}
