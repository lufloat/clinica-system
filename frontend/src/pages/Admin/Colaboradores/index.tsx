import { useEffect, useMemo, useState } from "react";

import Table from "../../../components/ui/Table";
import Pagination from "../../../components/ui/Pagination";
import ConfirmDialog from "../../Appointments/ConfirmDialog";
import EmployeeForm from "./EmployeeForm";

import type { Employee } from "../../../services/employeeService";
import { getEmployees, deleteEmployee } from "../../../services/employeeService";
import type { Role } from "../../../services/roleService";
import { getRoles } from "../../../services/roleService";
import { extractErrorMessage } from "../../../utils/errors";
import { usePagination } from "../../../utils/usePagination";

export default function Colaboradores() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [search, setSearch] = useState("");
  const [loadError, setLoadError] = useState("");

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Employee | null>(null);

  const [toDelete, setToDelete] = useState<Employee | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  useEffect(() => {
    load();
  }, []);

  async function load() {
    try {
      const [emps, rls] = await Promise.all([getEmployees(), getRoles()]);
      setEmployees(emps);
      setRoles(rls);
      setLoadError("");
    } catch (error) {
      setLoadError(extractErrorMessage(error));
    }
  }

  async function handleDelete() {
    if (!toDelete || deleting) return;
    try {
      setDeleting(true);
      setDeleteError("");
      await deleteEmployee(toDelete.id);
      await load();
      setToDelete(null);
    } catch (error) {
      setDeleteError(extractErrorMessage(error));
    } finally {
      setDeleting(false);
    }
  }

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return employees;
    return employees.filter(
      (e) =>
        e.name.toLowerCase().includes(term) ||
        e.email.toLowerCase().includes(term) ||
        (e.role_name ?? "").toLowerCase().includes(term) ||
        (e.doctor_name ?? "").toLowerCase().includes(term)
    );
  }, [employees, search]);

  const { page, setPage, pageCount, pageItems, pageSize, total } =
    usePagination(visible);

  const columns = [
    { key: "name" as const, label: "Nome" },
    { key: "email" as const, label: "E-mail / Login" },
    {
      key: "role_name" as const,
      label: "Cargo",
      render: (e: Employee) => e.role_name || "—",
    },
    {
      key: "doctor_name" as const,
      label: "Acesso aos dados",
      // Quem tem profissional vinculado só enxerga a própria agenda: é a
      // informação que o administrador precisa conferir de relance.
      render: (e: Employee) =>
        e.doctor_name ? (
          <span className="scope-badge" title="Vê apenas os próprios atendimentos">
            {e.doctor_name}
          </span>
        ) : (
          <span className="scope-badge scope-badge--all">Todos</span>
        ),
    },
    {
      key: "is_active" as const,
      label: "Status",
      render: (e: Employee) => (
        <span className={`status-badge ${e.is_active ? "on" : "off"}`}>
          {e.is_active ? "Ativo" : "Inativo"}
        </span>
      ),
    },
  ];

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <h1>Colaboradores</h1>
          <p className="page-sub">
            {employees.length} usuário{employees.length === 1 ? "" : "s"} com acesso
          </p>
        </div>

        <div className="page-head-actions">
          <input
            type="search"
            className="page-search"
            placeholder="Buscar por nome, e-mail ou cargo…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            ＋ Cadastrar colaborador
          </button>
        </div>
      </header>

      {loadError && <p className="form-error form-error-banner">{loadError}</p>}

      <section className="page-card">
        <div className="page-scroll">
          <Table
            columns={columns}
            data={pageItems}
            emptyText={
              search
                ? "Nenhum colaborador para essa busca."
                : "Nenhum colaborador cadastrado."
            }
            actions={(e) => (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setEditing(e);
                    setFormOpen(true);
                  }}
                >
                  Editar
                </button>
                <button
                  type="button"
                  className="table-delete"
                  onClick={() => setToDelete(e)}
                >
                  Excluir
                </button>
              </>
            )}
          />
        </div>

        <Pagination
          page={page}
          pageCount={pageCount}
          total={total}
          pageSize={pageSize}
          onChange={setPage}
        />
      </section>

      <EmployeeForm
        open={formOpen}
        employee={editing}
        roles={roles}
        onClose={() => setFormOpen(false)}
        onSaved={load}
      />

      <ConfirmDialog
        open={toDelete !== null}
        title="Excluir colaborador?"
        message={toDelete ? `${toDelete.name} — ${toDelete.email}` : ""}
        detail="O acesso será removido permanentemente. Para apenas suspender, edite e marque como Inativo."
        confirmLabel="Excluir"
        busy={deleting}
        error={deleteError}
        onConfirm={handleDelete}
        onCancel={() => {
          setToDelete(null);
          setDeleteError("");
        }}
      />
    </div>
  );
}
