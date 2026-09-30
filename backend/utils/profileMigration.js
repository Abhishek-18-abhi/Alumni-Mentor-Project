import User from '../models/User.js';
import Student from '../models/Student.js';
import Mentor from '../models/Mentor.js';
import Administrator from '../models/Administrator.js';

const hasAny = (u, keys) => keys.some((k) => u[k] !== undefined);

export async function migrateLegacyProfiles() {
  const users = await User.find().select('+passwordHash');
  const studentKeys = ['college','course','year','bio','skills','interests','goals','languages','availability','profileComplete'];
  const mentorKeys = ['jobTitle','company','experience','domain','bio','skills','interests','goals','languages','availability','capacity','currentMentees','profileComplete'];
  const adminKeys = ['department','adminType','title','permissions'];

  for (const user of users) {
    if (user.role === 'student' && hasAny(user, studentKeys)) {
      const exists = await Student.exists({ userId: user._id });
      if (!exists) await Student.create({ userId: user._id, college:user.college, course:user.course, year:user.year, bio:user.bio, skills:user.skills, interests:user.interests, goals:user.goals, languages:user.languages, availability:user.availability, profileComplete:user.profileComplete });
    }
    if (user.role === 'mentor' && hasAny(user, mentorKeys)) {
      const exists = await Mentor.exists({ userId: user._id });
      if (!exists) await Mentor.create({ userId:user._id, jobTitle:user.jobTitle, company:user.company, experience:user.experience, domain:user.domain, bio:user.bio, skills:user.skills, interests:user.interests, goals:user.goals, languages:user.languages, availability:user.availability, capacity:user.capacity, currentMentees:user.currentMentees, profileComplete:user.profileComplete });
    }
    if (user.role === 'admin' && hasAny(user, adminKeys)) {
      const exists = await Administrator.exists({ userId: user._id });
      if (!exists) await Administrator.create({ userId:user._id, department:user.department, adminType:user.adminType, title:user.title, permissions:user.permissions });
    }
    if (hasAny(user, [...studentKeys, ...mentorKeys, ...adminKeys])) {
      const unset = {};
      for (const key of [...studentKeys, ...mentorKeys, ...adminKeys]) unset[key] = 1;
      await User.updateOne({ _id: user._id }, { $unset: unset });
    }
  }
}
