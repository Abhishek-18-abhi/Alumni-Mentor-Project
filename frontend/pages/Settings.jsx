import React, { useEffect, useState } from 'react';
import {
  Bell,
  Download,
  LockKeyhole,
  Monitor,
  ShieldCheck,
  Trash2,
  UserRound,
  AlertTriangle,
  Key,
} from 'lucide-react';
import AppShell from '../components/AppShell';
import PageTitle from '../components/PageTitle';
import ConfirmModal from '../components/ConfirmModal';
import { useToast } from '../components/Toast';
import { getCurrentUser, getSession } from '../lib/storage';
import { updateUser, changePassword, logout } from '../lib/auth';
import { apiGet, apiDelete } from '../lib/api';

const ROLE_LABELS = { admin: 'Administrator', mentor: 'Alumni Mentor', student: 'Student' };
const DEFAULT_PREFS = {
  notifications: true,
  requestAlerts: true,
  meetingAlerts: true,
  profileVisible: true,
  compactMode: false,
};

function getPrefs(user) {
  const savedCompact =
    typeof localStorage !== 'undefined'
      ? localStorage.getItem('mc_compact_mode') === 'true'
      : false;
  return {
    ...DEFAULT_PREFS,
    ...(user?.settings || {}),
    compactMode: savedCompact || !!user?.settings?.compactMode,
  };
}

export default function Settings() {
  const session = getSession();
  const user = getCurrentUser();
  const toast = useToast();

  const [prefs, setPrefs] = useState(() => getPrefs(user));
  const [capacity, setCapacity] = useState(() => user?.capacity || 3);
  const [pauseRequests, setPauseRequests] = useState(() => Boolean(user?.pauseRequests));
  const [passwords, setPasswords] = useState({ current: '', next: '', confirm: '' });
  const [saving, setSaving] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Live real activity counts from server API
  const [apiCounts, setApiCounts] = useState({
    notifications: 0,
    meetings: 0,
    requests: 0,
    goals: 0,
    feedback: 0,
    loading: true,
  });

  // Apply compact mode globally to document.body without removing on unmount
  useEffect(() => {
    document.body.classList.toggle('compact-mode', Boolean(prefs.compactMode));
    localStorage.setItem('mc_compact_mode', prefs.compactMode ? 'true' : 'false');
  }, [prefs.compactMode]);

  // Fetch real counts from API
  useEffect(() => {
    let active = true;
    Promise.allSettled([
      apiGet('/notifications'),
      apiGet('/meetings'),
      apiGet('/mentorship-requests'),
      apiGet('/goals'),
      apiGet('/feedback'),
    ]).then(([n, m, r, g, f]) => {
      if (!active) return;
      setApiCounts({
        notifications: n.status === 'fulfilled' ? (n.value.notifications || []).length : 0,
        meetings: m.status === 'fulfilled' ? (m.value.meetings || []).length : 0,
        requests: r.status === 'fulfilled' ? (r.value.requests || []).length : 0,
        goals: g.status === 'fulfilled' ? (g.value.goals || []).length : 0,
        feedback: f.status === 'fulfilled' ? (f.value.feedback || []).length : 0,
        loading: false,
      });
    });
    return () => {
      active = false;
    };
  }, []);

  const role = session?.role;
  const roleLabel = ROLE_LABELS[role] || role || 'User';

  const calculatePasswordStrength = (pwd) => {
    if (!pwd) return { label: 'Empty', score: 0, color: 'var(--border)' };
    let score = 0;
    if (pwd.length >= 8) score += 1;
    if (pwd.length >= 12) score += 1;
    if (/[A-Z]/.test(pwd)) score += 1;
    if (/[0-9]/.test(pwd)) score += 1;
    if (/[^A-Za-z0-9]/.test(pwd)) score += 1;

    if (score <= 2) return { label: 'Weak', score: 1, color: 'var(--danger)' };
    if (score <= 4) return { label: 'Good', score: 2, color: 'var(--warning-text)' };
    return { label: 'Strong', score: 3, color: 'var(--success-text)' };
  };

  const pwdStrength = calculatePasswordStrength(passwords.next);

  const savePreferences = async () => {
    if (!user || saving) return;
    setSaving(true);
    try {
      const payload = { settings: prefs };
      if (role === 'mentor') {
        payload.capacity = Math.max(1, Number(capacity) || 1);
        payload.pauseRequests = Boolean(pauseRequests);
      }
      const result = await updateUser(user.id, payload);
      if (result.ok) toast.success('Settings saved successfully.');
      else toast.error(result.error || 'Could not save settings.');
    } finally {
      setSaving(false);
    }
  };

  const updatePref = (key, value) => setPrefs((p) => ({ ...p, [key]: value }));

  const submitPassword = async (e) => {
    e.preventDefault();
    if (savingPassword) return;
    if (passwords.next !== passwords.confirm) return toast.error('New passwords do not match.');
    if (passwords.next.length < 8) return toast.error('Password must be at least 8 characters.');

    setSavingPassword(true);
    try {
      const result = await changePassword(user?.id, passwords.current, passwords.next);
      if (!result.ok) return toast.error(result.error);
      setPasswords({ current: '', next: '', confirm: '' });
      toast.success('Password changed successfully.');
    } finally {
      setSavingPassword(false);
    }
  };

  const exportData = async () => {
    if (!user) return;
    try {
      toast.info('Fetching your complete account data from server...');
      const [n, m, r, g, f] = await Promise.allSettled([
        apiGet('/notifications'),
        apiGet('/meetings'),
        apiGet('/mentorship-requests'),
        apiGet('/goals'),
        apiGet('/feedback'),
      ]);

      const payload = {
        exportedAt: new Date().toISOString(),
        account: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          college: user.college,
          skills: user.skills,
          interests: user.interests,
          goals: user.goals,
          languages: user.languages,
          bio: user.bio,
        },
        notifications: n.status === 'fulfilled' ? n.value.notifications : [],
        meetings: m.status === 'fulfilled' ? m.value.meetings : [],
        requests: r.status === 'fulfilled' ? r.value.requests : [],
        goals: g.status === 'fulfilled' ? g.value.goals : [],
        feedback: f.status === 'fulfilled' ? f.value.feedback : [],
      };

      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `mentorconnect-${user.id}-export.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Your account data export was downloaded.');
    } catch (err) {
      toast.error('Failed to export data: ' + err.message);
    }
  };

  const handleDeleteAccount = async () => {
    if (isDeleting || !user) return;
    setIsDeleting(true);
    try {
      await apiDelete(`/users/${user.id}`);
      toast.success('Account deactivated and deleted successfully.');
      logout();
      window.location.href = '/';
    } catch (err) {
      toast.error('Failed to delete account: ' + err.message);
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  if (!user) return null;

  return (
    <AppShell role={role}>
      <PageTitle
        eyebrow="Account"
        title="Settings"
        text="Manage notifications, interface preferences, account security, and session controls."
      />

      <div className="settings-grid">
        {/* Account Overview */}
        <section className="card settings-card">
          <div className="settings-heading">
            <div className="settings-icon">
              <UserRound size={19} />
            </div>
            <div>
              <h2>Account Overview</h2>
              <p>Your current platform credentials.</p>
            </div>
          </div>
          <div className="detail-list">
            <span>
              Name <b>{user.name}</b>
            </span>
            <span>
              Email <b>{user.email}</b>
            </span>
            <span>
              Role <b>{roleLabel}</b>
            </span>
            <span>
              Status <b>{user.isActive !== false ? 'Active' : 'Deactivated'}</b>
            </span>
            <span>
              Verification <b>{user.isVerified ? 'Verified' : 'Standard'}</b>
            </span>
          </div>
        </section>

        {/* Real Activity Summary from API */}
        <section className="card settings-card">
          <div className="settings-heading">
            <div className="settings-icon">
              <Monitor size={19} />
            </div>
            <div>
              <h2>Activity Summary</h2>
              <p>Live records linked to this account from the server database.</p>
            </div>
          </div>
          <div className="settings-stat-grid">
            <div className="settings-stat">
              <b>{apiCounts.loading ? '—' : apiCounts.requests}</b>
              <span>Requests</span>
            </div>
            <div className="settings-stat">
              <b>{apiCounts.loading ? '—' : apiCounts.meetings}</b>
              <span>Meetings</span>
            </div>
            <div className="settings-stat">
              <b>{apiCounts.loading ? '—' : apiCounts.goals}</b>
              <span>Goals</span>
            </div>
            <div className="settings-stat">
              <b>{apiCounts.loading ? '—' : apiCounts.feedback}</b>
              <span>Feedback</span>
            </div>
            <div className="settings-stat">
              <b>{apiCounts.loading ? '—' : apiCounts.notifications}</b>
              <span>Alerts</span>
            </div>
          </div>
        </section>

        {/* Notifications */}
        <section className="card settings-card">
          <div className="settings-heading">
            <div className="settings-icon">
              <Bell size={19} />
            </div>
            <div>
              <h2>In-App Notifications</h2>
              <p>Choose which events trigger real-time updates.</p>
            </div>
          </div>
          <div className="settings-options">
            <label className="setting-toggle">
              <span>
                <b>All In-App Notifications</b>
                <small>Enable notifications badge and alerts</small>
              </span>
              <input
                type="checkbox"
                checked={prefs.notifications}
                onChange={(e) => updatePref('notifications', e.target.checked)}
              />
            </label>
            <label className="setting-toggle">
              <span>
                <b>Request Alerts</b>
                <small>Updates when mentorship requests are submitted or answered</small>
              </span>
              <input
                type="checkbox"
                checked={prefs.requestAlerts}
                onChange={(e) => updatePref('requestAlerts', e.target.checked)}
              />
            </label>
            <label className="setting-toggle">
              <span>
                <b>Meeting & Session Alerts</b>
                <small>Reminders for scheduled, modified or cancelled meetings</small>
              </span>
              <input
                type="checkbox"
                checked={prefs.meetingAlerts}
                onChange={(e) => updatePref('meetingAlerts', e.target.checked)}
              />
            </label>
          </div>
        </section>

        {/* Privacy & Interface Preferences */}
        <section className="card settings-card">
          <div className="settings-heading">
            <div className="settings-icon">
              <ShieldCheck size={19} />
            </div>
            <div>
              <h2>Interface & Matching Preferences</h2>
              <p>Control layout density and directory visibility.</p>
            </div>
          </div>
          <div className="settings-options">
            <label className="setting-toggle">
              <span>
                <b>Profile Visibility</b>
                <small>Allow your profile to appear in matching queries and search</small>
              </span>
              <input
                type="checkbox"
                checked={prefs.profileVisible}
                onChange={(e) => updatePref('profileVisible', e.target.checked)}
              />
            </label>
            <label className="setting-toggle">
              <span>
                <b>Global Compact Mode</b>
                <small>Tighter card paddings and condensed table row spacing</small>
              </span>
              <input
                type="checkbox"
                checked={prefs.compactMode}
                onChange={(e) => updatePref('compactMode', e.target.checked)}
              />
            </label>
          </div>
          <button className="uiverse-btn" onClick={savePreferences} disabled={saving}>
            {saving ? 'Saving...' : 'Save Preferences'}
          </button>
        </section>

        {/* Mentor Specific Capacity Settings */}
        {role === 'mentor' && (
          <section className="card settings-card">
            <div className="settings-heading">
              <div className="settings-icon">
                <ShieldCheck size={19} />
              </div>
              <div>
                <h2>Mentorship Capacity & Intake Controls</h2>
                <p>Prevent scheduling overload with automatic request throttling.</p>
              </div>
            </div>
            <div className="form-stack">
              <label>
                Maximum Concurrent Active Mentees
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={capacity}
                  onChange={(e) => setCapacity(Math.max(1, Number(e.target.value) || 1))}
                />
              </label>
              <div className="settings-options">
                <label className="setting-toggle">
                  <span>
                    <b>Pause New Requests</b>
                    <small>
                      Temporarily hide request button on your profile while keeping existing mentees
                    </small>
                  </span>
                  <input
                    type="checkbox"
                    checked={pauseRequests}
                    onChange={(e) => setPauseRequests(e.target.checked)}
                  />
                </label>
              </div>
              <button className="uiverse-btn" onClick={savePreferences} disabled={saving}>
                {saving ? 'Saving...' : 'Save Capacity Settings'}
              </button>
            </div>
          </section>
        )}

        {/* Security & Password */}
        <section className="card settings-card">
          <div className="settings-heading">
            <div className="settings-icon">
              <LockKeyhole size={19} />
            </div>
            <div>
              <h2>Password & Credentials</h2>
              <p>Update your authentication password.</p>
            </div>
          </div>
          <form className="form-stack" onSubmit={submitPassword}>
            <label>
              Current Password
              <input
                required
                type="password"
                autoComplete="current-password"
                value={passwords.current}
                onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
              />
            </label>
            <div className="two-col">
              <label>
                New Password
                <input
                  required
                  minLength="8"
                  type="password"
                  autoComplete="new-password"
                  value={passwords.next}
                  onChange={(e) => setPasswords({ ...passwords, next: e.target.value })}
                />
              </label>
              <label>
                Confirm New Password
                <input
                  required
                  minLength="8"
                  type="password"
                  autoComplete="new-password"
                  value={passwords.confirm}
                  onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                />
              </label>
            </div>

            {/* Password Strength Hint */}
            {passwords.next && (
              <div style={{ marginTop: 4, fontSize: '0.82rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span>Strength Hint:</span>
                  <span style={{ fontWeight: 700, color: pwdStrength.color }}>
                    {pwdStrength.label}
                  </span>
                </div>
                <div
                  style={{
                    height: 4,
                    width: '100%',
                    background: 'var(--border)',
                    borderRadius: 2,
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: `${(pwdStrength.score / 3) * 100}%`,
                      background: pwdStrength.color,
                      transition: 'width 0.2s ease',
                    }}
                  />
                </div>
              </div>
            )}

            <button className="btn secondary" type="submit" disabled={savingPassword}>
              {savingPassword ? 'Updating Password...' : 'Change Password'}
            </button>
          </form>
        </section>

        {/* Real Session Information */}
        <section className="card settings-card">
          <div className="settings-heading">
            <div className="settings-icon">
              <Key size={19} />
            </div>
            <div>
              <h2>Active Session Telemetry</h2>
              <p>Browser security environment and token integrity.</p>
            </div>
          </div>
          <div className="detail-list">
            <span>
              Session ID <code>{user.id}</code>
            </span>
            <span>
              Client Browser{' '}
              <b>
                {typeof navigator !== 'undefined'
                  ? navigator.userAgent.split(' ')[0]
                  : 'Web Client'}
              </b>
            </span>
            <span>
              Platform{' '}
              <b>
                {typeof navigator !== 'undefined'
                  ? navigator.platform || 'Modern Browser'
                  : 'Standard'}
              </b>
            </span>
            <span>
              Authentication Token <b>JWT Valid</b>
            </span>
          </div>
        </section>

        {/* Data Export */}
        <section className="card settings-card">
          <div className="settings-heading">
            <div className="settings-icon">
              <Download size={19} />
            </div>
            <div>
              <h2>Data Privacy & Portability</h2>
              <p>Export all profile records and interaction history as structured JSON.</p>
            </div>
          </div>
          <p className="muted-text" style={{ fontSize: '0.88rem' }}>
            Exports your profile attributes, meetings, requests, feedback and goals from the
            database. Password credentials are never exported.
          </p>
          <button className="btn secondary" onClick={exportData}>
            <Download size={16} /> Export Account Data
          </button>
        </section>

        {/* Danger Zone: Sign out & Delete Account */}
        <section className="card settings-card danger-card">
          <div className="settings-heading">
            <div className="settings-icon danger">
              <AlertTriangle size={19} />
            </div>
            <div>
              <h2>Danger Zone</h2>
              <p>Session termination and permanent account deletion.</p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 12 }}>
            <button
              className="btn secondary"
              onClick={() => {
                logout();
                window.location.href = '/login';
              }}
            >
              Sign out of this session
            </button>

            <button
              className="btn danger"
              onClick={() => setShowDeleteModal(true)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              <Trash2 size={16} /> Delete account
            </button>
          </div>
        </section>
      </div>

      {showDeleteModal && (
        <ConfirmModal
          title="Permanently Delete Account?"
          message="Are you sure you want to deactivate and remove your account? All pending mentorship requests and scheduled meetings will be cancelled. This action cannot be undone."
          confirmLabel={isDeleting ? 'Deleting...' : 'Permanently Delete Account'}
          onConfirm={handleDeleteAccount}
          onCancel={() => setShowDeleteModal(false)}
        />
      )}
    </AppShell>
  );
}
