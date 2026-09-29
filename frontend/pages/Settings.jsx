import React, { useEffect, useMemo, useState } from 'react';
import { Bell, Download, LockKeyhole, Monitor, ShieldCheck, Trash2, UserRound } from 'lucide-react';
import AppShell from '../components/AppShell';
import PageTitle from '../components/PageTitle';
import { useToast } from '../components/Toast';
import { getCurrentUser, getSession, getUsers, saveUsers, setSession, getNotifications, getMeetings, getRequests, getGoals, getFeedback, getAudit } from '../lib/storage';
import { updateUser, changePassword } from '../lib/auth';

const ROLE_LABELS = { admin: 'Administrator', mentor: 'Alumni Mentor', student: 'Student' };
const DEFAULT_PREFS = {
  notifications: true,
  requestAlerts: true,
  meetingAlerts: true,
  profileVisible: true,
  compactMode: false,
  language: 'English',
};

function getPrefs(user) {
  return { ...DEFAULT_PREFS, ...(user?.settings || {}) };
}

export default function Settings() {
  const session = getSession();
  const user = getCurrentUser();
  const toast = useToast();
  const [prefs, setPrefs] = useState(() => getPrefs(user));
  const [passwords, setPasswords] = useState({ current: '', next: '', confirm: '' });
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    document.body.classList.toggle('compact-mode', !!prefs.compactMode);
    return () => document.body.classList.remove('compact-mode');
  }, [prefs.compactMode]);

  const role = session?.role;
  const roleLabel = ROLE_LABELS[role] || role || 'User';

  const stats = useMemo(() => {
    if (!user) return [];
    return [
      ['Notifications', getNotifications().filter((n) => n.userId === user.id).length],
      ['Meetings', getMeetings().filter((m) => m.studentId === user.id || m.mentorId === user.id).length],
      ['Requests', getRequests().filter((r) => r.studentId === user.id || r.mentorId === user.id).length],
      ['Goals', getGoals().filter((g) => g.studentId === user.id || g.mentorId === user.id).length],
      ['Feedback', getFeedback().filter((f) => f.fromUserId === user.id || f.toUserId === user.id).length],
      ['Audit events', getAudit().filter((a) => a.userId === user.id).length],
    ];
  }, [user]);

  const savePreferences = () => {
    if (!user) return;
    setSaving(true);
    const result = updateUser(user.id, { settings: prefs });
    setSaving(false);
    if (result.ok) toast.success('Settings saved.');
    else toast.error(result.error || 'Could not save settings.');
  };

  const updatePref = (key, value) => setPrefs((p) => ({ ...p, [key]: value }));

  const submitPassword = (e) => {
    e.preventDefault();
    if (passwords.next !== passwords.confirm) return toast.error('New passwords do not match.');
    const result = changePassword(user?.id, passwords.current, passwords.next);
    if (!result.ok) return toast.error(result.error);
    setPasswords({ current: '', next: '', confirm: '' });
    toast.success('Password changed successfully.');
  };

  const exportData = () => {
    if (!user) return;
    const payload = {
      exportedAt: new Date().toISOString(),
      account: { ...user, password: undefined, passwordHash: undefined },
      notifications: getNotifications().filter((n) => n.userId === user.id),
      meetings: getMeetings().filter((m) => m.studentId === user.id || m.mentorId === user.id),
      requests: getRequests().filter((r) => r.studentId === user.id || r.mentorId === user.id),
      goals: getGoals().filter((g) => g.studentId === user.id || g.mentorId === user.id),
      feedback: getFeedback().filter((f) => f.fromUserId === user.id || f.toUserId === user.id),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mentorconnect-${user.id}-data.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Your account data export was downloaded.');
  };

  const signOutOtherLocalSessions = () => {
    localStorage.removeItem('mc_session');
    setSession(null);
    window.location.href = '/login';
  };

  if (!user) return null;

  return (
    <AppShell role={role}>
      <PageTitle
        eyebrow="Account"
        title="Settings"
        text="Control notifications, privacy, preferences and account security."
      />

      <div className="settings-grid">
        <section className="card settings-card">
          <div className="settings-heading">
            <div className="settings-icon"><UserRound size={19} /></div>
            <div><h2>Account overview</h2><p>Your current MentorConnect account.</p></div>
          </div>
          <div className="detail-list">
            <span>Name <b>{user.name}</b></span>
            <span>Email <b>{user.email}</b></span>
            <span>Role <b>{roleLabel}</b></span>
            <span>Profile <b>{user.profileComplete ? 'Complete' : 'Incomplete'}</b></span>
            <span>Member since <b>{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Not available'}</b></span>
          </div>
        </section>

        <section className="card settings-card">
          <div className="settings-heading">
            <div className="settings-icon"><Monitor size={19} /></div>
            <div><h2>Activity summary</h2><p>Records connected to this account.</p></div>
          </div>
          <div className="settings-stat-grid">
            {stats.map(([label, value]) => <div className="settings-stat" key={label}><b>{value}</b><span>{label}</span></div>)}
          </div>
        </section>

        <section className="card settings-card">
          <div className="settings-heading">
            <div className="settings-icon"><Bell size={19} /></div>
            <div><h2>Notifications</h2><p>Choose which in-app alerts you want to receive.</p></div>
          </div>
          <div className="settings-options">
            <label className="setting-toggle"><span><b>Notifications</b><small>Enable account notifications</small></span><input type="checkbox" checked={prefs.notifications} onChange={(e) => updatePref('notifications', e.target.checked)} /></label>
            <label className="setting-toggle"><span><b>Request alerts</b><small>Mentorship request updates and responses</small></span><input type="checkbox" checked={prefs.requestAlerts} onChange={(e) => updatePref('requestAlerts', e.target.checked)} /></label>
            <label className="setting-toggle"><span><b>Meeting alerts</b><small>Meeting and calendar updates</small></span><input type="checkbox" checked={prefs.meetingAlerts} onChange={(e) => updatePref('meetingAlerts', e.target.checked)} /></label>
          </div>
        </section>

        <section className="card settings-card">
          <div className="settings-heading">
            <div className="settings-icon"><ShieldCheck size={19} /></div>
            <div><h2>Privacy & preferences</h2><p>Control how your profile behaves in the platform.</p></div>
          </div>
          <div className="settings-options">
            <label className="setting-toggle"><span><b>Profile visibility</b><small>Allow your profile to appear in matching and discovery</small></span><input type="checkbox" checked={prefs.profileVisible} onChange={(e) => updatePref('profileVisible', e.target.checked)} /></label>
            <label className="setting-toggle"><span><b>Compact interface</b><small>Use tighter spacing across tables and cards</small></span><input type="checkbox" checked={prefs.compactMode} onChange={(e) => updatePref('compactMode', e.target.checked)} /></label>
            <label>Language<select value={prefs.language} onChange={(e) => updatePref('language', e.target.value)}><option>English</option><option>Hindi</option><option>Marathi</option></select></label>
          </div>
          <button className="uiverse-btn" onClick={savePreferences} disabled={saving}>{saving ? 'Saving...' : 'Save preferences'}</button>
        </section>

        <section className="card settings-card">
          <div className="settings-heading">
            <div className="settings-icon"><LockKeyhole size={19} /></div>
            <div><h2>Security</h2><p>Change your password without leaving the application.</p></div>
          </div>
          <form className="form-stack" onSubmit={submitPassword}>
            <label>Current password<input required type="password" value={passwords.current} onChange={(e) => setPasswords({ ...passwords, current: e.target.value })} /></label>
            <div className="two-col">
              <label>New password<input required minLength="8" type="password" value={passwords.next} onChange={(e) => setPasswords({ ...passwords, next: e.target.value })} /></label>
              <label>Confirm password<input required minLength="8" type="password" value={passwords.confirm} onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })} /></label>
            </div>
            <button className="btn secondary">Change password</button>
          </form>
        </section>

        <section className="card settings-card">
          <div className="settings-heading">
            <div className="settings-icon"><Download size={19} /></div>
            <div><h2>Your data</h2><p>Export the records connected to your account.</p></div>
          </div>
          <p className="muted-text">The export contains profile, notifications, meetings, requests, goals and feedback. Password credentials are never exported.</p>
          <button className="btn secondary" onClick={exportData}><Download size={16} /> Export my data</button>
        </section>

        <section className="card settings-card danger-card">
          <div className="settings-heading">
            <div className="settings-icon danger"><Trash2 size={19} /></div>
            <div><h2>Session</h2><p>Sign out from this browser session.</p></div>
          </div>
          <button className="btn secondary" onClick={signOutOtherLocalSessions}>Sign out</button>
        </section>
      </div>
    </AppShell>
  );
}
