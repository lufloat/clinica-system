import { useEffect, useMemo, useState } from "react";

import Table from "../../components/ui/Table";
import Pagination from "../../components/ui/Pagination";
import ConfirmDialog from "../Appointments/ConfirmDialog";
import PatientForm from "./PatientForm";

import type { Patient } from "./patient.types";
import { getPatients, deletePatient } from "../../services/patientService";
import { extractErrorMessage } from "../../utils/errors";
import { usePagination } from "../../utils/usePagination";
import { can, useCurrentUser } from "../../utils/useCurrentUser";

const columns = [
  { key: "name", label: "Nome" },
  { key: "cpf", label: "CPF" },
  { key: "phone", label: "Telefone" },
  { key: "email", label: "E-mail" },
] as const;

export default function Patients() {

  // A API recusa o que o cargo não permite; aqui as ações somem da tela para
  // não oferecer um botão que só devolveria 403.
  const { user } = useCurrentUser();
  const podeCriar = can(user, "pacientes", "create");
  const podeEditar = can(user, "pacientes", "edit");
  const podeExcluir = can(user, "pacientes", "delete");

  const [patients, setPatients] = useState<Patient[]>([]);
  const [search, setSearch] = useState("");
  const [loadError, setLoadError] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Patient | null>(null);
  const [toDelete, setToDelete] = useState<Patient | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  useEffect(() => {
    loadPatients();
  }, []);

  async function loadPatients() {
    try {
      setPatients(await getPatients());
      setLoadError("");
    } catch (error) {
      setLoadError(extractErrorMessage(error));
    }
  }

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(patient: Patient) {
    setEditing(patient);
    setFormOpen(true);
  }

  async function handleDelete() {
    if (!toDelete || deleting) return;

    try {
      setDeleting(true);
      setDeleteError("");

      await deletePatient(toDelete.id!);
      await loadPatients();

      setToDelete(null);

    } catch (error) {
      setDeleteError(extractErrorMessage(error));
    } finally {
      setDeleting(false);
    }
  }

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return patients;

    return patients.filter(
      (patient) =>
        patient.name.toLowerCase().includes(term) ||
        patient.cpf.includes(term)
    );
  }, [patients, search]);

  const { page, setPage, pageCount, pageItems, pageSize, total } =
    usePagination(visible);

  return (
    <div className="page">

      <header className="page-head">
        <div>
          <h1>Pacientes</h1>
          <p className="page-sub">
            {patients.length} cadastrado{patients.length === 1 ? "" : "s"}
          </p>
        </div>

        <div className="page-head-actions">
          <input
            type="search"
            className="page-search"
            placeholder="Buscar por nome ou CPF…"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
          />

          {podeCriar && (
            <button type="button" className="btn btn-primary" onClick={openCreate}>
              ＋ Cadastrar paciente
            </button>
          )}
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
                ? "Nenhum paciente para essa busca."
                : "Nenhum paciente cadastrado."
            }
            actions={(patient) => (
              <>
                {podeEditar && (
                  <button type="button" onClick={() => openEdit(patient)}>
                    Editar
                  </button>
                )}
                {podeExcluir && (
                  <button
                    type="button"
                    className="table-delete"
                    onClick={() => setToDelete(patient)}
                  >
                    Excluir
                  </button>
                )}
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

      <PatientForm
        open={formOpen}
        patient={editing}
        onClose={() => setFormOpen(false)}
        onSaved={loadPatients}
      />

      <ConfirmDialog
        open={toDelete !== null}
        title="Excluir paciente?"
        message={toDelete ? `${toDelete.name} — ${toDelete.cpf}` : ""}
        detail="O paciente será apagado do sistema. As consultas ligadas a ele também serão removidas."
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
