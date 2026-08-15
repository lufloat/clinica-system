import { useEffect, useMemo, useState } from "react";

import Table from "../../components/ui/Table";
import Pagination from "../../components/ui/Pagination";
import ConfirmDialog from "../Appointments/ConfirmDialog";
import DoctorForm from "./DoctorForm";

import type { Doctor } from "./doctor.types";
import { getDoctors, deleteDoctor } from "../../services/doctorService";
import { extractErrorMessage } from "../../utils/errors";
import { usePagination } from "../../utils/usePagination";
import {
  can,
  labelFor,
  singularOf,
  useCurrentUser,
} from "../../utils/useCurrentUser";
import { doctorColor } from "../Appointments/schedule";

/** Aba do filtro por tipo. "" = todos. */
type CouncilTab = "" | "CRM" | "CRO";

const TABS: { key: CouncilTab; label: string }[] = [
  { key: "", label: "Todos" },
  { key: "CRM", label: "Médicos" },
  { key: "CRO", label: "Dentistas" },
];

export default function Doctors() {

  const { user } = useCurrentUser();

  // Sem vertical (administrador geral) a tela mistura médicos e dentistas, e
  // "Profissionais" é o único nome que serve para os dois. Quem tem vertical
  // vê o nome dela: "Médicos" ou "Dentistas".
  const plural = labelFor(user, "medicos", "Profissionais");
  const singular = singularOf(plural);

  // As abas só fazem sentido para quem enxerga mais de um tipo.
  const showTabs = !user?.vertical;

  // A API recusa o que o cargo não permite; aqui as ações somem da tela para
  // não oferecer um botão que só devolveria 403.
  const podeCriar = can(user, "medicos", "create");
  const podeEditar = can(user, "medicos", "edit");
  const podeExcluir = can(user, "medicos", "delete");

  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [tab, setTab] = useState<CouncilTab>("");
  const [search, setSearch] = useState("");
  const [loadError, setLoadError] = useState("");

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Doctor | null>(null);

  const [toDelete, setToDelete] = useState<Doctor | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  useEffect(() => {
    loadDoctors();
  }, []);

  async function loadDoctors() {
    try {
      setDoctors(await getDoctors());
      setLoadError("");
    } catch (error) {
      setLoadError(extractErrorMessage(error));
    }
  }

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(doctor: Doctor) {
    setEditing(doctor);
    setFormOpen(true);
  }

  async function handleDelete() {
    if (!toDelete || deleting) return;

    try {
      setDeleting(true);
      setDeleteError("");

      await deleteDoctor(toDelete.id!);
      await loadDoctors();

      setToDelete(null);

    } catch (error) {
      setDeleteError(extractErrorMessage(error));
    } finally {
      setDeleting(false);
    }
  }

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();

    return doctors.filter((doctor) => {
      if (tab && doctor.council !== tab) return false;
      if (!term) return true;

      return (
        doctor.name.toLowerCase().includes(term) ||
        doctor.council_code.toLowerCase().includes(term) ||
        doctor.specialty.toLowerCase().includes(term)
      );
    });
  }, [doctors, search, tab]);

  /** Quantos há de cada tipo — vira contador nas abas. */
  const counts = useMemo(
    () => ({
      "": doctors.length,
      CRM: doctors.filter((d) => d.council === "CRM").length,
      CRO: doctors.filter((d) => d.council === "CRO").length,
    }),
    [doctors]
  );

  const { page, setPage, pageCount, pageItems, pageSize, total } =
    usePagination(visible);

  /** a cor é a mesma usada nas colunas da Agenda */
  const columns = [
    {
      key: "name" as const,
      label: "Nome",
      render: (doctor: Doctor) => (
        <span className="cell-with-dot">
          <span
            className="cell-dot"
            style={{ background: doctorColor(doctor.id ?? 0) }}
          />
          {doctor.name}
        </span>
      ),
    },
    {
      key: "council_code" as const,
      label: "Registro",
      render: (doctor: Doctor) => `${doctor.council} ${doctor.council_code}`,
    },
    { key: "specialty" as const, label: "Especialidade" },
    // A vertical decide em qual agenda o profissional aparece, então para
    // quem administra as duas ela é mais do que um rótulo.
    ...(showTabs
      ? [{
          key: "vertical_name" as const,
          label: "Área",
          render: (doctor: Doctor) => doctor.vertical_name ?? "—",
        }]
      : []),
    { key: "phone" as const, label: "Telefone" },
  ];

  return (
    <div className="page">

      <header className="page-head">
        <div>
          <h1>{plural}</h1>
          <p className="page-sub">
            {doctors.length} cadastrado{doctors.length === 1 ? "" : "s"}
          </p>
        </div>

        <div className="page-head-actions">
          <input
            type="search"
            className="page-search"
            placeholder={
              showTabs
                ? "Buscar por nome, registro ou especialidade…"
                : "Buscar por nome, CRM ou especialidade…"
            }
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
          />

          {podeCriar && (
            <button type="button" className="btn btn-primary" onClick={openCreate}>
              ＋ Cadastrar {singular.toLowerCase()}
            </button>
          )}
        </div>
      </header>

      {/* Só o administrador geral enxerga os dois tipos na mesma lista. */}
      {showTabs && (
        <div className="type-tabs" role="tablist" aria-label="Tipo de profissional">
          {TABS.map((item) => (
            <button
              key={item.key || "todos"}
              type="button"
              role="tab"
              aria-selected={tab === item.key}
              className={tab === item.key ? "type-tab active" : "type-tab"}
              onClick={() => {
                setTab(item.key);
                setPage(1);
              }}
            >
              {item.label}
              <span className="type-tab-count">{counts[item.key]}</span>
            </button>
          ))}
        </div>
      )}

      {loadError && <p className="form-error form-error-banner">{loadError}</p>}

      <section className="page-card">
        <div className="page-scroll">
          <Table
            columns={columns}
            data={pageItems}
            emptyText={
              search || tab
                ? `Nenhum ${singular.toLowerCase()} para esse filtro.`
                : `Nenhum ${singular.toLowerCase()} cadastrado.`
            }
            actions={(doctor) => (
              <>
                {podeEditar && (
                  <button type="button" onClick={() => openEdit(doctor)}>
                    Editar
                  </button>
                )}
                {podeExcluir && (
                  <button
                    type="button"
                    className="table-delete"
                    onClick={() => setToDelete(doctor)}
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

      <DoctorForm
        open={formOpen}
        doctor={editing}
        onClose={() => setFormOpen(false)}
        onSaved={loadDoctors}
      />

      <ConfirmDialog
        open={toDelete !== null}
        title={`Excluir ${singular.toLowerCase()}?`}
        message={
          toDelete
            ? `${toDelete.name} — ${toDelete.council} ${toDelete.council_code}`
            : ""
        }
        detail="O cadastro será apagado do sistema. As consultas na agenda dele também serão removidas."
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
