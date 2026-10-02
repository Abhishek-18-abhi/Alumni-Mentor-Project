import React from 'react';
import AppShell from './AppShell';
import PageTitle from './PageTitle';
import StatCard from './StatCard';
import EmptyState from './EmptyState';
import { RefreshCw, AlertCircle } from 'lucide-react';

/**
 * Shared DashboardLayout component
 * @param {{
 *   role: 'student' | 'mentor' | 'admin',
 *   eyebrow: string,
 *   title: string,
 *   subtitle: string,
 *   stats: Array<{
 *     label: string,
 *     value: string | number,
 *     icon: React.ComponentType<{ size?: number }>,
 *     subtext?: string,
 *     color?: 'blue' | 'green' | 'purple' | 'orange'
 *   }>,
 *   actions?: React.ReactNode,
 *   children?: React.ReactNode,
 *   loading?: boolean,
 *   error?: string,
 *   onRetry?: () => void
 * }} props
 */
export default function DashboardLayout({
  role,
  eyebrow,
  title,
  subtitle,
  stats = [],
  actions,
  children,
  loading = false,
  error = null,
  onRetry,
}) {
  return (
    <AppShell role={role}>
      <div
        className="dashboard-header-row"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <PageTitle eyebrow={eyebrow} title={title} text={subtitle} />
        {actions && <div className="dashboard-actions">{actions}</div>}
      </div>

      {error && (
        <div className="alert-card alert-error" style={{ marginBottom: 20 }} role="alert">
          <AlertCircle size={18} />
          <div style={{ flex: 1 }}>
            <b>Failed to load dashboard metrics</b>
            <p style={{ margin: '2px 0 0 0', fontSize: '0.85rem' }}>{error}</p>
          </div>
          {onRetry && (
            <button type="button" className="btn mini secondary" onClick={onRetry}>
              <RefreshCw size={13} /> Retry
            </button>
          )}
        </div>
      )}

      {loading ? (
        <div className="shopeers-kpi-grid" role="status" aria-live="polite">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="shopeers-kpi-card skeleton-card" style={{ height: 110 }}>
              <div
                className="skeleton-bar"
                style={{ width: '60%', height: 16, marginBottom: 12 }}
              />
              <div className="skeleton-bar" style={{ width: '40%', height: 28 }} />
            </div>
          ))}
          <span className="sr-only">Loading dashboard metrics...</span>
        </div>
      ) : (
        <div className="shopeers-kpi-grid">
          {stats.map((stat, idx) => (
            <StatCard
              key={idx}
              label={stat.label}
              value={stat.value}
              icon={stat.icon}
              subtext={stat.subtext}
              color={stat.color}
            />
          ))}
        </div>
      )}

      <div className="dashboard-content" style={{ marginTop: 24 }}>
        {children}
      </div>
    </AppShell>
  );
}
