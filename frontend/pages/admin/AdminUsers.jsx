import React, { useState, useMemo } from 'react';
import AppShell from '../../components/AppShell';
import PageTitle from '../../components/PageTitle';
import EmptyState from '../../components/EmptyState';
import StatusChip from '../../components/StatusChip';
import TabBar from '../../components/TabBar';
import DataTable from '../../components/DataTable';
import { useUsers } from '../../hooks/useApi';
import { apiPatch } from '../../lib/api';
import { useToast } from '../../components/Toast';
import {
  Users,
  Search,
  CheckCircle,
  XCircle,
  Shield,
  ShieldAlert,
  UserCheck,
  UserX,
  X,
} from 'lucide-react';

export default function AdminUsers() {
  const toast = useToast();
  const [roleFilter, setRoleFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [updatingId, setUpdatingId] = useState(null);

  const { data: users = [], loading, refetch } = useUsers();

  const handleVerifyMentor = async (user) => {
    const uId = user.id || user._id;
    if (updatingId) return;
    setUpdatingId(uId);

    try {
      const nextStatus = !Boolean(user.verified || user.isVerified);
      await apiPatch(`/users/${uId}`, {
        verified: nextStatus,
        isVerified: nextStatus,
      });
      toast.success(
        nextStatus ? `Mentor ${user.name} verified.` : `Verification revoked for ${user.name}.`
      );
      await refetch();
    } catch (err) {
      toast.error(err?.message || 'Failed to update verification status.');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleToggleActive = async (user) => {
    const uId = user.id || user._id;
    if (updatingId) return;
    setUpdatingId(uId);

    try {
      const nextActive = user.isActive === false ? true : false;
      await apiPatch(`/users/${uId}`, {
        isActive: nextActive,
      });
      toast.success(
        nextActive ? `Account ${user.name} activated.` : `Account ${user.name} deactivated.`
      );
      await refetch();
    } catch (err) {
      toast.error(err?.message || 'Failed to update account status.');
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredUsers = useMemo(() => {
    return (users || []).filter((u) => {
      // Role filter
      if (roleFilter !== 'all' && u.role !== roleFilter) return false;

      // Search filter
      if (search.trim()) {
        const text = [u.name, u.email, u.role, u.company, u.domain, u.course, u.college]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        if (!text.includes(search.toLowerCase())) return false;
      }
      return true;
    });
  }, [users, roleFilter, search]);

  const tabs = [
    { id: 'all', label: 'All Accounts', count: (users || []).length },
    {
      id: 'student',
      label: 'Students',
      count: (users || []).filter((u) => u.role === 'student').length,
    },
    {
      id: 'mentor',
      label: 'Mentors',
      count: (users || []).filter((u) => u.role === 'mentor').length,
    },
    { id: 'admin', label: 'Admins', count: (users || []).filter((u) => u.role === 'admin').length },
  ];

  const columns = [
    {
      header: 'User',
      accessor: (u) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div className="mentor-avatar" style={{ width: 34, height: 34, fontSize: '0.88rem' }}>
            {u.name?.[0] || 'U'}
          </div>
          <div>
            <b style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {u.name}
              {Boolean(u.verified || u.isVerified) && (
                <span className="bento-badge" style={{ fontSize: '0.65rem', padding: '1px 5px' }}>
                  Verified
                </span>
              )}
            </b>
            <p
              style={{ margin: '2px 0 0 0', fontSize: '0.8rem', color: 'var(--foreground-muted)' }}
            >
              {u.email}
            </p>
          </div>
        </div>
      ),
    },
    {
      header: 'Role',
      accessor: (u) => (
        <span style={{ textTransform: 'capitalize', fontWeight: 600, fontSize: '0.85rem' }}>
          {u.role}
        </span>
      ),
    },
    {
      header: 'Account Status',
      accessor: (u) => (
        <StatusChip status={u.isActive === false ? 'inactive' : 'active'} size="sm" />
      ),
    },
    {
      header: 'Profile Status',
      accessor: (u) => (
        <span
          style={{
            fontSize: '0.82rem',
            color: u.profileComplete ? 'var(--success-text)' : 'var(--warning-text)',
          }}
        >
          {u.profileComplete ? 'Complete' : 'Incomplete'}
        </span>
      ),
    },
    {
      header: 'Actions',
      align: 'right',
      accessor: (u) => {
        const uId = u.id || u._id;
        const isVerified = Boolean(u.verified || u.isVerified);
        const isActive = u.isActive !== false;

        return (
          <div style={{ display: 'inline-flex', gap: 6 }}>
            {u.role === 'mentor' && (
              <button
                type="button"
                className={`btn mini ${isVerified ? 'secondary' : 'primary'}`}
                disabled={updatingId === uId}
                onClick={() => handleVerifyMentor(u)}
                title={isVerified ? 'Revoke verification badge' : 'Grant verified alumni status'}
              >
                {isVerified ? 'Unverify' : 'Verify Mentor'}
              </button>
            )}

            <button
              type="button"
              className="btn mini secondary"
              disabled={updatingId === uId || u.role === 'admin'}
              onClick={() => handleToggleActive(u)}
              title={isActive ? 'Deactivate user access' : 'Activate user access'}
            >
              {isActive ? 'Deactivate' : 'Activate'}
            </button>
          </div>
        );
      },
    },
  ];

  return (
    <AppShell role="admin">
      <PageTitle
        eyebrow="Administrator Platform Portal"
        title="User & Account Management"
        text="Audit registered students, alumni mentors, and institutional accounts. Verify credentials and enforce access."
      />

      <section className="card" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <div className="search large-search" style={{ flex: 1, minWidth: 260 }}>
            <Search size={16} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email, company, domain, or college..."
              aria-label="Search users"
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
        </div>

        <div style={{ marginTop: 14 }}>
          <TabBar tabs={tabs} activeTab={roleFilter} onChange={setRoleFilter} />
        </div>
      </section>

      <section className="card">
        <DataTable
          columns={columns}
          data={filteredUsers}
          loading={loading}
          emptyTitle="No users found"
          emptyText="No user accounts match the current filter or search query."
        />
      </section>
    </AppShell>
  );
}
