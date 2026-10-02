import { test, describe, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../server.js';
import { setupTestDB, teardownTestDB, clearTestDB, createTestUser } from './setup.js';
import User from '../models/User.js';

describe('Roles, Permissions & User Visibility Tests', () => {
  before(async () => {
    await setupTestDB();
  });

  after(async () => {
    await teardownTestDB();
  });

  beforeEach(async () => {
    await clearTestDB();
  });

  test('Student cannot access admin analytics', async () => {
    const { token } = await createTestUser({ role: 'student', email: 'student@test.com' });
    const res = await request(app)
      .get('/api/admin/analytics')
      .set('Authorization', `Bearer ${token}`);

    assert.equal(res.status, 403);
  });

  test('Mentor cannot access admin analytics', async () => {
    const { token } = await createTestUser({ role: 'mentor', email: 'mentor@test.com' });
    const res = await request(app)
      .get('/api/admin/analytics')
      .set('Authorization', `Bearer ${token}`);

    assert.equal(res.status, 403);
  });

  test('Admin can access admin analytics', async () => {
    const { token } = await createTestUser({ role: 'admin', email: 'admin@test.com' });
    const res = await request(app)
      .get('/api/admin/analytics')
      .set('Authorization', `Bearer ${token}`);

    assert.equal(res.status, 200);
    assert.ok(res.body.overview);
    assert.ok(res.body.capacity);
  });

  test('Non-admins must not see other users emails in GET /api/users', async () => {
    const { token: studentToken, user: studentUser } = await createTestUser({
      name: 'Student Viewer',
      role: 'student',
      email: 'viewer@student.edu',
    });
    await createTestUser({
      name: 'Mentor Secret',
      role: 'mentor',
      email: 'secret.mentor@corp.com',
    });

    const res = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${studentToken}`);

    assert.equal(res.status, 200);
    const otherUser = res.body.users.find((u) => u.name === 'Mentor Secret');
    assert.ok(otherUser);
    assert.equal(otherUser.email, undefined, 'Email of other user must be stripped for non-admin');

    const selfUser = res.body.users.find((u) => u.name === 'Student Viewer');
    assert.ok(selfUser);
    assert.equal(selfUser.email, 'viewer@student.edu', 'Viewer can see their own email');
  });

  test('Non-admins must not see inactive accounts in GET /api/users', async () => {
    const { token } = await createTestUser({ role: 'student', email: 'active.student@test.com' });
    await createTestUser({
      name: 'Inactive Account',
      role: 'mentor',
      email: 'inactive@test.com',
      isActive: false,
    });

    const res = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${token}`);

    assert.equal(res.status, 200);
    const inactiveFound = res.body.users.find((u) => u.name === 'Inactive Account');
    assert.equal(inactiveFound, undefined, 'Inactive accounts must not be visible to non-admins');
  });

  test('Non-admins cannot view inactive user profile via GET /api/users/:id', async () => {
    const { token } = await createTestUser({ role: 'student', email: 'active@test.com' });
    const { user: inactiveUser } = await createTestUser({
      name: 'Deactivated User',
      email: 'deactivated@test.com',
      isActive: false,
    });

    const res = await request(app)
      .get(`/api/users/${inactiveUser._id}`)
      .set('Authorization', `Bearer ${token}`);

    assert.equal(res.status, 404);
  });

  test('User cannot update another user profile', async () => {
    const { token: studentToken } = await createTestUser({ role: 'student', email: 'student1@test.com' });
    const { user: otherUser } = await createTestUser({ role: 'student', email: 'student2@test.com' });

    const res = await request(app)
      .patch(`/api/users/${otherUser._id}`)
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ name: 'Hacked Name' });

    assert.equal(res.status, 403);
    assert.match(res.body.message, /only update your own profile/i);
  });

  test('Admin can update another user status (deactivate/activate)', async () => {
    const { token: adminToken } = await createTestUser({ role: 'admin', email: 'admin@test.com' });
    const { user: targetUser } = await createTestUser({ role: 'student', email: 'target@test.com' });

    const res = await request(app)
      .patch(`/api/users/${targetUser._id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ isActive: false });

    assert.equal(res.status, 200);
    assert.equal(res.body.user.isActive, false);

    const updated = await User.findById(targetUser._id);
    assert.equal(updated.isActive, false);
  });

  test('Admin cannot delete the last remaining administrator', async () => {
    const { token: adminToken, user: adminUser } = await createTestUser({ role: 'admin', email: 'lone.admin@test.com' });
    const { user: otherAdmin } = await createTestUser({ role: 'admin', email: 'other.admin@test.com' });

    // Deleting otherAdmin leaves 1 admin
    const deleteFirst = await request(app)
      .delete(`/api/users/${otherAdmin._id}`)
      .set('Authorization', `Bearer ${adminToken}`);
    assert.equal(deleteFirst.status, 200);

    // Now trying to delete the sole remaining admin should be blocked
    const deleteLone = await request(app)
      .delete(`/api/users/${adminUser._id}`)
      .set('Authorization', `Bearer ${adminToken}`);
    assert.equal(deleteLone.status, 400);
  });
});
