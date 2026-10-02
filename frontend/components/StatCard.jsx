import React from 'react';

/**
 * Reusable StatCard component
 * Adheres strictly to the rule: Never show invented numbers.
 * @param {{
 *   label: string,
 *   value: string | number,
 *   icon: React.ComponentType<{ size?: number }>,
 *   subtext?: string,
 *   color?: 'blue' | 'green' | 'purple' | 'orange',
 *   className?: string
 * }} props
 */
export default function StatCard({
  label,
  value,
  icon: Icon,
  subtext,
  color = 'blue',
  className = '',
}) {
  const displayValue = value !== undefined && value !== null && value !== '' ? value : '0';

  return (
    <div className={`shopeers-kpi-card ${className}`.trim()}>
      <div className="kpi-header">
        <span className="kpi-title">{label}</span>
        {Icon && (
          <div className={`kpi-icon-badge ${color}`}>
            <Icon size={18} />
          </div>
        )}
      </div>
      <div className="kpi-body">
        <span className="kpi-value">{displayValue}</span>
      </div>
      {subtext && <span className="kpi-period">{subtext}</span>}
    </div>
  );
}
