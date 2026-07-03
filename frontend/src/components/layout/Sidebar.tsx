import { NavLink } from "react-router-dom";
import { Button } from "@mui/material";

function Sidebar() {
  function handleLogout() {
    localStorage.removeItem("token");
    window.location.href = "/";
  }

  return (
    <aside className="sidebar">
      <h2>🏥 Clínica</h2>

      <nav>
        <NavLink to="/">Dashboard</NavLink>

        <NavLink to="/medicos">
          Médicos
        </NavLink>

        <NavLink to="/pacientes">
          Pacientes
        </NavLink>

        <NavLink to="/consultorios">
          Consultórios
        </NavLink>

        <NavLink to="/agenda">
          Agenda
        </NavLink>

        <NavLink to="/relatorios">
          Relatórios
        </NavLink>
      </nav>

      <Button
        color="error"
        onClick={handleLogout}
      >
        Sair
      </Button>
    </aside>
  );
}

export default Sidebar;