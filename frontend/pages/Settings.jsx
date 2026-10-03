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
  Sliders,
  Save,
  PlayCircle,
  PauseCircle,
} from 'lucide-react';
import AppShell from '../components/AppShell';
import PageTitle from '../components/PageTitle';
import ConfirmModal from '../components/ConfirmModal';
import { useToast } from '../components/Toast';
import { getCurrentUser, getSession } from '../lib/storage';
import { updateUser, changePassword, logout } from '../lib/auth';
import { apiGet, apiPatch, apiDelete, getToken } from '../lib/api';

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
  const [user, setUser] = useState(() => getCurrentUser() || {});
  const toast = useToast();

  const [prefs, setPrefs] = useState(() => getPrefs(user));
  const [capacity, setCapacity] = useState(() => user?.capacity || 3);
  const [pauseRequests, setPauseRequests] = useState(() => Boolean(user?.pauseRequests));
  const [passwords, setPasswords] = useState({ current: '', next: '', confirm: '' });
  const [saving, setSaving] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [platformSettings, setPlatformSettings] = useState({
    matchingEnabled: true,
    registrationsEnabled: true,
    defaultMentorCapacity: 5,
    aiAdvisoryEnabled: true,
  });
  const [savingPlatform, setSavingPlatform] = useState(false);

  // Sync fresh user data from server on mount
  useEffect(() => {
    let mounted = true;
    if (getToken()) {
      apiGet('/auth/me')
        .then((res) => {
          if (mounted && res?.user) {
            const u = res.user;
            setUser((prev) => ({ ...prev, ...u }));
            if (u.capacity !== undefined) setCapacity(Math.max(1, Number(u.capacity) || 1));
            if (u.pauseRequests !== undefined) setPauseRequests(Boolean(u.pauseRequests));
            if (u.settings) setPrefs(getPrefs(u));
          }
        })
        .catch(() => {});
    }
    return () => {
      mounted = false;
    };
  }, []);

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

  // Load platform settings for administrators
  useEffect(() => {
    let mounted = true;
    if (role === 'admin') {
      apiGet('/platform-settings')
        .then((res) => {
          if (mounted && res?.settings) {
            setPlatformSettings((prev) => ({
              ...prev,
              ...res.settings,
              aiAdvisoryEnabled: res.settings.aiEnabled ?? res.settings.aiAdvisoryEnabled ?? true,
            }));
          }
        })
        .catch((err) => console.warn('Failed to load platform settings:', err));
    }
    return () => {
      mounted = false;
    };
  }, [role]);

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

  const [savingPause, setSavingPause] = useState(false);

  const handleTogglePause = async () => {
    const targetUserId = user?.id || user?._id || session?.id;
    if (!targetUserId || savingPause) return;
    setSavingPause(true);
    try {
      const nextVal = !pauseRequests;
      const result = await updateUser(targetUserId, {
        pauseRequests: nextVal,
      });
      if (result.ok) {
        setPauseRequests(nextVal);
        setUser((prev) => ({ ...prev, ...result.user, pauseRequests: nextVal }));
        toast.success(nextVal ? 'Mentorship requests paused.' : 'Mentorship intake resumed.');
      } else {
        toast.error(result.error || 'Could not update intake status.');
      }
    } catch (err) {
      toast.error(err?.message || 'Failed to update intake status.');
    } finally {
      setSavingPause(false);
    }
  };

  const handleSaveCapacity = async (e) => {
    if (e?.preventDefault) e.preventDefault();
    const targetUserId = user?.id || user?._id || session?.id;
    if (!targetUserId || saving) return;
    if (capacity < 1) return toast.error('Capacity must be at least 1 mentee.');

    setSaving(true);
    try {
      const capNum = Math.max(1, Number(capacity) || 1);
      const pauseBool = Boolean(pauseRequests);
      const result = await updateUser(targetUserId, {
        capacity: capNum,
        pauseRequests: pauseBool,
      });
      if (result.ok) {
        setUser((prev) => ({
          ...prev,
          ...result.user,
          capacity: capNum,
          pauseRequests: pauseBool,
        }));
        toast.success(`Capacity (${capNum}) and intake status saved successfully.`);
      } else {
        toast.error(result.error || 'Could not save capacity settings.');
      }
    } catch (err) {
      toast.error(err?.message || 'Failed to save capacity settings.');
    } finally {
      setSaving(false);
    }
  };

  const savePreferences = async () => {
    const targetUserId = user?.id || user?._id || session?.id;
    if (!targetUserId || saving) return;
    setSaving(true);
    try {
      const payload = { settings: prefs };
      if (role === 'mentor') {
        payload.capacity = Math.max(1, Number(capacity) || 1);
        payload.pauseRequests = Boolean(pauseRequests);
      }
      const result = await updateUser(targetUserId, payload);
      if (result.ok) {
        setUser((prev) => ({ ...prev, ...result.user }));
        toast.success('Settings saved successfully.');
      } else {
        toast.error(result.error || 'Could not save settings.');
      }
    } catch (err) {
      toast.error(err?.message || 'Could not save settings.');
    } finally {
      setSaving(false);
    }
  };

  const handleSavePlatformSettings = async () => {
    if (savingPlatform) return;
    setSavingPlatform(true);
    try {
      await apiPatch('/platform-settings', {
        ...platformSettings,
        aiEnabled: platformSettings.aiAdvisoryEnabled,
      });
      toast.success('Platform operational settings updated successfully.');
    } catch (err) {
      toast.error(err?.message || 'Failed to update platform settings.');
    } finally {
      setSavingPlatform(false);
    }
  };

  const updatePref = (key, value) => setPrefs((p) => ({ ...p, [key]: value }));

  const submitPassword = async (e) => {
    e.preventDefault();
    if (savingPassword) return;
    if (passwords.next !== passwords.confirm) return toast.error('New passwords do not match.');
    if (passwords.next.length < 8) return toast.error('Password must be at least 8 characters.');

    const targetUserId = user?.id || user?._id || session?.id;
    if (!targetUserId) return toast.error('User session not found.');

    setSavingPassword(true);
    try {
      const result = await changePassword(targetUserId, passwords.current, passwords.next);
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
          id: user?.id || session?.id,
          name: user?.name || session?.name,
          email: user?.email || session?.email,
          role: user?.role || session?.role,
          college: user?.college,
          skills: user?.skills,
          interests: user?.interests,
          goals: user?.goals,
          languages: user?.languages,
          bio: user?.bio,
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
      a.download = `mentorconnect-${user?.id || session?.id || 'account'}-export.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Your account data export was downloaded.');
    } catch (err) {
      toast.error('Failed to export data: ' + err.message);
    }
  };

  const handleDeleteAccount = async () => {
    const targetUserId = user?.id || user?._id || session?.id;
    if (isDeleting || !targetUserId) return;
    setIsDeleting(true);
    try {
      await apiDelete(`/users/${targetUserId}`);
      toast.success('Account deactivated and deleted successfully.');
      logout();
      window.location.href = '/';
    } catch (err) {
      toast.error('Failed to delete account: ' + err.message);
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  if (!session) return null;

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
              Name <b>{user?.name || session?.name || 'User'}</b>
            </span>
            <span>
              Email <b>{user?.email || session?.email || '—'}</b>
            </span>
            <span>
              Role <b>{ROLE_LABELS[user?.role || session?.role] || roleLabel}</b>
            </span>
            <span>
              Status <b>{user?.isActive !== false ? 'Active' : 'Deactivated'}</b>
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
                  max="20"
                  value={capacity}
                  onChange={(e) => setCapacity(Math.max(1, Number(e.target.value) || 1))}
                />
              </label>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 16,
                  padding: '14px 0',
                  borderTop: '1px solid var(--border-subtle)',
                  borderBottom: '1px solid var(--border-subtle)',
                  flexWrap: 'wrap',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <b style={{ fontSize: '0.92rem' }}>Pause New Requests</b>
                    <span
                      className={`status-chip ${pauseRequests ? 'orange' : 'green'}`}
                      style={{ fontSize: '0.74rem', padding: '2px 8px' }}
                    >
                      {pauseRequests ? 'Intake Paused' : 'Accepting Requests'}
                    </span>
                  </div>
                  <small
                    style={{
                      color: 'var(--foreground-muted)',
                      display: 'block',
                      fontSize: '0.78rem',
                      lineHeight: 1.4,
                      maxWidth: 420,
                    }}
                  >
                    {pauseRequests
                      ? 'Mentorship inquiries are currently paused. Students cannot send you new requests.'
                      : 'Temporarily hide request button on your profile while keeping existing mentees.'}
                  </small>
                </div>

                <button
                  type="button"
                  className={`btn ${pauseRequests ? 'primary' : 'secondary'}`}
                  onClick={handleTogglePause}
                  disabled={savingPause}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    fontWeight: 600,
                  }}
                >
                  {pauseRequests ? <PlayCircle size={16} /> : <PauseCircle size={16} />}
                  {savingPause ? 'Updating...' : pauseRequests ? 'Resume Intake' : 'Pause Requests'}
                </button>
              </div>

              <button
                type="button"
                className="uiverse-btn"
                onClick={handleSaveCapacity}
                disabled={saving}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
              >
                <Save size={15} />
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

        {/* Platform Features & Governance (Admin Only) */}
        {role === 'admin' && (
          <section className="card settings-card">
            <div className="settings-heading">
              <div className="settings-icon">
                <Sliders size={19} />
              </div>
              <div>
                <h2>Platform Features & Governance</h2>
                <p>
                  Configure algorithmic matching parameters, user registration policies, and AI
                  advisory controls.
                </p>
              </div>
            </div>
            <div className="settings-options">
              <label className="setting-toggle">
                <span>
                  <b>Algorithmic Matching Engine</b>
                  <small>
                    Allow students to discover and calculate multi-factor compatibility scores
                  </small>
                </span>
                <input
                  type="checkbox"
                  checked={platformSettings.matchingEnabled}
                  onChange={(e) =>
                    setPlatformSettings((prev) => ({
                      ...prev,
                      matchingEnabled: e.target.checked,
                    }))
                  }
                />
              </label>

              <label className="setting-toggle">
                <span>
                  <b>Public User Registrations</b>
                  <small>Allow new students and alumni mentors to create platform accounts</small>
                </span>
                <input
                  type="checkbox"
                  checked={platformSettings.registrationsEnabled}
                  onChange={(e) =>
                    setPlatformSettings((prev) => ({
                      ...prev,
                      registrationsEnabled: e.target.checked,
                    }))
                  }
                />
              </label>

              <label className="setting-toggle">
                <span>
                  <b>AI Advisory Features (Explanations & Goal Suggestions)</b>
                  <small>Enable LLM reasoning assistance grounded strictly in factor scores</small>
                </span>
                <input
                  type="checkbox"
                  checked={platformSettings.aiAdvisoryEnabled}
                  onChange={(e) =>
                    setPlatformSettings((prev) => ({
                      ...prev,
                      aiAdvisoryEnabled: e.target.checked,
                    }))
                  }
                />
              </label>

              <div style={{ marginTop: 12 }}>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: 4 }}>
                  Default New Mentor Capacity Limit
                </label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={platformSettings.defaultMentorCapacity}
                  onChange={(e) =>
                    setPlatformSettings((prev) => ({
                      ...prev,
                      defaultMentorCapacity: parseInt(e.target.value, 10) || 5,
                    }))
                  }
                  style={{ maxWidth: 200 }}
                />
              </div>
            </div>
            <button
              type="button"
              className="uiverse-btn"
              disabled={savingPlatform}
              onClick={handleSavePlatformSettings}
              style={{ marginTop: 16, display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              <Save size={15} /> {savingPlatform ? 'Saving...' : 'Save Platform Settings'}
            </button>
          </section>
        )}

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
