import React, { useMemo, useState, useEffect } from 'react';
import { useSearchParams, useParams, useNavigate, Link, Navigate } from 'react-router-dom';
import { DAYS, TIME_SLOTS } from '../lib/constants';
import { respondToRequest, createMentorshipRequest } from '../lib/requests';
import { updateUser } from '../lib/auth';
import { apiPatch, hydrateLocalCache, refetchAudit } from '../lib/api';
import { createMeeting, updateMeeting, createGoal, updateGoal, createFeedback, markNotificationRead, markAllNotificationsRead, updatePlatformSettings, sendAdminNotification } from '../lib/dataApi';
import { scoreMatch, buildMatchSnapshot } from '../lib/matching';
import { useToast } from '../components/Toast';
import ProgressModal from '../components/ProgressModal';
import ModalShell from '../components/ModalShell';
import AppShell from '../components/AppShell';
import PageTitle from '../components/PageTitle';
import {
  Search,
  CalendarDays,
  Check,
  Clock3,
  MessageSquare,
  Target,
  Star,
  Bell,
  ShieldCheck,
  Send,
  UserCheck,
  X,
  BarChart3,
  Users,
  Sparkles,
  ClipboardList,
} from 'lucide-react';
import {
  getUsers,
  saveUsers,
  getMeetings,
  saveMeetings,
  getNotifications,
  saveNotifications,
  getRequests,
  saveRequests,
  getSession,
  addNotification,
  addAudit,
  uid,
  getGoals,
  saveGoals,
  getFeedback,
  saveFeedback,
  getAudit,
  getPlatformSettings,
  savePlatformSettings,
  normalizeList,
  splitList,
} from '../lib/storage';
const current = () => getUsers().find((u) => u.id === getSession()?.id);
const FACTOR_LABELS = {
  skills: 'Skills',
  interests: 'Interests',
  goals: 'Goals',
  languages: 'Languages',
  availability: 'Availability',
  capacity: 'Capacity',
};
function Empty({ title, text }) {
  return (
    <div className="empty">
      <div className="empty-icon">
        <ShieldCheck size={21} />
      </div>
      <h3>{title}</h3>
      <p>{text}</p>
    </div>
  );
}
export function FindMentor() {
  const [params, setParams] = useSearchParams();
  const [q, setQ] = useState(params.get('search') || '');
  const s = current();
  const mentors = getUsers().filter((u) => u.role === 'mentor' && u.profileComplete);
  const results = mentors
    .map((m) => ({ ...m, match: scoreMatch(s, m) }))
    .filter((m) =>
      [m.name, m.jobTitle, m.company, m.domain, ...(m.skills || []), ...(m.interests || [])]
        .join(' ')
        .toLowerCase()
        .includes(q.toLowerCase())
    )
    .sort((a, b) => b.match.score - a.match.score);
  return (
    <AppShell role="student">
      <PageTitle
        eyebrow="Student"
        title="Find a mentor"
        text="Search real mentor profiles. Recommendations are calculated from your skills, interests, goals, languages and mentor capacity."
      />
      <section className="card">
        <div className="search large-search">
          <Search size={17} />
          <input
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setParams(e.target.value ? { search: e.target.value } : {});
            }}
            placeholder="Search mentors, skills or domains..."
          />
        </div>
      </section>
      <div className="mentor-grid">
        {results.map((m) => (
          <MentorCard key={m.id} mentor={m} />
        ))}
        {results.length === 0 && (
          <Empty
            title={q ? 'No mentors match your search' : 'No alumni mentors registered yet.'}
            text={
              q
                ? 'Try another name, skill or domain.'
                : 'Register an alumni mentor account from the top-right account menu.'
            }
          />
        )}
      </div>
    </AppShell>
  );
}
function MentorCard({ mentor }) {
  return (
    <article className="mentor-card">
      <div className="mentor-avatar">{mentor.name?.[0]}</div>
      <div className="mentor-main">
        <div>
          <h3>{mentor.name}</h3>
          <p>
            {mentor.jobTitle} · {mentor.company}
          </p>
        </div>
        <span className="match-score">{mentor.match.score}% match</span>
      </div>
      <p>{mentor.domain || mentor.interests?.join(', ') || 'Mentorship'}</p>
      <div className="tag-row">
        {(mentor.skills || []).slice(0, 5).map((x) => (
          <span key={x}>{x}</span>
        ))}
      </div>
      <div className="match-reason">
        {mentor.match.matched.length
          ? `Skills: ${mentor.match.matched.slice(0, 3).join(', ')}`
          : 'Profile match available'}
        {mentor.match.capacity ? ' · Capacity available' : ''}
      </div>
      <div className="mentor-actions">
        <Link className="btn secondary" to={`/mentor/${mentor.id}`}>
          View profile
        </Link>
        <Link className="uiverse-btn" to={`/request?mentor=${mentor.id}`}>
          Request
        </Link>
      </div>
    </article>
  );
}
export function MentorProfile() {
  const { id } = useParams();
  const m = getUsers().find((u) => u.id === id);
  const s = current();
  const match = m && s?.role === 'student' ? scoreMatch(s, m) : null;
  return (
    <AppShell role="student">
      <PageTitle
        eyebrow="Mentor profile"
        title={m?.name || 'Mentor profile'}
        text={
          m ? `${m.jobTitle || ''} ${m.company ? '· ' + m.company : ''}` : 'No mentor selected.'
        }
      />
      {m ? (
        <div className="profile-grid">
          <section className="card">
            <h2>About</h2>
            <p>{m.bio || 'This mentor has not added an about section yet.'}</p>
            <h3>Skills & expertise</h3>
            <div className="tag-row">
              {(m.skills || []).map((x) => (
                <span key={x}>{x}</span>
              ))}
            </div>
            <h3>Interests</h3>
            <div className="tag-row">
              {(m.interests || []).map((x) => (
                <span key={x}>{x}</span>
              ))}
            </div>
            {match && (
              <div className="explain-box">
                <b>{match.score}% explainable match</b>
                <p>
                  {match.matched.length
                    ? `Matching skills: ${match.matched.join(', ')}.`
                    : 'No direct skill overlap yet.'}{' '}
                  {match.matchedInterests.length
                    ? `Shared interests: ${match.matchedInterests.join(', ')}.`
                    : ''}{' '}
                  {match.capacity
                    ? 'The mentor has available capacity.'
                    : 'The mentor is currently at capacity.'}
                </p>
                <ul className="factor-list">
                  {match.factors.map((f) => (
                    <li key={f.name}>
                      <b>{FACTOR_LABELS[f.name]}</b> · {f.contribution} /{' '}
                      {Math.round(f.weight * 100)} pts — {f.explanation}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>
          <section className="card">
            <h2>Mentorship details</h2>
            <div className="detail-list">
              <span>
                Experience <b>{m.experience || 'Not specified'}</b>
              </span>
              <span>
                Languages <b>{(m.languages || []).join(', ')}</b>
              </span>
              <span>
                Capacity{' '}
                <b>
                  {m.currentMentees || 0} / {m.capacity || 0}
                </b>
              </span>
              <span>
                Availability <b>{m.availability?.length || 0} slots</b>
              </span>
            </div>
            <Link className="uiverse-btn full" to={`/request?mentor=${m.id}`}>
              Request mentorship
            </Link>
          </section>
        </div>
      ) : (
        <Empty
          title="No mentor found"
          text="Go back to Find Mentor and select a registered mentor."
        />
      )}
    </AppShell>
  );
}
export function Request() {
  const [params] = useSearchParams();
  const s = current();
  const mentorId = params.get('mentor');
  const m = getUsers().find((u) => u.id === mentorId);
  const [msg, setMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const nav = useNavigate();
  const toast = useToast();
  const submit = async (e) => {
    e.preventDefault();
    if (!m || !s || isSubmitting) return;
    const existing = getRequests().find((r) => r.studentId === s.id && r.mentorId === m.id && ['pending', 'accepted'].includes(r.status));
    if (existing) {
      return toast.error(
        existing.status === 'accepted'
          ? 'You are already actively paired with this mentor.'
          : 'You already have a pending request for this mentor.'
      );
    }
    setIsSubmitting(true);
    try {
      const result = await createMentorshipRequest(s, m, msg, buildMatchSnapshot(scoreMatch(s, m)));
      if (!result.ok) return toast.error(result.error);
      toast.success('Mentorship request sent successfully.');
      nav('/matches');
    } finally {
      setIsSubmitting(false);
    }
  };
  return (
    <AppShell role="student">
      <PageTitle
        eyebrow="Mentorship"
        title="Request mentorship"
        text={m ? `Send a request to ${m.name}.` : 'Select a mentor first.'}
      />
      {m ? (
        <section className="card form-card">
          <div className="mentor-summary">
            <div className="mentor-avatar">{m.name[0]}</div>
            <div>
              <b>{m.name}</b>
              <span>
                {m.jobTitle} · {m.domain}
              </span>
            </div>
          </div>
          <form onSubmit={submit} className="form-stack">
            <label>
              Why would you like this mentor?
              <textarea
                required
                rows="6"
                value={msg}
                onChange={(e) => setMsg(e.target.value)}
                placeholder="Explain your goals and what you hope to learn."
              />
            </label>
            <button className="uiverse-btn" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Sending request...' : 'Send request'} <Send size={16} />
            </button>
          </form>
        </section>
      ) : (
        <Empty title="No mentor selected" text="Open Find Mentor and choose a registered mentor." />
      )}
    </AppShell>
  );
}
export function Matches() {
  const s = current();
  const req = getRequests().filter((r) => r.studentId === s?.id);
  const mentors = getUsers()
    .filter((u) => u.role === 'mentor' && u.profileComplete)
    .map((m) => ({ ...m, match: scoreMatch(s, m) }))
    .sort((a, b) => b.match.score - a.match.score);
  return (
    <AppShell role="student">
      <PageTitle
        eyebrow="Student"
        title="My matches"
        text="Your recommendations and actual mentorship requests are based on your stored profile."
      />
      <section className="match-section">
        <h2>Recommended mentors</h2>
        <div className="mentor-grid">
          {mentors.slice(0, 6).map((m) => (
            <MentorCard key={m.id} mentor={m} />
          ))}
          {!mentors.length && (
            <Empty
              title="No recommendations yet"
              text="Complete your student onboarding and wait for mentor profiles to be registered."
            />
          )}
        </div>
      </section>
      <section className="card">
        <h2>My requests</h2>
        <div className="data-table">
          <div className="table-row table-head">
            <span>Mentor</span>
            <span>Message</span>
            <span>Status</span>
            <span>Created</span>
          </div>
          {req.map((r) => {
            const m = getUsers().find((u) => u.id === r.mentorId);
            return (
              <div className="table-row" key={r.id}>
                <span>{m?.name || 'Unknown'}</span>
                <span>{r.message}</span>
                <span>
                  <span className="status-chip">{r.status}</span>
                </span>
                <span>{new Date(r.createdAt).toLocaleDateString()}</span>
              </div>
            );
          })}
        </div>
        {req.length === 0 && (
          <Empty title="No requests yet" text="Send a mentorship request from a mentor profile." />
        )}
      </section>
    </AppShell>
  );
}
export function MentorRequests() {
  const s = current();
  const toast = useToast();
  const [items, setItems] = useState(getRequests().filter((r) => r.mentorId === s?.id));
  const [respondingId, setRespondingId] = useState(null);
  const respond = async (r, status) => {
    if (respondingId) return;
    setRespondingId(r.id);
    try {
      const result = await respondToRequest(s.id, r.id, status);
      if (!result.ok) return toast.error(result.error);
      setItems(getRequests().filter((x) => x.mentorId === s.id));
      toast.success(status === 'accepted' ? 'Request accepted.' : 'Request declined.');
    } finally {
      setRespondingId(null);
    }
  };
  return (
    <AppShell role="mentor">
      <PageTitle
        eyebrow="Alumni mentor"
        title="Mentorship requests"
        text="Accept or decline real student requests while respecting your capacity."
      />
      <section className="card request-list">
        {items.map((r) => {
          const st = getUsers().find((u) => u.id === r.studentId);
          return (
            <div className="request-row" key={r.id}>
              <div className="mentor-avatar">{st?.name?.[0]}</div>
              <div className="request-main">
                <b>{st?.name}</b>
                <span>
                  {st?.college} · {(st?.skills || []).slice(0, 4).join(', ')}
                </span>
                <p>{r.message}</p>
                {r.matchSnapshot && (
                  <details className="match-rationale">
                    <summary>
                      Match rationale · {r.matchSnapshot.score}% ({r.matchSnapshot.algorithmVersion}
                      )
                    </summary>
                    <ul className="factor-list">
                      {r.matchSnapshot.factors.map((f) => (
                        <li key={f.name}>
                          <b>{FACTOR_LABELS[f.name]}</b> · {f.contribution} pts — {f.explanation}
                        </li>
                      ))}
                    </ul>
                  </details>
                )}
              </div>
              <div className="request-actions">
                {r.status === 'pending' ? (
                  <>
                    <button
                      className="btn secondary"
                      onClick={() => respond(r, 'rejected')}
                      disabled={!!respondingId}
                    >
                      <X size={15} />
                      Decline
                    </button>
                    <button
                      className="uiverse-btn"
                      onClick={() => respond(r, 'accepted')}
                      disabled={!!respondingId}
                    >
                      <Check size={15} />
                      {respondingId === r.id ? 'Processing...' : 'Accept'}
                    </button>
                  </>
                ) : (
                  <span className="status-chip">{r.status}</span>
                )}
              </div>
            </div>
          );
        })}
        {!items.length && (
          <Empty
            title="No requests"
            text="Student requests will appear here when someone requests mentorship."
          />
        )}
      </section>
    </AppShell>
  );
}
export function Mentees() {
  const s = current();
  const accepted = getRequests().filter((r) => r.mentorId === s?.id && r.status === 'accepted');
  return (
    <AppShell role="mentor">
      <PageTitle
        eyebrow="Alumni mentor"
        title="My mentees"
        text="Students with accepted mentorship requests."
      />
      <section className="card">
        <div className="data-table">
          <div className="table-row table-head">
            <span>Student</span>
            <span>Skills</span>
            <span>Goals</span>
            <span>Status</span>
          </div>
          {accepted.map((r) => {
            const st = getUsers().find((u) => u.id === r.studentId);
            return (
              <div className="table-row" key={r.id}>
                <span>{st?.name}</span>
                <span>{(st?.skills || []).join(', ')}</span>
                <span>{(st?.goals || []).join(', ')}</span>
                <span>
                  <span className="status-chip">Active</span>
                </span>
              </div>
            );
          })}
        </div>
        {!accepted.length && (
          <Empty
            title="No active mentees"
            text="Accept a student request to create a mentorship relationship."
          />
        )}
      </section>
    </AppShell>
  );
}
export function Meetings({ role = 'student' }) {
  const s = current();
  const toast = useToast();
  const [items, setItems] = useState(
    getMeetings().filter((m) => (role === 'mentor' ? m.mentorId === s?.id : m.studentId === s?.id))
  );
  const [log, setLog] = useState(null);
  const [isSavingLog, setIsSavingLog] = useState(false);
  const saveLog = async (e) => {
    e.preventDefault();
    if (isSavingLog || !log) return;
    setIsSavingLog(true);
    try {
      const result = await updateMeeting(log.id, { log: log.text, status: 'completed' });
      if (!result.ok) return toast.error(result.error);
      const all = getMeetings();
      setItems(all.filter((m) => (role === 'mentor' ? m.mentorId === s?.id : m.studentId === s?.id)));
      setLog(null);
      toast.success('Meeting log saved.');
    } finally {
      setIsSavingLog(false);
    }
  };
  return (
    <AppShell role={role}>
      <PageTitle
        eyebrow="Workspace"
        title="Meetings"
        text="Scheduled meetings and meeting logs stay connected to your mentorship sessions."
        action={
          role === 'student' ? (
            <Link className="uiverse-btn" to="/calendar">
              Schedule meeting
            </Link>
          ) : null
        }
      />
      <section className="card">
        <div className="data-table">
          <div className="table-row table-head">
            <span>Date</span>
            <span>Other participant</span>
            <span>Mode</span>
            <span>Status / Log</span>
          </div>
          {items.map((m) => {
            const other = getUsers().find(
              (u) => u.id === (role === 'mentor' ? m.studentId : m.mentorId)
            );
            return (
              <div className="table-row" key={m.id}>
                <span>
                  {m.date} · {m.time}
                </span>
                <span>{other?.name || 'Unknown'}</span>
                <span>{m.mode}</span>
                <span>
                  <span className="status-chip">{m.status}</span>
                  {m.status !== 'cancelled' && (
                    <button
                      className="btn mini"
                      onClick={() => setLog({ id: m.id, text: m.log || '' })}
                    >
                      {m.log ? 'View log' : 'Add log'}
                    </button>
                  )}
                </span>
              </div>
            );
          })}
        </div>
        {items.length === 0 && (
          <Empty
            title="No meetings yet"
            text="Create a meeting after you have a mentor relationship."
          />
        )}
      </section>
      {log && (
        <ModalShell eyebrow="Meeting log" title="Record session notes" onClose={() => setLog(null)}>
          <form className="form-stack" onSubmit={saveLog}>
            <label>
              What happened in this meeting?
              <textarea
                rows="7"
                required
                value={log.text}
                onChange={(e) => setLog({ ...log, text: e.target.value })}
                placeholder="Topics discussed, action items, next steps..."
              />
            </label>
            <button className="uiverse-btn" type="submit" disabled={isSavingLog}>
              {isSavingLog ? 'Saving log...' : 'Save meeting log'}
            </button>
          </form>
        </ModalShell>
      )}
    </AppShell>
  );
}
export function Calendar() {
  const s = current();
  const nav = useNavigate();
  const toast = useToast();
  const accepted = getRequests().filter((r) => r.studentId === s?.id && r.status === 'accepted');
  const mentors = accepted.map((r) => getUsers().find((u) => u.id === r.mentorId)).filter(Boolean);
  const [form, setForm] = useState({
    mentorId: mentors[0]?.id || '',
    date: '',
    time: '',
    mode: 'Video call',
  });
  const [isScheduling, setIsScheduling] = useState(false);

  useEffect(() => {
    if (!form.mentorId && mentors.length > 0) {
      setForm((prev) => ({ ...prev, mentorId: mentors[0].id }));
    }
  }, [mentors, form.mentorId]);
  const save = async (e) => {
    e.preventDefault();
    if (isScheduling) return;
    if (!form.mentorId) return toast.error('You need an accepted mentor relationship first.');
    setIsScheduling(true);
    try {
      const result = await createMeeting({ studentId: s.id, mentorId: form.mentorId, date: form.date, time: form.time, mode: form.mode, status: 'scheduled' });
      if (!result.ok) return toast.error(result.error);
      toast.success('Meeting scheduled successfully.');
      nav('/meetings');
    } finally {
      setIsScheduling(false);
    }
  };
  return (
    <AppShell role="student">
      <PageTitle
        eyebrow="Student"
        title="Schedule a meeting"
        text="Schedule with a mentor after the mentorship request is accepted."
      />
      {mentors.length ? (
        <section className="card form-card">
          <form className="form-stack" onSubmit={save}>
            <label>
              Mentor
              <select
                value={form.mentorId}
                onChange={(e) => setForm({ ...form, mentorId: e.target.value })}
              >
                {mentors.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </label>
            <div className="two-col">
              <label>
                Date
                <input
                  type="date"
                  required
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                />
              </label>
              <label>
                Time
                <input
                  type="time"
                  required
                  value={form.time}
                  onChange={(e) => setForm({ ...form, time: e.target.value })}
                />
              </label>
            </div>
            <label>
              Mode
              <select
                value={form.mode}
                onChange={(e) => setForm({ ...form, mode: e.target.value })}
              >
                <option>Video call</option>
                <option>Phone call</option>
                <option>In person</option>
              </select>
            </label>
            <button className="uiverse-btn" type="submit" disabled={isScheduling}>
              {isScheduling ? 'Scheduling...' : 'Create meeting'}
            </button>
          </form>
        </section>
      ) : (
        <Empty
          title="No accepted mentor"
          text="Send a request and wait for a mentor to accept it before scheduling a meeting."
        />
      )}
    </AppShell>
  );
}
export function MentorAvailability() {
  const s = current();
  const [slots, setSlots] = useState(s?.availability || []);
  const toggle = async (x) => {
    const next = slots.includes(x) ? slots.filter((v) => v !== x) : [...slots, x];
    const result = await updateUser(s.id, { availability: next });
    if (!result.ok) return;
    setSlots(next);
  };
  return (
    <AppShell role="mentor">
      <PageTitle
        eyebrow="Alumni mentor"
        title="Availability"
        text="Set recurring weekly slots visible to students."
      />
      <section className="card">
        <div className="slot-grid">
          {DAYS.map((day) => (
            <div className="slot-day" key={day}>
              <b>{day}</b>
              {TIME_SLOTS.map((t) => (
                <button
                  type="button"
                  aria-pressed={slots.includes(`${day} ${t}`)}
                  className={slots.includes(`${day} ${t}`) ? 'slot selected' : 'slot'}
                  onClick={() => toggle(`${day} ${t}`)}
                  key={t}
                >
                  {t}
                </button>
              ))}
            </div>
          ))}
        </div>
      </section>
    </AppShell>
  );
}
export function Notifications() {
  const s = getSession();
  const [items, setItems] = useState(() => getNotifications().filter((n) => n.userId === s?.id));

  if (!s) {
    return <Navigate to="/login" replace />;
  }

  const mark = async (id) => {
    const result = await markNotificationRead(id);
    if (!result.ok) return;
    setItems(getNotifications().filter((n) => n.userId === s?.id));
  };
  const markAll = async () => {
    const result = await markAllNotificationsRead();
    if (!result.ok) return;
    setItems(getNotifications().filter((n) => n.userId === s?.id));
  };
  return (
    <AppShell role={s?.role}>
      <PageTitle
        eyebrow="Updates"
        title="Notifications"
        text="Notifications are generated by actual account and workflow activity."
        action={
          <button className="btn secondary" onClick={markAll}>
            Mark all read
          </button>
        }
      />
      <section className="card notification-list">
        {items.map((n) => (
          <button
            key={n.id}
            className={`notification ${n.read ? 'read' : ''}`}
            onClick={() => mark(n.id)}
          >
            <div className="activity-icon">
              <Bell size={17} />
            </div>
            <div>
              <b>{n.title}</b>
              <span>{n.message}</span>
              <small>{new Date(n.createdAt).toLocaleString()}</small>
            </div>
            {!n.read && <span className="unread-dot" />}
          </button>
        ))}
        {!items.length && (
          <Empty
            title="No notifications"
            text="New notifications will appear after registration, requests, meetings or admin messages."
          />
        )}
      </section>
    </AppShell>
  );
}
export function Goals({ role }) {
  const s = current();
  const accepted = getRequests().filter(
    (r) =>
      r.status === 'accepted' && (role === 'mentor' ? r.mentorId === s?.id : r.studentId === s?.id)
  );
  const mentees = accepted.map((r) => getUsers().find((u) => u.id === r.studentId)).filter(Boolean);
  const [selected, setSelected] = useState(mentees[0]?.id || '');
  const [items, setItems] = useState(
    getGoals().filter((g) =>
      role === 'student' ? g.studentId === s?.id : mentees.some((m) => m.id === g.studentId)
    )
  );
  const [title, setTitle] = useState('');
  const [target, setTarget] = useState('');
  const [progressGoal, setProgressGoal] = useState(null);
  const [isAdding, setIsAdding] = useState(false);
  const toast = useToast();

  useEffect(() => {
    if (!selected && mentees.length > 0) {
      setSelected(mentees[0].id);
    }
  }, [mentees, selected]);
  const add = async (e) => {
    e.preventDefault();
    if (isAdding) return;
    const studentId = role === 'student' ? s.id : selected;
    if (!studentId) return toast.error('Select a mentee first.');
    if (!title.trim()) return toast.error('Enter a goal title.');
    setIsAdding(true);
    try {
      const result = await createGoal({ studentId, title, target, progress: 0 });
      if (!result.ok) return toast.error(result.error);
      const all = getGoals();
      setItems(all.filter((x) => role === 'student' ? x.studentId === s.id : mentees.some((m) => m.id === x.studentId)));
      setTitle('');
      setTarget('');
      toast.success('Goal saved successfully.');
    } finally {
      setIsAdding(false);
    }
  };
  const saveProgress = async (value) => {
    const g = progressGoal;
    setProgressGoal(null);
    if (!g) return;
    const result = await updateGoal(g.id, { progress: value, status: value >= 100 ? 'completed' : 'active' });
    if (!result.ok) return toast.error(result.error);
    const all = getGoals();
    setItems(all.filter((x) => role === 'student' ? x.studentId === s.id : mentees.some((m) => m.id === x.studentId)));
    toast.success('Progress updated.');
  };
  const progress = (g) => setProgressGoal(g);
  return (
    <AppShell role={role}>
      <PageTitle
        eyebrow="Workspace"
        title={role === 'student' ? 'My goals' : 'Mentee goals'}
        text="Goals and milestones are linked to your active mentorship relationship."
      />
      {role === 'mentor' && mentees.length > 0 && (
        <section className="card form-card">
          <label>
            Mentee
            <select value={selected} onChange={(e) => setSelected(e.target.value)}>
              {mentees.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </label>
        </section>
      )}
      {role === 'mentor' && !mentees.length ? (
        <Empty
          title="No active mentees"
          text="Accept a mentorship request before managing mentee goals."
        />
      ) : (
        <section className="card form-card">
          <form className="form-stack" onSubmit={add}>
            <label>
              Goal title
              <input
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Become job-ready in SQL"
              />
            </label>
            <label>
              Target / success criteria
              <textarea
                rows="3"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                placeholder="Describe the outcome"
              />
            </label>
            <button type="submit" className="uiverse-btn" disabled={isAdding}>
              {isAdding ? 'Adding goal...' : 'Add goal'}
            </button>
          </form>
        </section>
      )}
      <section className="goal-grid">
        {items.map((g) => {
          const st = getUsers().find((u) => u.id === g.studentId);
          return (
            <article className="goal-card" key={g.id}>
              <Target size={20} />
              {role === 'mentor' && <small>{st?.name}</small>}
              <h3>{g.title}</h3>
              <p>{g.target}</p>
              <div className="progress">
                <span style={{ width: `${g.progress}%` }} />
              </div>
              <div className="goal-foot">
                <span>
                  {g.progress}% · {g.status}
                </span>
                <button className="btn mini" onClick={() => progress(g)}>
                  Update
                </button>
              </div>
            </article>
          );
        })}
        {!items.length && (
          <Empty title="No goals yet" text="Add a goal to start tracking progress." />
        )}
      </section>
      {progressGoal && (
        <ProgressModal
          goalTitle={progressGoal.title}
          initial={progressGoal.progress || 0}
          onSave={saveProgress}
          onCancel={() => setProgressGoal(null)}
        />
      )}
    </AppShell>
  );
}
export function Feedback({ role }) {
  const s = current();
  const accepted =
    role === 'student'
      ? getRequests().filter((r) => r.studentId === s?.id && r.status === 'accepted')
      : getRequests().filter((r) => r.mentorId === s?.id && r.status === 'accepted');
  const [items, setItems] = useState(
    getFeedback().filter((f) =>
      role === 'student' ? f.fromUserId === s?.id : f.fromUserId === s?.id
    )
  );
  const [rating, setRating] = useState(5);
  const [text, setText] = useState('');
  const [submittingRequestId, setSubmittingRequestId] = useState(null);
  const toast = useToast();
  const submit = async (toId, requestId) => {
    if (!text.trim() || submittingRequestId) return;
    setSubmittingRequestId(requestId);
    try {
      const result = await createFeedback({ toUserId: toId, requestId, rating: Number(rating), text });
      if (!result.ok) return toast.error(result.error);
      const all = getFeedback();
      setItems(all.filter((f) => f.fromUserId === s.id));
      setText('');
      toast.success('Feedback submitted successfully.');
    } finally {
      setSubmittingRequestId(null);
    }
  };
  return (
    <AppShell role={role}>
      <PageTitle
        eyebrow="Workspace"
        title="Feedback"
        text="Submit feedback to a real mentorship partner."
      />
      {accepted.map((r) => {
        const otherId = role === 'student' ? r.mentorId : r.studentId;
        const other = getUsers().find((u) => u.id === otherId);
        return (
          <section className="card feedback-card" key={r.id}>
            <div>
              <b>{other?.name}</b>
              <span>{role === 'student' ? 'Mentor' : 'Mentee'}</span>
            </div>
            <div className="rating-row">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  type="button"
                  className={n <= rating ? 'rating selected' : 'rating'}
                  onClick={() => setRating(n)}
                  key={n}
                >
                  <Star size={17} />
                </button>
              ))}
            </div>
            <textarea
              rows="4"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Share useful feedback..."
            />
            <button
              className="uiverse-btn"
              disabled={!!submittingRequestId}
              onClick={() => submit(otherId, r.id)}
            >
              {submittingRequestId === r.id ? 'Sending feedback...' : 'Send feedback'}
            </button>
          </section>
        );
      })}
      {!accepted.length && (
        <Empty
          title="No active mentorship"
          text="Feedback becomes available after a mentorship request is accepted."
        />
      )}
      {items.length > 0 && (
        <section className="card">
          <h3>Your submitted feedback</h3>
          {items.map((f) => (
            <div className="feedback-item" key={f.id}>
              <Star size={15} />
              <span>
                {f.rating}/5 · {f.text}
              </span>
            </div>
          ))}
        </section>
      )}
    </AppShell>
  );
}
export function AdminUsers() {
  const users = getUsers();
  return (
    <AppShell role="admin">
      <PageTitle
        eyebrow="Administrator"
        title="Users"
        text="Only real registered accounts appear here."
      />
      <section className="card">
        <div className="data-table">
          <div className="table-row table-head">
            <span>Name</span>
            <span>Email</span>
            <span>Role</span>
            <span>Profile</span>
            <span>Created</span>
          </div>
          {users.map((u) => (
            <div className="table-row" key={u.id}>
              <span>{u.name}</span>
              <span>{u.email}</span>
              <span>
                <span className="status-chip">{u.role}</span>
              </span>
              <span>{u.profileComplete ? 'Complete' : 'Incomplete'}</span>
              <span>{new Date(u.createdAt).toLocaleDateString()}</span>
            </div>
          ))}
        </div>
        {!users.length && <Empty title="No accounts" text="No users have registered yet." />}
      </section>
    </AppShell>
  );
}

export function AdminMatching() {
  const users = getUsers();
  const students = users.filter((u) => u.role === 'student' && u.profileComplete);
  const mentors = users.filter((u) => u.role === 'mentor' && u.profileComplete && (u.settings?.profileVisible ?? true));
  const pairs = students.flatMap((student) =>
    mentors.map((mentor) => ({ student, mentor, result: scoreMatch(student, mentor) }))
  ).sort((a, b) => b.result.score - a.result.score);
  const requests = getRequests();
  const accepted = requests.filter((r) => r.status === 'accepted').length;
  const avg = pairs.length ? Math.round(pairs.reduce((sum, p) => sum + p.result.score, 0) / pairs.length) : 0;

  return (
    <AppShell role="admin">
      <PageTitle eyebrow="Administrator" title="Matching management" text="Live recommendations calculated from registered student and mentor profiles." />
      <div className="stats">
        <div className="stat"><div className="stat-icon"><Users size={19} /></div><div><span>Eligible students</span><b>{students.length}</b></div></div>
        <div className="stat"><div className="stat-icon"><UserCheck size={19} /></div><div><span>Eligible mentors</span><b>{mentors.length}</b></div></div>
        <div className="stat"><div className="stat-icon"><Sparkles size={19} /></div><div><span>Possible matches</span><b>{pairs.length}</b></div></div>
        <div className="stat"><div className="stat-icon"><Check size={19} /></div><div><span>Accepted requests</span><b>{accepted}</b></div></div>
      </div>
      <section className="card">
        <div className="section-inline"><div><h2>Top matching pairs</h2><p className="muted-text">Average compatibility score: {avg}%</p></div><span className="status-chip">{pairs.length} calculated</span></div>
        {pairs.length ? (
          <div className="data-table">
            <div className="table-row table-head"><span>Student</span><span>Mentor</span><span>Score</span><span>Shared factors</span><span>Capacity</span></div>
            {pairs.slice(0, 30).map((p) => {
              const shared = p.result.factors.filter((f) => f.matchedItems?.length).length;
              return <div className="table-row" key={`${p.student.id}-${p.mentor.id}`}>
                <span><b>{p.student.name}</b><small>{p.student.email}</small></span>
                <span><b>{p.mentor.name}</b><small>{p.mentor.email}</small></span>
                <span><span className="score-chip">{p.result.score}%</span></span>
                <span>{shared}/6 factors</span>
                <span>{p.result.capacity ? 'Available' : 'Full'}</span>
              </div>;
            })}
          </div>
        ) : <Empty title="No matchable profiles yet" text="Matching needs at least one completed student profile and one completed, visible mentor profile." />}
      </section>
    </AppShell>
  );
}

export function AdminAnalytics() {
  const users = getUsers();
  const requests = getRequests();
  const meetings = getMeetings();
  const goals = getGoals();
  const feedback = getFeedback();
  const statusCount = (items, status) => items.filter((x) => x.status === status).length;
  const students = users.filter((u) => u.role === 'student');
  const mentors = users.filter((u) => u.role === 'mentor');
  const completed = users.filter((u) => u.profileComplete).length;
  const avgRating = feedback.length ? (feedback.reduce((sum, f) => sum + Number(f.rating || 0), 0) / feedback.length).toFixed(1) : '0.0';
  const skillCounts = {};
  users.forEach((u) => (u.skills || []).forEach((skill) => { skillCounts[skill] = (skillCounts[skill] || 0) + 1; }));
  const topSkills = Object.entries(skillCounts).sort((a, b) => b[1] - a[1]).slice(0, 8);

  return (
    <AppShell role="admin">
      <PageTitle eyebrow="Administrator" title="Analytics & reports" text="Operational analytics calculated from the current MentorConnect records." />
      <div className="stats">
        <div className="stat"><div className="stat-icon"><Users size={19} /></div><div><span>Total users</span><b>{users.length}</b></div></div>
        <div className="stat"><div className="stat-icon"><ClipboardList size={19} /></div><div><span>Requests</span><b>{requests.length}</b></div></div>
        <div className="stat"><div className="stat-icon"><CalendarDays size={19} /></div><div><span>Meetings</span><b>{meetings.length}</b></div></div>
        <div className="stat"><div className="stat-icon"><Star size={19} /></div><div><span>Avg feedback</span><b>{avgRating}/5</b></div></div>
      </div>
      <div className="admin-analytics-grid">
        <section className="card"><h2>User distribution</h2><div className="metric-list">
          <span><b>Students</b><strong>{students.length}</strong></span><span><b>Mentors</b><strong>{mentors.length}</strong></span><span><b>Admins</b><strong>{users.filter((u) => u.role === 'admin').length}</strong></span><span><b>Profiles complete</b><strong>{completed}/{users.length}</strong></span>
        </div></section>
        <section className="card"><h2>Request funnel</h2><div className="metric-list">
          <span><b>Pending</b><strong>{statusCount(requests, 'pending')}</strong></span><span><b>Accepted</b><strong>{statusCount(requests, 'accepted')}</strong></span><span><b>Rejected</b><strong>{statusCount(requests, 'rejected')}</strong></span><span><b>Acceptance rate</b><strong>{requests.length ? Math.round((statusCount(requests, 'accepted') / requests.length) * 100) : 0}%</strong></span>
        </div></section>
        <section className="card"><h2>Meeting activity</h2><div className="metric-list">
          <span><b>Total meetings</b><strong>{meetings.length}</strong></span><span><b>Scheduled</b><strong>{statusCount(meetings, 'scheduled')}</strong></span><span><b>Completed</b><strong>{statusCount(meetings, 'completed')}</strong></span><span><b>Goals created</b><strong>{goals.length}</strong></span>
        </div></section>
        <section className="card">
          <h2>Popular skills</h2>
          {topSkills.length ? (
            <div className="skill-bars">
              {topSkills.map(([skill, count]) => (
                <div className="skill-bar" key={skill}>
                  <div><span>{skill}</span><b>{count}</b></div>
                  <div className="bar-track">
                    <i style={{ width: `${Math.max(8, Math.round((count / topSkills[0][1]) * 100))}%` }} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="muted-text">No skill data is available yet.</p>
          )}
        </section>
      </div>
      <section className="card"><h2>Data coverage</h2><p className="muted-text">This report uses {users.length} users, {requests.length} requests, {meetings.length} meetings, {goals.length} goals and {feedback.length} feedback records. Values update whenever the page is opened.</p></section>
    </AppShell>
  );
}

export function AdminAudit() {
  const users = getUsers();
  const [logs, setLogs] = useState(() => getAudit());
  const [filter, setFilter] = useState('');

  useEffect(() => {
    refetchAudit().then((items) => {
      if (items) setLogs(items);
    });
  }, []);

  const filtered = logs.filter((log) => {
    const user = users.find((u) => u.id === log.userId);
    const haystack = `${log.action} ${log.resource} ${log.status} ${user?.name || ''} ${user?.email || ''}`.toLowerCase();
    return haystack.includes(filter.toLowerCase());
  });
  return (
    <AppShell role="admin">
      <PageTitle eyebrow="Administrator" title="Audit logs" text={`${logs.length} recorded account and workflow events.`} />
      <section className="card">
        <div className="section-inline"><div><h2>Activity history</h2><p className="muted-text">Newest events appear first.</p></div><input className="inline-search" value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Search action, user..." /></div>
        {filtered.length ? <div className="data-table">
          <div className="table-row table-head"><span>Time</span><span>User</span><span>Action</span><span>Resource</span><span>Status</span></div>
          {filtered.map((log) => { const u = users.find((x) => x.id === log.userId); return <div className="table-row" key={log.id}><span>{new Date(log.timestamp).toLocaleString()}</span><span>{u?.name || log.userId}<small>{u?.email || ''}</small></span><span>{log.action}</span><span>{log.resource}</span><span><span className="status-chip">{log.status || 'Success'}</span></span></div>; })}
        </div> : <Empty title="No audit events found" text={logs.length ? 'No audit events match your search.' : 'Audit events will appear after users sign in, update profiles, send requests or perform administrative actions.'} />}
      </section>
    </AppShell>
  );
}

export function AdminSettings() {
  const [settings, setSettings] = useState(() => getPlatformSettings());
  const [isSaving, setIsSaving] = useState(false);
  const toast = useToast();
  const save = async () => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      const result = await updatePlatformSettings(settings);
      if (!result.ok) return toast.error(result.error);
      toast.success('Platform settings saved successfully.');
    } finally {
      setIsSaving(false);
    }
  };
  return (
    <AppShell role="admin">
      <PageTitle eyebrow="Administrator" title="Administrator settings" text="Platform-wide operational controls and configurations." />
      <div className="admin-settings-grid">
        <section className="card settings-card"><div className="settings-heading"><div className="settings-icon"><BarChart3 size={19} /></div><div><h2>Platform</h2><p>General application behaviour.</p></div></div>
          <label>Platform name<input value={settings.platformName} onChange={(e) => setSettings({ ...settings, platformName: e.target.value })} /></label>
          <label>Default mentor capacity<input type="number" min="1" max="20" value={settings.defaultMentorCapacity} onChange={(e) => setSettings({ ...settings, defaultMentorCapacity: Number(e.target.value) || 1 })} /></label>
        </section>
        <section className="card settings-card"><div className="settings-heading"><div className="settings-icon"><ShieldCheck size={19} /></div><div><h2>Access controls</h2><p>Enable or pause platform capabilities.</p></div></div>
          <div className="settings-options">
            <label className="setting-toggle"><span><b>Matching engine</b><small>Allow match calculations in student and admin views</small></span><input type="checkbox" checked={settings.matchingEnabled} onChange={(e) => setSettings({ ...settings, matchingEnabled: e.target.checked })} /></label>
            <label className="setting-toggle"><span><b>New registrations</b><small>Allow new student and mentor accounts</small></span><input type="checkbox" checked={settings.registrationsEnabled} onChange={(e) => setSettings({ ...settings, registrationsEnabled: e.target.checked })} /></label>
            <label className="setting-toggle"><span><b>Maintenance mode</b><small>Mark the platform as temporarily unavailable</small></span><input type="checkbox" checked={settings.maintenanceMode} onChange={(e) => setSettings({ ...settings, maintenanceMode: e.target.checked })} /></label>
          </div>
        </section>
      </div>
      <section className="card"><h2>Configuration preview</h2><div className="settings-stat-grid"><div className="settings-stat"><b>{settings.matchingEnabled ? 'ON' : 'OFF'}</b><span>Matching</span></div><div className="settings-stat"><b>{settings.registrationsEnabled ? 'ON' : 'OFF'}</b><span>Registration</span></div><div className="settings-stat"><b>{settings.maintenanceMode ? 'ON' : 'OFF'}</b><span>Maintenance</span></div><div className="settings-stat"><b>{settings.defaultMentorCapacity}</b><span>Default capacity</span></div></div><button className="uiverse-btn" disabled={isSaving} onClick={save}>{isSaving ? 'Saving settings...' : 'Save platform settings'}</button></section>
    </AppShell>
  );
}

export function AdminNotifications() {
  const users = getUsers().filter((u) => u.role === 'student' || u.role === 'mentor');
  const [target, setTarget] = useState('all');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const toast = useToast();
  const send = async (e) => {
    e.preventDefault();
    if (isSending) return;
    const recipients = target === 'all' ? users : users.filter((u) => u.id === target);
    if (!recipients.length) return toast.error('No recipients found.');
    setIsSending(true);
    try {
      const result = await sendAdminNotification(recipients.map((u) => u.id), title, message, 'admin');
      if (!result.ok) return toast.error(result.error);
      setTitle('');
      setMessage('');
      toast.success(`Notification sent to ${recipients.length} account(s).`);
    } finally {
      setIsSending(false);
    }
  };
  return (
    <AppShell role="admin">
      <PageTitle
        eyebrow="Administrator"
        title="Notifications"
        text="Send a real notification to registered students and mentors."
      />
      <section className="card form-card">
        <form className="form-stack" onSubmit={send}>
          <label>
            Recipient
            <select value={target} onChange={(e) => setTarget(e.target.value)}>
              <option value="all">All students and mentors</option>
              {users.map((u) => (
                <option value={u.id} key={u.id}>
                  {u.name} · {u.role}
                </option>
              ))}
            </select>
          </label>
          <label>
            Title
            <input
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Alumni-cell update"
            />
          </label>
          <label>
            Message
            <textarea
              required
              rows="6"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Write your notification..."
            />
          </label>
          <button className="uiverse-btn" type="submit" disabled={isSending}>
            <Send size={16} /> {isSending ? 'Sending notification...' : 'Send notification'}
          </button>
        </form>
      </section>
      {!users.length && (
        <Empty
          title="No recipients"
          text="Notifications can be sent after students or mentors register."
        />
      )}
    </AppShell>
  );
}
export function AdminSimple({ title, icon: Icon = BarChart3, text }) {
  return (
    <AppShell role="admin">
      <PageTitle eyebrow="Administrator" title={title} text={text} />
      <section className="empty-panel">
        <div className="empty-orb">
          <Icon size={24} />
        </div>
        <h2>No demo records</h2>
        <p>
          This section displays real platform activity. It will populate as users engage with the application.
        </p>
      </section>
    </AppShell>
  );
}
