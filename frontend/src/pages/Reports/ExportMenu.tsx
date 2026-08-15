import { useState } from "react";

import FileDownloadRoundedIcon from "@mui/icons-material/FileDownloadRounded";
import KeyboardArrowDownRoundedIcon from "@mui/icons-material/KeyboardArrowDownRounded";
import PrintRoundedIcon from "@mui/icons-material/PrintRounded";
import TableViewRoundedIcon from "@mui/icons-material/TableViewRounded";

import { useDismissable } from "../../utils/useDismissable";

type Props = {
  onExportCSV: () => void;
  onPrint: () => void;
};

/**
 * Split button: a parte principal baixa o CSV (ação mais frequente); a seta
 * abre as demais saídas.
 */
export default function ExportMenu({ onExportCSV, onPrint }: Props) {

  const [open, setOpen] = useState(false);
  const boxRef = useDismissable<HTMLDivElement>(open, () => setOpen(false));

  function run(action: () => void) {
    setOpen(false);
    action();
  }

  return (
    <div className="split-btn" ref={boxRef}>
      <button type="button" className="split-btn-main" onClick={onExportCSV}>
        <FileDownloadRoundedIcon fontSize="small" />
        Exportar
      </button>

      <button
        type="button"
        className={open ? "split-btn-toggle open" : "split-btn-toggle"}
        onClick={() => setOpen((current) => !current)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Mais opções de exportação"
      >
        <KeyboardArrowDownRoundedIcon fontSize="small" />
      </button>

      {open && (
        <ul className="split-btn-menu" role="menu">
          <li role="none">
            <button
              type="button"
              role="menuitem"
              className="split-btn-item"
              onClick={() => run(onExportCSV)}
            >
              <TableViewRoundedIcon fontSize="small" />
              Exportar CSV
            </button>
          </li>
          <li role="none">
            <button
              type="button"
              role="menuitem"
              className="split-btn-item"
              onClick={() => run(onPrint)}
            >
              <PrintRoundedIcon fontSize="small" />
              Imprimir
            </button>
          </li>
        </ul>
      )}
    </div>
  );
}
