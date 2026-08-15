import { Link } from "react-router-dom";

import BlockRoundedIcon from "@mui/icons-material/BlockRounded";

export default function NoAccess() {
  return (
    <div className="noaccess">
      <span className="noaccess-icon">
        <BlockRoundedIcon />
      </span>
      <h1>Acesso negado</h1>
      <p>Você não tem permissão para acessar esta área.</p>
      <Link to="/" className="btn btn-primary">
        Voltar ao início
      </Link>
    </div>
  );
}
