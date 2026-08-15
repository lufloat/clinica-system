import { useEffect, useMemo, useState } from "react";

import "./Appointments.css";

import AppointmentModal from "./AppointmentModal";
import type { Option, Prefill } from "./AppointmentModal";
import ConfirmDialog from "./ConfirmDialog";
import VerticalTabs from "../../components/ui/VerticalTabs";

import type { Appointment } from "./appointment.types";
import {
  getAppointments,
  finalizeAppointment,
  cancelAppointment,
  deleteAppointment,
} from "../../services/appointmentService";
import { getDoctors } from "../../services/doctorService";
import { getPatients } from "../../services/patientService";
import { getOffices } from "../../services/officeService";
import { extractErrorMessage } from "../../utils/errors";
import {
  isScopedToOwnData,
  labelFor,
  useCurrentUser,
} from "../../utils/useCurrentUser";

import {
  STATUS,
  STATUS_KEYS,
  isStatusKey,
  doctorColor,
  initials,
  buildSlots,
  isWithinWorkingHours,
  normalizeTime,
  todayISO,
  shiftDate,
  formatLongDate,
  nowOffset,
  formatClock,
} from "./schedule";
import type { StatusKey } from "./schedule";

const SLOTS = buildSlots();

type View = "grid" | "list";

type DoctorOption = Option & { specialty: string; verticalSlug?: string };

const SUMMARY_ICONS: Record<StatusKey, string> = {
  AGENDADA: "◔",
  FINALIZADA: "✓",
  CANCELADA: "✕",
};

function statusOf(appointment: Appointment): StatusKey {
  const raw = appointment.status ?? "AGENDADA";
  return isStatusKey(raw) ? raw : "AGENDADA";
}

export default function Appointments() {

  const { user } = useCurrentUser();
  // Profissional vinculado não agenda: a API recusa o POST (core/scoping.py),
  // então o botão sairia da tela só para dar erro depois.
  const scoped = isScopedToOwnData(user);

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctors, setDoctors] = useState<DoctorOption[]>([]);
  const [patients, setPatients] = useState<Option[]>([]);
  const [offices, setOffices] = useState<Option[]>([]);

  const [date, setDate] = useState(todayISO());
  const [view, setView] = useState<View>("grid");
  /** "" = todas as áreas na mesma grade */
  const [vertical, setVertical] = useState("");

  const [doctorFilter, setDoctorFilter] = useState<number[]>([]);
  const [officeFilter, setOfficeFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<StatusKey[]>([]);
  const [search, setSearch] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [prefill, setPrefill] = useState<Prefill>({});
  const [loadError, setLoadError] = useState("");

  /** consulta aguardando confirmação de exclusão */
  const [toDelete, setToDelete] = useState<Appointment | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    loadEverything();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vertical]);

  /** A linha de "agora" precisa andar sozinha enquanto a tela fica aberta. */
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(timer);
  }, []);

  async function loadEverything() {
    try {
      // `allSettled`, não `all`: o profissional não tem os módulos de
      // profissionais e consultórios, e um 403 nesses derrubaria a agenda
      // inteira — inclusive a lista de consultas, que é o que ele veio ver.
      const [appointments, doctorsResult, patientsResult, officesResult] =
        await Promise.allSettled([
          getAppointments(vertical),
          getDoctors(),
          getPatients(),
          getOffices(),
        ]);

      if (appointments.status === "rejected") {
        setLoadError(extractErrorMessage(appointments.reason));
        return;
      }

      const appointmentsData = appointments.value;
      const doctorsData =
        doctorsResult.status === "fulfilled" ? doctorsResult.value : [];
      const patientsData =
        patientsResult.status === "fulfilled" ? patientsResult.value : [];
      const officesData =
        officesResult.status === "fulfilled" ? officesResult.value : [];

      setAppointments(appointmentsData);

      // As colunas da grade acompanham a área escolhida: mostrar um dentista
      // sem horário nenhum na agenda médica só rouba largura da tela.
      setDoctors(
        doctorsData
          .filter(
            (doctor: { vertical_slug?: string }) =>
              !vertical || doctor.vertical_slug === vertical
          )
          .map((doctor: {
            id: number;
            name: string;
            specialty: string;
            vertical_slug?: string;
          }) => ({
            value: doctor.id,
            label: doctor.name,
            specialty: doctor.specialty,
            verticalSlug: doctor.vertical_slug,
          }))
      );
      setPatients(
        patientsData.map(
          (patient: { id: number; name: string; cpf: string; phone: string }) => ({
            value: patient.id,
            label: patient.name,
            hint: patient.cpf,
            // CPF e telefone entram na busca, não só o nome
            searchText: `${patient.cpf} ${patient.phone ?? ""}`,
          })
        )
      );
      setOffices(toOptions(officesData));
      setLoadError("");

    } catch (error) {
      setLoadError(extractErrorMessage(error));
    }
  }

  async function reloadAppointments() {
    try {
      setAppointments(await getAppointments(vertical));
    } catch (error) {
      setLoadError(extractErrorMessage(error));
    }
  }

  async function handleFinalize(id: number) {
    try {
      await finalizeAppointment(id);
      await reloadAppointments();
    } catch (error) {
      alert(extractErrorMessage(error));
    }
  }

  async function handleCancel(id: number) {
    try {
      await cancelAppointment(id);
      await reloadAppointments();
    } catch (error) {
      alert(extractErrorMessage(error));
    }
  }

  async function handleDelete() {
    if (!toDelete || deleting) return;

    try {
      setDeleting(true);
      setDeleteError("");

      await deleteAppointment(toDelete.id!);
      await reloadAppointments();

      setToDelete(null);

    } catch (error) {
      setDeleteError(extractErrorMessage(error));
    } finally {
      setDeleting(false);
    }
  }

  const isToday = date === todayISO();

  const hasFilters =
    doctorFilter.length > 0 ||
    statusFilter.length > 0 ||
    officeFilter !== "" ||
    search.trim() !== "";

  function clearFilters() {
    setDoctorFilter([]);
    setStatusFilter([]);
    setOfficeFilter("");
    setSearch("");
  }

  /** Consultas do dia selecionado, antes dos filtros — base do resumo. */
  const dayAppointments = useMemo(
    () => appointments.filter((a) => a.appointment_date === date),
    [appointments, date]
  );

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();

    return dayAppointments.filter((appointment) => {
      if (doctorFilter.length && !doctorFilter.includes(appointment.doctor)) {
        return false;
      }

      if (statusFilter.length && !statusFilter.includes(statusOf(appointment))) {
        return false;
      }

      if (officeFilter && String(appointment.office) !== officeFilter) {
        return false;
      }

      if (term && !(appointment.patient_name ?? "").toLowerCase().includes(term)) {
        return false;
      }

      return true;
    });
  }, [dayAppointments, doctorFilter, statusFilter, officeFilter, search]);

  const summary = useMemo(() => {
    const counts = { AGENDADA: 0, FINALIZADA: 0, CANCELADA: 0 };

    for (const appointment of dayAppointments) {
      counts[statusOf(appointment)]++;
    }

    return { total: dayAppointments.length, counts };
  }, [dayAppointments]);

  /**
   * Profissionais que a grade conhece.
   *
   * O profissional vinculado não tem o módulo de profissionais e recebe 403
   * ao listá-los — a coluna dele vem do próprio perfil, senão a agenda dele
   * abriria sem coluna nenhuma e as consultas não teriam onde aparecer.
   */
  const doctorOptions = useMemo<DoctorOption[]>(() => {
    if (doctors.length) return doctors;

    if (user?.doctor) {
      return [{
        value: user.doctor.id,
        label: user.doctor.name,
        specialty: user.doctor.specialty,
      }];
    }

    return [];
  }, [doctors, user]);

  /** Colunas da grade: só os médicos filtrados, ou todos quando não há filtro. */
  const columns = doctorFilter.length
    ? doctorOptions.filter((doctor) => doctorFilter.includes(doctor.value))
    : doctorOptions;

  /** Índice (médico, hora) → consulta, para achar o bloco de cada célula. */
  const bySlot = useMemo(() => {
    const map = new Map<string, Appointment>();

    for (const appointment of visible) {
      map.set(
        `${appointment.doctor}|${normalizeTime(appointment.appointment_time)}`,
        appointment
      );
    }

    return map;
  }, [visible]);

  const lineOffset = isToday ? nowOffset(now) : null;

  function openModal(next: Prefill) {
    setPrefill(next);
    setModalOpen(true);
  }

  function toggleDoctor(id: number) {
    setDoctorFilter((current) =>
      current.includes(id)
        ? current.filter((value) => value !== id)
        : [...current, id]
    );
  }

  /**
   * Trocar de área recarrega a agenda e limpa o filtro de profissionais:
   * os selecionados eram da área anterior e sumiriam das colunas.
   */
  function changeVertical(slug: string) {
    setVertical(slug);
    setDoctorFilter([]);
  }

  const areaName =
    user?.verticals.find((item) => item.slug === vertical)?.name ?? "";

  function toggleStatus(key: StatusKey) {
    setStatusFilter((current) =>
      current.includes(key)
        ? current.filter((value) => value !== key)
        : [...current, key]
    );
  }

  return (
    <div className="agenda">

      <header className="agenda-head">
        <div>
          <div className="agenda-title">
            <h1>Agenda</h1>
            {isToday && <span className="badge-today">Hoje</span>}
          </div>
          <p className="agenda-date">
            {formatLongDate(date)}
            {areaName ? ` · ${areaName}` : ""}
          </p>
        </div>

        <div className="agenda-head-actions">
          <div className="view-toggle" role="group" aria-label="Alternar visão">
            <button
              type="button"
              className={view === "grid" ? "active" : ""}
              onClick={() => setView("grid")}
            >
              Grade
            </button>
            <button
              type="button"
              className={view === "list" ? "active" : ""}
              onClick={() => setView("list")}
            >
              Lista
            </button>
          </div>

          {!scoped && (
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => openModal({ appointment_date: date })}
            >
              ＋ Nova consulta
            </button>
          )}
        </div>
      </header>

      <VerticalTabs
        options={user?.verticals ?? []}
        value={vertical}
        onChange={changeVertical}
      />

      {loadError && <p className="form-error form-error-banner">{loadError}</p>}

      <section className="stats">
        <article className="stat stat-total">
          <span className="stat-icon">▤</span>
          <div>
            <strong>{summary.total}</strong>
            <span>Consultas hoje</span>
          </div>
        </article>

        {STATUS_KEYS.map((key) => (
          <article key={key} className="stat" style={{ borderTopColor: STATUS[key].color }}>
            <span
              className="stat-icon"
              style={{ background: STATUS[key].soft, color: STATUS[key].color }}
            >
              {SUMMARY_ICONS[key]}
            </span>
            <div>
              <strong style={{ color: STATUS[key].color }}>{summary.counts[key]}</strong>
              <span>{STATUS[key].label}s</span>
            </div>
          </article>
        ))}
      </section>

      <section className="ag-card filters">
        <div className="filter-line filter-line-top">
          <div className="date-nav">
            <button type="button" onClick={() => setDate(shiftDate(date, -1))}>
              ‹ Anterior
            </button>
            <button
              type="button"
              className={isToday ? "today active" : "today"}
              onClick={() => setDate(todayISO())}
            >
              Hoje
            </button>
            <button type="button" onClick={() => setDate(shiftDate(date, 1))}>
              Próximo ›
            </button>
          </div>

          <input
            type="date"
            className="date-picker"
            value={date}
            onChange={(event) => setDate(event.target.value)}
          />

          <button
            type="button"
            className="clear-link"
            onClick={clearFilters}
            disabled={!hasFilters}
          >
            Limpar filtros
          </button>
        </div>

        {/* Filtrar entre um profissional só não filtra nada — é o caso de
            quem enxerga apenas a própria agenda. */}
        {doctorOptions.length > 1 && (
        <div className="filter-line">
          <span className="filter-label">
            {labelFor(user, "medicos", "Profissionais")}
          </span>
          <div className="chips">
            {doctorOptions.map((doctor) => {
              const active = doctorFilter.includes(doctor.value);
              const color = doctorColor(doctor.value);

              return (
                <button
                  key={doctor.value}
                  type="button"
                  className={`chip ${active ? "chip-active" : ""}`}
                  style={
                    active
                      ? { background: color, borderColor: color }
                      : { borderColor: color }
                  }
                  onClick={() => toggleDoctor(doctor.value)}
                >
                  <span
                    className="chip-dot"
                    style={{ background: active ? "#fff" : color }}
                  />
                  {doctor.label}
                </button>
              );
            })}
          </div>
        </div>
        )}

        <div className="filter-line">
          <span className="filter-label">Status</span>
          <div className="chips">
            {STATUS_KEYS.map((key) => {
              const active = statusFilter.includes(key);

              return (
                <button
                  key={key}
                  type="button"
                  className={`chip ${active ? "chip-active" : ""}`}
                  style={
                    active
                      ? { background: STATUS[key].color, borderColor: STATUS[key].color }
                      : { borderColor: STATUS[key].color }
                  }
                  onClick={() => toggleStatus(key)}
                >
                  <span
                    className="chip-dot"
                    style={{ background: active ? "#fff" : STATUS[key].color }}
                  />
                  {STATUS[key].label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="filter-line filter-line-inputs">
          <select
            className="control"
            value={officeFilter}
            onChange={(event) => setOfficeFilter(event.target.value)}
          >
            <option value="">Todos os consultórios</option>
            {offices.map((office) => (
              <option key={office.value} value={office.value}>
                {office.label}
              </option>
            ))}
          </select>

          <input
            className="control"
            type="search"
            placeholder="Buscar paciente…"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
      </section>

      {view === "grid" ? (
        <section className="ag-card grid-wrap">
          {columns.length === 0 ? (
            <p className="empty">Nenhum médico cadastrado.</p>
          ) : (
            <div className="grid-scroll">
              <div
                className="grid"
                style={{
                  gridTemplateColumns: `72px repeat(${columns.length}, minmax(0, 1fr))`,
                }}
              >
                <div className="grid-corner" />

                {columns.map((doctor) => (
                  <div
                    key={doctor.value}
                    className="grid-col-head"
                    style={{ borderTopColor: doctorColor(doctor.value) }}
                  >
                    <span
                      className="col-avatar"
                      style={{ background: doctorColor(doctor.value) }}
                    >
                      {initials(doctor.label)}
                    </span>
                    <div className="col-info">
                      <strong>{doctor.label}</strong>
                      <span>{doctor.specialty}</span>
                    </div>
                  </div>
                ))}

                {SLOTS.map((slot) => (
                  <SlotRow
                    key={slot}
                    slot={slot}
                    columns={columns}
                    bySlot={bySlot}
                    date={date}
                    onOpen={openModal}
                    canCreate={!scoped}
                    onFinalize={handleFinalize}
                    onCancel={handleCancel}
                    onDelete={setToDelete}
                  />
                ))}
              </div>

              {lineOffset !== null && (
                <div
                  className="now-line"
                  style={{ top: `calc(var(--head-h) + ${lineOffset}px)` }}
                >
                  <span className="now-time">{formatClock(now)}</span>
                </div>
              )}
            </div>
          )}
        </section>
      ) : (
        <section className="ag-card">
          <table className="list">
            <thead>
              <tr>
                <th>Hora</th>
                <th>Paciente</th>
                <th>Médico</th>
                <th>Consultório</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {visible.length === 0 && (
                <tr>
                  <td colSpan={6} className="empty">
                    Nenhuma consulta para os filtros escolhidos.
                  </td>
                </tr>
              )}

              {[...visible]
                .sort((a, b) =>
                  a.appointment_time.localeCompare(b.appointment_time)
                )
                .map((appointment) => {
                  const status = statusOf(appointment);

                  return (
                    <tr key={appointment.id}>
                      <td className="mono">
                        {normalizeTime(appointment.appointment_time)}
                      </td>
                      <td>{appointment.patient_name}</td>
                      <td>
                        <span
                          className="doctor-dot"
                          style={{ background: doctorColor(appointment.doctor) }}
                        />
                        {appointment.doctor_name}
                      </td>
                      <td>{appointment.office_name}</td>
                      <td>
                        <span
                          className="badge"
                          style={{
                            background: STATUS[status].soft,
                            color: STATUS[status].ink,
                          }}
                        >
                          {STATUS[status].label}
                        </span>
                      </td>
                      <td className="row-actions">
                        <button
                          type="button"
                          onClick={() => handleFinalize(appointment.id!)}
                        >
                          Finalizar
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCancel(appointment.id!)}
                        >
                          Cancelar
                        </button>
                        <button
                          type="button"
                          className="row-delete"
                          onClick={() => setToDelete(appointment)}
                        >
                          Excluir
                        </button>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </section>
      )}

      <AppointmentModal
        open={modalOpen}
        prefill={prefill}
        doctors={doctorOptions}
        patients={patients}
        offices={offices}
        onClose={() => setModalOpen(false)}
        onCreated={reloadAppointments}
      />

      <ConfirmDialog
        open={toDelete !== null}
        title="Excluir consulta?"
        message={
          toDelete
            ? `${toDelete.patient_name} — ${normalizeTime(
                toDelete.appointment_time
              )} com ${toDelete.doctor_name}.`
            : ""
        }
        detail="A consulta será apagada do sistema e não poderá ser recuperada. Para manter o histórico, use Cancelar."
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

type SlotRowProps = {
  slot: string;
  columns: DoctorOption[];
  bySlot: Map<string, Appointment>;
  date: string;
  onOpen: (prefill: Prefill) => void;
  /** false para o profissional vinculado: a API recusa a criação. */
  canCreate: boolean;
  onFinalize: (id: number) => void;
  onCancel: (id: number) => void;
  onDelete: (appointment: Appointment) => void;
};

function SlotRow({
  slot,
  columns,
  bySlot,
  date,
  onOpen,
  canCreate,
  onFinalize,
  onCancel,
  onDelete,
}: SlotRowProps) {

  return (
    <>
      <div className="grid-time">
        {slot.endsWith(":00") && <span>{slot}</span>}
      </div>

      {columns.map((doctor) => {
        const appointment = bySlot.get(`${doctor.value}|${slot}`);
        const off = !isWithinWorkingHours(slot, doctor.value);

        if (appointment) {
          const status = statusOf(appointment);
          const kind = appointment.observations?.trim() || doctor.specialty;

          return (
            <div key={doctor.value} className="grid-cell">
              <div
                className="event"
                style={{
                  background: STATUS[status].soft,
                  borderLeftColor: STATUS[status].color,
                }}
                title={`${appointment.patient_name} — ${kind} — ${normalizeTime(
                  appointment.appointment_time
                )} — ${appointment.office_name}`}
              >
                <div className="event-top">
                  <span className="event-patient">{appointment.patient_name}</span>
                  <span
                    className="event-badge"
                    style={{ background: STATUS[status].color }}
                  >
                    {STATUS[status].label}
                  </span>
                </div>

                <span className="event-kind">{kind}</span>

                <span className="event-meta">
                  {normalizeTime(appointment.appointment_time)} · {appointment.office_name}
                </span>

                <div className="event-actions">
                  <button type="button" onClick={() => onFinalize(appointment.id!)}>
                    Finalizar
                  </button>
                  <button type="button" onClick={() => onCancel(appointment.id!)}>
                    Cancelar
                  </button>
                  <button
                    type="button"
                    className="event-delete"
                    title="Excluir consulta"
                    aria-label="Excluir consulta"
                    onClick={() => onDelete(appointment)}
                  >
                    🗑
                  </button>
                </div>
              </div>
            </div>
          );
        }

        if (off) {
          return (
            <div
              key={doctor.value}
              className="grid-cell grid-cell-off"
              title="Fora do expediente"
            />
          );
        }

        // Horário livre continua legível para quem não agenda, mas sem o
        // botão de "＋": ele só levaria a um 403.
        if (!canCreate) {
          return <div key={doctor.value} className="grid-cell" />;
        }

        return (
          <div key={doctor.value} className="grid-cell">
            <button
              type="button"
              className="free-slot"
              onClick={() =>
                onOpen({
                  doctor: doctor.value,
                  appointment_date: date,
                  appointment_time: slot,
                })
              }
            >
              <span>＋ {slot}</span>
            </button>
          </div>
        );
      })}
    </>
  );
}

function toOptions(items: Array<{ id: number; name: string }>): Option[] {
  return items.map((item) => ({ value: item.id, label: item.name }));
}
