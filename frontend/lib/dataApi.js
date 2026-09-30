import { apiPatch, apiPost, hydrateLocalCache, normalizeFeedback, normalizeGoal, normalizeMeeting, normalizeNotification } from './api';

export async function createMeeting(payload) {
  try {
    const result = await apiPost('/meetings', payload);
    await hydrateLocalCache({ includeAudit: false });
    return { ok: true, meeting: normalizeMeeting(result.meeting) };
  } catch (error) { return { ok: false, error: error.message }; }
}

export async function updateMeeting(id, patch) {
  try {
    const result = await apiPatch(`/meetings/${id}`, patch);
    await hydrateLocalCache({ includeAudit: false });
    return { ok: true, meeting: normalizeMeeting(result.meeting) };
  } catch (error) { return { ok: false, error: error.message }; }
}

export async function createGoal(payload) {
  try {
    const result = await apiPost('/goals', payload);
    await hydrateLocalCache({ includeAudit: false });
    return { ok: true, goal: normalizeGoal(result.goal) };
  } catch (error) { return { ok: false, error: error.message }; }
}

export async function updateGoal(id, patch) {
  try {
    const result = await apiPatch(`/goals/${id}`, patch);
    await hydrateLocalCache({ includeAudit: false });
    return { ok: true, goal: normalizeGoal(result.goal) };
  } catch (error) { return { ok: false, error: error.message }; }
}

export async function createFeedback(payload) {
  try {
    const result = await apiPost('/feedback', payload);
    await hydrateLocalCache({ includeAudit: false });
    return { ok: true, feedback: normalizeFeedback(result.feedback) };
  } catch (error) { return { ok: false, error: error.message }; }
}

export async function markNotificationRead(id) {
  try {
    const result = await apiPatch(`/notifications/${id}/read`, {});
    await hydrateLocalCache({ includeAudit: false });
    return { ok: true, notification: normalizeNotification(result.notification) };
  } catch (error) { return { ok: false, error: error.message }; }
}

export async function markAllNotificationsRead() {
  try {
    await apiPatch('/notifications/read-all', {});
    await hydrateLocalCache({ includeAudit: false });
    return { ok: true };
  } catch (error) { return { ok: false, error: error.message }; }
}

export async function updatePlatformSettings(settings) {
  try {
    const result = await apiPatch('/platform-settings', settings);
    localStorage.setItem('mc_platform_settings', JSON.stringify(result.settings));
    return { ok: true, settings: result.settings };
  } catch (error) { return { ok: false, error: error.message }; }
}

export async function sendAdminNotification(userIds, title, message, type = 'admin') {
  try {
    await apiPost('/notifications/broadcast', { userIds, title, message, type });
    await hydrateLocalCache({ includeAudit: false });
    return { ok: true };
  } catch (error) { return { ok: false, error: error.message }; }
}
