import { describe, it, expect, beforeEach, vi } from 'vitest';
import { scoreMatch } from '../lib/matching';
import { apiPatch, apiPost, explainMatchWithAi } from '../lib/api';

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

describe('Capacity Checks & Enforcement', () => {
  const student = {
    id: 's1',
    name: 'Aarav Sharma',
    skills: ['React', 'JavaScript'],
    interests: ['Web Development'],
    goals: ['Career guidance'],
    languages: ['English'],
    availability: ['Saturday 10:00-12:00'],
  };

  it('awards 0 capacity score and 0 contribution when mentor is at full capacity', () => {
    const fullMentor = {
      id: 'm_full',
      name: 'Priya Patel',
      skills: ['React', 'Node.js'],
      interests: ['Web Development'],
      goals: ['Career guidance'],
      languages: ['English'],
      availability: ['Saturday 10:00-12:00'],
      capacity: 3,
      currentMentees: 3, // Full!
    };

    const match = scoreMatch(student, fullMentor);
    const capacityFactor = match.factors.find((f) => f.name === 'capacity');

    expect(capacityFactor.rawScore).toBe(0);
    expect(capacityFactor.contribution).toBe(0);
    expect(capacityFactor.explanation).toMatch(/at capacity/i);
  });

  it('awards 100 capacity score when mentor has open mentee slots', () => {
    const openMentor = {
      id: 'm_open',
      name: 'Rohan Verma',
      skills: ['React', 'Node.js'],
      interests: ['Web Development'],
      goals: ['Career guidance'],
      languages: ['English'],
      availability: ['Saturday 10:00-12:00'],
      capacity: 4,
      currentMentees: 1, // 3 open slots
    };

    const match = scoreMatch(student, openMentor);
    const capacityFactor = match.factors.find((f) => f.name === 'capacity');

    expect(capacityFactor.rawScore).toBe(100);
    expect(capacityFactor.contribution).toBe(5); // 5% weight * 100
    expect(capacityFactor.explanation).toMatch(/has capacity/i);
  });

  it('rejects mentorship request when server detects mentor is at capacity (HTTP 409)', async () => {
    global.fetch = vi
      .fn()
      .mockResolvedValue(
        mockResponse({ message: 'Mentor has reached maximum active mentee capacity (3/3).' }, 409)
      );

    let errorThrown = null;
    try {
      await apiPost('/mentorship-requests', {
        mentorId: 'm_full',
        message: 'I want guidance.',
      });
    } catch (err) {
      errorThrown = err;
    }

    expect(errorThrown).not.toBeNull();
    expect(errorThrown.message).toMatch(/maximum active mentee capacity/i);
  });
});

describe('Meeting Booking Validation', () => {
  it('rejects booking when date is in the past (HTTP 400)', async () => {
    global.fetch = vi
      .fn()
      .mockResolvedValue(
        mockResponse({ message: 'Meeting cannot be scheduled in the past.' }, 400)
      );

    let errorThrown = null;
    try {
      await apiPost('/meetings', {
        mentorId: 'm1',
        studentId: 's1',
        date: '2020-01-01',
        time: '10:00-11:00',
      });
    } catch (err) {
      errorThrown = err;
    }

    expect(errorThrown).not.toBeNull();
    expect(errorThrown.message).toMatch(/cannot be scheduled in the past/i);
  });

  it('rejects booking when slot does not match mentor availability (HTTP 400)', async () => {
    global.fetch = vi.fn().mockResolvedValue(
      mockResponse(
        {
          message: "The selected date and time does not match any of the mentor's available slots.",
          availability: ['Saturday 10:00-12:00'],
        },
        400
      )
    );

    let errorThrown = null;
    try {
      await apiPost('/meetings', {
        mentorId: 'm1',
        studentId: 's1',
        date: '2026-10-15',
        time: '03:00-04:00', // Slot outside availability
      });
    } catch (err) {
      errorThrown = err;
    }

    expect(errorThrown).not.toBeNull();
    expect(errorThrown.message).toMatch(/does not match any of the mentor's available slots/i);
  });

  it('rejects booking when either party has a double-booking conflict (HTTP 409)', async () => {
    global.fetch = vi
      .fn()
      .mockResolvedValue(
        mockResponse(
          { message: 'The mentor already has a scheduled meeting at this date and time.' },
          409
        )
      );

    let errorThrown = null;
    try {
      await apiPost('/meetings', {
        mentorId: 'm1',
        studentId: 's1',
        date: '2026-10-17',
        time: '10:00-11:00',
      });
    } catch (err) {
      errorThrown = err;
    }

    expect(errorThrown).not.toBeNull();
    expect(errorThrown.message).toMatch(/already has a scheduled meeting/i);
  });
});

describe('Request Withdrawal Flow', () => {
  it('successfully withdraws a pending request via PATCH /mentorship-requests/:id/withdraw', async () => {
    global.fetch = vi.fn().mockResolvedValue(
      mockResponse({
        message: 'Request withdrawn successfully.',
        request: {
          _id: 'req_123',
          studentId: 's1',
          mentorId: 'm1',
          status: 'withdrawn',
        },
      })
    );

    const result = await apiPatch('/mentorship-requests/req_123/withdraw');
    expect(result.message).toBe('Request withdrawn successfully.');
    expect(result.request.status).toBe('withdrawn');
  });

  it('rejects withdrawal if request is already accepted (HTTP 400)', async () => {
    global.fetch = vi
      .fn()
      .mockResolvedValue(
        mockResponse(
          { message: 'Cannot withdraw a request that is already accepted or finalized.' },
          400
        )
      );

    let errorThrown = null;
    try {
      await apiPatch('/mentorship-requests/req_accepted/withdraw');
    } catch (err) {
      errorThrown = err;
    }

    expect(errorThrown).not.toBeNull();
    expect(errorThrown.message).toMatch(/Cannot withdraw/i);
  });
});

describe('AI Explainability & Fallback', () => {
  it('returns AI match explanation when backend service responds successfully', async () => {
    global.fetch = vi.fn().mockResolvedValue(
      mockResponse({
        explanation: 'Strong match driven by overlapping React skills and aligned career goals.',
        fallbackUsed: false,
        latencyMs: 145,
      })
    );

    const res = await explainMatchWithAi({
      studentId: 's1',
      mentorId: 'm1',
      score: 85,
    });

    expect(res.explanation).toContain('Strong match');
    expect(res.fallbackUsed).toBe(false);
  });

  it('gracefully provides deterministic template fallback when AI service indicates fallback was used', async () => {
    global.fetch = vi.fn().mockResolvedValue(
      mockResponse({
        explanation:
          'Matched with 85% overall alignment based on 2 shared skills and schedule overlap.',
        fallbackUsed: true,
        latencyMs: 12,
      })
    );

    const res = await explainMatchWithAi({
      studentId: 's1',
      mentorId: 'm1',
      score: 85,
    });

    expect(res.fallbackUsed).toBe(true);
    expect(res.explanation).toMatch(/Matched with 85% overall alignment/i);
  });

  it('propagates graceful error handling when API call fails entirely', async () => {
    global.fetch = vi
      .fn()
      .mockResolvedValue(mockResponse({ message: 'AI service temporarily unavailable.' }, 503));

    let errorThrown = null;
    try {
      await explainMatchWithAi({
        studentId: 's1',
        mentorId: 'm1',
      });
    } catch (err) {
      errorThrown = err;
    }

    expect(errorThrown).not.toBeNull();
    expect(errorThrown.message).toMatch(/AI service temporarily unavailable/i);
  });
});
