import { apiPatch, apiPost, hydrateLocalCache, normalizeRequest } from './api';
import { getRequests } from './storage';

export async function createMentorshipRequest(student, mentor, message, matchSnapshot) {
  try {
    const result = await apiPost('/mentorship-requests', { mentorId: mentor.id, message, matchSnapshot });
    const request = normalizeRequest(result.request);
    await hydrateLocalCache({ includeAudit: false });
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
    await hydrateLocalCache({ includeAudit: false });
    return { ok: true, request };
  } catch (error) {
    return { ok: false, error: error.message };
  }
}
