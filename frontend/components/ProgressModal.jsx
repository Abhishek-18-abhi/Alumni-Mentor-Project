import React, { useState } from 'react';
import ModalShell from './ModalShell';

/** Parses user input into an integer 0-100, or null when it is not a valid number. */
export function parseProgress(value) {
  if (value === '' || value === null || value === undefined) return null;
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  return Math.max(0, Math.min(100, Math.round(n)));
}

export default function ProgressModal({ goalTitle, initial = 0, onSave, onCancel }) {
  const [value, setValue] = useState(String(initial ?? 0));
  const [error, setError] = useState('');

  const submit = (e) => {
    e.preventDefault();
    const parsed = parseProgress(value);
    if (parsed === null) return setError('Enter a number between 0 and 100.');
    onSave(parsed);
  };

  return (
    <ModalShell eyebrow="Goal progress" title="Update progress" onClose={onCancel}>
      <form className="form-stack" onSubmit={submit}>
        {goalTitle && <p>{goalTitle}</p>}
        <label>
          Progress (0-100)
          <input
            type="number"
            min="0"
            max="100"
            required
            autoFocus
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              setError('');
            }}
          />
        </label>
        {error && <div className="error-box">{error}</div>}
        <button className="uiverse-btn full">Save progress</button>
      </form>
    </ModalShell>
  );
}
