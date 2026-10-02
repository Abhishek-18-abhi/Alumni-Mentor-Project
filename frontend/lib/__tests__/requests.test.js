import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createMentorshipRequest, respondToRequest } from '../requests';
import { getRequests } from '../storage';

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

describe('createMentorshipRequest', () => {
  it('creates a mentorship request and returns normalized request', async () => {
    global.fetch = vi.fn().mockImplementation((url) => {
      if (url.includes('/mentorship-requests')) {
        return mockResponse({
          request: {
            _id: 'req1',
            studentId: 'student1',
            mentorId: 'mentor1',
            message: 'Looking for guidance in React',
            status: 'pending',
          },
        });
      }
      return mockResponse({});
    });

    const student = { id: 'student1', name: 'Student One', role: 'student' };
    const mentor = { id: 'mentor1', name: 'Mentor One', role: 'mentor' };
    const r = await createMentorshipRequest(student, mentor, 'Looking for guidance in React');

    expect(r.ok).toBe(true);
    expect(r.request.id).toBe('req1');
    expect(r.request.studentId).toBe('student1');
    expect(r.request.mentorId).toBe('mentor1');
    expect(r.request.status).toBe('pending');
  });

  it('handles backend error when creating mentorship request', async () => {
    global.fetch = vi
      .fn()
      .mockResolvedValue(
        mockResponse({ message: 'A pending request already exists for this mentor.' }, 400)
      );

    const r = await createMentorshipRequest({ id: 's1' }, { id: 'm1' }, 'Hi');
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/already exists/i);
  });
});

describe('respondToRequest', () => {
  it('rejects an invalid response status without making a network request', async () => {
    const fetchSpy = vi.fn();
    global.fetch = fetchSpy;

    const r = await respondToRequest('mentor1', 'req1', 'invalid_status');
    expect(r.ok).toBe(false);
    expect(r.error).toBe('Invalid response.');
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('accepts a request and updates status', async () => {
    global.fetch = vi.fn().mockImplementation((url, opts) => {
      if (opts?.method === 'PATCH' && url.includes('/mentorship-requests/req1/respond')) {
        return mockResponse({
          request: {
            _id: 'req1',
            studentId: 'student1',
            mentorId: 'mentor1',
            status: 'accepted',
          },
        });
      }
      // refetch mocks
      if (url.includes('/mentorship-requests')) {
        return mockResponse({
          requests: [
            { _id: 'req1', studentId: 'student1', mentorId: 'mentor1', status: 'accepted' },
          ],
        });
      }
      return mockResponse({});
    });

    const r = await respondToRequest('mentor1', 'req1', 'accepted');
    expect(r.ok).toBe(true);
    expect(r.request.status).toBe('accepted');
    expect(getRequests().find((x) => x.id === 'req1')?.status).toBe('accepted');
  });

  it('declines a request properly', async () => {
    global.fetch = vi.fn().mockImplementation((url, opts) => {
      if (opts?.method === 'PATCH' && url.includes('/mentorship-requests/req1/respond')) {
        return mockResponse({
          request: {
            _id: 'req1',
            studentId: 'student1',
            mentorId: 'mentor1',
            status: 'rejected',
          },
        });
      }
      return mockResponse({});
    });

    const r = await respondToRequest('mentor1', 'req1', 'rejected');
    expect(r.ok).toBe(true);
    expect(r.request.status).toBe('rejected');
  });

  it('propagates capacity error when mentor is full', async () => {
    global.fetch = vi
      .fn()
      .mockResolvedValue(mockResponse({ message: 'Mentor is already at full capacity.' }, 400));

    const r = await respondToRequest('mentor1', 'req1', 'accepted');
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/full capacity/i);
  });

  it('rejects responding to a request that does not belong to the mentor', async () => {
    global.fetch = vi
      .fn()
      .mockResolvedValue(
        mockResponse({ message: 'Not authorized to respond to this request.' }, 403)
      );

    const r = await respondToRequest('someone-else', 'req1', 'accepted');
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/not authorized/i);
  });

  it('rejects responding to an already-answered request', async () => {
    global.fetch = vi
      .fn()
      .mockResolvedValue(mockResponse({ message: 'Mentorship request is already accepted.' }, 400));

    const r = await respondToRequest('mentor1', 'req1', 'accepted');
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/already accepted/i);
  });
});
