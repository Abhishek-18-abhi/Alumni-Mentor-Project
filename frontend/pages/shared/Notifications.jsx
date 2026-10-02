import React, { useState, useEffect, useMemo } from 'react';
import AppShell from '../../components/AppShell';
import PageTitle from '../../components/PageTitle';
import EmptyState from '../../components/EmptyState';
import TabBar from '../../components/TabBar';
import { useNotifications } from '../../hooks/useApi';
import { getSession } from '../../lib/storage';
import { apiPatch } from '../../lib/api';
import { useToast } from '../../components/Toast';
import { Bell, CheckCircle, Mail, MailOpen, Filter } from 'lucide-react';

export default function Notifications() {
  const toast = useToast();
  const session = getSession();
  const myId = session?.id || session?._id;

  const [filterType, setFilterType] = useState('all'); // 'all' | 'unread' | 'request' | 'meeting'

  const { data: allNotifications = [], loading, refetch } = useNotifications();

  // Poll every 30s when tab is focused
  useEffect(() => {
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        refetch();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [refetch]);

  // Current user's notifications
  const userNotes = useMemo(() => {
    return (allNotifications || []).filter((n) => {
      const uId = n.userId?._id || n.userId?.id || n.userId;
      return String(uId) === String(myId);
    });
  }, [allNotifications, myId]);

  const filtered = useMemo(() => {
    return (userNotes || []).filter((n) => {
      if (filterType === 'unread') return !n.read;
      if (filterType === 'request') return n.type === 'request';
      if (filterType === 'meeting') return n.type === 'meeting';
      return true;
    });
  }, [userNotes, filterType]);

  const handleToggleRead = async (note) => {
    const nId = note.id || note._id;
    try {
      await apiPatch(`/notifications/${nId}`, { read: !note.read });
      await refetch();
    } catch (err) {
      toast.error(err?.message || 'Failed to update notification.');
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await apiPatch('/notifications/mark-all-read', {});
      toast.success('All notifications marked as read.');
      await refetch();
    } catch (err) {
      toast.error(err?.message || 'Failed to mark all as read.');
    }
  };

  const tabs = [
    { id: 'all', label: 'All', count: userNotes.length },
    { id: 'unread', label: 'Unread', count: userNotes.filter((n) => !n.read).length },
    {
      id: 'request',
      label: 'Requests',
      count: userNotes.filter((n) => n.type === 'request').length,
    },
    {
      id: 'meeting',
      label: 'Meetings',
      count: userNotes.filter((n) => n.type === 'meeting').length,
    },
  ];

  return (
    <AppShell role={session?.role}>
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
          eyebrow="Updates & Alerts"
          title="Notifications"
          text="System updates, request acceptances, and schedule changes in real time."
        />

        {userNotes.some((n) => !n.read) && (
          <button
            type="button"
            className="btn secondary"
            onClick={handleMarkAllRead}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            <CheckCircle size={14} /> Mark all read
          </button>
        )}
      </div>

      <div style={{ marginBottom: 16 }}>
        <TabBar tabs={tabs} activeTab={filterType} onChange={setFilterType} />
      </div>

      <section className="card">
        {loading ? (
          <div className="skeleton-container" role="status" aria-live="polite">
            <div className="skeleton-bar" style={{ height: 60, marginBottom: 12 }} />
            <div className="skeleton-bar" style={{ height: 60, marginBottom: 12 }} />
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Bell}
            title={`No ${filterType === 'all' ? '' : filterType} notifications`}
            text="You have no notifications in this category."
          />
        ) : (
          <div className="notification-list">
            {filtered.map((n) => {
              const nId = n.id || n._id;
              const isUnread = !n.read;

              return (
                <div
                  key={nId}
                  className={`notification-item ${isUnread ? 'unread' : 'read'}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '14px 16px',
                    borderRadius: 8,
                    background: isUnread ? 'var(--primary-subtle)' : 'transparent',
                    border: '1px solid var(--border)',
                    marginBottom: 10,
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1 }}>
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: '50%',
                        background: isUnread ? 'var(--primary)' : 'var(--border)',
                        color: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Bell size={15} />
                    </div>

                    <div style={{ flex: 1 }}>
                      <b style={{ fontSize: '0.94rem', color: 'var(--foreground)' }}>{n.title}</b>
                      <p
                        style={{
                          margin: '3px 0 0 0',
                          fontSize: '0.84rem',
                          color: 'var(--foreground-muted)',
                        }}
                      >
                        {n.message}
                      </p>
                      <small
                        style={{
                          fontSize: '0.72rem',
                          color: 'var(--foreground-muted)',
                          display: 'block',
                          marginTop: 4,
                        }}
                      >
                        {n.createdAt ? new Date(n.createdAt).toLocaleString() : 'Recent'}
                      </small>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="btn mini secondary"
                    onClick={() => handleToggleRead(n)}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
                    title={isUnread ? 'Mark as read' : 'Mark as unread'}
                  >
                    {isUnread ? <MailOpen size={13} /> : <Mail size={13} />}
                    {isUnread ? 'Mark read' : 'Mark unread'}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </AppShell>
  );
}
