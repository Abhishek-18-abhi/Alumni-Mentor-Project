import { test, describe, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../server.js';
import { setupTestDB, teardownTestDB, clearTestDB, createTestUser } from './setup.js';
import MentorshipRequest from '../models/MentorshipRequest.js';

describe('Explainable Matching & Mentorship Requests Tests', () => {
  before(async () => {
    await setupTestDB();
  });

  after(async () => {
    await teardownTestDB();
  });

  beforeEach(async () => {
    await clearTestDB();
  });

  test('GET /api/matches/:studentId returns ranked mentors with full factor explanations', async () => {
    const { token: studentToken, user: student } = await createTestUser({
      name: 'Rohan Student',
      email: 'rohan.student@test.com',
      role: 'student',
      profile: {
        skills: ['React', 'Node.js', 'Python'],
        interests: ['Web Development'],
        goals: ['Career guidance'],
        languages: ['English'],
        availability: ['Monday 17:00-20:00'],
      },
    });

    // Mentor 1: High overlap
    await createTestUser({
      name: 'Priya HighFit',
      email: 'priya.high@test.com',
      role: 'mentor',
      profile: {
        skills: ['React', 'Node.js', 'Python', 'Docker'],
        interests: ['Web Development'],
        goals: ['Career guidance'],
        languages: ['English'],
        availability: ['Monday 17:00-20:00'],
        capacity: 3,
        currentMentees: 0,
      },
    });

    // Mentor 2: Low overlap
    await createTestUser({
      name: 'Vikram LowFit',
      email: 'vikram.low@test.com',
      role: 'mentor',
      profile: {
        skills: ['Embedded C', 'Hardware'],
        interests: ['Robotics'],
        goals: ['Higher studies'],
        languages: ['German'],
        availability: ['Sunday 09:00-12:00'],
        capacity: 2,
        currentMentees: 0,
      },
    });

    const res = await request(app)
      .get(`/api/matches/${student._id}`)
      .set('Authorization', `Bearer ${studentToken}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.matches.length, 2);

    const firstMatch = res.body.matches[0];
    assert.equal(firstMatch.mentor.name, 'Priya HighFit');
    assert.ok(firstMatch.score >= 90, 'High overlap mentor should have score >= 90');

    // Check factors transparency
    assert.ok(Array.isArray(firstMatch.factors));
    const factorNames = firstMatch.factors.map((f) => f.name);
    assert.ok(factorNames.includes('skills'));
    assert.ok(factorNames.includes('interests'));
    assert.ok(factorNames.includes('goals'));
    assert.ok(factorNames.includes('languages'));
    assert.ok(factorNames.includes('availability'));
    assert.ok(factorNames.includes('capacity'));

    // Verify mathematical sum equals score
    const totalContributed = firstMatch.factors.reduce((sum, f) => sum + f.contribution, 0);
    assert.equal(Math.round(totalContributed), firstMatch.score);
  });

  test('Student cannot view matches for another student', async () => {
    const { token: studentToken } = await createTestUser({ role: 'student', email: 's1@test.com' });
    const { user: otherStudent } = await createTestUser({ role: 'student', email: 's2@test.com' });

    const res = await request(app)
      .get(`/api/matches/${otherStudent._id}`)
      .set('Authorization', `Bearer ${studentToken}`);

    assert.equal(res.status, 403);
  });

  test('POST /api/mentorship-requests computes matchSnapshot server-side ignoring client tampering', async () => {
    const { token: studentToken, user: student } = await createTestUser({
      role: 'student',
      email: 'honest.student@test.com',
      profile: {
        skills: ['Python'],
        interests: ['Data Science'],
        goals: ['Project guidance'],
      },
    });

    const { user: mentor } = await createTestUser({
      role: 'mentor',
      email: 'target.mentor@test.com',
      profile: {
        skills: ['Python'],
        interests: ['Data Science'],
        goals: ['Project guidance'],
        capacity: 2,
        currentMentees: 0,
      },
    });

    // Client maliciously attempts to send a forged 100% snapshot with fake skills
    const res = await request(app)
      .post('/api/mentorship-requests')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        mentorId: mentor._id.toString(),
        message: 'I would love your mentorship.',
        matchSnapshot: {
          score: 100, // Fake score
          factors: [{ name: 'fake', rawScore: 100, contribution: 100 }],
        },
      });

    assert.equal(res.status, 201);
    const createdReq = await MentorshipRequest.findById(res.body.request._id);
    assert.ok(createdReq.matchSnapshot);
    assert.equal(createdReq.matchSnapshot.algorithmVersion, 'v1-weighted-overlap');

    // Server should have computed real factors, not client's fake factor
    const factorNames = createdReq.matchSnapshot.factors.map((f) => f.name);
    assert.ok(factorNames.includes('skills'));
    assert.ok(!factorNames.includes('fake'), 'Client injected factors must be ignored');
  });

  test('Student cannot submit duplicate mentorship request to same mentor', async () => {
    const { token: studentToken, user: student } = await createTestUser({ role: 'student', email: 'student.dup@test.com' });
    const { user: mentor } = await createTestUser({ role: 'mentor', email: 'mentor.dup@test.com' });

    const first = await request(app)
      .post('/api/mentorship-requests')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ mentorId: mentor._id.toString(), message: 'Hello' });
    assert.equal(first.status, 201);

    const second = await request(app)
      .post('/api/mentorship-requests')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ mentorId: mentor._id.toString(), message: 'Hello again' });
    assert.equal(second.status, 409);
    assert.match(second.body.message, /already have a pending request/i);
  });

  test('Mentor cannot send mentorship request as a student', async () => {
    const { token: mentorToken } = await createTestUser({ role: 'mentor', email: 'mentor.req@test.com' });
    const { user: targetMentor } = await createTestUser({ role: 'mentor', email: 'other.mentor@test.com' });

    const res = await request(app)
      .post('/api/mentorship-requests')
      .set('Authorization', `Bearer ${mentorToken}`)
      .send({ mentorId: targetMentor._id.toString() });

    assert.equal(res.status, 403);
    assert.match(res.body.message, /only students can send mentorship requests/i);
  });
});
