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

export async function getPublicUser(user) {
  const base = user?.toObject ? user.toObject() : { ...user };
  delete base.passwordHash;
  delete base.password;
  let profile = {};
  if (user?.role === 'student') profile = stripProfile(await Student.findOne({ userId: user._id }));
  else if (user?.role === 'mentor') profile = stripProfile(await Mentor.findOne({ userId: user._id }));
  else if (user?.role === 'admin') profile = stripProfile(await Administrator.findOne({ userId: user._id }));
  return { ...base, ...profile };
}

export async function getPublicUsers(users) {
  const docs = users.map((u) => (u?.toObject ? u.toObject() : { ...u }));
  const ids = docs.map((u) => u._id);
  const [students, mentors, administrators] = await Promise.all([
    Student.find({ userId: { $in: ids } }).lean(),
    Mentor.find({ userId: { $in: ids } }).lean(),
    Administrator.find({ userId: { $in: ids } }).lean()
  ]);
  const profiles = new Map();
  for (const p of [...students, ...mentors, ...administrators]) profiles.set(String(p.userId), p);
  return docs.map((obj) => {
    delete obj.passwordHash;
    delete obj.password;
    const p = profiles.get(String(obj._id));
    if (p) {
      const clean = stripProfile(p);
      return { ...obj, ...clean };
    }
    return obj;
  });
}

export function profilePayload(role, data = {}) {
  if (role === 'student') return {
    college: data.college ?? '', course: data.course ?? '', year: data.year ?? '', bio: data.bio ?? '',
    skills: Array.isArray(data.skills) ? data.skills : [], interests: Array.isArray(data.interests) ? data.interests : [],
    goals: Array.isArray(data.goals) ? data.goals : [], languages: Array.isArray(data.languages) ? data.languages : ['English'],
    availability: Array.isArray(data.availability) ? data.availability : [], profileComplete: Boolean(data.profileComplete)
  };
  if (role === 'mentor') return {
    jobTitle: data.jobTitle ?? '', company: data.company ?? '', experience: data.experience ?? '', domain: data.domain ?? '', bio: data.bio ?? '',
    skills: Array.isArray(data.skills) ? data.skills : [], interests: Array.isArray(data.interests) ? data.interests : [],
    goals: Array.isArray(data.goals) ? data.goals : [], languages: Array.isArray(data.languages) ? data.languages : ['English'],
    availability: Array.isArray(data.availability) ? data.availability : [], capacity: Math.max(0, Number(data.capacity) || 1),
    currentMentees: Math.max(0, Number(data.currentMentees) || 0), profileComplete: Boolean(data.profileComplete)
  };
  return {
    adminType: data.adminType === 'coordinator' ? 'coordinator' : 'admin',
    title: data.title ?? 'Administrator',
    department: data.department ?? 'Alumni Cell',
    permissions: Array.isArray(data.permissions) ? data.permissions : []
  };
}
