import { test, describe, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../server.js';
import { setupTestDB, teardownTestDB, clearTestDB, createTestUser } from './setup.js';
import MentorshipRequest from '../models/MentorshipRequest.js';
import AuditLog from '../models/AuditLog.js';
import { recordAudit, verifyAuditChain } from '../services/auditService.js';

describe('Feedback Authorization & Tamper-Evident Audit Tests', () => {
  before(async () => {
    await setupTestDB();
  });

  after(async () => {
    await teardownTestDB();
  });

  beforeEach(async () => {
    await clearTestDB();
  });

  test('Feedback submission succeeds for verified mentorship participants', async () => {
    const { token: studentToken, user: student } = await createTestUser({ role: 'student', email: 'fb.s@test.com' });
    const { user: mentor } = await createTestUser({ role: 'mentor', email: 'fb.m@test.com' });

    const reqDoc = await MentorshipRequest.create({
      studentId: student._id,
      mentorId: mentor._id,
      status: 'accepted',
    });

    const res = await request(app)
      .post('/api/feedback')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        toUserId: mentor._id.toString(),
        requestId: reqDoc._id.toString(),
        rating: 5,
        comment: 'Exceptional guidance on full-stack architecture.',
        aspects: { usefulness: 5, clarity: 5, comfort: 5 },
      });

    assert.equal(res.status, 201);
    assert.equal(res.body.feedback.rating, 5);
    assert.equal(res.body.feedback.comment, 'Exceptional guidance on full-stack architecture.');
  });

  test('Feedback submission rejects unauthorized random user', async () => {
    const { token: outsiderToken } = await createTestUser({ role: 'student', email: 'outsider@test.com' });
    const { user: student } = await createTestUser({ role: 'student', email: 'student@test.com' });
    const { user: mentor } = await createTestUser({ role: 'mentor', email: 'mentor@test.com' });

    const reqDoc = await MentorshipRequest.create({
      studentId: student._id,
      mentorId: mentor._id,
      status: 'accepted',
    });

    // Outsider tries to review the mentor for a relationship they are not part of
    const res = await request(app)
      .post('/api/feedback')
      .set('Authorization', `Bearer ${outsiderToken}`)
      .send({
        toUserId: mentor._id.toString(),
        requestId: reqDoc._id.toString(),
        rating: 1,
        comment: 'Fake feedback.',
      });

    assert.equal(res.status, 403);
    assert.match(res.body.message, /partner in this mentorship/i);
  });

  test('Tamper-evident audit ledger maintains cryptographic SHA-256 hash chain', async () => {
    const { user } = await createTestUser({ role: 'student', email: 'audit.test@test.com' });

    // Record 3 consecutive audit actions
    const log1 = await recordAudit({
      userId: user._id,
      action: 'Account Created',
      resource: 'User',
      status: 'Success',
      details: { step: 1 },
    });

    const log2 = await recordAudit({
      userId: user._id,
      action: 'Profile Updated',
      resource: 'User',
      status: 'Success',
      details: { step: 2 },
    });

    const log3 = await recordAudit({
      userId: user._id,
      action: 'Request Submitted',
      resource: 'MentorshipRequest',
      status: 'Success',
      details: { step: 3 },
    });

    assert.ok(log1.hash, 'Log 1 must have a SHA-256 hash');
    assert.ok(log2.hash, 'Log 2 must have a SHA-256 hash');
    assert.ok(log3.hash, 'Log 3 must have a SHA-256 hash');

    // Verify hash link: log2.prevHash === log1.hash
    assert.equal(log2.prevHash, log1.hash, 'Log 2 prevHash must link to Log 1 hash');
    assert.equal(log3.prevHash, log2.hash, 'Log 3 prevHash must link to Log 2 hash');

    // Run verification service
    const verifyResult = await verifyAuditChain();
    assert.equal(verifyResult.valid, true);
    assert.equal(verifyResult.totalChecked, 3);
  });

  test('GET /api/audit-logs/verify returns verified status for intact ledger', async () => {
    const { token: adminToken, user: admin } = await createTestUser({ role: 'admin', email: 'audit.admin@test.com' });

    await recordAudit({
      userId: admin._id,
      action: 'System Startup',
      resource: 'Core',
    });

    const res = await request(app)
      .get('/api/audit-logs/verify')
      .set('Authorization', `Bearer ${adminToken}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.valid, true);
    assert.match(res.body.message, /verified successfully/i);
  });

  test('Tampering with an audit entry in DB is detected by verifyAuditChain', async () => {
    const { user } = await createTestUser({ role: 'student', email: 'tamper@test.com' });

    await recordAudit({ userId: user._id, action: 'Initial Entry', status: 'Success' });
    const logToTamper = await recordAudit({ userId: user._id, action: 'Action to Tamper', status: 'Success' });
    await recordAudit({ userId: user._id, action: 'Subsequent Entry', status: 'Success' });

    // Malicious attacker directly alters database entry without re-signing hash
    await AuditLog.updateOne(
      { _id: logToTamper._id },
      { $set: { action: 'Hacked Action Altered in DB' } }
    );

    const verifyResult = await verifyAuditChain();
    assert.equal(verifyResult.valid, false, 'Tampered log must be detected as invalid');
    assert.equal(verifyResult.brokenAt, logToTamper._id.toString());
    assert.match(verifyResult.reason, /tampered content/i);
  });
});
