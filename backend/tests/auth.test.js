import { test, describe, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../server.js';
import { setupTestDB, teardownTestDB, clearTestDB, createTestUser } from './setup.js';
import User from '../models/User.js';

describe('Auth & Setup API Tests', () => {
  before(async () => {
    await setupTestDB();
  });

  after(async () => {
    await teardownTestDB();
  });

  beforeEach(async () => {
    await clearTestDB();
  });

  test('POST /api/auth/setup-admin creates initial administrator', async () => {
    const res = await request(app)
      .post('/api/auth/setup-admin')
      .send({
        name: 'Head Administrator',
        email: 'admin@college.edu',
        password: 'AdminPassword@123',
        title: 'HOD Computer Science',
        department: 'BCA Department',
      });

    assert.equal(res.status, 201);
    assert.equal(res.body.user.role, 'admin');
    assert.ok(res.body.token);

    const count = await User.countDocuments({ role: 'admin' });
    assert.equal(count, 1);
  });

  test('POST /api/auth/setup-admin blocks duplicate initial admin setup if admin exists', async () => {
    await createTestUser({ email: 'existing.admin@college.edu', role: 'admin' });

    const res = await request(app)
      .post('/api/auth/setup-admin')
      .send({
        name: 'Second Admin',
        email: 'second@college.edu',
        password: 'AdminPassword@123',
      });

    assert.ok([400, 409].includes(res.status));
    assert.match(res.body.message, /already complete/i);
  });

  test('POST /api/auth/register registers student user successfully', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Aarav Sharma',
        email: 'aarav@student.edu',
        password: 'Password@123',
        role: 'student',
        college: 'Main Campus',
        course: 'BCA',
        year: '3rd Year',
        skills: ['Python', 'SQL'],
        interests: ['Data Analytics'],
      });

    assert.equal(res.status, 201);
    assert.equal(res.body.user.role, 'student');
    assert.equal(res.body.user.name, 'Aarav Sharma');
    assert.ok(res.body.token);
  });

  test('POST /api/auth/register registers mentor user successfully', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Pooja Iyer',
        email: 'pooja@techcorp.com',
        password: 'Password@123',
        role: 'mentor',
        company: 'Google',
        jobTitle: 'Cloud Architect',
        domain: 'Cloud Computing',
        capacity: 4,
        skills: ['Cloud Computing', 'AWS'],
      });

    assert.equal(res.status, 201);
    assert.equal(res.body.user.role, 'mentor');
    assert.equal(res.body.user.capacity, 4);
    assert.ok(res.body.token);
  });

  test('POST /api/auth/register rejects duplicate email address', async () => {
    await createTestUser({ email: 'duplicate@test.com' });

    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Another User',
        email: 'duplicate@test.com',
        password: 'Password@123',
        role: 'student',
      });

    assert.equal(res.status, 409);
    assert.match(res.body.message, /already exists/i);
  });

  test('POST /api/auth/register validates minimum password length', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Short Password User',
        email: 'short@test.com',
        password: '123',
        role: 'student',
      });

    assert.equal(res.status, 400);
    assert.match(res.body.message, /at least 8 characters/i);
  });

  test('POST /api/auth/login succeeds with valid credentials', async () => {
    await createTestUser({
      name: 'Rohan Mehra',
      email: 'rohan@test.com',
      password: 'SecurePassword@123',
      role: 'student',
    });

    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'rohan@test.com',
        password: 'SecurePassword@123',
      });

    assert.equal(res.status, 200);
    assert.equal(res.body.user.name, 'Rohan Mehra');
    assert.ok(res.body.token);
  });

  test('POST /api/auth/login fails with invalid password', async () => {
    await createTestUser({ email: 'user@test.com', password: 'CorrectPassword@123' });

    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'user@test.com',
        password: 'WrongPassword@123',
      });

    assert.equal(res.status, 401);
    assert.match(res.body.message, /invalid email or password|invalid credentials/i);
  });

  test('POST /api/auth/login blocks inactive accounts', async () => {
    await createTestUser({
      email: 'inactive@test.com',
      password: 'Password@123',
      isActive: false,
    });

    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'inactive@test.com',
        password: 'Password@123',
      });

    assert.equal(res.status, 403);
    assert.match(res.body.message, /deactivated/i);
  });

  test('GET /api/auth/me returns current authenticated user profile', async () => {
    const { token } = await createTestUser({
      name: 'Logged In User',
      email: 'me@test.com',
      role: 'mentor',
    });

    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.user.name, 'Logged In User');
    assert.equal(res.body.user.email, 'me@test.com');
  });

  test('POST /api/auth/change-password validates current password and updates hash', async () => {
    const { token } = await createTestUser({
      email: 'pwchange@test.com',
      password: 'OldPassword@123',
    });

    const badAttempt = await request(app)
      .post('/api/auth/change-password')
      .set('Authorization', `Bearer ${token}`)
      .send({
        currentPassword: 'WrongOldPassword',
        newPassword: 'NewPassword@123',
      });
    assert.equal(badAttempt.status, 400);

    const goodAttempt = await request(app)
      .post('/api/auth/change-password')
      .set('Authorization', `Bearer ${token}`)
      .send({
        currentPassword: 'OldPassword@123',
        newPassword: 'NewPassword@123',
      });
    assert.equal(goodAttempt.status, 200);

    // Verify login with new password
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'pwchange@test.com', password: 'NewPassword@123' });
    assert.equal(loginRes.status, 200);
  });
});
