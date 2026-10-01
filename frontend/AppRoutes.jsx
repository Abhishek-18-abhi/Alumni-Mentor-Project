import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Landing from './pages/Landing';
import Auth from './pages/Auth';
import InitialAdminSetup from './pages/InitialAdminSetup';
import AdminAdministrators from './pages/AdminAdministrators';
import Profile from './pages/Profile';
import Onboarding from './pages/Onboarding';
import Settings from './pages/Settings';
import { StudentDashboard, MentorDashboard, AdminDashboard } from './pages/Dashboard';
import { getSession, setSession } from './lib/storage';
import { getToken, hydrateLocalCache } from './lib/api';
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

function ProtectedRoute({ role, children }) {
  const session = getSession();

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  if (role && session.role !== role) {
    return (
      <Navigate
        to={session.role === 'admin' ? '/admin' : session.role === 'mentor' ? '/mentor' : '/student'}
        replace
      />
    );
  }

  return children;
}

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
    <Route path="/account-switcher" element={<Navigate to="/profile" replace />} />
    <Route path="/account/add" element={<Navigate to="/profile" replace />} />
    <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
    <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
    <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
  </>
);

const studentRoutes = (
  <>
    <Route path="/onboarding" element={<ProtectedRoute role="student"><Onboarding role="student" /></ProtectedRoute>} />
    <Route path="/student" element={<ProtectedRoute role="student"><StudentDashboard /></ProtectedRoute>} />
    <Route path="/mentors" element={<ProtectedRoute role="student"><FindMentor /></ProtectedRoute>} />
    <Route path="/mentor/:id" element={<ProtectedRoute role="student"><MentorProfile /></ProtectedRoute>} />
    <Route path="/request" element={<ProtectedRoute role="student"><Request /></ProtectedRoute>} />
    <Route path="/matches" element={<ProtectedRoute role="student"><Matches /></ProtectedRoute>} />
    <Route path="/calendar" element={<ProtectedRoute role="student"><Calendar /></ProtectedRoute>} />
    <Route path="/meetings" element={<ProtectedRoute role="student"><Meetings /></ProtectedRoute>} />
    <Route path="/goals" element={<ProtectedRoute role="student"><Goals role="student" /></ProtectedRoute>} />
    <Route path="/feedback" element={<ProtectedRoute role="student"><Feedback role="student" /></ProtectedRoute>} />
  </>
);

const mentorRoutes = (
  <>
    <Route path="/mentor/onboarding" element={<ProtectedRoute role="mentor"><Onboarding role="mentor" /></ProtectedRoute>} />
    <Route path="/mentor" element={<ProtectedRoute role="mentor"><MentorDashboard /></ProtectedRoute>} />
    <Route path="/mentor/requests" element={<ProtectedRoute role="mentor"><MentorRequests /></ProtectedRoute>} />
    <Route path="/mentor/mentees" element={<ProtectedRoute role="mentor"><Mentees /></ProtectedRoute>} />
    <Route path="/mentor/calendar" element={<ProtectedRoute role="mentor"><MentorAvailability /></ProtectedRoute>} />
    <Route path="/mentor/meetings" element={<ProtectedRoute role="mentor"><Meetings role="mentor" /></ProtectedRoute>} />
    <Route path="/mentor/goals" element={<ProtectedRoute role="mentor"><Goals role="mentor" /></ProtectedRoute>} />
    <Route path="/mentor/feedback" element={<ProtectedRoute role="mentor"><Feedback role="mentor" /></ProtectedRoute>} />
    <Route path="/mentor/profile" element={<ProtectedRoute role="mentor"><Profile /></ProtectedRoute>} />
  </>
);

const adminRoutes = (
  <>
    <Route path="/admin" element={<ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute>} />
    <Route path="/admin/users" element={<ProtectedRoute role="admin"><AdminUsers /></ProtectedRoute>} />
    <Route path="/admin/matching" element={<ProtectedRoute role="admin"><AdminMatching /></ProtectedRoute>} />
    <Route path="/admin/analytics" element={<ProtectedRoute role="admin"><AdminAnalytics /></ProtectedRoute>} />
    <Route path="/admin/audit" element={<ProtectedRoute role="admin"><AdminAudit /></ProtectedRoute>} />
    <Route path="/admin/administrators" element={<ProtectedRoute role="admin"><AdminAdministrators /></ProtectedRoute>} />
    <Route path="/admin/notifications" element={<ProtectedRoute role="admin"><AdminNotifications /></ProtectedRoute>} />
    <Route path="/admin/settings" element={<ProtectedRoute role="admin"><AdminSettings /></ProtectedRoute>} />
  </>
);

export default function AppRoutes() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;

    const boot = async () => {
      // Never block the first render on the API. The public/auth UI must open
      // even when the backend or database is temporarily unavailable.
      if (active) setReady(true);

      const session = getSession();
      const token = getToken();
      if (!session || !token) return;

      try {
        await hydrateLocalCache({ includeAudit: session.role === 'admin' });
        if (!getToken() && active) setSession(null);
      } catch (error) {
        console.warn('Background data hydration failed:', error?.message || error);
      }
    };

    boot();
    return () => { active = false; };
  }, []);

  if (!ready) return <div className="center-page"><div className="simple-card"><h2>Loading MentorConnect...</h2><p>Starting the application...</p></div></div>;

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
