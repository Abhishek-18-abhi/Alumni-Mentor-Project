import Student from '../models/Student.js';
import Mentor from '../models/Mentor.js';
import Administrator from '../models/Administrator.js';

const stripProfile = (profile) => {
  if (!profile) return {};
  const obj = profile.toObject ? profile.toObject() : { ...profile };
  delete obj._id;
  delete obj.userId;
  delete obj.createdAt;
  delete obj.updatedAt;
  delete obj.__v;
  return obj;
};

/**
 * Strips private fields for non-admin viewers.
 * Non-admins must not see other users' emails or private details.
 */
function sanitizeForViewer(userObj, viewer) {
  const isViewerAdmin = viewer?.role === 'admin';
  const isSelf = String(viewer?._id || viewer?.id || '') === String(userObj._id || userObj.id || '');

  delete userObj.passwordHash;
  delete userObj.password;
  delete userObj.__v;

  if (!isViewerAdmin && !isSelf) {
    // Non-admins must not see other users' emails
    delete userObj.email;
    // Strip other sensitive/internal fields
    delete userObj.resetPasswordToken;
    delete userObj.resetPasswordExpires;
  }

  return userObj;
}

export async function getPublicUser(user, viewer = null) {
  const base = user?.toObject ? user.toObject() : { ...user };
  let profile = {};
  if (user?.role === 'student') profile = stripProfile(await Student.findOne({ userId: user._id }));
  else if (user?.role === 'mentor') profile = stripProfile(await Mentor.findOne({ userId: user._id }));
  else if (user?.role === 'admin') profile = stripProfile(await Administrator.findOne({ userId: user._id }));

  const merged = { ...base, ...profile };
  merged.id = String(merged._id || merged.id);
  return sanitizeForViewer(merged, viewer);
}

export async function getPublicUsers(users, viewer = null) {
  const docs = users.map((u) => (u?.toObject ? u.toObject() : { ...u }));
  const ids = docs.map((u) => u._id);
  const [students, mentors, administrators] = await Promise.all([
    Student.find({ userId: { $in: ids } }).lean(),
    Mentor.find({ userId: { $in: ids } }).lean(),
    Administrator.find({ userId: { $in: ids } }).lean(),
  ]);
  const profiles = new Map();
  for (const p of [...students, ...mentors, ...administrators]) profiles.set(String(p.userId), p);

  return docs.map((obj) => {
    const p = profiles.get(String(obj._id));
    const merged = p ? { ...obj, ...stripProfile(p) } : obj;
    merged.id = String(merged._id || merged.id);
    return sanitizeForViewer(merged, viewer);
  });
}

export function profilePayload(role, data = {}) {
  if (role === 'student') {
    return {
      college: data.college ?? '',
      course: data.course ?? '',
      year: data.year ?? '',
      bio: data.bio ?? '',
      skills: Array.isArray(data.skills) ? data.skills : [],
      interests: Array.isArray(data.interests) ? data.interests : [],
      goals: Array.isArray(data.goals) ? data.goals : [],
      languages: Array.isArray(data.languages) ? data.languages : ['English'],
      availability: Array.isArray(data.availability) ? data.availability : [],
      profileComplete: Boolean(data.profileComplete),
    };
  }
  if (role === 'mentor') {
    return {
      jobTitle: data.jobTitle ?? '',
      company: data.company ?? '',
      experience: data.experience ?? '',
      domain: data.domain ?? '',
      bio: data.bio ?? '',
      skills: Array.isArray(data.skills) ? data.skills : [],
      interests: Array.isArray(data.interests) ? data.interests : [],
      goals: Array.isArray(data.goals) ? data.goals : [],
      languages: Array.isArray(data.languages) ? data.languages : ['English'],
      availability: Array.isArray(data.availability) ? data.availability : [],
      capacity: Math.max(0, Number(data.capacity) || 1),
      currentMentees: Math.max(0, Number(data.currentMentees) || 0),
      profileComplete: Boolean(data.profileComplete),
    };
  }
  return {
    adminType: data.adminType === 'coordinator' ? 'coordinator' : 'admin',
    title: data.title ?? 'Administrator',
    department: data.department ?? 'Alumni Cell',
    permissions: Array.isArray(data.permissions) ? data.permissions : [],
  };
}
