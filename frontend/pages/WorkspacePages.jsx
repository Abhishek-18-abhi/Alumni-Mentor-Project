// Modular Workspace Page Exports
// Split from the previous 2400-line monolith into dedicated domain folders

// Student Workspace Pages
export { default as FindMentor } from './student/FindMentor';
export { default as MentorProfile } from './student/MentorProfile';
export { default as Request } from './student/Request';
export { default as Matches } from './student/Matches';
export { default as Calendar } from './student/Calendar';

// Mentor Workspace Pages
export { default as MentorRequests } from './mentor/MentorRequests';
export { default as Mentees } from './mentor/Mentees';
export { default as MentorAvailability } from './mentor/MentorAvailability';

// Admin Workspace Pages
export { default as AdminUsers } from './admin/AdminUsers';
export { default as AdminMatching } from './admin/AdminMatching';
export { default as AdminAnalytics } from './admin/AdminAnalytics';
export { default as AdminAudit } from './admin/AdminAudit';
export { default as AdminSettings } from './admin/AdminSettings';
export { default as AdminNotifications } from './admin/AdminNotifications';

// Shared Workspace Pages
export { default as Meetings } from './shared/Meetings';
export { default as Goals } from './shared/Goals';
export { default as Feedback } from './shared/Feedback';
export { default as Notifications } from './shared/Notifications';
