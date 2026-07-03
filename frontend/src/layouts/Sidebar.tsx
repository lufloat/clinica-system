import {
  FaCalendarAlt,
  FaClipboardList,
  FaHospital,
  FaStethoscope,
  FaUserFriends,
} from "react-icons/fa";

import { NavLink, useNavigate } from "react-router-dom";

function Sidebar() {
  const navigate = useNavigate();

  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("refresh");

    navigate("/login", { replace: true });
  }

  return (
    <aside className="sidebar">
      <h2>🏥 Clínica</h2>

      <nav>
        <NavLink to="/">
          <FaHospital /> Dashboard
        </NavLink>

        <NavLink to="/medicos">
          <FaStethoscope /> Médicos
        </NavLink>

        <NavLink to="/pacientes">
          <FaUserFriends /> Pacientes
        </NavLink>

        <NavLink to="/consultorios">
          🏢 Consultórios
        </NavLink>

        <NavLink to="/agenda">
          <FaCalendarAlt /> Agenda
        </NavLink>

        <NavLink to="/relatorios">
          <FaClipboardList /> Relatórios
        </NavLink>

        <button
          onClick={handleLogout}
          className="logout-btn"
        >
          Sair
        </button>
      </nav>
    </aside>
  );
}

export default Sidebar;