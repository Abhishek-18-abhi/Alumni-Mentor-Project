import { SKILLS } from './constants';
const KEYS = {
  users: 'mc_users',
  session: 'mc_session',
  notifications: 'mc_notifications',
  meetings: 'mc_meetings',
  requests: 'mc_requests',
  audit: 'mc_audit',
  goals: 'mc_goals',
  feedback: 'mc_feedback',
  platformSettings: 'mc_platform_settings',
};
const read = (k, f = []) => {
  try {
    const v = JSON.parse(localStorage.getItem(k));
    return v ?? f;
  } catch {
    return f;
  }
};
const write = (k, v) => localStorage.setItem(k, JSON.stringify(v));
/** @returns {import('./types').User[]} */
export const getUsers = () => read(KEYS.users, []);
export const saveUsers = (x) => write(KEYS.users, x);
export const getSession = () => {
  try {
    return JSON.parse(localStorage.getItem(KEYS.session));
  } catch {
    return null;
  }
};
export const setSession = (u) =>
  u ? write(KEYS.session, u) : localStorage.removeItem(KEYS.session);
export const NOTIFICATIONS_CHANGED_EVENT = 'mc:notifications-changed';
export const getNotifications = () => read(KEYS.notifications, []);
export const saveNotifications = (x) => {
  write(KEYS.notifications, x);
  // Same-tab listeners (e.g. the Topbar badge) don't get the native `storage` event,
  // which only fires in *other* tabs - so fire our own for same-tab reactivity.
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(NOTIFICATIONS_CHANGED_EVENT));
  }
};
export const getMeetings = () => read(KEYS.meetings, []);
export const saveMeetings = (x) => write(KEYS.meetings, x);
export const getRequests = () => read(KEYS.requests, []);
export const saveRequests = (x) => write(KEYS.requests, x);
export const getAudit = () => read(KEYS.audit, []);
export const saveAudit = (x) => write(KEYS.audit, x);
export const getGoals = () => read(KEYS.goals, []);
export const saveGoals = (x) => write(KEYS.goals, x);
export const getFeedback = () => read(KEYS.feedback, []);
export const saveFeedback = (x) => write(KEYS.feedback, x);
export const getPlatformSettings = () =>
  read(KEYS.platformSettings, {
    platformName: 'MentorConnect',
    matchingEnabled: true,
    registrationsEnabled: true,
    maintenanceMode: false,
    defaultMentorCapacity: 3,
  });
export const savePlatformSettings = (x) => write(KEYS.platformSettings, x);
export const uid = (p = 'id') => `${p}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
/**
 * @param {string} userId
 * @param {string} title
 * @param {string} message
 * @param {string} [type]
 */
export function addNotification(userId, title, message, type = 'info') {
  if (!userId) return;
  const recipient = getUsers().find((u) => u.id === userId);
  if (recipient?.settings?.notifications === false) return;
  const n = getNotifications();
  n.unshift({
    id: uid('note'),
    userId,
    title,
    message,
    type,
    read: false,
    createdAt: new Date().toISOString(),
  });
  saveNotifications(n);
}
/**
 * @param {string} userId
 * @param {string} action
 * @param {string} resource
 * @param {'Success'|'Failed'} [status]
 */
export function addAudit(userId, action, resource, status = 'Success') {
  const a = getAudit();
  a.unshift({
    id: uid('audit'),
    timestamp: new Date().toISOString(),
    userId,
    action,
    resource,
    status,
  });
  saveAudit(a);
}
export const getCurrentUser = () => {
  const s = getSession();
  if (!s) return null;
  const found = getUsers().find((u) => u.id === s.id);
  if (found) {
    return {
      ...found,
      email: found.email || s.email || '',
      name: found.name || s.name || '',
      role: found.role || s.role || 'student',
    };
  }
  return {
    id: s.id,
    name: s.name || '',
    email: s.email || '',
    role: s.role || 'student',
    skills: [],
    interests: [],
    goals: [],
    languages: ['English'],
    availability: [],
    settings: {},
  };
};
export const splitList = (v) =>
  Array.isArray(v)
    ? v
    : (v || '')
        .split(',')
        .map((x) => x.trim())
        .filter(Boolean);
export const normalizeList = (v) => splitList(v).map((x) => x.toLowerCase().trim());
export function seedSkills() {
  return [...SKILLS];
}
