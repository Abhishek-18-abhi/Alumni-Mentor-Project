import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Landing from './pages/Landing';
import Auth from './pages/Auth';
import InitialAdminSetup from './pages/InitialAdminSetup';
import AccountSwitcher from './pages/AccountSwitcher';
import AccountAdd from './pages/AccountAdd';
import AdminAdministrators from './pages/AdminAdministrators';
import Profile from './pages/Profile';
import Onboarding from './pages/Onboarding';
import Settings from './pages/Settings';
import { StudentDashboard, MentorDashboard, AdminDashboard } from './pages/Dashboard';
import {
  FindMentor,
  MentorProfile,
  Request,
  Matches,
  Meetings,
  Calendar,
  Notifications,
  AdminUsers,
  AdminSimple,
  MentorRequests,
  Mentees,
  MentorAvailability,
  Goals,
  Feedback,
  AdminNotifications,
  AdminMatching,
  AdminAnalytics,
  AdminAudit,
  AdminSettings,
} from './pages/WorkspacePages';
const adminInfoPage = (title, text) => <AdminSimple title={title} text={text} />;

const publicRoutes = (
  <>
    <Route path="/" element={<Landing />} />
    <Route path="/login" element={<Auth />} />
    <Route path="/admin/login" element={<Auth adminLogin />} />
    <Route path="/register" element={<Auth register />} />
    <Route path="/admin/setup" element={<InitialAdminSetup />} />
  </>
);

const sharedRoutes = (
  <>
    <Route path="/account-switcher" element={<AccountSwitcher />} />
    <Route path="/account/add" element={<AccountAdd />} />
    <Route path="/profile" element={<Profile />} />
    <Route path="/notifications" element={<Notifications />} />
    <Route path="/settings" element={<Settings />} />
  </>
);

const studentRoutes = (
  <>
    <Route path="/onboarding" element={<Onboarding role="student" />} />
    <Route path="/student" element={<StudentDashboard />} />
    <Route path="/mentors" element={<FindMentor />} />
    <Route path="/mentor/:id" element={<MentorProfile />} />
    <Route path="/request" element={<Request />} />
    <Route path="/matches" element={<Matches />} />
    <Route path="/calendar" element={<Calendar />} />
    <Route path="/meetings" element={<Meetings />} />
    <Route path="/goals" element={<Goals role="student" />} />
    <Route path="/feedback" element={<Feedback role="student" />} />
  </>
);

const mentorRoutes = (
  <>
    <Route path="/mentor/onboarding" element={<Onboarding role="mentor" />} />
    <Route path="/mentor" element={<MentorDashboard />} />
    <Route path="/mentor/requests" element={<MentorRequests />} />
    <Route path="/mentor/mentees" element={<Mentees />} />
    <Route path="/mentor/calendar" element={<MentorAvailability />} />
    <Route path="/mentor/meetings" element={<Meetings role="mentor" />} />
    <Route path="/mentor/goals" element={<Goals role="mentor" />} />
    <Route path="/mentor/feedback" element={<Feedback role="mentor" />} />
    <Route path="/mentor/profile" element={<Profile />} />
  </>
);

const adminRoutes = (
  <>
    <Route path="/admin" element={<AdminDashboard />} />
    <Route path="/admin/users" element={<AdminUsers />} />
    <Route path="/admin/matching" element={<AdminMatching />} />
    <Route path="/admin/analytics" element={<AdminAnalytics />} />
    <Route path="/admin/audit" element={<AdminAudit />} />
    <Route path="/admin/administrators" element={<AdminAdministrators />} />
    <Route path="/admin/notifications" element={<AdminNotifications />} />
    <Route path="/admin/settings" element={<AdminSettings />} />
  </>
);

export default function AppRoutes() {
  return (
    <Routes>
      {publicRoutes}
      {sharedRoutes}
      {studentRoutes}
      {mentorRoutes}
      {adminRoutes}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
