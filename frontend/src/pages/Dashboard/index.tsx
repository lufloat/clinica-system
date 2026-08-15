import { useEffect, useState } from "react";

import PeopleIcon from "@mui/icons-material/People";
import LocalHospitalIcon from "@mui/icons-material/LocalHospital";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";

import StatCard from "../../components/dashboard/StatCard";
import StatusChart from "../../components/dashboard/StatusChart";
import VerticalTabs from "../../components/ui/VerticalTabs";
import type { VerticalOption } from "../../components/ui/VerticalTabs";

import { getDashboard } from "../../services/dashboardService";
import { labelFor, useCurrentUser } from "../../utils/useCurrentUser";

import "./Dashboard.css";

type TodayAppointment = {
  id: number;
  appointment_time: string;
  patient_name: string;
  doctor_name: string;
  status: string;
};

type DashboardData = {
  /** áreas que o usuário pode escolher; menos de duas = sem seletor */
  verticals: VerticalOption[];
  vertical: string | null;
  vertical_name: string | null;
  doctors: number;
  patients: number;
  offices: number;
  appointments_today: number;
  appointments_week: number;
  status_chart: { status: string; label: string; total: number }[];
  today_list: TodayAppointment[];
};

const STATUS_LABELS: Record<string, string> = {
  AGENDADA: "Agendada",
  FINALIZADA: "Finalizada",
  CANCELADA: "Cancelada",
};

function Dashboard() {
  const { user } = useCurrentUser();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  /** "" = todas as áreas somadas */
  const [vertical, setVertical] = useState("");

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      try {
        const response = await getDashboard(vertical);
        if (active) setData(response);
      } finally {
        if (active) setLoading(false);
      }
    }

    load();
    return () => {
      active = false;
    };
  }, [vertical]);

  const today = new Date().toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  // Só na primeira carga a tela inteira vira esqueleto. Ao trocar de área o
  // cabeçalho e as abas ficam de pé, senão o seletor sumiria debaixo do
  // cursor a cada clique.
  if (loading && !data) {
    return (
      <div className="dashboard">
        <div className="dashboard-header">
          <h1>Dashboard</h1>
        </div>
        <div className="stat-grid">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="dashboard-skeleton" />
          ))}
        </div>
      </div>
    );
  }

  // Sem dados (ex.: a requisição falhou): mostra um aviso em vez de quebrar.
  if (!data) {
    return (
      <div className="dashboard">
        <div className="dashboard-header">
          <h1>Dashboard</h1>
        </div>
        <p className="subtitle">
          Não foi possível carregar os dados. Recarregue a página.
        </p>
      </div>
    );
  }

  const d = data;

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div>
          <h1>Dashboard</h1>
          <p className="subtitle">
            {today}
            {d.vertical_name ? ` · ${d.vertical_name}` : ""}
          </p>
        </div>
      </div>

      <VerticalTabs
        options={d.verticals}
        value={vertical}
        onChange={setVertical}
      />

      <div className="stat-grid">
        <StatCard
          title="Consultas Hoje"
          value={d.appointments_today}
          icon={<CalendarMonthIcon fontSize="large" />}
          color="#4F46E5"
          bg="var(--indigo-50)"
        />
        <StatCard
          title="Consultas na Semana"
          value={d.appointments_week}
          icon={<CalendarMonthIcon fontSize="large" />}
          color="#0891B2"
          bg="#ECFEFF"
        />
        <StatCard
          title="Pacientes"
          value={d.patients}
          icon={<PeopleIcon fontSize="large" />}
          color="#047857"
          bg="#ECFDF5"
        />
        <StatCard
          title={labelFor(user, "medicos", "Profissionais")}
          value={d.doctors}
          icon={<LocalHospitalIcon fontSize="large" />}
          color="#B45309"
          bg="#FFFBEB"
        />
      </div>

      <div className="dashboard-panels">
        <section className="panel">
          <h2 className="panel__title">Consultas por Status</h2>
          <StatusChart data={d.status_chart} />
        </section>

        <section className="panel">
          <h2 className="panel__title">
            Agenda de Hoje ({d.today_list.length})
          </h2>

          {d.today_list.length === 0 ? (
            <p className="empty-state">Nenhuma consulta agendada para hoje.</p>
          ) : (
            <div className="today-list">
              {d.today_list.map((item) => (
                <div key={item.id} className="today-row">
                  <span className="today-row__time">
                    {item.appointment_time?.slice(0, 5)}
                  </span>
                  <div>
                    <div className="today-row__patient">{item.patient_name}</div>
                    <div className="today-row__doctor">{item.doctor_name}</div>
                  </div>
                  <span className={`badge badge--${item.status}`}>
                    {STATUS_LABELS[item.status] ?? item.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export default Dashboard;
