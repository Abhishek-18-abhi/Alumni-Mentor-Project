import { describe, it, expect, beforeEach, vi } from 'vitest';
import { login, registerUser, createAdmin, changePassword } from '../auth';
import { getUsers, getSession } from '../storage';

const mockResponse = (data, status = 200) =>
  Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(data),
  });

beforeEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});

describe('registerUser', () => {
  it('rejects a password under the minimum length before making a request', async () => {
    const fetchSpy = vi.fn();
    global.fetch = fetchSpy;

    const r = await registerUser({
      name: 'Bob',
      email: 'bob@test.com',
      password: 'short',
      role: 'student',
    });

    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/password must be at least/i);
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(getUsers()).toHaveLength(0);
  });

  it('stores JWT token and never exposes plaintext password or hash on success', async () => {
    global.fetch = vi.fn().mockImplementation((url) => {
      if (url.includes('/auth/register')) {
        return mockResponse({
          token: 'mock-jwt-token',
          user: {
            _id: 'u1',
            name: 'Alice',
            email: 'alice@test.com',
            role: 'student',
            password: 'password123',
            passwordHash: '$2a$10$somethinghashed',
          },
        });
      }
      return mockResponse({});
    });

    const r = await registerUser({
      name: 'Alice',
      email: 'alice@test.com',
      password: 'password123',
      role: 'student',
    });

    expect(r.ok).toBe(true);
    expect(r.user.password).toBeUndefined();
    expect(r.user.passwordHash).toBeUndefined();
    expect(localStorage.getItem('mc_api_token')).toBe('mock-jwt-token');
    expect(getSession()).toEqual({
      id: 'u1',
      name: 'Alice',
      email: 'alice@test.com',
      role: 'student',
    });
  });

  it('handles duplicate email conflicts gracefully', async () => {
    global.fetch = vi.fn().mockResolvedValue(
      mockResponse({ message: 'User already exists with this email' }, 409)
    );

    const r = await registerUser({
      name: 'Alice2',
      email: 'dup@test.com',
      password: 'password123',
      role: 'student',
    });

    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/already exists/i);
  });
});

describe('login', () => {
  it('succeeds with the correct credentials and fails with invalid ones', async () => {
    global.fetch = vi.fn().mockImplementation((url, opts) => {
      const body = JSON.parse(opts.body);
      if (body.email === 'carol@test.com' && body.password === 'password123') {
        return mockResponse({
          token: 'valid-token',
          user: { _id: 'u2', name: 'Carol', email: 'carol@test.com', role: 'student' },
        });
      }
      return mockResponse({ message: 'Invalid credentials' }, 401);
    });

    const success = await login('carol@test.com', 'password123');
    expect(success.ok).toBe(true);
    expect(success.user.name).toBe('Carol');
    expect(localStorage.getItem('mc_api_token')).toBe('valid-token');

    const wrongPass = await login('carol@test.com', 'wrongpass');
    expect(wrongPass.ok).toBe(false);
    expect(wrongPass.error).toMatch(/invalid credentials/i);

    const noUser = await login('nouser@test.com', 'password123');
    expect(noUser.ok).toBe(false);
    expect(noUser.error).toMatch(/invalid credentials/i);
  });

  it('never returns a password or passwordHash field on success', async () => {
    global.fetch = vi.fn().mockResolvedValue(
      mockResponse({
        token: 'token-dana',
        user: {
          _id: 'u3',
          name: 'Dana',
          email: 'dana@test.com',
          role: 'student',
          password: 'password123',
          passwordHash: '$2b$10$hashedstring',
        },
      })
    );

    const r = await login('dana@test.com', 'password123');
    expect(r.ok).toBe(true);
    expect(r.user.password).toBeUndefined();
    expect(r.user.passwordHash).toBeUndefined();
  });
});

describe('createAdmin', () => {
  it('allows creating an admin and never returns raw credentials', async () => {
    global.fetch = vi.fn().mockResolvedValue(
      mockResponse({
        user: {
          _id: 'a1',
          name: 'New Admin',
          email: 'newadmin@test.com',
          role: 'admin',
          passwordHash: '$2a$10$somehash',
        },
      })
    );

    const r = await createAdmin({
      name: 'New Admin',
      email: 'newadmin@test.com',
      password: 'password123',
    });

    expect(r.ok).toBe(true);
    expect(r.user.password).toBeUndefined();
    expect(r.user.passwordHash).toBeUndefined();
    expect(getUsers().some((u) => u.email === 'newadmin@test.com')).toBe(true);
  });

  it('propagates server authorization failures', async () => {
    global.fetch = vi.fn().mockResolvedValue(
      mockResponse({ message: 'Access denied. Administrator role required.' }, 403)
    );

    const r = await createAdmin({
      name: 'Fake Admin',
      email: 'fake@test.com',
      password: 'password123',
    });

    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/administrator role required/i);
  });
});

describe('changePassword', () => {
  it('validates password length before making network request', async () => {
    const fetchSpy = vi.fn();
    global.fetch = fetchSpy;

    const r = await changePassword('u1', 'oldpassword', 'short');
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/password must be at least/i);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('updates password successfully when valid', async () => {
    global.fetch = vi.fn().mockResolvedValue(
      mockResponse({ message: 'Password updated successfully' }, 200)
    );

    const r = await changePassword('u1', 'oldpassword123', 'newpassword123');
    expect(r.ok).toBe(true);
  });
});
