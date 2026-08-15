import Modal from "../../components/ui/Modal";

type Props = {
  open: boolean;
  title: string;
  message: string;
  detail?: string;
  confirmLabel?: string;
  busy?: boolean;
  error?: string;
  onConfirm: () => void;
  onCancel: () => void;
};

export default function ConfirmDialog({
  open,
  title,
  message,
  detail,
  confirmLabel = "Confirmar",
  busy = false,
  error,
  onConfirm,
  onCancel,
}: Props) {

  return (
    <Modal open={open} title={title} onClose={onCancel} size="confirm">

      <div className="modal-body">
        <div className="confirm-row">
          <span className="confirm-icon">⚠</span>

          <div>
            <p className="confirm-message">{message}</p>
            {detail && <p className="confirm-detail">{detail}</p>}
          </div>
        </div>

        {error && <p className="form-error form-error-banner">{error}</p>}

        <footer className="modal-foot">
          <button
            type="button"
            className="btn btn-ghost"
            onClick={onCancel}
            disabled={busy}
          >
            Cancelar
          </button>
          <button
            type="button"
            className="btn btn-danger"
            onClick={onConfirm}
            disabled={busy}
          >
            {busy ? "Excluindo…" : confirmLabel}
          </button>
        </footer>
      </div>

    </Modal>
  );
}
