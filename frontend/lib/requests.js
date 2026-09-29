import {
  getRequests,
  saveRequests,
  getUsers,
  saveUsers,
  addNotification,
  addAudit,
} from './storage';

/**
 * Accept or decline a mentorship request on behalf of a mentor.
 * Accepting is refused when the mentor is already at capacity, and mentee counts change
 * only on a successful accept. The request's matchSnapshot is left untouched.
 * @param {string} mentorId
 * @param {string} requestId
 * @param {'accepted'|'rejected'} status
 * @returns {{ok: boolean, error?: string, request?: import('./types').MentorshipRequest}}
 */
export function respondToRequest(mentorId, requestId, status) {
  if (status !== 'accepted' && status !== 'rejected') {
    return { ok: false, error: 'Invalid response.' };
  }
  const requests = getRequests();
  const request = requests.find((r) => r.id === requestId);
  if (!request || request.mentorId !== mentorId) {
    return { ok: false, error: 'Request not found.' };
  }
  if (request.status !== 'pending') {
    return { ok: false, error: 'This request has already been answered.' };
  }

  const users = getUsers();
  const mentor = users.find((u) => u.id === mentorId);
  if (!mentor) return { ok: false, error: 'Mentor not found.' };

  if (status === 'accepted') {
    if ((mentor.currentMentees || 0) >= (mentor.capacity || 0)) {
      return {
        ok: false,
        error: 'Your capacity is full. Increase capacity from Profile before accepting.',
      };
    }
    saveUsers(
      users.map((u) =>
        u.id === mentorId ? { ...u, currentMentees: (u.currentMentees || 0) + 1 } : u
      )
    );
    addNotification(
      request.studentId,
      'Mentorship request accepted',
      `${mentor.name} accepted your mentorship request.`,
      'request'
    );
  } else {
    addNotification(
      request.studentId,
      'Mentorship request declined',
      `${mentor.name} declined your mentorship request.`,
      'request'
    );
  }

  const updated = { ...request, status, respondedAt: new Date().toISOString() };
  saveRequests(requests.map((r) => (r.id === requestId ? updated : r)));
  addAudit(
    mentorId,
    `${status === 'accepted' ? 'Accepted' : 'Declined'} mentorship request`,
    requestId
  );
  return { ok: true, request: updated };
}
