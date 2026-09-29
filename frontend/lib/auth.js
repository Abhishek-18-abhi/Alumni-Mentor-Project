import bcrypt from 'bcryptjs';
import { MIN_PASSWORD_LENGTH } from './constants';
import { getUsers, setSession, saveUsers, addAudit, addNotification, uid } from './storage';

const BCRYPT_ROUNDS = 10;
const PASSWORD_ERROR = `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;

/** Removes credential fields before a user object is handed to UI code. */
const publicUser = (u) => {
  const { password, passwordHash, ...rest } = u;
  return rest;
};

const isValidPassword = (p) => typeof p === 'string' && p.length >= MIN_PASSWORD_LENGTH;
const hashPassword = (p) => bcrypt.hashSync(p, BCRYPT_ROUNDS);

/**
 * @param {string} email
 * @param {string} password
 * @returns {{ok: boolean, error?: string, user?: import('./types').User}}
 */
export function login(email, password) {
  const users = getUsers();
  const idx = users.findIndex((x) => x.email?.toLowerCase() === String(email).toLowerCase());
  const u = users[idx];
  let valid = false;
  if (u?.passwordHash) {
    valid = bcrypt.compareSync(String(password), u.passwordHash);
  } else if (u && typeof u.password === 'string') {
    // Legacy account saved before hashing was introduced: verify, then migrate transparently.
    valid = u.password === password;
    if (valid) {
      const { password: legacy, ...rest } = u;
      users[idx] = { ...rest, passwordHash: hashPassword(String(password)) };
      saveUsers(users);
    }
  }
  if (!valid) return { ok: false, error: 'Invalid email or password.' };
  const current = users[idx];
  setSession({ id: current.id, name: current.name, email: current.email, role: current.role });
  addAudit(current.id, 'Signed in', 'Account');
  return { ok: true, user: publicUser(current) };
}
/**
 * @param {Partial<import('./types').User> & {password: string}} data
 * @returns {{ok: boolean, error?: string, user?: import('./types').User}}
 */
export function registerUser(data) {
  const users = getUsers();
  if (!isValidPassword(data.password)) return { ok: false, error: PASSWORD_ERROR };
  if (users.some((u) => u.email?.toLowerCase() === data.email.toLowerCase()))
    return { ok: false, error: 'An account with this email already exists.' };
  const { password, ...profileData } = data;
  const user = {
    ...profileData,
    passwordHash: hashPassword(password),
    id: uid('user'),
    createdAt: new Date().toISOString(),
    profileComplete: data.role === 'admin',
    skills: Array.isArray(data.skills) ? data.skills : [],
    interests: Array.isArray(data.interests) ? data.interests : [],
    goals: Array.isArray(data.goals) ? data.goals : [],
    languages: Array.isArray(data.languages) ? data.languages : ['English'],
    availability: [],
    capacity: Number(data.capacity) || 1,
    currentMentees: 0,
    settings: { notifications: true, requestAlerts: true, meetingAlerts: true, profileVisible: true, compactMode: false, language: 'English' },
  };
  users.push(user);
  saveUsers(users);
  setSession({ id: user.id, name: user.name, email: user.email, role: user.role });
  addAudit(user.id, 'Account created', 'Account');
  addNotification(
    user.id,
    'Welcome to MentorConnect',
    'Complete your profile to start using mentorship features.'
  );
  return { ok: true, user: publicUser(user) };
}
/**
 * @param {string} userId
 * @param {Partial<import('./types').User>} patch
 * @returns {{ok: boolean, error?: string, user?: import('./types').User}}
 */
export function updateUser(userId, patch) {
  const users = getUsers();
  const idx = users.findIndex((u) => u.id === userId);
  if (idx < 0) return { ok: false, error: 'User not found.' };
  users[idx] = { ...users[idx], ...patch, updatedAt: new Date().toISOString() };
  saveUsers(users);
  const u = users[idx];
  setSession({ id: u.id, name: u.name, email: u.email, role: u.role });
  addAudit(userId, 'Updated profile', 'Profile');
  return { ok: true, user: publicUser(u) };
}
/**
 * @param {Partial<import('./types').User> & {password: string}} data
 * @param {import('./types').User} creator - must already be an admin.
 * @returns {{ok: boolean, error?: string, user?: import('./types').User}}
 */
export function createAdmin(data, creator) {
  const users = getUsers();
  if (creator?.role !== 'admin')
    return { ok: false, error: 'Only an administrator can create another administrator.' };
  if (!isValidPassword(data.password)) return { ok: false, error: PASSWORD_ERROR };
  if (users.some((u) => u.email?.toLowerCase() === data.email.toLowerCase()))
    return { ok: false, error: 'Email already exists.' };
  const { password, ...adminData } = data;
  const admin = {
    ...adminData,
    passwordHash: hashPassword(password),
    id: uid('admin'),
    role: 'admin',
    createdAt: new Date().toISOString(),
    profileComplete: true,
    skills: [],
    interests: [],
    goals: [],
    languages: ['English'],
    availability: [],
    settings: { notifications: true, requestAlerts: true, meetingAlerts: true, profileVisible: true, compactMode: false, language: 'English' },
  };
  users.push(admin);
  saveUsers(users);
  addAudit(creator.id, 'Created administrator', admin.email);
  addNotification(
    admin.id,
    'Administrator account created',
    'Your administrator account is ready.'
  );
  return { ok: true, user: publicUser(admin) };
}

export function changePassword(userId, currentPassword, nextPassword) {
  if (!isValidPassword(nextPassword)) return { ok: false, error: PASSWORD_ERROR };
  const users = getUsers();
  const idx = users.findIndex((u) => u.id === userId);
  if (idx < 0) return { ok: false, error: 'Account not found.' };
  const user = users[idx];
  let valid = false;
  if (user.passwordHash) valid = bcrypt.compareSync(String(currentPassword), user.passwordHash);
  else if (typeof user.password === 'string') valid = user.password === currentPassword;
  if (!valid) return { ok: false, error: 'Current password is incorrect.' };
  const { password, ...rest } = user;
  users[idx] = { ...rest, passwordHash: hashPassword(String(nextPassword)), updatedAt: new Date().toISOString() };
  saveUsers(users);
  addAudit(userId, 'Changed password', 'Account');
  return { ok: true };
}
