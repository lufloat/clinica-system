import { NavLink } from "react-router-dom";

import SpaceDashboardRoundedIcon from "@mui/icons-material/SpaceDashboardRounded";
import MedicalServicesRoundedIcon from "@mui/icons-material/MedicalServicesRounded";
import GroupsRoundedIcon from "@mui/icons-material/GroupsRounded";
import MeetingRoomRoundedIcon from "@mui/icons-material/MeetingRoomRounded";
import CalendarMonthRoundedIcon from "@mui/icons-material/CalendarMonthRounded";
import InsertChartRoundedIcon from "@mui/icons-material/InsertChartRounded";
import MenuOpenRoundedIcon from "@mui/icons-material/MenuOpenRounded";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import ManageAccountsRoundedIcon from "@mui/icons-material/ManageAccountsRounded";
import BadgeRoundedIcon from "@mui/icons-material/BadgeRounded";
import ShieldRoundedIcon from "@mui/icons-material/ShieldRounded";

import {
  useCurrentUser,
  initialsOf,
  can,
  labelFor,
} from "../../utils/useCurrentUser";
import { ALL_VERTICAL_SCREENS } from "../../verticals/registry";

type Props = {
  collapsed: boolean;
  onToggleCollapse: () => void;
  /** fecha a gaveta no mobile ao navegar */
  onNavigate: () => void;
};

// cada item guarda o `module` usado para checar permissão de exibição e
// para buscar o rótulo da vertical (`label` é o texto padrão)
//
// "Profissionais" é o texto de quem não tem vertical — o administrador geral,
// que enxerga médicos e dentistas na mesma tela. As verticais sobrescrevem
// com o nome delas: "Médicos" na clínica médica, "Dentistas" na odontologia.
const LINKS = [
  { to: "/", module: "dashboard", label: "Dashboard", Icon: SpaceDashboardRoundedIcon },
  { to: "/medicos", module: "medicos", label: "Profissionais", Icon: MedicalServicesRoundedIcon },
  { to: "/pacientes", module: "pacientes", label: "Pacientes", Icon: GroupsRoundedIcon },
  { to: "/consultorios", module: "consultorios", label: "Consultórios", Icon: MeetingRoomRoundedIcon },
  { to: "/agenda", module: "agenda", label: "Agenda", Icon: CalendarMonthRoundedIcon },
  { to: "/relatorios", module: "relatorios", label: "Relatórios", Icon: InsertChartRoundedIcon },
];

// telas exclusivas de vertical vêm do registry, não de uma lista à parte
const VERTICAL_LINKS = ALL_VERTICAL_SCREENS.map((screen) => ({
  to: screen.path,
  module: screen.module,
  label: screen.label,
  Icon: screen.Icon,
}));

// grupo Administração — só aparece para administradores
const ADMIN_LINKS = [
  { to: "/admin/colaboradores", label: "Colaboradores", Icon: ManageAccountsRoundedIcon },
  { to: "/admin/cargos", label: "Cargos", Icon: BadgeRoundedIcon },
  { to: "/admin/permissoes", label: "Permissões", Icon: ShieldRoundedIcon },
];

function Sidebar({ collapsed, onToggleCollapse, onNavigate }: Props) {
  const { user } = useCurrentUser();

  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("refresh");
    window.location.href = "/login";
  }

  return (
    <aside className="sidebar">

      <div className="sidebar-brand">
        <span className="sidebar-logo">{user?.vertical?.theme?.logo ?? "🏥"}</span>
        <div className="sidebar-brand-text">
          <strong>{user?.vertical?.name ?? "Clínica"}</strong>
          <span>Sistema de gestão</span>
        </div>
        <button
          type="button"
          className="sidebar-collapse-toggle"
          onClick={onToggleCollapse}
          aria-label={collapsed ? "Expandir menu" : "Recolher menu"}
          title={collapsed ? "Expandir menu" : "Recolher menu"}
        >
          <MenuOpenRoundedIcon />
        </button>
      </div>

      <nav className="sidebar-nav">
        {[...LINKS, ...VERTICAL_LINKS]
          .filter((link) => can(user, link.module, "view"))
          .map((link) => {
          const label = labelFor(user, link.module, link.label);

          return (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === "/"}
              onClick={onNavigate}
              title={collapsed ? label : undefined}
              className={({ isActive }) =>
                isActive ? "sidebar-link active" : "sidebar-link"
              }
            >
              <span className="sidebar-icon">
                <link.Icon />
              </span>
              <span className="sidebar-label">{label}</span>
            </NavLink>
          );
        })}

        {user?.is_admin && (
          <>
            <p className="sidebar-group">Administração</p>
            {ADMIN_LINKS.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                onClick={onNavigate}
                title={collapsed ? link.label : undefined}
                className={({ isActive }) =>
                  isActive ? "sidebar-link active" : "sidebar-link"
                }
              >
                <span className="sidebar-icon">
                  <link.Icon />
                </span>
                <span className="sidebar-label">{link.label}</span>
              </NavLink>
            ))}
          </>
        )}
      </nav>

      <div className="sidebar-foot">
        <div className="sidebar-user">
          <span className="sidebar-avatar">{initialsOf(user)}</span>
          <div className="sidebar-user-info">
            <strong>{user?.username || "Usuário"}</strong>
            <span>{user?.email || "—"}</span>
          </div>
        </div>

        <button
          type="button"
          className="sidebar-logout"
          onClick={handleLogout}
          title="Sair"
        >
          <LogoutRoundedIcon />
          <span className="sidebar-label">Sair</span>
        </button>
      </div>

    </aside>
  );
}

export default Sidebar;
