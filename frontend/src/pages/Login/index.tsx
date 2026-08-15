import { useState } from "react";
import { useNavigate } from "react-router-dom";

import LocalHospitalIcon from "@mui/icons-material/LocalHospital";
import PersonOutlineIcon from "@mui/icons-material/PersonOutlined";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutlined";
import EventAvailableIcon from "@mui/icons-material/EventAvailable";
import GroupsIcon from "@mui/icons-material/Groups";
import InsertChartOutlinedIcon from "@mui/icons-material/InsertChartOutlined";

import { login } from "../../services/authService";

import "./Login.css";

export default function Login() {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    try {
      setLoading(true);
      const response = await login(username, password);
      localStorage.setItem("token", response.access);
      localStorage.setItem("refresh", response.refresh);
      navigate("/");
    } catch {
      setError("Usuário ou senha inválidos.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <aside className="login-brand">
        <div className="login-brand__logo">
          <span className="login-brand__logo-badge">
            <LocalHospitalIcon />
          </span>
          Clínica System
        </div>

        <div className="login-brand__center">
          <h1>Gestão completa da sua clínica em um só lugar</h1>
          <p>
            Agenda, pacientes, médicos e relatórios integrados para o dia a dia
            da recepção ao consultório.
          </p>
        </div>

        <div className="login-brand__features">
          <div className="login-brand__feature">
            <EventAvailableIcon fontSize="small" /> Agenda de consultas em tempo real
          </div>
          <div className="login-brand__feature">
            <GroupsIcon fontSize="small" /> Cadastro de pacientes e médicos
          </div>
          <div className="login-brand__feature">
            <InsertChartOutlinedIcon fontSize="small" /> Relatórios e indicadores
          </div>
        </div>
      </aside>

      <main className="login-form-side">
        <div className="login-card">
          <div className="login-card__head">
            <span className="login-card__mobile-logo">
              <LocalHospitalIcon />
            </span>
            <h2>Bem-vindo de volta</h2>
            <p>Entre com suas credenciais para acessar o sistema</p>
          </div>

          {error && (
            <div className="login-error">
              <ErrorOutlineIcon fontSize="small" />
              {error}
            </div>
          )}

          <form onSubmit={handleLogin}>
            <div className="login-field">
              <label htmlFor="username">Usuário ou e-mail</label>
              <div className="login-input-wrap">
                <PersonOutlineIcon className="leading" />
                <input
                  id="username"
                  type="text"
                  placeholder="Digite seu usuário ou e-mail"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="username"
                  required
                />
              </div>
            </div>

            <div className="login-field">
              <label htmlFor="password">Senha</label>
              <div className="login-input-wrap">
                <LockOutlinedIcon className="leading" />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Digite sua senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  className="login-toggle"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                >
                  {showPassword ? (
                    <VisibilityOffIcon fontSize="small" />
                  ) : (
                    <VisibilityIcon fontSize="small" />
                  )}
                </button>
              </div>
            </div>

            <button type="submit" className="login-btn" disabled={loading}>
              {loading ? "Entrando..." : "Entrar"}
            </button>
          </form>

          <p className="login-footnote">
            © {new Date().getFullYear()} Clínica System · Todos os direitos reservados
          </p>
        </div>
      </main>
    </div>
  );
}
