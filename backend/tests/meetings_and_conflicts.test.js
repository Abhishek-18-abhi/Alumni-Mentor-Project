import { test, describe, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../server.js';
import { setupTestDB, teardownTestDB, clearTestDB, createTestUser } from './setup.js';
import MentorshipRequest from '../models/MentorshipRequest.js';
import Meeting from '../models/Meeting.js';

describe('Meeting Scheduling, Availability & Conflict Prevention Tests', () => {
  before(async () => {
    await setupTestDB();
  });

  after(async () => {
    await teardownTestDB();
  });

  beforeEach(async () => {
    await clearTestDB();
  });

  test('Booking requires an accepted mentorship relationship', async () => {
    const { token: studentToken, user: student } = await createTestUser({ role: 'student', email: 's.meeting@test.com' });
    const { user: mentor } = await createTestUser({
      role: 'mentor',
      email: 'm.meeting@test.com',
      profile: { availability: ['Monday 17:00-20:00'] },
    });

    // No accepted request exists yet
    const res = await request(app)
      .post('/api/meetings')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        studentId: student._id.toString(),
        mentorId: mentor._id.toString(),
        date: '2026-10-12', // Monday
        time: '18:00',
      });

    assert.equal(res.status, 403);
    assert.match(res.body.message, /accepted mentorship relationship/i);
  });

  test('Meeting booking rejects date/time that does not match mentor availability', async () => {
    const { token: studentToken, user: student } = await createTestUser({ role: 'student', email: 's.avail@test.com' });
    const { user: mentor } = await createTestUser({
      role: 'mentor',
      email: 'm.avail@test.com',
      profile: { availability: ['Monday 17:00-20:00'] },
    });

    await MentorshipRequest.create({
      studentId: student._id,
      mentorId: mentor._id,
      status: 'accepted',
    });

    // Attempting to book on Sunday (2026-10-11) or outside 17:00-20:00
    const res = await request(app)
      .post('/api/meetings')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        studentId: student._id.toString(),
        mentorId: mentor._id.toString(),
        date: '2026-10-12', // Monday
        time: '09:00', // Outside 17:00-20:00
      });

    assert.equal(res.status, 400);
    assert.match(res.body.message, /does not match any of the mentor's available slots/i);
  });

  test('Meeting booking succeeds when slot is in mentor availability', async () => {
    const { token: studentToken, user: student } = await createTestUser({ role: 'student', email: 's.ok@test.com' });
    const { user: mentor } = await createTestUser({
      role: 'mentor',
      email: 'm.ok@test.com',
      profile: { availability: ['Monday 17:00-20:00'] },
    });

    await MentorshipRequest.create({
      studentId: student._id,
      mentorId: mentor._id,
      status: 'accepted',
    });

    // 2026-10-12 is Monday, 18:00 is within 17:00-20:00
    const res = await request(app)
      .post('/api/meetings')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        studentId: student._id.toString(),
        mentorId: mentor._id.toString(),
        date: '2026-10-12',
        time: '18:00',
        mode: 'Online',
      });

    assert.equal(res.status, 201);
    assert.equal(res.body.meeting.status, 'scheduled');
    assert.equal(res.body.meeting.date, '2026-10-12');
    assert.equal(res.body.meeting.time, '18:00');
  });

  test('Meeting booking blocks mentor scheduling conflict', async () => {
    const { token: studentToken, user: student1 } = await createTestUser({ role: 'student', email: 's1.conflict@test.com' });
    const { user: student2 } = await createTestUser({ role: 'student', email: 's2.conflict@test.com' });
    const { user: mentor } = await createTestUser({
      role: 'mentor',
      email: 'm.conflict@test.com',
      profile: { availability: ['Monday 17:00-20:00'] },
    });

    await MentorshipRequest.create({ studentId: student1._id, mentorId: mentor._id, status: 'accepted' });
    await MentorshipRequest.create({ studentId: student2._id, mentorId: mentor._id, status: 'accepted' });

    // Existing scheduled meeting for mentor with student2
    await Meeting.create({
      studentId: student2._id,
      mentorId: mentor._id,
      date: '2026-10-12',
      time: '18:00',
      status: 'scheduled',
    });

    // Student 1 tries to book same mentor at the same date & time
    const res = await request(app)
      .post('/api/meetings')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        studentId: student1._id.toString(),
        mentorId: mentor._id.toString(),
        date: '2026-10-12',
        time: '18:00',
      });

    assert.equal(res.status, 409);
    assert.match(res.body.message, /mentor already has a scheduled meeting/i);
  });

  test('Meeting booking blocks student scheduling conflict (bidirectional check)', async () => {
    const { token: studentToken, user: student } = await createTestUser({ role: 'student', email: 'busy.student@test.com' });
    const { user: mentorA } = await createTestUser({
      role: 'mentor',
      email: 'mentorA@test.com',
      profile: { availability: ['Monday 17:00-20:00'] },
    });
    const { user: mentorB } = await createTestUser({
      role: 'mentor',
      email: 'mentorB@test.com',
      profile: { availability: ['Monday 17:00-20:00'] },
    });

    await MentorshipRequest.create({ studentId: student._id, mentorId: mentorA._id, status: 'accepted' });
    await MentorshipRequest.create({ studentId: student._id, mentorId: mentorB._id, status: 'accepted' });

    // Student is already booked with Mentor A at 2026-10-12 18:00
    await Meeting.create({
      studentId: student._id,
      mentorId: mentorA._id,
      date: '2026-10-12',
      time: '18:00',
      status: 'scheduled',
    });

    // Student attempts to book Mentor B at the exact same date & time
    const res = await request(app)
      .post('/api/meetings')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        studentId: student._id.toString(),
        mentorId: mentorB._id.toString(),
        date: '2026-10-12',
        time: '18:00',
      });

    assert.equal(res.status, 409);
    assert.match(res.body.message, /student already has another scheduled meeting/i);
  });

  test('Cancelled meetings do not block booking at that slot', async () => {
    const { token: studentToken, user: student } = await createTestUser({ role: 'student', email: 'cancelled.slot@test.com' });
    const { user: mentor } = await createTestUser({
      role: 'mentor',
      email: 'cancelled.mentor@test.com',
      profile: { availability: ['Monday 17:00-20:00'] },
    });

    await MentorshipRequest.create({ studentId: student._id, mentorId: mentor._id, status: 'accepted' });

    // Old cancelled meeting
    await Meeting.create({
      studentId: student._id,
      mentorId: mentor._id,
      date: '2026-10-12',
      time: '18:00',
      status: 'cancelled',
    });

    const res = await request(app)
      .post('/api/meetings')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        studentId: student._id.toString(),
        mentorId: mentor._id.toString(),
        date: '2026-10-12',
        time: '18:00',
      });

    assert.equal(res.status, 201);
    assert.equal(res.body.meeting.status, 'scheduled');
  });

  test('Participant can update meeting status to completed with notes', async () => {
    const { token: mentorToken, user: mentor } = await createTestUser({ role: 'mentor', email: 'update.m@test.com' });
    const { user: student } = await createTestUser({ role: 'student', email: 'update.s@test.com' });

    const meeting = await Meeting.create({
      studentId: student._id,
      mentorId: mentor._id,
      date: '2026-10-12',
      time: '18:00',
      status: 'scheduled',
    });

    const res = await request(app)
      .patch(`/api/meetings/${meeting._id}`)
      .set('Authorization', `Bearer ${mentorToken}`)
      .send({
        status: 'completed',
        log: 'Discussed Capstone architecture and deployment strategies.',
      });

    assert.equal(res.status, 200);
    assert.equal(res.body.meeting.status, 'completed');
    assert.equal(res.body.meeting.log, 'Discussed Capstone architecture and deployment strategies.');
  });
});
