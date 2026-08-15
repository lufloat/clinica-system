import { useEffect, useState } from "react";

import Table from "../../components/ui/Table";
import Pagination from "../../components/ui/Pagination";
import ConfirmDialog from "../Appointments/ConfirmDialog";
import OfficeForm from "./OfficeForm";

import type { Office } from "./office.types";
import { getOffices, deleteOffice } from "../../services/officeService";
import { extractErrorMessage } from "../../utils/errors";
import { usePagination } from "../../utils/usePagination";
import { can, useCurrentUser } from "../../utils/useCurrentUser";

const columns = [
  { key: "name", label: "Consultório" },
  { key: "room", label: "Sala" },
  { key: "floor", label: "Andar" },
  { key: "observations", label: "Observações" },
] as const;

export default function Offices() {

  // A API recusa o que o cargo não permite; aqui as ações somem da tela para
  // não oferecer um botão que só devolveria 403.
  const { user } = useCurrentUser();
  const podeCriar = can(user, "consultorios", "create");
  const podeEditar = can(user, "consultorios", "edit");
  const podeExcluir = can(user, "consultorios", "delete");

  const [offices, setOffices] = useState<Office[]>([]);
  const [loadError, setLoadError] = useState("");

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Office | null>(null);

  const [toDelete, setToDelete] = useState<Office | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const { page, setPage, pageCount, pageItems, pageSize, total } =
    usePagination(offices);

  useEffect(() => {
    loadOffices();
  }, []);

  async function loadOffices() {
    try {
      setOffices(await getOffices());
      setLoadError("");
    } catch (error) {
      setLoadError(extractErrorMessage(error));
    }
  }

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(office: Office) {
    setEditing(office);
    setFormOpen(true);
  }

  async function handleDelete() {
    if (!toDelete || deleting) return;

    try {
      setDeleting(true);
      setDeleteError("");

      await deleteOffice(toDelete.id!);
      await loadOffices();

      setToDelete(null);

    } catch (error) {
      setDeleteError(extractErrorMessage(error));
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="page">

      <header className="page-head">
        <div>
          <h1>Consultórios</h1>
          <p className="page-sub">
            {offices.length} cadastrado{offices.length === 1 ? "" : "s"}
          </p>
        </div>

        <div className="page-head-actions">
          {podeCriar && (
            <button type="button" className="btn btn-primary" onClick={openCreate}>
              ＋ Cadastrar consultório
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
            emptyText="Nenhum consultório cadastrado."
            actions={(office) => (
              <>
                {podeEditar && (
                  <button type="button" onClick={() => openEdit(office)}>
                    Editar
                  </button>
                )}
                {podeExcluir && (
                  <button
                    type="button"
                    className="table-delete"
                    onClick={() => setToDelete(office)}
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

      <OfficeForm
        open={formOpen}
        office={editing}
        onClose={() => setFormOpen(false)}
        onSaved={loadOffices}
      />

      <ConfirmDialog
        open={toDelete !== null}
        title="Excluir consultório?"
        message={toDelete ? `${toDelete.name} — sala ${toDelete.room}` : ""}
        detail="O consultório será apagado do sistema. As consultas marcadas nele também serão removidas."
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
