import { useEffect, useState } from "react";

import Table from "../../../components/ui/Table";
import ConfirmDialog from "../../Appointments/ConfirmDialog";
import RoleForm from "./RoleForm";

import type { Role } from "../../../services/roleService";
import { getRoles, deleteRole } from "../../../services/roleService";
import { extractErrorMessage } from "../../../utils/errors";

export default function Cargos() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loadError, setLoadError] = useState("");

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Role | null>(null);

  const [toDelete, setToDelete] = useState<Role | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  useEffect(() => {
    load();
  }, []);

  async function load() {
    try {
      setRoles(await getRoles());
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
      await deleteRole(toDelete.id);
      await load();
      setToDelete(null);
    } catch (error) {
      setDeleteError(extractErrorMessage(error));
    } finally {
      setDeleting(false);
    }
  }

  const columns = [
    {
      key: "name" as const,
      label: "Cargo",
      render: (r: Role) => (
        <span className="cell-with-dot">
          {r.name}
          {r.is_admin && <span className="tag-admin">acesso total</span>}
          {r.is_system && <span className="tag-system">padrão</span>}
        </span>
      ),
    },
    { key: "description" as const, label: "Descrição" },
    {
      key: "employee_count" as const,
      label: "Colaboradores",
      render: (r: Role) => String(r.employee_count),
    },
  ];

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <h1>Cargos</h1>
          <p className="page-sub">
            {roles.length} cargo{roles.length === 1 ? "" : "s"} cadastrado
            {roles.length === 1 ? "" : "s"}
          </p>
        </div>

        <div className="page-head-actions">
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            ＋ Novo cargo
          </button>
        </div>
      </header>

      {loadError && <p className="form-error form-error-banner">{loadError}</p>}

      <section className="page-card">
        <div className="page-scroll">
          <Table
            columns={columns}
            data={roles}
            emptyText="Nenhum cargo cadastrado."
            actions={(r) => (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setEditing(r);
                    setFormOpen(true);
                  }}
                >
                  Editar
                </button>
                <button
                  type="button"
                  className="table-delete"
                  disabled={r.is_system}
                  title={r.is_system ? "Cargo padrão não pode ser excluído" : ""}
                  onClick={() => setToDelete(r)}
                >
                  Excluir
                </button>
              </>
            )}
          />
        </div>
      </section>

      <RoleForm
        open={formOpen}
        role={editing}
        onClose={() => setFormOpen(false)}
        onSaved={load}
      />

      <ConfirmDialog
        open={toDelete !== null}
        title="Excluir cargo?"
        message={toDelete ? toDelete.name : ""}
        detail="Colaboradores com este cargo ficarão sem cargo até você atribuir outro."
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
