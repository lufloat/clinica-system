import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import MainLayout from "../components/layout/MainLayout";
import { RequireAuth, RequirePermission, RequireAdmin } from "./guards";

import Dashboard from "../pages/Dashboard";
import Doctors from "../pages/Doctors";
import Patients from "../pages/Patients";
import Offices from "../pages/Offices";
import Appointments from "../pages/Appointments";
import Reports from "../pages/Reports";

import Colaboradores from "../pages/Admin/Colaboradores";
import Cargos from "../pages/Admin/Cargos";
import Permissoes from "../pages/Admin/Permissoes";

import Login from "../pages/Login";
import ChangePassword from "../pages/ChangePassword";
import NoAccess from "../pages/NoAccess";

import { ALL_VERTICAL_SCREENS } from "../verticals/registry";

function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>

        {/* Pública */}
        <Route path="/login" element={<Login />} />

        {/* Troca de senha obrigatória (1º acesso) */}
        <Route
          path="/trocar-senha"
          element={
            <RequireAuth allowPasswordChange>
              <ChangePassword forced />
            </RequireAuth>
          }
        />

        {/* Protegidas — dentro do layout */}
        <Route
          element={
            <RequireAuth>
              <MainLayout />
            </RequireAuth>
          }
        >
          <Route
            path="/"
            element={
              <RequirePermission module="dashboard">
                <Dashboard />
              </RequirePermission>
            }
          />
          <Route
            path="/agenda"
            element={
              <RequirePermission module="agenda">
                <Appointments />
              </RequirePermission>
            }
          />
          <Route
            path="/pacientes"
            element={
              <RequirePermission module="pacientes">
                <Patients />
              </RequirePermission>
            }
          />
          <Route
            path="/medicos"
            element={
              <RequirePermission module="medicos">
                <Doctors />
              </RequirePermission>
            }
          />
          <Route
            path="/consultorios"
            element={
              <RequirePermission module="consultorios">
                <Offices />
              </RequirePermission>
            }
          />
          <Route
            path="/relatorios"
            element={
              <RequirePermission module="relatorios">
                <Reports />
              </RequirePermission>
            }
          />

          {/* Telas exclusivas de vertical (registry). O RequirePermission já
              carrega o recorte por vertical, então registrar todas é seguro. */}
          {ALL_VERTICAL_SCREENS.map((screen) => (
            <Route
              key={screen.path}
              path={screen.path}
              element={
                <RequirePermission module={screen.module}>
                  {screen.element}
                </RequirePermission>
              }
            />
          ))}

          {/* Administração — somente admin */}
          <Route
            path="/admin/colaboradores"
            element={
              <RequireAdmin>
                <Colaboradores />
              </RequireAdmin>
            }
          />
          <Route
            path="/admin/cargos"
            element={
              <RequireAdmin>
                <Cargos />
              </RequireAdmin>
            }
          />
          <Route
            path="/admin/permissoes"
            element={
              <RequireAdmin>
                <Permissoes />
              </RequireAdmin>
            }
          />

          <Route path="/sem-acesso" element={<NoAccess />} />
        </Route>

        {/* Qualquer caminho desconhecido vai para o início */}
        <Route path="*" element={<Navigate to="/" replace />} />

      </Routes>
    </BrowserRouter>
  );
}

export default AppRoutes;
