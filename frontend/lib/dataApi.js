import {
  apiPatch,
  apiPost,
  normalizeFeedback,
  normalizeGoal,
  normalizeMeeting,
  normalizeNotification,
  refetchMeetings,
  refetchGoals,
  refetchFeedback,
  refetchNotifications,
} from './api';
import { getNotifications, saveNotifications } from './storage';

export async function createMeeting(payload) {
  try {
    const result = await apiPost('/meetings', payload);
    await Promise.allSettled([refetchMeetings(), refetchNotifications()]);
    return { ok: true, meeting: normalizeMeeting(result.meeting) };
  } catch (error) {
    return { ok: false, error: error.message };
  }
}

export async function updateMeeting(id, patch) {
  try {
    const result = await apiPatch(`/meetings/${id}`, patch);
    await refetchMeetings();
    return { ok: true, meeting: normalizeMeeting(result.meeting) };
  } catch (error) {
    return { ok: false, error: error.message };
  }
}

export async function createGoal(payload) {
  try {
    const result = await apiPost('/goals', payload);
    await Promise.allSettled([refetchGoals(), refetchNotifications()]);
    return { ok: true, goal: normalizeGoal(result.goal) };
  } catch (error) {
    return { ok: false, error: error.message };
  }
}

export async function updateGoal(id, patch) {
  try {
    const result = await apiPatch(`/goals/${id}`, patch);
    await refetchGoals();
    return { ok: true, goal: normalizeGoal(result.goal) };
  } catch (error) {
    return { ok: false, error: error.message };
  }
}

export async function createFeedback(payload) {
  try {
    const result = await apiPost('/feedback', payload);
    await Promise.allSettled([refetchFeedback(), refetchNotifications()]);
    return { ok: true, feedback: normalizeFeedback(result.feedback) };
  } catch (error) {
    return { ok: false, error: error.message };
  }
}

export async function markNotificationRead(id) {
  try {
    const result = await apiPatch(`/notifications/${id}/read`, {});
    const updated = normalizeNotification(result.notification);
    const current = getNotifications();
    const next = current.map((n) => (n.id === id ? { ...n, read: true } : n));
    saveNotifications(next);
    return { ok: true, notification: updated };
  } catch (error) {
    return { ok: false, error: error.message };
  }
}

export async function markAllNotificationsRead() {
  try {
    await apiPatch('/notifications/read-all', {});
    const current = getNotifications();
    const next = current.map((n) => ({ ...n, read: true }));
    saveNotifications(next);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error.message };
  }
}

export async function updatePlatformSettings(settings) {
  try {
    const result = await apiPatch('/platform-settings', settings);
    localStorage.setItem('mc_platform_settings', JSON.stringify(result.settings));
    return { ok: true, settings: result.settings };
  } catch (error) {
    return { ok: false, error: error.message };
  }
}

export async function sendAdminNotification(userIds, title, message, type = 'admin') {
  try {
    await apiPost('/notifications/broadcast', { userIds, title, message, type });
    await refetchNotifications();
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error.message };
  }
}
