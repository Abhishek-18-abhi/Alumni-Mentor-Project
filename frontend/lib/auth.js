import { MIN_PASSWORD_LENGTH } from './constants';
import { getUsers, setSession } from './storage';
import { apiPost, apiPatch, setToken, clearToken, hydrateLocalCache, normalizeUser } from './api';

const PASSWORD_ERROR = `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
const publicUser = (u) => {
  if (!u) return u;
  const { password, passwordHash, ...rest } = u;
  return rest;
};
const isValidPassword = (p) => typeof p === 'string' && p.length >= MIN_PASSWORD_LENGTH;

export async function login(email, password) {
  try {
    const result = await apiPost('/auth/login', { email, password });
    setToken(result.token);
    const user = normalizeUser(result.user);
    setSession({ id: user.id, name: user.name, email: user.email, role: user.role });
    try { await hydrateLocalCache({ includeAudit: user.role === 'admin' }); } catch (e) { console.warn('Background data hydration failed:', e?.message || e); }
    return { ok: true, user: publicUser(user) };
  } catch (error) {
    return { ok: false, error: error.message };
  }
}

export async function registerUser(data) {
  if (!isValidPassword(data.password)) return { ok: false, error: PASSWORD_ERROR };
  try {
    const result = await apiPost('/auth/register', data);
    setToken(result.token);
    const user = normalizeUser(result.user);
    setSession({ id: user.id, name: user.name, email: user.email, role: user.role });
    try { await hydrateLocalCache({ includeAudit: false }); } catch (e) { console.warn('Background data hydration failed:', e?.message || e); }
    return { ok: true, user: publicUser(user) };
  } catch (error) {
    return { ok: false, error: error.message };
  }
}

export async function setupAdmin(data) {
  if (!isValidPassword(data.password)) return { ok: false, error: PASSWORD_ERROR };
  try {
    const result = await apiPost('/auth/setup-admin', data);
    setToken(result.token);
    const user = normalizeUser(result.user);
    setSession({ id: user.id, name: user.name, email: user.email, role: user.role });
    try { await hydrateLocalCache({ includeAudit: true }); } catch (e) { console.warn('Background data hydration failed:', e?.message || e); }
    return { ok: true, user: publicUser(user) };
  } catch (error) {
    return { ok: false, error: error.message };
  }
}

export async function updateUser(userId, patch) {
  try {
    const result = await apiPatch(`/users/${userId}`, patch);
    const user = normalizeUser(result.user);
    const users = getUsers();
    localStorage.setItem('mc_users', JSON.stringify(users.some((u) => u.id === user.id) ? users.map((u) => u.id === user.id ? { ...u, ...user } : u) : [user, ...users]));
    const session = JSON.parse(localStorage.getItem('mc_session') || 'null');
    if (session?.id === user.id) setSession({ id: user.id, name: user.name, email: user.email, role: user.role });
    return { ok: true, user: publicUser(user) };
  } catch (error) {
    return { ok: false, error: error.message };
  }
}

export async function createAdmin(data) {
  try {
    const result = await apiPost('/auth/admins', data);
    const user = normalizeUser(result.user);
    const users = getUsers();
    localStorage.setItem('mc_users', JSON.stringify([user, ...users.filter((u) => u.id !== user.id)]));
    return { ok: true, user: publicUser(user) };
  } catch (error) {
    return { ok: false, error: error.message };
  }
}

export async function changePassword(_userId, currentPassword, nextPassword) {
  if (!isValidPassword(nextPassword)) return { ok: false, error: PASSWORD_ERROR };
  try {
    await apiPatch('/auth/change-password', { currentPassword, nextPassword });
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error.message };
  }
}

export function logout() {
  clearToken();
  setSession(null);
}
