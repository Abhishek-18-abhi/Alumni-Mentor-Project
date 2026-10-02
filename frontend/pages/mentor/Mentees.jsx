import React, { useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import AppShell from '../../components/AppShell';
import PageTitle from '../../components/PageTitle';
import EmptyState from '../../components/EmptyState';
import StatusChip from '../../components/StatusChip';
import DataTable from '../../components/DataTable';
import { useMentorshipRequests, useUsers } from '../../hooks/useApi';
import { getSession } from '../../lib/storage';
import { Users, CalendarDays, Target, MessageSquare } from 'lucide-react';

export default function Mentees() {
  const nav = useNavigate();
  const session = getSession();
  const mentorId = session?.id || session?._id;

  const { data: requests = [], loading: loadingRequests } = useMentorshipRequests();
  const { data: users = [] } = useUsers();

  const acceptedRequests = useMemo(() => {
    return (requests || []).filter((r) => {
      const mId = r.mentorId?._id || r.mentorId?.id || r.mentorId;
      return String(mId) === String(mentorId) && r.status === 'accepted';
    });
  }, [requests, mentorId]);

  const mentees = useMemo(() => {
    return (acceptedRequests || []).map((r) => {
      const sId = r.studentId?._id || r.studentId?.id || r.studentId;
      const studentUser = (users || []).find((u) => (u.id || u._id) === sId) || r.studentId || {};
      return {
        id: r.id || r._id,
        studentId: sId,
        name: studentUser.name || 'Student',
        email: studentUser.email || '',
        course: studentUser.course || "BCA '25",
        college: studentUser.college || 'College of Computer Applications',
        skills: studentUser.skills || [],
        goals: studentUser.goals || [],
        acceptedAt: r.respondedAt || r.updatedAt,
      };
    });
  }, [acceptedRequests, users]);

  const columns = [
    {
      header: 'Student',
      accessor: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div className="mentor-avatar" style={{ width: 34, height: 34, fontSize: '0.88rem' }}>
            {row.name?.[0] || 'S'}
          </div>
          <div>
            <b>{row.name}</b>
            <p
              style={{ margin: '2px 0 0 0', fontSize: '0.8rem', color: 'var(--foreground-muted)' }}
            >
              {row.course} · {row.college}
            </p>
          </div>
        </div>
      ),
    },
    {
      header: 'Skills',
      accessor: (row) => (
        <div className="tag-row">
          {(row.skills || []).slice(0, 3).map((s) => (
            <span key={s} className="category-pill-tech" style={{ fontSize: '0.74rem' }}>
              {s}
            </span>
          ))}
        </div>
      ),
    },
    {
      header: 'Focus Goals',
      accessor: (row) => (
        <span style={{ fontSize: '0.84rem' }}>
          {(row.goals || []).slice(0, 2).join(', ') || 'Career & Project guidance'}
        </span>
      ),
    },
    {
      header: 'Mentorship Status',
      accessor: () => <StatusChip status="accepted" label="Active Mentee" size="sm" />,
    },
    {
      header: 'Actions',
      align: 'right',
      accessor: () => (
        <div style={{ display: 'inline-flex', gap: 6 }}>
          <Link
            to="/mentor/meetings"
            className="btn mini secondary"
            title="View scheduled sessions"
          >
            <CalendarDays size={13} /> Meetings
          </Link>
          <Link to="/mentor/goals" className="btn mini secondary" title="Track mentee goals">
            <Target size={13} /> Goals
          </Link>
        </div>
      ),
    },
  ];

  return (
    <AppShell role="mentor">
      <PageTitle
        eyebrow="Alumni Mentor Workspace"
        title="My Active Mentees"
        text="Review currently accepted mentees, milestone goals, and ongoing progress."
      />

      <section className="card">
        <DataTable
          columns={columns}
          data={mentees}
          loading={loadingRequests}
          emptyTitle="No active mentees"
          emptyText="When you accept incoming student requests, they will appear here as active mentees."
        />
      </section>
    </AppShell>
  );
}
