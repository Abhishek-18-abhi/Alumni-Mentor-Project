import React from 'react';
import ModalShell from './ModalShell';

export default function ConfirmModal({
  title,
  message,
  confirmLabel = 'Confirm',
  onConfirm,
  onCancel,
}) {
  return (
    <ModalShell eyebrow="Please confirm" title={title} onClose={onCancel}>
      <p>{message}</p>
      <div className="form-actions">
        <button type="button" className="btn secondary" onClick={onCancel}>
          Cancel
        </button>
        <button type="button" className="uiverse-btn" onClick={onConfirm} autoFocus>
          {confirmLabel}
        </button>
      </div>
    </ModalShell>
  );
}
