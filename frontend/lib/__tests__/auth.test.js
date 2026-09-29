import { describe, it, expect, beforeEach } from 'vitest';
import { login, registerUser, createAdmin } from '../auth';
import { getUsers, saveUsers } from '../storage';

beforeEach(() => {
  localStorage.clear();
});

describe('registerUser', () => {
  it('stores a bcrypt hash and never the plaintext password', () => {
    const r = registerUser({
      name: 'Alice',
      email: 'alice@test.com',
      password: 'password123',
      role: 'student',
    });
    expect(r.ok).toBe(true);
    expect(r.user.password).toBeUndefined();
    expect(r.user.passwordHash).toBeUndefined(); // never returned to the caller either
    const stored = getUsers().find((u) => u.email === 'alice@test.com');
    expect(stored.password).toBeUndefined();
    expect(stored.passwordHash).toMatch(/^\$2[aby]\$/); // bcrypt hash prefix
  });

  it('rejects a password under the minimum length', () => {
    const r = registerUser({
      name: 'Bob',
      email: 'bob@test.com',
      password: 'short',
      role: 'student',
    });
    expect(r.ok).toBe(false);
    expect(getUsers()).toHaveLength(0);
  });

  it('rejects a duplicate email', () => {
    registerUser({
      name: 'Alice',
      email: 'dup@test.com',
      password: 'password123',
      role: 'student',
    });
    const r = registerUser({
      name: 'Alice2',
      email: 'DUP@test.com',
      password: 'password123',
      role: 'student',
    });
    expect(r.ok).toBe(false);
  });
});

describe('login', () => {
  it('succeeds with the correct password and fails with the wrong one', () => {
    registerUser({
      name: 'Carol',
      email: 'carol@test.com',
      password: 'password123',
      role: 'student',
    });
    expect(login('carol@test.com', 'password123').ok).toBe(true);
    expect(login('carol@test.com', 'wrongpass').ok).toBe(false);
    expect(login('nouser@test.com', 'password123').ok).toBe(false);
  });

  it('never returns a password or passwordHash field on success', () => {
    registerUser({
      name: 'Dana',
      email: 'dana@test.com',
      password: 'password123',
      role: 'student',
    });
    const r = login('dana@test.com', 'password123');
    expect(r.user.password).toBeUndefined();
    expect(r.user.passwordHash).toBeUndefined();
  });

  it('migrates a legacy plaintext-password account transparently on first login', () => {
    const legacyUser = {
      id: 'user_legacy',
      name: 'Legacy',
      email: 'legacy@test.com',
      password: 'plaintextpass',
      role: 'student',
      skills: [],
      interests: [],
      goals: [],
      languages: ['English'],
      availability: [],
      capacity: 1,
      currentMentees: 0,
    };
    saveUsers([legacyUser]);

    const r = login('legacy@test.com', 'plaintextpass');
    expect(r.ok).toBe(true);

    const stored = getUsers().find((u) => u.email === 'legacy@test.com');
    expect(stored.password).toBeUndefined();
    expect(stored.passwordHash).toMatch(/^\$2[aby]\$/);

    // and it still logs in correctly afterwards, via the new hash
    expect(login('legacy@test.com', 'plaintextpass').ok).toBe(true);
    expect(login('legacy@test.com', 'wrongpass').ok).toBe(false);
  });
});

describe('createAdmin', () => {
  it('rejects a creator who is not an admin', () => {
    const student = { id: 'u1', role: 'student' };
    const r = createAdmin(
      { name: 'New Admin', email: 'newadmin@test.com', password: 'password123' },
      student
    );
    expect(r.ok).toBe(false);
    expect(getUsers()).toHaveLength(0);
  });

  it('allows an admin creator and hashes the password', () => {
    const admin = { id: 'admin1', role: 'admin' };
    const r = createAdmin(
      { name: 'New Admin', email: 'newadmin@test.com', password: 'password123' },
      admin
    );
    expect(r.ok).toBe(true);
    const stored = getUsers().find((u) => u.email === 'newadmin@test.com');
    expect(stored.passwordHash).toMatch(/^\$2[aby]\$/);
    expect(stored.password).toBeUndefined();
  });

  it('rejects a short password even for an admin creator', () => {
    const admin = { id: 'admin1', role: 'admin' };
    const r = createAdmin(
      { name: 'New Admin', email: 'shortpass@test.com', password: 'short' },
      admin
    );
    expect(r.ok).toBe(false);
  });
});
