import { test, describe, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../server.js';
import { setupTestDB, teardownTestDB, clearTestDB, createTestUser } from './setup.js';
import MentorshipRequest from '../models/MentorshipRequest.js';
import Mentor from '../models/Mentor.js';

describe('Capacity Concurrency & Atomic Accept Tests', () => {
  before(async () => {
    await setupTestDB();
  });

  after(async () => {
    await teardownTestDB();
  });

  beforeEach(async () => {
    await clearTestDB();
  });

  test('Mentor accepts request within capacity, incrementing currentMentees', async () => {
    const { token: mentorToken, user: mentor } = await createTestUser({
      name: 'Mentor Capable',
      email: 'capable.mentor@test.com',
      role: 'mentor',
      profile: { capacity: 2, currentMentees: 0 },
    });
    const { user: student } = await createTestUser({ role: 'student', email: 'student1@test.com' });

    const reqDoc = await MentorshipRequest.create({
      studentId: student._id,
      mentorId: mentor._id,
      status: 'pending',
    });

    const res = await request(app)
      .patch(`/api/mentorship-requests/${reqDoc._id}/respond`)
      .set('Authorization', `Bearer ${mentorToken}`)
      .send({ status: 'accepted' });

    assert.equal(res.status, 200);
    assert.equal(res.body.request.status, 'accepted');

    const profile = await Mentor.findOne({ userId: mentor._id });
    assert.equal(profile.currentMentees, 1);
  });

  test('Mentor already at full capacity cannot accept request', async () => {
    const { token: mentorToken, user: mentor } = await createTestUser({
      name: 'Mentor Full',
      email: 'full.mentor@test.com',
      role: 'mentor',
      profile: { capacity: 1, currentMentees: 1 }, // Already full
    });
    const { user: student } = await createTestUser({ role: 'student', email: 'waiting.student@test.com' });

    const reqDoc = await MentorshipRequest.create({
      studentId: student._id,
      mentorId: mentor._id,
      status: 'pending',
    });

    const res = await request(app)
      .patch(`/api/mentorship-requests/${reqDoc._id}/respond`)
      .set('Authorization', `Bearer ${mentorToken}`)
      .send({ status: 'accepted' });

    assert.equal(res.status, 400);
    assert.match(res.body.message, /capacity is full/i);

    const profile = await Mentor.findOne({ userId: mentor._id });
    assert.equal(profile.currentMentees, 1, 'Current mentees must remain 1');
  });

  test('PARALLEL CONCURRENT ACCEPTS RACE: exactly one succeeds and capacity is never exceeded', async () => {
    // Capacity is strictly 1
    const { token: mentorToken, user: mentor } = await createTestUser({
      name: 'Single Slot Mentor',
      email: 'singleslot@test.com',
      role: 'mentor',
      profile: { capacity: 1, currentMentees: 0 },
    });

    // Create 6 different students and 6 pending requests
    const pendingRequestIds = [];
    for (let i = 1; i <= 6; i++) {
      const { user: s } = await createTestUser({
        name: `Student ${i}`,
        email: `student_${i}@test.com`,
        role: 'student',
      });
      const r = await MentorshipRequest.create({
        studentId: s._id,
        mentorId: mentor._id,
        status: 'pending',
      });
      pendingRequestIds.push(r._id.toString());
    }

    // Fire all 6 accepts concurrently in parallel
    const parallelResponses = await Promise.all(
      pendingRequestIds.map((id) =>
        request(app)
          .patch(`/api/mentorship-requests/${id}/respond`)
          .set('Authorization', `Bearer ${mentorToken}`)
          .send({ status: 'accepted' })
      )
    );

    const successfulAccepts = parallelResponses.filter((r) => r.status === 200);
    const rejectedForCapacity = parallelResponses.filter((r) => r.status === 400);

    assert.equal(
      successfulAccepts.length,
      1,
      `Expected exactly 1 request to succeed under concurrency, got ${successfulAccepts.length}`
    );
    assert.equal(
      rejectedForCapacity.length,
      5,
      `Expected exactly 5 requests to be rejected due to capacity guard, got ${rejectedForCapacity.length}`
    );

    // Verify DB state
    const mentorProfile = await Mentor.findOne({ userId: mentor._id });
    assert.equal(mentorProfile.currentMentees, 1, 'Mentor currentMentees must strictly equal 1');

    const acceptedDocs = await MentorshipRequest.countDocuments({
      mentorId: mentor._id,
      status: 'accepted',
    });
    assert.equal(acceptedDocs, 1, 'Database must have exactly 1 accepted mentorship request');
  });

  test('Declining a request does not increment mentor capacity', async () => {
    const { token: mentorToken, user: mentor } = await createTestUser({
      role: 'mentor',
      email: 'decline.mentor@test.com',
      profile: { capacity: 3, currentMentees: 0 },
    });
    const { user: student } = await createTestUser({ role: 'student', email: 'decline.student@test.com' });

    const reqDoc = await MentorshipRequest.create({
      studentId: student._id,
      mentorId: mentor._id,
      status: 'pending',
    });

    const res = await request(app)
      .patch(`/api/mentorship-requests/${reqDoc._id}/respond`)
      .set('Authorization', `Bearer ${mentorToken}`)
      .send({ status: 'rejected' });

    assert.equal(res.status, 200);
    assert.equal(res.body.request.status, 'rejected');

    const profile = await Mentor.findOne({ userId: mentor._id });
    assert.equal(profile.currentMentees, 0);
  });

  test('Cannot answer an already answered request', async () => {
    const { token: mentorToken, user: mentor } = await createTestUser({
      role: 'mentor',
      email: 'repeat.mentor@test.com',
      profile: { capacity: 3, currentMentees: 0 },
    });
    const { user: student } = await createTestUser({ role: 'student', email: 'repeat.student@test.com' });

    const reqDoc = await MentorshipRequest.create({
      studentId: student._id,
      mentorId: mentor._id,
      status: 'accepted', // already answered
    });

    const res = await request(app)
      .patch(`/api/mentorship-requests/${reqDoc._id}/respond`)
      .set('Authorization', `Bearer ${mentorToken}`)
      .send({ status: 'rejected' });

    assert.equal(res.status, 400);
    assert.match(res.body.message, /already been answered/i);
  });
});
