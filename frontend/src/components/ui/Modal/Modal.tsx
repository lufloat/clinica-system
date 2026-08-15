import { useEffect } from "react";
import type { ReactNode } from "react";

import "./Modal.css";

type Props = {
  open: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
  /** largura máxima; use "confirm" para diálogos curtos */
  size?: "default" | "confirm";
};

export default function Modal({
  open,
  title,
  children,
  onClose,
  size = "default",
}: Props) {

  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="modal-backdrop"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        className={size === "confirm" ? "modal modal-confirm" : "modal"}
        role="dialog"
        aria-modal="true"
      >
        <header className="modal-head">
          <h2>{title}</h2>
          <button
            type="button"
            className="modal-close"
            aria-label="Fechar"
            onClick={onClose}
          >
            ×
          </button>
        </header>

        {children}
      </div>
    </div>
  );
}
