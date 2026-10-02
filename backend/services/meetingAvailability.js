/**
 * Helper to verify meeting date and time against mentor's published availability slots.
 */

const DAY_NAMES = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
const SHORT_DAYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

export function isSlotInAvailability(dateStr, timeStr, availabilitySlots = []) {
  if (!Array.isArray(availabilitySlots) || availabilitySlots.length === 0) {
    return false;
  }

  // Parse day of week from dateStr (e.g., "2026-10-05") using noon to prevent TZ day shift
  const dateObj = new Date(`${dateStr}T12:00:00`);
  if (isNaN(dateObj.getTime())) {
    return false;
  }

  const dayIndex = dateObj.getDay();
  const fullDay = DAY_NAMES[dayIndex];
  const shortDay = SHORT_DAYS[dayIndex];

  // Standardize time string "HH:MM"
  const meetingTime = timeStr.trim().padStart(5, '0');

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
    const timeMatch = lower.match(/(\d{1,2}:\d{2})\s*(?:-\s*(\d{1,2}:\d{2}))?/);
    if (!timeMatch) {
      // If only day is specified without hours, whole day is available
      return true;
    }

    const start = timeMatch[1].padStart(5, '0');
    const end = timeMatch[2] ? timeMatch[2].padStart(5, '0') : null;

    if (end && end > start) {
      return meetingTime >= start && meetingTime <= end;
    }
    return meetingTime === start;
  });
}
