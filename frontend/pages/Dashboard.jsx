import React from 'react';
import { Link } from 'react-router-dom';
import AppShell from '../components/AppShell';
import PageTitle from '../components/PageTitle';
import { Users, CalendarDays, Target, ShieldCheck, UserCheck, Sparkles } from 'lucide-react';
import { getUsers, getMeetings, getRequests, getGoals, getSession } from '../lib/storage';
function Stat({ icon: Icon, label, value }) {
  return (
    <div className="stat">
      <div className="stat-icon">
        <Icon size={19} />
      </div>
      <div>
        <span>{label}</span>
        <b>{value}</b>
      </div>
    </div>
  );
}
export function StudentDashboard() {
  const s = getUsers().find((u) => u.id === getSession()?.id);
  const users = getUsers();
  const active = getRequests().filter((r) => r.studentId === s?.id && r.status === 'accepted');
  const meetings = getMeetings().filter((m) => m.studentId === s?.id && m.status !== 'cancelled');
  const goals = getGoals().filter((g) => g.studentId === s?.id);
  const mentors = users.filter((u) => u.role === 'mentor' && u.profileComplete);
  return (
    <AppShell role="student">
      <PageTitle
        eyebrow="Student workspace"
        title={`Welcome${s?.name ? `, ${s.name.split(' ')[0]}` : ''}`}
        text="Your dashboard uses only your real account and local activity."
      />
      <div className="stats">
        <Stat icon={UserCheck} label="Active mentors" value={active.length} />
        <Stat icon={CalendarDays} label="Meetings" value={meetings.length} />
        <Stat icon={Target} label="Goals" value={goals.length} />
        <Stat icon={Users} label="Available mentors" value={mentors.length} />
      </div>
      <section className="dashboard-grid">
        <div className="card">
          <h2>Profile readiness</h2>
          <p>
            {s?.profileComplete
              ? 'Your profile is complete and available to the matching engine.'
              : 'Complete onboarding to activate matching.'}
          </p>
          <Link className="uiverse-btn" to={s?.profileComplete ? '/matches' : '/onboarding'}>
            {s?.profileComplete ? 'View recommendations' : 'Complete profile'}
          </Link>
        </div>
        <div className="card">
          <h2>Next step</h2>
          <p>
            {active.length
              ? 'Schedule your next meeting or update your goals.'
              : mentors.length
                ? 'Review your explainable mentor recommendations.'
                : 'No registered mentors are available yet.'}
          </p>
          <Link className="btn secondary" to={active.length ? '/calendar' : '/mentors'}>
            {active.length ? 'Schedule meeting' : 'Find mentor'}
          </Link>
        </div>
      </section>
    </AppShell>
  );
}
export function MentorDashboard() {
  const s = getUsers().find((u) => u.id === getSession()?.id);
  const req = getRequests().filter((r) => r.mentorId === s?.id);
  const meetings = getMeetings().filter((m) => m.mentorId === s?.id);
  const mentees = req.filter((r) => r.status === 'accepted');
  return (
    <AppShell role="mentor">
      <PageTitle
        eyebrow="Alumni mentor"
        title={`Welcome${s?.name ? `, ${s.name.split(' ')[0]}` : ''}`}
        text="Your dashboard is calculated from your actual profile and activity."
      />
      <div className="stats">
        <Stat icon={Users} label="Active mentees" value={mentees.length} />
        <Stat
          icon={UserCheck}
          label="Pending requests"
          value={req.filter((r) => r.status === 'pending').length}
        />
        <Stat icon={CalendarDays} label="Meetings" value={meetings.length} />
        <Stat
          icon={Target}
          label="Capacity"
          value={`${s?.currentMentees || 0} / ${s?.capacity || 0}`}
        />
      </div>
      <section className="dashboard-grid">
        <div className="card">
          <h2>Mentor profile</h2>
          <p>
            {s?.profileComplete
              ? 'Your skills, interests, availability and capacity are visible to matching.'
              : 'Complete mentor onboarding before accepting requests.'}
          </p>
          <Link
            className="uiverse-btn"
            to={s?.profileComplete ? '/mentor/requests' : '/mentor/onboarding'}
          >
            {s?.profileComplete ? 'View requests' : 'Complete profile'}
          </Link>
        </div>
        <div className="card">
          <h2>Availability</h2>
          <p>{s?.availability?.length || 0} recurring slots configured.</p>
          <Link className="btn secondary" to="/mentor/calendar">
            Manage availability
          </Link>
        </div>
      </section>
    </AppShell>
  );
}
export function AdminDashboard() {
  const users = getUsers(),
    meetings = getMeetings(),
    requests = getRequests();
  return (
    <AppShell role="admin">
      <PageTitle
        eyebrow="Administrator"
        title="Platform overview"
        text="All counts are calculated from actual localStorage records."
      />
      <div className="stats">
        <Stat
          icon={Users}
          label="Students"
          value={users.filter((u) => u.role === 'student').length}
        />
        <Stat
          icon={UserCheck}
          label="Alumni mentors"
          value={users.filter((u) => u.role === 'mentor').length}
        />
        <Stat icon={CalendarDays} label="Meetings" value={meetings.length} />
        <Stat
          icon={ShieldCheck}
          label="Administrators"
          value={users.filter((u) => u.role === 'admin').length}
        />
      </div>
      <section className="dashboard-grid">
        <div className="card">
          <h2>Requests</h2>
          <p>
            {requests.filter((r) => r.status === 'pending').length} pending mentorship requests.
          </p>
          <Link className="btn secondary" to="/admin/users">
            View users
          </Link>
        </div>
        <div className="card">
          <h2>Administration</h2>
          <p>Send notifications, manage administrators and inspect audit activity.</p>
          <Link className="uiverse-btn" to="/admin/notifications">
            Send notification
          </Link>
        </div>
      </section>
    </AppShell>
  );
}
