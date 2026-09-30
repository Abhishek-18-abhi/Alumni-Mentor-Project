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
    if (response.status === 401) clearToken();
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
const mapGoal = (g) => g ? ({ ...g, id: idOf(g), studentId: idOf(g.studentId), createdBy: idOf(g.createdBy), mentorId: idOf(g.createdBy) }) : g;
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
