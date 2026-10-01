import {
  getUsers,
  saveUsers,
  getRequests,
  saveRequests,
  getMeetings,
  saveMeetings,
  getGoals,
  saveGoals,
  getFeedback,
  saveFeedback,
  addAudit,
} from './storage';
import { scoreMatch, buildMatchSnapshot } from './matching';

export function loadSampleCollegeData() {
  const existingUsers = getUsers();
  const existingRequests = getRequests();
  const existingMeetings = getMeetings();
  const existingGoals = getGoals();
  const existingFeedback = getFeedback();

  // 1. High-quality BCA Alumni Mentors
  const demoMentors = [
    {
      id: 'demo_mentor_priya',
      name: 'Priya Sharma',
      email: 'priya.sharma@alumni.edu',
      role: 'mentor',
      college: 'Vivekanand College of BCA',
      course: 'BCA (Batch of 2020)',
      jobTitle: 'Senior Software Engineer',
      company: 'Google',
      experience: '5+ years',
      domain: 'Cloud & Full Stack Engineering',
      bio: 'Alumni mentor passionate about distributed systems, React, and helping juniors crack technical interviews.',
      skills: ['React', 'Node.js', 'System Design', 'Algorithms', 'TypeScript', 'Cloud Computing'],
      interests: ['Web Development', 'Competitive Programming', 'Open Source'],
      availability: ['Monday', 'Wednesday', 'Saturday'],
      languages: ['English', 'Hindi'],
      capacity: 4,
      currentMentees: 1,
      profileComplete: true,
      settings: { profileVisible: true, notifications: true },
      createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
    },
    {
      id: 'demo_mentor_rahul',
      name: 'Rahul Verma',
      email: 'rahul.verma@alumni.edu',
      role: 'mentor',
      college: 'Vivekanand College of BCA',
      course: 'BCA (Batch of 2019)',
      jobTitle: 'Lead Data Scientist',
      company: 'Microsoft',
      experience: '6 years',
      domain: 'Artificial Intelligence & Machine Learning',
      bio: 'BCA alumnus working on large language models and predictive analytics. Happy to guide on ML roadmaps and career transitions.',
      skills: ['Python', 'Machine Learning', 'SQL', 'Data Analytics', 'TensorFlow', 'Deep Learning'],
      interests: ['AI Research', 'Data Science', 'Big Data'],
      availability: ['Tuesday', 'Thursday', 'Sunday'],
      languages: ['English', 'Hindi'],
      capacity: 3,
      currentMentees: 1,
      profileComplete: true,
      settings: { profileVisible: true, notifications: true },
      createdAt: new Date(Date.now() - 25 * 86400000).toISOString(),
    },
    {
      id: 'demo_mentor_ananya',
      name: 'Ananya Patel',
      email: 'ananya.patel@alumni.edu',
      role: 'mentor',
      college: 'Vivekanand College of BCA',
      course: 'BCA (Batch of 2021)',
      jobTitle: 'Product Manager',
      company: 'Amazon',
      experience: '4 years',
      domain: 'Product Strategy & UX',
      bio: 'Bridging tech and user experience. Mentoring students interested in Product Management, System Architecture, and Agile practices.',
      skills: ['Product Management', 'UI/UX', 'Agile Methodologies', 'Cloud Computing', 'Data Analytics'],
      interests: ['Product Growth', 'User Research', 'Tech Leadership'],
      availability: ['Friday', 'Saturday'],
      languages: ['English', 'Hindi', 'Gujarati'],
      capacity: 3,
      currentMentees: 0,
      profileComplete: true,
      settings: { profileVisible: true, notifications: true },
      createdAt: new Date(Date.now() - 20 * 86400000).toISOString(),
    },
  ];

  // 2. Demo Student
  const demoStudent = {
    id: 'demo_student_arjun',
    name: 'Arjun Mehta',
    email: 'arjun.mehta@student.edu',
    role: 'student',
    college: 'Vivekanand College of BCA',
    course: 'BCA (3rd Year)',
    year: 'Final Year',
    domain: 'Software Engineering',
    skills: ['React', 'JavaScript', 'Node.js', 'Python'],
    goals: ['Full Stack Developer', 'System Design', 'Crack Campus Placement'],
    interests: ['Web Development', 'Open Source'],
    availability: ['Monday', 'Wednesday', 'Saturday'],
    languages: ['English', 'Hindi'],
    profileComplete: true,
    settings: { profileVisible: true, notifications: true },
    createdAt: new Date(Date.now() - 15 * 86400000).toISOString(),
  };

  // Merge users without duplicates
  const usersById = new Map();
  existingUsers.forEach((u) => usersById.set(u.id, u));
  demoMentors.forEach((m) => {
    if (!usersById.has(m.id)) usersById.set(m.id, m);
  });
  if (!usersById.has(demoStudent.id)) {
    usersById.set(demoStudent.id, demoStudent);
  }
  saveUsers(Array.from(usersById.values()));

  // 3. Demo Request (Arjun -> Priya)
  const reqId = 'demo_req_arjun_priya';
  if (!existingRequests.some((r) => r.id === reqId)) {
    const matchResult = scoreMatch(demoStudent, demoMentors[0]);
    const snapshot = buildMatchSnapshot(matchResult);
    const newReq = {
      id: reqId,
      studentId: demoStudent.id,
      mentorId: demoMentors[0].id,
      message: "Hello Priya ma'am, I am a final-year BCA student aiming for SDE roles. I would love your guidance on System Design and modern web architectures.",
      status: 'accepted',
      matchSnapshot: snapshot,
      createdAt: new Date(Date.now() - 10 * 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 8 * 86400000).toISOString(),
    };
    existingRequests.unshift(newReq);
    saveRequests(existingRequests);
  }

  // 4. Demo Meeting
  const meetingId = 'demo_meet_1';
  if (!existingMeetings.some((m) => m.id === meetingId)) {
    const newMeet = {
      id: meetingId,
      studentId: demoStudent.id,
      mentorId: demoMentors[0].id,
      date: new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0],
      time: '18:00',
      mode: 'Google Meet',
      link: 'https://meet.google.com/abc-demo-capstone',
      status: 'scheduled',
      log: '',
      createdAt: new Date().toISOString(),
    };
    existingMeetings.unshift(newMeet);
    saveMeetings(existingMeetings);
  }

  // 5. Demo Goals
  const goalId1 = 'demo_goal_1';
  const goalId2 = 'demo_goal_2';
  if (!existingGoals.some((g) => g.id === goalId1)) {
    existingGoals.unshift({
      id: goalId1,
      studentId: demoStudent.id,
      title: 'Complete Full Stack Capstone & Architecture Document',
      target: 'By end of semester',
      progress: 85,
      status: 'active',
      createdAt: new Date(Date.now() - 7 * 86400000).toISOString(),
    });
    existingGoals.unshift({
      id: goalId2,
      studentId: demoStudent.id,
      title: 'Solve Top 50 LeetCode DSA Patterns in Python/JS',
      target: 'Technical Rounds',
      progress: 60,
      status: 'active',
      createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
    });
    saveGoals(existingGoals);
  }

  // 6. Demo Feedback
  const feedId = 'demo_feedback_1';
  if (!existingFeedback.some((f) => f.id === feedId)) {
    existingFeedback.unshift({
      id: feedId,
      fromUserId: demoStudent.id,
      toUserId: demoMentors[0].id,
      requestId: reqId,
      rating: 5,
      text: "Priya ma'am gave structured feedback on my project architecture and mock interview tips. Extremely helpful!",
      createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    });
    saveFeedback(existingFeedback);
  }

  // Log in Audit Trail
  addAudit('ADMIN_LOADED_DEMO_DATA', 'Loaded verified alumni, student matches, and sample meetings for viva presentation');

  return { ok: true, count: demoMentors.length };
}

export function clearSampleCollegeData() {
  const users = getUsers().filter((u) => !u.id.startsWith('demo_'));
  const requests = getRequests().filter((r) => !r.id.startsWith('demo_'));
  const meetings = getMeetings().filter((m) => !m.id.startsWith('demo_'));
  const goals = getGoals().filter((g) => !g.id.startsWith('demo_'));
  const feedback = getFeedback().filter((f) => !f.id.startsWith('demo_'));

  saveUsers(users);
  saveRequests(requests);
  saveMeetings(meetings);
  saveGoals(goals);
  saveFeedback(feedback);

  addAudit('ADMIN_CLEARED_DEMO_DATA', 'Cleared sample demo records');
  return { ok: true };
}
