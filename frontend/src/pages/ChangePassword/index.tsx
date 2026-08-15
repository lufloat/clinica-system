import { useState } from "react";

import LockResetRoundedIcon from "@mui/icons-material/LockResetRounded";

import { changePassword } from "../../services/authService";
import { clearCurrentUserCache } from "../../utils/useCurrentUser";
import { extractErrorMessage } from "../../utils/errors";

import "./ChangePassword.css";

type Props = {
  /** true quando é a troca obrigatória do 1º acesso */
  forced?: boolean;
};

export default function ChangePassword({ forced = false }: Props) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");

    if (next !== confirm) {
      setError("A confirmação não confere com a nova senha.");
      return;
    }
    if (next.length < 8) {
      setError("A nova senha deve ter ao menos 8 caracteres.");
      return;
    }

    try {
      setSaving(true);
      await changePassword(current, next);
      // o perfil mudou (must_change_password). Um reload completo garante
      // que as guardas releiam /me e liberem o acesso, sem estado obsoleto.
      clearCurrentUserCache();
      window.location.replace("/");
    } catch (err) {
      setError(extractErrorMessage(err));
      setSaving(false);
    }
  }

  return (
    <div className="changepw-page">
      <div className="changepw-card">
        <span className="changepw-icon">
          <LockResetRoundedIcon />
        </span>

        <h1>{forced ? "Defina uma nova senha" : "Alterar senha"}</h1>
        <p className="changepw-sub">
          {forced
            ? "Por segurança, no primeiro acesso você precisa trocar a senha temporária."
            : "Escolha uma nova senha para sua conta."}
        </p>

        {error && <p className="form-error form-error-banner">{error}</p>}

        <form onSubmit={handleSubmit} className="changepw-form" noValidate>
          <label className="field">
            <span>Senha atual</span>
            <input
              type="password"
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
              autoComplete="current-password"
              placeholder={forced ? "Senha temporária" : "Senha atual"}
            />
          </label>

          <label className="field">
            <span>Nova senha</span>
            <input
              type="password"
              value={next}
              onChange={(e) => setNext(e.target.value)}
              autoComplete="new-password"
              placeholder="Mínimo 8 caracteres"
            />
          </label>

          <label className="field">
            <span>Confirmar nova senha</span>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              autoComplete="new-password"
              placeholder="Repita a nova senha"
            />
          </label>

          <button type="submit" className="btn btn-primary changepw-submit" disabled={saving}>
            {saving ? "Salvando…" : "Salvar nova senha"}
          </button>
        </form>
      </div>
    </div>
  );
}
