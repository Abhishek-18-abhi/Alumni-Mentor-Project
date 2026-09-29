import { describe, it, expect, beforeEach } from 'vitest';
import { respondToRequest } from '../requests';
import { saveUsers, getUsers, saveRequests, getRequests } from '../storage';

const mentor = {
  id: 'mentor1',
  name: 'Mentor One',
  role: 'mentor',
  capacity: 1,
  currentMentees: 0,
};
const student = { id: 'student1', name: 'Student One', role: 'student' };
const pendingRequest = {
  id: 'req1',
  studentId: 'student1',
  mentorId: 'mentor1',
  message: 'Hi',
  status: 'pending',
  createdAt: new Date().toISOString(),
};

beforeEach(() => {
  localStorage.clear();
  saveUsers([mentor, student]);
  saveRequests([pendingRequest]);
});

describe('respondToRequest', () => {
  it('accepts a request and increments currentMentees exactly once', () => {
    const r = respondToRequest('mentor1', 'req1', 'accepted');
    expect(r.ok).toBe(true);
    expect(getUsers().find((u) => u.id === 'mentor1').currentMentees).toBe(1);
    expect(getRequests().find((x) => x.id === 'req1').status).toBe('accepted');
  });

  it('declines a request without changing capacity', () => {
    const r = respondToRequest('mentor1', 'req1', 'rejected');
    expect(r.ok).toBe(true);
    expect(getUsers().find((u) => u.id === 'mentor1').currentMentees).toBe(0);
    expect(getRequests().find((x) => x.id === 'req1').status).toBe('rejected');
  });

  it('refuses to accept when the mentor is already at capacity', () => {
    saveUsers([{ ...mentor, currentMentees: 1 }, student]);
    const r = respondToRequest('mentor1', 'req1', 'accepted');
    expect(r.ok).toBe(false);
    expect(getUsers().find((u) => u.id === 'mentor1').currentMentees).toBe(1); // unchanged
    expect(getRequests().find((x) => x.id === 'req1').status).toBe('pending'); // unchanged
  });

  it('rejects responding to a request that does not belong to the mentor', () => {
    const r = respondToRequest('someone-else', 'req1', 'accepted');
    expect(r.ok).toBe(false);
  });

  it('rejects responding to an already-answered request', () => {
    respondToRequest('mentor1', 'req1', 'accepted');
    const r = respondToRequest('mentor1', 'req1', 'accepted');
    expect(r.ok).toBe(false);
    // capacity must not double-increment
    expect(getUsers().find((u) => u.id === 'mentor1').currentMentees).toBe(1);
  });
});
