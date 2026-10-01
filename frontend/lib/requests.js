import {
  apiPatch,
  apiPost,
  normalizeRequest,
  refetchRequests,
  refetchNotifications,
  refetchUsers,
} from './api';

export async function createMentorshipRequest(student, mentor, message, matchSnapshot) {
  try {
    const result = await apiPost('/mentorship-requests', { mentorId: mentor.id, message, matchSnapshot });
    const request = normalizeRequest(result.request);
    await Promise.allSettled([refetchRequests(), refetchNotifications()]);
    return { ok: true, request };
  } catch (error) {
    return { ok: false, error: error.message };
  }
}

export async function respondToRequest(_mentorId, requestId, status) {
  if (!['accepted', 'rejected'].includes(status)) return { ok: false, error: 'Invalid response.' };
  try {
    const result = await apiPatch(`/mentorship-requests/${requestId}/respond`, { status });
    const request = normalizeRequest(result.request);
    await Promise.allSettled([refetchRequests(), refetchUsers(), refetchNotifications()]);
    return { ok: true, request };
  } catch (error) {
    return { ok: false, error: error.message };
  }
}
