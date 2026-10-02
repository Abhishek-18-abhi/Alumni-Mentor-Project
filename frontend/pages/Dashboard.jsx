import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';
import { useDashboardData } from '../hooks/useDashboardData';
import EmptyState from '../components/EmptyState';
import StatusChip from '../components/StatusChip';
import {
  Users,
  CalendarDays,
  Target,
  Clock,
  Sparkles,
  Award,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  PauseCircle,
  PlayCircle,
  Activity,
  HeartPulse,
} from 'lucide-react';

/* ========================================================================== */
/* STUDENT DASHBOARD                                                          */
/* ========================================================================== */
export function StudentDashboard() {
  const nav = useNavigate();
  const { currentUser, metrics, recentItems, loading, error, refetch } =
    useDashboardData('student');

  const stats = [
    {
      label: 'Pending Requests',
      value: metrics ? `${metrics.pendingRequestsCount} pending` : '0',
      icon: Clock,
      color: 'blue',
      subtext: 'Awaiting mentor acceptance',
    },
    {
      label: 'Upcoming Meetings',
      value: metrics ? `${metrics.upcomingMeetingsCount} scheduled` : '0',
      icon: CalendarDays,
      color: 'green',
      subtext: 'Confirmed 1:1 sessions',
    },
    {
      label: 'Goals Completed',
      value: metrics ? `${metrics.completedGoalsCount} / ${metrics.totalGoalsCount || 0}` : '0',
      icon: Target,
      color: 'purple',
      subtext: 'Milestones achieved',
    },
    {
      label: 'Profile Completion',
      value: metrics ? `${metrics.profileCompletion}%` : '0%',
      icon: Award,
      color: 'orange',
      subtext: 'Improves match accuracy',
    },
  ];

  return (
    <DashboardLayout
      role="student"
      eyebrow="Student Workspace • BCA Alumni Network"
      title={`Welcome back${currentUser?.name ? `, ${currentUser.name.split(' ')[0]}` : ''}`}
      subtitle="Track your mentorship progress, upcoming meeting hours, and career milestones."
      stats={stats}
      loading={loading}
      error={error}
      onRetry={refetch}
      actions={
        <div style={{ display: 'flex', gap: 8 }}>
          <button type="button" className="btn secondary" onClick={() => nav('/matches')}>
            <Sparkles size={15} /> View Matches
          </button>
          <button type="button" className="btn primary" onClick={() => nav('/mentors')}>
            Find Mentors
          </button>
        </div>
      }
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: 20,
        }}
      >
        {/* Upcoming Meetings Panel */}
        <section className="card">
          <div
            className="section-head"
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 14,
            }}
          >
            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700 }}>Upcoming Sessions</h3>
            <Link to="/meetings" className="text-link" style={{ fontSize: '0.84rem' }}>
              View all
            </Link>
          </div>

          {recentItems.length === 0 ? (
            <EmptyState
              title="No upcoming sessions"
              text="When a mentor accepts your request, you can schedule a 1-on-1 meeting."
              actionLabel="Find a Mentor"
              onAction={() => nav('/mentors')}
            />
          ) : (
            <div className="table-list">
              {recentItems.map((m) => (
                <div key={m.id || m._id} className="table-row" style={{ padding: '10px 0' }}>
                  <div>
                    <b>
                      {m.date} · {m.time}
                    </b>
                    <p
                      style={{
                        margin: '2px 0 0 0',
                        fontSize: '0.82rem',
                        color: 'var(--foreground-muted)',
                      }}
                    >
                      Mode: {m.mode || 'Video call'}
                    </p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <StatusChip status={m.status} size="sm" />
                    {m.link && (
                      <a
                        href={m.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn mini join-btn"
                      >
                        Join
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Quick Mentorship Actions */}
        <section className="card">
          <h3 style={{ margin: '0 0 14px 0', fontSize: '1.05rem', fontWeight: 700 }}>
            Quick Actions
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <Link to="/matches" className="quick-action-row">
              <div className="quick-action-icon blue">
                <Sparkles size={16} />
              </div>
              <div style={{ flex: 1 }}>
                <b>View Explainable Matches</b>
                <p>Browse alumni ranked transparently by factor overlap</p>
              </div>
              <ArrowRight size={14} />
            </Link>
            <Link to="/goals" className="quick-action-row">
              <div className="quick-action-icon green">
                <Target size={16} />
              </div>
              <div style={{ flex: 1 }}>
                <b>Milestone Goal Tracker</b>
                <p>Record career objectives and generate AI SMART goals</p>
              </div>
              <ArrowRight size={14} />
            </Link>
            <Link to="/profile" className="quick-action-row">
              <div className="quick-action-icon purple">
                <Award size={16} />
              </div>
              <div style={{ flex: 1 }}>
                <b>Update Profile Skills & Goals</b>
                <p>Keep your technical skills and domain preferences current</p>
              </div>
              <ArrowRight size={14} />
            </Link>
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}

/* ========================================================================== */
/* MENTOR DASHBOARD                                                           */
/* ========================================================================== */
export function MentorDashboard() {
  const nav = useNavigate();
  const { currentUser, metrics, recentItems, loading, error, refetch, togglePauseRequests } =
    useDashboardData('mentor');

  const stats = [
    {
      label: 'Pending Requests',
      value: metrics ? `${metrics.pendingRequestsCount} waiting` : '0',
      icon: Clock,
      color: 'blue',
      subtext: 'Incoming student requests',
    },
    {
      label: 'Active Mentees / Capacity',
      value: metrics ? `${metrics.currentMentees} / ${metrics.capacity}` : '0 / 0',
      icon: Users,
      color: 'green',
      subtext:
        metrics?.currentMentees >= metrics?.capacity ? 'Capacity full' : 'Available capacity open',
    },
    {
      label: 'Upcoming Sessions',
      value: metrics ? `${metrics.upcomingMeetingsCount} scheduled` : '0',
      icon: CalendarDays,
      color: 'purple',
      subtext: 'Planned mentoring slots',
    },
    {
      label: 'Intake Status',
      value: metrics?.pauseRequests ? 'Paused' : 'Accepting',
      icon: metrics?.pauseRequests ? PauseCircle : PlayCircle,
      color: metrics?.pauseRequests ? 'orange' : 'green',
      subtext: metrics?.pauseRequests ? 'New requests blocked' : 'Accepting new mentees',
    },
  ];

  return (
    <DashboardLayout
      role="mentor"
      eyebrow="Alumni Mentor Workspace"
      title={`Welcome back${currentUser?.name ? `, ${currentUser.name.split(' ')[0]}` : ''}`}
      subtitle="Overview of your active mentees, incoming pairing requests, and weekly session hours."
      stats={stats}
      loading={loading}
      error={error}
      onRetry={refetch}
      actions={
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            type="button"
            className={`btn ${metrics?.pauseRequests ? 'primary' : 'secondary'}`}
            onClick={togglePauseRequests}
            title={
              metrics?.pauseRequests
                ? 'Resume receiving student requests'
                : 'Pause receiving new student requests'
            }
          >
            {metrics?.pauseRequests ? <PlayCircle size={15} /> : <PauseCircle size={15} />}
            {metrics?.pauseRequests ? 'Resume Intake' : 'Pause Requests'}
          </button>
          <button type="button" className="btn primary" onClick={() => nav('/mentor/requests')}>
            Review Requests
          </button>
        </div>
      }
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: 20,
        }}
      >
        {/* Pending Requests Panel */}
        <section className="card">
          <div
            className="section-head"
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 14,
            }}
          >
            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700 }}>
              Pending Student Requests
            </h3>
            <Link to="/mentor/requests" className="text-link" style={{ fontSize: '0.84rem' }}>
              View all ({metrics?.pendingRequestsCount || 0})
            </Link>
          </div>

          {recentItems.length === 0 ? (
            <EmptyState
              title="No pending requests"
              text="You are all caught up! New mentorship inquiries from students will appear here."
            />
          ) : (
            <div className="table-list">
              {recentItems.map((r) => (
                <div key={r.id || r._id} className="table-row" style={{ padding: '10px 0' }}>
                  <div>
                    <b>{r.studentId?.name || 'Student'}</b>
                    <p
                      style={{
                        margin: '2px 0 0 0',
                        fontSize: '0.82rem',
                        color: 'var(--foreground-muted)',
                      }}
                    >
                      Match Score:{' '}
                      {r.matchSnapshot?.score ? `${r.matchSnapshot.score}%` : 'Calculated'}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="btn mini secondary"
                    onClick={() => nav('/mentor/requests')}
                  >
                    Review
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Mentor Availability & Schedule Overview */}
        <section className="card">
          <h3 style={{ margin: '0 0 14px 0', fontSize: '1.05rem', fontWeight: 700 }}>
            Schedule & Availability
          </h3>
          <p
            style={{
              fontSize: '0.88rem',
              color: 'var(--foreground-muted)',
              lineHeight: 1.5,
              marginBottom: 16,
            }}
          >
            Keep your weekly calendar availability up to date so students can book valid 1-on-1
            meeting slots.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <Link to="/mentor/calendar" className="quick-action-row">
              <div className="quick-action-icon blue">
                <CalendarDays size={16} />
              </div>
              <div style={{ flex: 1 }}>
                <b>Manage Calendar Availability</b>
                <p>Configure recurring weekly slots for student bookings</p>
              </div>
              <ArrowRight size={14} />
            </Link>
            <Link to="/mentor/mentees" className="quick-action-row">
              <div className="quick-action-icon green">
                <Users size={16} />
              </div>
              <div style={{ flex: 1 }}>
                <b>My Active Mentees</b>
                <p>View matched students and ongoing mentorship threads</p>
              </div>
              <ArrowRight size={14} />
            </Link>
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}

/* ========================================================================== */
/* ADMIN DASHBOARD                                                            */
/* ========================================================================== */
export function AdminDashboard() {
  const nav = useNavigate();
  const { metrics, recentItems, loading, error, refetch } = useDashboardData('admin');

  const stats = [
    {
      label: 'Registered Students',
      value: metrics ? `${metrics.studentCount} students` : '0',
      icon: Users,
      color: 'blue',
      subtext: 'Enrolled in platform',
    },
    {
      label: 'Alumni Mentors',
      value: metrics ? `${metrics.mentorCount} mentors` : '0',
      icon: Award,
      color: 'purple',
      subtext: 'Registered alumni',
    },
    {
      label: 'Active Mentorships',
      value: metrics ? `${metrics.activeMentorships} pairs` : '0',
      icon: Sparkles,
      color: 'green',
      subtext: 'Active accepted pairings',
    },
    {
      label: 'System Status',
      value: metrics?.systemStatus || 'Healthy',
      icon: HeartPulse,
      color: metrics?.systemStatus === 'Healthy' ? 'green' : 'orange',
      subtext: `Database: ${metrics?.dbStatus || 'connected'}`,
    },
  ];

  return (
    <DashboardLayout
      role="admin"
      eyebrow="Administrator Platform Portal"
      title="College Platform Overview"
      subtitle="University-wide mentorship analytics, pairing ratios, and active alumni engagement."
      stats={stats}
      loading={loading}
      error={error}
      onRetry={refetch}
      actions={
        <div style={{ display: 'flex', gap: 8 }}>
          <button type="button" className="btn secondary" onClick={() => nav('/admin/analytics')}>
            <Activity size={15} /> Analytics
          </button>
          <button type="button" className="btn primary" onClick={() => nav('/admin/users')}>
            Manage Users
          </button>
        </div>
      }
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: 20,
        }}
      >
        {/* Registered Alumni Mentors Panel */}
        <section className="card">
          <div
            className="section-head"
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 14,
            }}
          >
            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700 }}>
              Registered Alumni Mentors
            </h3>
            <Link to="/admin/users" className="text-link" style={{ fontSize: '0.84rem' }}>
              View all ({metrics?.mentorCount || 0})
            </Link>
          </div>

          {recentItems.length === 0 ? (
            <EmptyState
              title="No mentors registered"
              text="Registered alumni mentors will appear here."
            />
          ) : (
            <div className="table-list">
              {recentItems.map((m) => (
                <div key={m.id || m._id} className="table-row" style={{ padding: '10px 0' }}>
                  <div>
                    <b>{m.name}</b>
                    <p
                      style={{
                        margin: '2px 0 0 0',
                        fontSize: '0.82rem',
                        color: 'var(--foreground-muted)',
                      }}
                    >
                      {m.jobTitle || 'Alumnus'} · {m.company || 'Industry'}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="btn mini secondary"
                    onClick={() => nav('/admin/users')}
                  >
                    Manage
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* System Administration Quick Links */}
        <section className="card">
          <h3 style={{ margin: '0 0 14px 0', fontSize: '1.05rem', fontWeight: 700 }}>
            Audit & Platform Controls
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <Link to="/admin/audit" className="quick-action-row">
              <div className="quick-action-icon blue">
                <ShieldCheck size={16} />
              </div>
              <div style={{ flex: 1 }}>
                <b>Cryptographic Audit Ledger</b>
                <p>Verify SHA-256 tamper-evident hash chain across all state changes</p>
              </div>
              <ArrowRight size={14} />
            </Link>
            <Link to="/admin/matching" className="quick-action-row">
              <div className="quick-action-icon purple">
                <Sparkles size={16} />
              </div>
              <div style={{ flex: 1 }}>
                <b>Algorithm Inspector</b>
                <p>Simulate pairings and inspect transparent factor score contributions</p>
              </div>
              <ArrowRight size={14} />
            </Link>
            <Link to="/admin/analytics" className="quick-action-row">
              <div className="quick-action-icon green">
                <Activity size={16} />
              </div>
              <div style={{ flex: 1 }}>
                <b>Capacity Balance & Funnel Analytics</b>
                <p>Monitor mentor load distribution and accept-rate funnels</p>
              </div>
              <ArrowRight size={14} />
            </Link>
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}
