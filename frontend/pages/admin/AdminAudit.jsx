import React, { useState, useMemo } from 'react';
import AppShell from '../../components/AppShell';
import PageTitle from '../../components/PageTitle';
import EmptyState from '../../components/EmptyState';
import DataTable from '../../components/DataTable';
import { useAuditLogs } from '../../hooks/useApi';
import { verifyAuditLedger } from '../../lib/api';
import { useToast } from '../../components/Toast';
import {
  ShieldCheck,
  ShieldAlert,
  Search,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Hash,
  X,
} from 'lucide-react';

export default function AdminAudit() {
  const toast = useToast();
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [verifyResult, setVerifyResult] = useState(null);
  const [verifying, setVerifying] = useState(false);

  const { data: logs = [], loading, refetch } = useAuditLogs();

  const handleVerifyChain = async () => {
    if (verifying) return;
    setVerifying(true);
    try {
      const res = await verifyAuditLedger();
      setVerifyResult(res);
      if (res?.valid) {
        toast.success(`Ledger verified: ${res.totalEntries || logs.length} blocks intact.`);
      } else {
        toast.error('Cryptographic hash discrepancy detected in audit ledger!');
      }
    } catch (err) {
      toast.error(err?.message || 'Failed to verify ledger integrity.');
    } finally {
      setVerifying(false);
    }
  };

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
      header: 'IP Address',
      accessor: (l) => (
        <code
          style={{
            fontSize: '0.76rem',
            background: 'var(--surface-sunken, #f8fafc)',
            padding: '2px 4px',
            borderRadius: 4,
          }}
        >
          {l.ip || '127.0.0.1'}
        </code>
      ),
    },
    {
      header: 'SHA-256 Block Hash',
      accessor: (l) => (
        <div style={{ maxWidth: 180 }}>
          <code
            style={{
              fontSize: '0.72rem',
              display: 'block',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              color: 'var(--primary)',
            }}
            title={l.hash || 'Genesis Hash'}
          >
            {l.hash ? l.hash.slice(0, 16) + '...' : 'Genesis'}
          </code>
        </div>
      ),
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
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <PageTitle
          eyebrow="Administrator Platform Portal"
          title="Cryptographic Audit Ledger"
          text="Tamper-evident record of all critical state mutations. Each entry cryptographically chains to its predecessor."
        />

        <button
          type="button"
          className="uiverse-btn"
          disabled={verifying}
          onClick={handleVerifyChain}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
        >
          {verifying ? <RefreshCw size={15} className="spin" /> : <ShieldCheck size={15} />}
          {verifying ? 'Verifying Hashes...' : 'Verify Cryptographic Chain'}
        </button>
      </div>

      {/* Verification Result Banner */}
      {verifyResult && (
        <div
          className={`alert-card ${verifyResult.valid ? 'alert-success' : 'alert-error'}`}
          style={{ marginBottom: 16 }}
        >
          {verifyResult.valid ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
          <div>
            <b>
              {verifyResult.valid
                ? 'Cryptographic Ledger Verified — Hash Chain 100% Intact'
                : 'Tamper Alert — Broken Hash Chain Detected!'}
            </b>
            <p style={{ margin: '2px 0 0 0', fontSize: '0.84rem' }}>
              {verifyResult.valid
                ? `All ${verifyResult.totalEntries || logs.length} audit entries verified against SHA-256 predecessor chain.`
                : verifyResult.message ||
                  'Discrepancy found between recorded hash and recomputed digest.'}
            </p>
          </div>
        </div>
      )}

      {/* Filters */}
      <section className="card" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <div className="search large-search" style={{ flex: 1, minWidth: 260 }}>
            <Search size={16} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by action, actor, resource, or hash..."
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
