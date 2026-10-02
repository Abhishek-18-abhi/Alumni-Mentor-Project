/**
 * Helper to verify meeting date and time against mentor's published availability slots.
 */

const DAY_NAMES = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
const SHORT_DAYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

function toMinutes(hhmm) {
  if (!hhmm) return null;
  const parts = hhmm.trim().split(':');
  if (parts.length < 2) return null;
  return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
}

export function isSlotInAvailability(dateStr, timeStr, availabilitySlots = []) {
  if (!Array.isArray(availabilitySlots) || availabilitySlots.length === 0) {
    return true; // No restrictions configured by mentor
  }

  // Parse day of week from dateStr (e.g., "2026-10-09") using noon to prevent timezone shifts
  const dateObj = new Date(`${dateStr}T12:00:00`);
  if (isNaN(dateObj.getTime())) {
    return false;
  }

  const dayIndex = dateObj.getDay();
  const fullDay = DAY_NAMES[dayIndex];
  const shortDay = SHORT_DAYS[dayIndex];

  // Extract requested meeting time: start and optional end
  const reqMatch = String(timeStr).match(/(\d{1,2}:\d{2})\s*(?:-\s*(\d{1,2}:\d{2}))?/);
  if (!reqMatch) return false;

  const reqStart = toMinutes(reqMatch[1]);
  const reqEnd = reqMatch[2] ? toMinutes(reqMatch[2]) : reqStart + 60;

  return availabilitySlots.some((slot) => {
    if (!slot || typeof slot !== 'string') return false;
    const lower = slot.toLowerCase().trim();

    // Check if slot specifies a day of week
    const hasAnyDay = DAY_NAMES.some((d, idx) => lower.includes(d) || lower.includes(SHORT_DAYS[idx]));
    if (hasAnyDay) {
      const matchesDay = lower.includes(fullDay) || lower.includes(shortDay);
      if (!matchesDay) return false;
    }

    // Extract time range (e.g. "17:00-20:00" or "17:00")
    const slotMatch = lower.match(/(\d{1,2}:\d{2})\s*(?:-\s*(\d{1,2}:\d{2}))?/);
    if (!slotMatch) {
      // If only day is specified without hours, whole day is available
      return true;
    }

    const slotStart = toMinutes(slotMatch[1]);
    const slotEnd = slotMatch[2] ? toMinutes(slotMatch[2]) : slotStart;

    if (slotEnd > slotStart) {
      return reqStart >= slotStart && reqStart <= slotEnd && (reqEnd ? reqEnd <= slotEnd + 30 : true);
    }
    return reqStart === slotStart;
  });
}
