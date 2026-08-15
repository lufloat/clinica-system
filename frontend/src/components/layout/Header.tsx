import MenuRoundedIcon from "@mui/icons-material/MenuRounded";

import {
  useCurrentUser,
  initialsOf,
  firstNameOf,
  labelFor,
} from "../../utils/useCurrentUser";

type Props = {
  onOpenMenu: () => void;
};

function Header({ onOpenMenu }: Props) {
  const { user } = useCurrentUser();
  const firstName = firstNameOf(user);

  return (
    <header className="header">

      <button
        type="button"
        className="header-menu-btn"
        onClick={onOpenMenu}
        aria-label="Abrir menu"
      >
        <MenuRoundedIcon />
      </button>

      <label className="header-search">
        <span className="header-search-icon">⌕</span>
        <input
          type="search"
          placeholder={labelFor(
            user,
            "search_placeholder",
            "Buscar paciente, médico ou consulta…"
          )}
        />
      </label>

      <div className="header-right">
        <button type="button" className="header-bell" aria-label="Notificações">
          🔔
          <span className="header-bell-dot" />
        </button>

        <div className="header-user">
          <span className="header-greeting">
            Olá, {firstName || "visitante"} 👋
          </span>
          <span className="header-avatar">{initialsOf(user)}</span>
        </div>
      </div>

    </header>
  );
}

export default Header;
