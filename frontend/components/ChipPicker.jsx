import React, { useState } from 'react';
import { Plus, X } from 'lucide-react';

/**
 * Reusable ChipPicker component
 * Replaces inline pickers in Onboarding, Profile, and Settings
 * @param {{
 *   options?: string[],
 *   selected: string[],
 *   onChange: (selected: string[]) => void,
 *   allowCustom?: boolean,
 *   label?: string,
 *   placeholder?: string,
 *   maxItems?: number,
 *   className?: string
 * }} props
 */
export default function ChipPicker({
  options = [],
  selected = [],
  onChange,
  allowCustom = true,
  label,
  placeholder = 'Add custom...',
  maxItems,
  className = '',
}) {
  const [customInput, setCustomInput] = useState('');

  const toggleOption = (item) => {
    if (selected.includes(item)) {
      onChange(selected.filter((x) => x !== item));
    } else {
      if (maxItems && selected.length >= maxItems) return;
      onChange([...selected, item]);
    }
  };

  const handleAddCustom = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (e && e.stopPropagation) e.stopPropagation();
    const trimmed = customInput.trim();
    if (!trimmed) return;
    if (!selected.includes(trimmed)) {
      if (maxItems && selected.length >= maxItems) return;
      onChange([...selected, trimmed]);
    }
    setCustomInput('');
  };

  const removeChip = (item) => {
    onChange(selected.filter((x) => x !== item));
  };

  // Combine predefined options and any selected custom items
  const allAvailable = Array.from(new Set([...options, ...selected]));

  return (
    <div className={`chip-picker ${className}`.trim()}>
      {label && <label className="chip-picker-label">{label}</label>}

      <div className="chip-picker-options" role="group" aria-label={label || 'Select items'}>
        {allAvailable.map((opt) => {
          const isSelected = selected.includes(opt);
          return (
            <button
              key={opt}
              type="button"
              className={`chip-btn ${isSelected ? 'active' : ''}`}
              aria-pressed={isSelected}
              onClick={() => toggleOption(opt)}
            >
              <span>{opt}</span>
              {isSelected && (
                <X
                  size={12}
                  className="chip-remove-icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeChip(opt);
                  }}
                  aria-label={`Remove ${opt}`}
                />
              )}
            </button>
          );
        })}
      </div>

      {allowCustom && (!maxItems || selected.length < maxItems) && (
        <div className="chip-custom-form">
          <input
            type="text"
            value={customInput}
            onChange={(e) => setCustomInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                e.stopPropagation();
                handleAddCustom(e);
              }
            }}
            placeholder={placeholder}
            className="chip-custom-input"
            aria-label={`Add custom ${label || 'item'}`}
          />
          <button
            type="button"
            className="btn mini secondary chip-add-btn"
            disabled={!customInput.trim()}
            onClick={handleAddCustom}
          >
            <Plus size={13} /> Add
          </button>
        </div>
      )}
    </div>
  );
}
