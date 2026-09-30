/**
 * Shared JSDoc type definitions for the MongoDB-backed data model mirrored in a local UI cache.
 * These are documentation only (no runtime checks) - the project targets
 * React 19, where PropTypes are no longer checked at runtime either, so
 * JSDoc + editor type-checking is the lightweight alternative used here.
 */

/**
 * @typedef {Object} User
 * @property {string} id
 * @property {string} name
 * @property {string} email
 * @property {string} [passwordHash] - bcrypt hash; never the plain password.
 * @property {'student'|'mentor'|'admin'} role
 * @property {string[]} skills
 * @property {string[]} interests
 * @property {string[]} goals
 * @property {string[]} languages
 * @property {string[]} availability - e.g. "Monday 09:00-12:00" slot strings.
 * @property {number} [capacity] - mentor-only: max concurrent mentees.
 * @property {number} [currentMentees] - mentor-only: current accepted mentee count.
 * @property {boolean} profileComplete
 * @property {string} createdAt - ISO timestamp.
 */

/**
 * @typedef {Object} MatchFactor
 * @property {string} name - e.g. "skills", "availability", "capacity".
 * @property {number} rawScore - 0-100, before weighting.
 * @property {number} weight - 0-1.
 * @property {number} contribution - rawScore * weight.
 * @property {string[]} matchedItems
 * @property {string} explanation - human-readable reason.
 */

/**
 * @typedef {Object} MatchResult
 * @property {number} score - 0-100 overall score.
 * @property {string} algorithmVersion
 * @property {MatchFactor[]} factors
 * @property {string[]} matched - legacy alias for the skills factor's matchedItems.
 * @property {string[]} matchedInterests
 * @property {string[]} matchedGoals
 * @property {string[]} matchedLanguages
 * @property {string[]} matchedAvailability
 * @property {boolean} capacity - whether the mentor currently has room.
 */

/**
 * @typedef {Object} MatchSnapshot
 * @property {number} score
 * @property {string} algorithmVersion
 * @property {MatchFactor[]} factors
 * @property {string} computedAt - ISO timestamp.
 */

/**
 * @typedef {Object} MentorshipRequest
 * @property {string} id
 * @property {string} studentId
 * @property {string} mentorId
 * @property {string} message
 * @property {'pending'|'accepted'|'rejected'} status
 * @property {MatchSnapshot} [matchSnapshot]
 * @property {string} createdAt - ISO timestamp.
 * @property {string} [respondedAt] - ISO timestamp.
 */

/**
 * @typedef {Object} Meeting
 * @property {string} id
 * @property {string} mentorId
 * @property {string} studentId
 * @property {string} date
 * @property {string} time
 * @property {string} mode
 * @property {string} [log] - session notes added after the meeting.
 */

/**
 * @typedef {Object} Goal
 * @property {string} id
 * @property {string} studentId
 * @property {string} createdBy
 * @property {string} title
 * @property {string} target
 * @property {'active'|'completed'} status
 * @property {number} progress - 0-100.
 * @property {string} createdAt - ISO timestamp.
 */

/**
 * @typedef {Object} Feedback
 * @property {string} id
 * @property {string} fromUserId
 * @property {string} toUserId
 * @property {string} requestId
 * @property {number} rating - 1-5.
 * @property {string} text
 * @property {string} createdAt - ISO timestamp.
 */

export {};
