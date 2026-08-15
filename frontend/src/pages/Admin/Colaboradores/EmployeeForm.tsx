import { useEffect, useState } from "react";

import Modal from "../../../components/ui/Modal";
import type { Employee } from "../../../services/employeeService";
import { createEmployee, updateEmployee } from "../../../services/employeeService";
import { getDoctors } from "../../../services/doctorService";
import type { Role } from "../../../services/roleService";
import { extractErrorMessage } from "../../../utils/errors";

type Props = {
  open: boolean;
  employee: Employee | null;
  roles: Role[];
  onClose: () => void;
  onSaved: () => void;
};

/** Opção do seletor de profissional. */
type DoctorOption = {
  id: number;
  name: string;
  council: string;
  specialty: string;
};

type FormState = {
  name: string;
  email: string;
  username: string;
  password: string;
  role_id: string;
  doctor_id: string;
  is_active: boolean;
};

const EMPTY: FormState = {
  name: "",
  email: "",
  username: "",
  password: "",
  role_id: "",
  doctor_id: "",
  is_active: true,
};

export default function EmployeeForm({
  open,
  employee,
  roles,
  onClose,
  onSaved,
}: Props) {
  const [form, setForm] = useState<FormState>(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [doctors, setDoctors] = useState<DoctorOption[]>([]);

  useEffect(() => {
    if (!open) return;
    if (employee) {
      setForm({
        name: employee.name,
        email: employee.email,
        username: employee.username,
        password: "",
        role_id: employee.role_id ? String(employee.role_id) : "",
        doctor_id: employee.doctor_id ? String(employee.doctor_id) : "",
        is_active: employee.is_active,
      });
    } else {
      setForm(EMPTY);
    }
    setErrors({});
  }, [open, employee]);

  // A lista vem recortada pela vertical de quem administra, como todo o resto
  // do módulo de profissionais.
  useEffect(() => {
    if (!open) return;
    getDoctors()
      .then(setDoctors)
      .catch(() => setDoctors([]));
  }, [open]);

  function setField(field: keyof FormState, value: string | boolean) {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: "" }));
  }

  function validate(): boolean {
    const found: Record<string, string> = {};
    if (!form.name.trim()) found.name = "Nome é obrigatório.";
    if (!form.email.trim()) found.email = "E-mail é obrigatório.";
    // senha obrigatória só na criação
    if (!employee && !form.password) found.password = "Senha temporária é obrigatória.";
    setErrors(found);
    return Object.keys(found).length === 0;
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (saving || !validate()) return;

    const payload = {
      name: form.name,
      email: form.email,
      username: form.username || undefined,
      password: form.password || undefined,
      role_id: form.role_id ? Number(form.role_id) : null,
      doctor_id: form.doctor_id ? Number(form.doctor_id) : null,
      is_active: form.is_active,
    };

    try {
      setSaving(true);
      if (employee) {
        await updateEmployee(employee.id, payload);
      } else {
        await createEmployee(payload);
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
      title={employee ? "Editar colaborador" : "Novo colaborador"}
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
            <span>E-mail *</span>
            <input
              type="email"
              value={form.email}
              className={errors.email ? "invalid" : ""}
              onChange={(e) => setField("email", e.target.value)}
              placeholder="email@clinica.com"
            />
            {errors.email && <p className="form-error">{errors.email}</p>}
          </label>

          <label className="field">
            <span>Login (opcional)</span>
            <input
              value={form.username}
              onChange={(e) => setField("username", e.target.value)}
              placeholder="Usa o e-mail se vazio"
            />
          </label>
        </div>

        <div className="field-row">
          <label className="field">
            <span>{employee ? "Nova senha (opcional)" : "Senha temporária *"}</span>
            <input
              type="text"
              value={form.password}
              className={errors.password ? "invalid" : ""}
              onChange={(e) => setField("password", e.target.value)}
              placeholder={employee ? "Deixe vazio p/ manter" : "Senha inicial"}
            />
            {errors.password && <p className="form-error">{errors.password}</p>}
          </label>

          <label className="field">
            <span>Cargo</span>
            <select
              value={form.role_id}
              onChange={(e) => setField("role_id", e.target.value)}
            >
              <option value="">Sem cargo</option>
              {roles.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className="field">
          <span>Profissional vinculado</span>
          <select
            value={form.doctor_id}
            onChange={(e) => setField("doctor_id", e.target.value)}
          >
            <option value="">Nenhum — vê os dados de todos</option>
            {doctors.map((doctor) => (
              <option key={doctor.id} value={doctor.id}>
                {doctor.name} · {doctor.council} · {doctor.specialty}
              </option>
            ))}
          </select>
          <p className="field-hint">
            Vincular restringe o acesso: agenda, dashboard e relatórios passam
            a mostrar apenas os atendimentos deste profissional. Deixe em
            branco para cargos administrativos.
          </p>
        </label>

        <label className="field-check">
          <input
            type="checkbox"
            checked={form.is_active}
            onChange={(e) => setField("is_active", e.target.checked)}
          />
          <span>Ativo (pode acessar o sistema)</span>
        </label>

        <p className="field-hint">
          O colaborador será obrigado a trocar a senha no primeiro acesso.
        </p>

        <footer className="modal-foot">
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Cancelar
          </button>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? "Salvando…" : "Salvar colaborador"}
          </button>
        </footer>
      </form>
    </Modal>
  );
}
