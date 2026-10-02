import React from 'react';
import { Inbox } from 'lucide-react';

/**
 * Reusable EmptyState component
 * @param {{
 *   icon?: React.ComponentType<{ size?: number }>,
 *   title: string,
 *   text?: string,
 *   actionLabel?: string,
 *   onAction?: () => void,
 *   children?: React.ReactNode,
 *   className?: string
 * }} props
 */
export default function EmptyState({
  icon: Icon = Inbox,
  title,
  text,
  actionLabel,
  onAction,
  children,
  className = '',
}) {
  return (
    <section className={`empty-panel ${className}`.trim()} role="status" aria-live="polite">
      <div className="empty-orb">
        <Icon size={24} />
      </div>
      <h2>{title}</h2>
      {text && <p>{text}</p>}
      {actionLabel && onAction && (
        <button type="button" className="btn primary empty-action-btn" onClick={onAction}>
          {actionLabel}
        </button>
      )}
      {children}
    </section>
  );
}
