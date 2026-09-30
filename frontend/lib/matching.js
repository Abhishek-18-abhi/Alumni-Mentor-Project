import { normalizeList } from './storage';

export const ALGORITHM_VERSION = 'v1-weighted-overlap';

/** Factor weights. They sum to 1, so contributions add up to a 0-100 score. */
export const WEIGHTS = {
  skills: 0.45,
  interests: 0.2,
  goals: 0.15,
  languages: 0.1,
  availability: 0.05,
  capacity: 0.05,
};

const round2 = (n) => Math.round(n * 100) / 100;

/** Share of the student's items that the mentor also has, as 0-100. */
function overlapFactor(name, label, studentItems, mentorItems) {
  const studentSet = new Set(studentItems);
  const matchedItems = [...new Set(mentorItems)].filter((x) => studentSet.has(x));
  const rawScore = Math.min(100, (matchedItems.length / Math.max(studentSet.size, 1)) * 100);
  const weight = WEIGHTS[name];
  return {
    name,
    rawScore: round2(rawScore),
    weight,
    contribution: round2(rawScore * weight),
    matchedItems,
    explanation: matchedItems.length
      ? `Shared ${label}: ${matchedItems.join(', ')} (${matchedItems.length} of ${studentSet.size} of the student's).`
      : `No shared ${label}.`,
  };
}

/**
 * Pure explainable match between one student and one mentor. Reads no storage.
 * @param {import('./types').User} student
 * @param {import('./types').User} mentor
 * @returns {import('./types').MatchResult}
 */
export function scoreMatch(student, mentor) {
  const skills = overlapFactor(
    'skills',
    'skills',
    normalizeList(student?.skills),
    normalizeList(mentor?.skills)
  );
  const interests = overlapFactor(
    'interests',
    'interests',
    normalizeList(student?.interests),
    normalizeList(mentor?.interests)
  );
  const goals = overlapFactor(
    'goals',
    'goals',
    normalizeList(student?.goals),
    normalizeList(mentor?.goals)
  );
  const languages = overlapFactor(
    'languages',
    'languages',
    normalizeList(student?.languages),
    normalizeList(mentor?.languages)
  );
  // Availability slots are exact "Day HH:MM-HH:MM" strings, compared without case changes.
  const availability = overlapFactor(
    'availability',
    'availability slots',
    student?.availability || [],
    mentor?.availability || []
  );

  const mentees = Number(mentor?.currentMentees) || 0;
  const cap = Number(mentor?.capacity) || 0;
  const hasCapacity = mentees < cap;
  const capacityFactor = {
    name: 'capacity',
    rawScore: hasCapacity ? 100 : 0,
    weight: WEIGHTS.capacity,
    contribution: hasCapacity ? round2(100 * WEIGHTS.capacity) : 0,
    matchedItems: [],
    explanation: hasCapacity
      ? `Mentor has capacity (${mentees} of ${cap} mentees).`
      : 'Mentor is currently at capacity.',
  };

  const factors = [skills, interests, goals, languages, availability, capacityFactor];
  const total = factors.reduce((sum, f) => sum + f.rawScore * f.weight, 0);

  return {
    score: Math.min(100, Math.round(total)),
    algorithmVersion: ALGORITHM_VERSION,
    factors,
    // Backwards-compatible fields used by existing UI code.
    matched: skills.matchedItems,
    matchedInterests: interests.matchedItems,
    matchedGoals: goals.matchedItems,
    matchedLanguages: languages.matchedItems,
    matchedAvailability: availability.matchedItems,
    capacity: hasCapacity,
  };
}

/** Compact, storable copy of a match result, saved on a request for later audit. */
export function buildMatchSnapshot(result, now = new Date()) {
  return {
    score: result.score,
    algorithmVersion: result.algorithmVersion,
    factors: result.factors.map((f) => ({ ...f, matchedItems: [...f.matchedItems] })),
    computedAt: now.toISOString(),
  };
}
