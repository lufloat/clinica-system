import { BrowserRouter, Routes, Route } from "react-router-dom";

import MainLayout from "../components/layout/MainLayout";
import PrivateRoute from "../components/PrivateRoute";

import Dashboard from "../pages/Dashboard";
import Doctors from "../pages/Doctors";
import Patients from "../pages/Patients";
import Offices from "../pages/Offices";
import Appointments from "../pages/Appointments";
import Reports from "../pages/Reports";

import Login from "../pages/Login";
import Register from "../pages/Register";

function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>

        {/* Rotas públicas */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Rotas protegidas */}
        <Route
          element={
            <PrivateRoute>
              <MainLayout />
            </PrivateRoute>
          }
        >
          <Route path="/" element={<Dashboard />} />
          <Route path="/medicos" element={<Doctors />} />
          <Route path="/pacientes" element={<Patients />} />
          <Route path="/consultorios" element={<Offices />} />
          <Route path="/agenda" element={<Appointments />} />
          <Route path="/relatorios" element={<Reports />} />
        </Route>

      </Routes>
    </BrowserRouter>
  );
}

export default AppRoutes;