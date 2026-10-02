import React from 'react';

const STATUS_VARIANTS = {
  // Requests & Verification
  pending: { label: 'Pending', className: 'status-pending' },
  accepted: { label: 'Accepted', className: 'status-accepted' },
  rejected: { label: 'Declined', className: 'status-rejected' },
  withdrawn: { label: 'Withdrawn', className: 'status-withdrawn' },
  verified: { label: 'Verified', className: 'status-verified' },

  // Meetings
  scheduled: { label: 'Scheduled', className: 'status-scheduled' },
  completed: { label: 'Completed', className: 'status-completed' },
  cancelled: { label: 'Cancelled', className: 'status-cancelled' },

  // Goals
  in_progress: { label: 'In Progress', className: 'status-in-progress' },
  not_started: { label: 'Not Started', className: 'status-not-started' },

  // General accounts
  active: { label: 'Active', className: 'status-active' },
  inactive: { label: 'Inactive', className: 'status-inactive' },
};

/**
 * Reusable StatusChip component
 * @param {{
 *   status: string,
 *   label?: string,
 *   size?: 'sm' | 'md',
 *   className?: string
 * }} props
 */
export default function StatusChip({ status = '', label, size = 'md', className = '' }) {
  const normalizedKey = String(status || '')
    .toLowerCase()
    .replace(/[\s-]/g, '_');
  const variant = STATUS_VARIANTS[normalizedKey] || {
    label: label || status || 'Unknown',
    className: 'status-default',
  };

  const displayLabel = label || variant.label;

  return (
    <span
      className={`status-chip ${variant.className} ${size === 'sm' ? 'status-chip-sm' : ''} ${className}`.trim()}
    >
      {displayLabel}
    </span>
  );
}
