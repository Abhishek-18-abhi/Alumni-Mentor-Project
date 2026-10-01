import { setSession } from './storage';

const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/$/, '');
const TOKEN_KEY = 'mc_api_token';

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (token) => token ? localStorage.setItem(TOKEN_KEY, token) : localStorage.removeItem(TOKEN_KEY);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

export async function apiRequest(path, options = {}) {
  const headers = new Headers(options.headers || {});
  if (options.body !== undefined && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  const token = getToken();
  if (token) headers.set('Authorization', `Bearer ${token}`);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs || 10000);
  let response;
  try {
    response = await fetch(`${API_BASE}${path}`, { ...options, headers, signal: controller.signal });
  } catch (error) {
    if (error?.name === 'AbortError') throw new Error('Backend request timed out. Make sure the backend is running.');
    throw error;
  } finally {
    clearTimeout(timeout);
  }
  let data = null;
  try { data = await response.json(); } catch { data = null; }
  if (!response.ok) {
    if (response.status === 401) {
      clearToken();
      setSession(null);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('mc:auth-expired'));
      }
    }
    throw new Error(data?.message || `Request failed (${response.status}).`);
  }
  return data;
}

export const apiGet = (path) => apiRequest(path);
export const apiPost = (path, body) => apiRequest(path, { method: 'POST', body: JSON.stringify(body) });
export const apiPatch = (path, body) => apiRequest(path, { method: 'PATCH', body: JSON.stringify(body) });
export const apiDelete = (path) => apiRequest(path, { method: 'DELETE' });

const idOf = (value) => value?._id || value?.id || value;
const mapUser = (u) => u ? ({ ...u, id: idOf(u) }) : u;
const mapRequest = (r) => r ? ({ ...r, id: idOf(r), studentId: idOf(r.studentId), mentorId: idOf(r.mentorId) }) : r;
const mapMeeting = (m) => m ? ({ ...m, id: idOf(m), mentorId: idOf(m.mentorId), studentId: idOf(m.studentId), status: m.status || 'scheduled' }) : m;
const mapGoal = (g) => {
  if (!g) return g;
  const studentId = idOf(g.studentId);
  const createdBy = idOf(g.createdBy);
  return {
    ...g,
    id: idOf(g),
    studentId,
    createdBy,
    mentorId: createdBy && createdBy !== studentId ? createdBy : undefined,
  };
};
const mapFeedback = (f) => f ? ({ ...f, id: idOf(f), fromUserId: idOf(f.fromUserId), toUserId: idOf(f.toUserId), requestId: idOf(f.requestId) }) : f;
const mapNotification = (n) => n ? ({ ...n, id: idOf(n), userId: idOf(n.userId) }) : n;
const mapAudit = (a) => a ? ({ ...a, id: idOf(a), userId: idOf(a.userId), timestamp: a.timestamp || a.createdAt }) : a;

export const normalizeUser = mapUser;
export const normalizeRequest = mapRequest;
export const normalizeMeeting = mapMeeting;
export const normalizeGoal = mapGoal;
export const normalizeFeedback = mapFeedback;
export const normalizeNotification = mapNotification;
export const normalizeAudit = mapAudit;

export async function refetchMeetings() {
  try {
    const data = await apiGet('/meetings');
    const items = (data.meetings || []).map(mapMeeting);
    localStorage.setItem('mc_meetings', JSON.stringify(items));
    return items;
  } catch (e) {
    console.warn('Failed to refetch meetings:', e.message);
  }
}

export async function refetchGoals() {
  try {
    const data = await apiGet('/goals');
    const items = (data.goals || []).map(mapGoal);
    localStorage.setItem('mc_goals', JSON.stringify(items));
    return items;
  } catch (e) {
    console.warn('Failed to refetch goals:', e.message);
  }
}

export async function refetchFeedback() {
  try {
    const data = await apiGet('/feedback');
    const items = (data.feedback || []).map(mapFeedback);
    localStorage.setItem('mc_feedback', JSON.stringify(items));
    return items;
  } catch (e) {
    console.warn('Failed to refetch feedback:', e.message);
  }
}

export async function refetchNotifications() {
  try {
    const data = await apiGet('/notifications');
    const items = (data.notifications || []).map(mapNotification);
    localStorage.setItem('mc_notifications', JSON.stringify(items));
    return items;
  } catch (e) {
    console.warn('Failed to refetch notifications:', e.message);
  }
}

export async function refetchRequests() {
  try {
    const data = await apiGet('/mentorship-requests');
    const items = (data.requests || []).map(mapRequest);
    localStorage.setItem('mc_requests', JSON.stringify(items));
    return items;
  } catch (e) {
    console.warn('Failed to refetch requests:', e.message);
  }
}

export async function refetchUsers() {
  try {
    const data = await apiGet('/users');
    const items = (data.users || []).map(mapUser);
    localStorage.setItem('mc_users', JSON.stringify(items));
    return items;
  } catch (e) {
    console.warn('Failed to refetch users:', e.message);
  }
}

export async function refetchAudit() {
  try {
    const data = await apiGet('/audit-logs');
    const items = (data.audit || []).map(mapAudit);
    localStorage.setItem('mc_audit', JSON.stringify(items));
    return items;
  } catch (e) {
    console.warn('Failed to refetch audit logs:', e.message);
  }
}

export async function hydrateLocalCache({ includeAudit = true } = {}) {
  const results = await Promise.allSettled([
    apiGet('/users'),
    apiGet('/notifications'),
    apiGet('/mentorship-requests'),
    apiGet('/meetings'),
    apiGet('/goals'),
    apiGet('/feedback'),
    apiGet('/platform-settings'),
    includeAudit ? apiGet('/audit-logs') : Promise.resolve(null),
  ]);
  const [users, notifications, requests, meetings, goals, feedback, settings, audit] = results;
  const set = (key, value) => localStorage.setItem(key, JSON.stringify(value));
  if (users.status === 'fulfilled') set('mc_users', (users.value.users || []).map(mapUser));
  if (notifications.status === 'fulfilled') set('mc_notifications', (notifications.value.notifications || []).map(mapNotification));
  if (requests.status === 'fulfilled') set('mc_requests', (requests.value.requests || []).map(mapRequest));
  if (meetings.status === 'fulfilled') set('mc_meetings', (meetings.value.meetings || []).map(mapMeeting));
  if (goals.status === 'fulfilled') set('mc_goals', (goals.value.goals || []).map(mapGoal));
  if (feedback.status === 'fulfilled') set('mc_feedback', (feedback.value.feedback || []).map(mapFeedback));
  if (settings.status === 'fulfilled') set('mc_platform_settings', settings.value.settings || {});
  if (audit?.status === 'fulfilled' && audit.value?.audit) set('mc_audit', audit.value.audit.map(mapAudit));
}

export async function refreshCurrentUserCache() {
  const result = await apiGet('/auth/me');
  const user = mapUser(result.user);
  const users = JSON.parse(localStorage.getItem('mc_users') || '[]');
  const next = users.some((u) => u.id === user.id) ? users.map((u) => u.id === user.id ? { ...u, ...user } : u) : [user, ...users];
  localStorage.setItem('mc_users', JSON.stringify(next));
  return user;
}
