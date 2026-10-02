import React, { useState, useMemo } from 'react';
import AppShell from '../../components/AppShell';
import PageTitle from '../../components/PageTitle';
import DataTable from '../../components/DataTable';
import { useAuditLogs } from '../../hooks/useApi';
import { Search, X } from 'lucide-react';

export default function AdminAudit() {
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('all');

  const { data: logs = [], loading } = useAuditLogs();

  // Distinct action types
  const distinctActions = useMemo(() => {
    const set = new Set();
    (logs || []).forEach((l) => {
      if (l.action) set.add(l.action);
    });
    return Array.from(set);
  }, [logs]);

  // Filtering
  const filteredLogs = useMemo(() => {
    return (logs || []).filter((l) => {
      if (actionFilter !== 'all' && l.action !== actionFilter) return false;
      if (search.trim()) {
        const text = [l.action, l.resource, l.ip, l.userId?.name, l.userId?.email, l.hash]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        if (!text.includes(search.toLowerCase())) return false;
      }
      return true;
    });
  }, [logs, actionFilter, search]);

  const columns = [
    {
      header: 'Timestamp',
      accessor: (l) => {
        const ts = l.createdAt || l.timestamp;
        return (
          <span style={{ fontSize: '0.82rem', whiteSpace: 'nowrap' }}>
            {ts ? new Date(ts).toLocaleString() : 'N/A'}
          </span>
        );
      },
    },
    {
      header: 'Action',
      accessor: (l) => (
        <div>
          <b>{l.action}</b>
          {l.resource && (
            <p
              style={{ margin: '2px 0 0 0', fontSize: '0.78rem', color: 'var(--foreground-muted)' }}
            >
              Resource: {l.resource}
            </p>
          )}
        </div>
      ),
    },
    {
      header: 'Actor / User',
      accessor: (l) => {
        const user = l.userId;
        return (
          <span style={{ fontSize: '0.84rem' }}>
            {user?.name || user?.email || (typeof user === 'string' ? user : 'System')}
          </span>
        );
      },
    },
    {
      header: 'Status',
      align: 'right',
      accessor: (l) => (
        <span
          className={`status-chip ${l.status === 'Failed' ? 'status-rejected' : 'status-accepted'}`}
          style={{ fontSize: '0.76rem' }}
        >
          {l.status || 'Success'}
        </span>
      ),
    },
  ];

  return (
    <AppShell role="admin">
      <PageTitle
        eyebrow="Administrator Platform Portal"
        title="Cryptographic Audit Ledger"
        text="Tamper-evident record of all critical state mutations. Each entry cryptographically chains to its predecessor."
      />

      {/* Filters */}
      <section className="card" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <div className="search large-search" style={{ flex: 1, minWidth: 260 }}>
            <Search size={16} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by action, actor, or resource..."
              aria-label="Search audit records"
            />
            {search && (
              <button
                type="button"
                className="icon-btn"
                onClick={() => setSearch('')}
                aria-label="Clear search"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {distinctActions.length > 0 && (
            <div style={{ minWidth: 200 }}>
              <select
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
                aria-label="Filter by action"
              >
                <option value="all">All Actions ({logs.length})</option>
                {distinctActions.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </section>

      {/* Audit Log Table */}
      <section className="card">
        <DataTable
          columns={columns}
          data={filteredLogs}
          loading={loading}
          emptyTitle="No audit records"
          emptyText="Audit logs record state changes automatically."
        />
      </section>
    </AppShell>
  );
}
