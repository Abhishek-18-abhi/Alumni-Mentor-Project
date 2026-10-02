import React, { useEffect, useState, Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ErrorBoundary from './components/ErrorBoundary';
import NotFound from './pages/NotFound';
import Landing from './pages/Landing';
import Auth from './pages/Auth';
import InitialAdminSetup from './pages/InitialAdminSetup';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import { getSession, setSession } from './lib/storage';
import { getToken, clearToken, apiGet } from './lib/api';

// Code-split dashboards per role
const StudentDashboard = lazy(() =>
  import('./pages/Dashboard').then((m) => ({ default: m.StudentDashboard }))
);
const MentorDashboard = lazy(() =>
  import('./pages/Dashboard').then((m) => ({ default: m.MentorDashboard }))
);
const AdminDashboard = lazy(() =>
  import('./pages/Dashboard').then((m) => ({ default: m.AdminDashboard }))
);

// Student Pages
const FindMentor = lazy(() => import('./pages/student/FindMentor'));
const MentorProfile = lazy(() => import('./pages/student/MentorProfile'));
const Request = lazy(() => import('./pages/student/Request'));
const Matches = lazy(() => import('./pages/student/Matches'));
const Calendar = lazy(() => import('./pages/student/Calendar'));
const Onboarding = lazy(() => import('./pages/Onboarding'));

// Mentor Pages
const MentorRequests = lazy(() => import('./pages/mentor/MentorRequests'));
const Mentees = lazy(() => import('./pages/mentor/Mentees'));
const MentorAvailability = lazy(() => import('./pages/mentor/MentorAvailability'));

// Admin Pages
const AdminUsers = lazy(() => import('./pages/admin/AdminUsers'));
const AdminMatching = lazy(() => import('./pages/admin/AdminMatching'));
const AdminAnalytics = lazy(() => import('./pages/admin/AdminAnalytics'));
const AdminAudit = lazy(() => import('./pages/admin/AdminAudit'));
const AdminAdministrators = lazy(() => import('./pages/AdminAdministrators'));
const AdminNotifications = lazy(() => import('./pages/admin/AdminNotifications'));

// Shared Pages
const Meetings = lazy(() => import('./pages/shared/Meetings'));
const Goals = lazy(() => import('./pages/shared/Goals'));
const Feedback = lazy(() => import('./pages/shared/Feedback'));
const Notifications = lazy(() => import('./pages/shared/Notifications'));

function ProtectedRoute({ role, children }) {
  const session = getSession();
  const [sessionValid, setSessionValid] = useState(session ? true : null);

  useEffect(() => {
    if (!session) return;
    let active = true;
    const token = getToken();
    if (token) {
      apiGet('/auth/me')
        .then((res) => {
          if (active && (!res || !res.user)) {
            clearToken();
            setSession(null);
            setSessionValid(false);
          }
        })
        .catch(() => {
          if (active && !getToken()) {
            setSessionValid(false);
          }
        });
    }
    return () => {
      active = false;
    };
  }, [session]);

  if (!session || sessionValid === false) {
    return <Navigate to="/login" replace />;
  }

  if (role && session.role !== role) {
    return (
      <Navigate
        to={
          session.role === 'admin' ? '/admin' : session.role === 'mentor' ? '/mentor' : '/student'
        }
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
    <Route
      path="/profile"
      element={
        <ProtectedRoute>
          <Profile />
        </ProtectedRoute>
      }
    />
    <Route
      path="/notifications"
      element={
        <ProtectedRoute>
          <Notifications />
        </ProtectedRoute>
      }
    />
    <Route
      path="/settings"
      element={
        <ProtectedRoute>
          <Settings />
        </ProtectedRoute>
      }
    />
  </>
);

const studentRoutes = (
  <>
    <Route
      path="/onboarding"
      element={
        <ProtectedRoute role="student">
          <Onboarding role="student" />
        </ProtectedRoute>
      }
    />
    <Route
      path="/student"
      element={
        <ProtectedRoute role="student">
          <StudentDashboard />
        </ProtectedRoute>
      }
    />
    <Route
      path="/mentors"
      element={
        <ProtectedRoute role="student">
          <FindMentor />
        </ProtectedRoute>
      }
    />
    <Route
      path="/mentor/:id"
      element={
        <ProtectedRoute role="student">
          <MentorProfile />
        </ProtectedRoute>
      }
    />
    <Route
      path="/mentors/:id"
      element={
        <ProtectedRoute role="student">
          <MentorProfile />
        </ProtectedRoute>
      }
    />
    <Route
      path="/request"
      element={
        <ProtectedRoute role="student">
          <Request />
        </ProtectedRoute>
      }
    />
    <Route
      path="/matches"
      element={
        <ProtectedRoute role="student">
          <Matches />
        </ProtectedRoute>
      }
    />
    <Route
      path="/calendar"
      element={
        <ProtectedRoute role="student">
          <Calendar />
        </ProtectedRoute>
      }
    />
    <Route
      path="/meetings"
      element={
        <ProtectedRoute role="student">
          <Meetings />
        </ProtectedRoute>
      }
    />
    <Route
      path="/goals"
      element={
        <ProtectedRoute role="student">
          <Goals role="student" />
        </ProtectedRoute>
      }
    />
    <Route
      path="/feedback"
      element={
        <ProtectedRoute role="student">
          <Feedback role="student" />
        </ProtectedRoute>
      }
    />
    <Route path="/student/meetings" element={<Navigate to="/meetings" replace />} />
    <Route path="/student/goals" element={<Navigate to="/goals" replace />} />
    <Route path="/student/feedback" element={<Navigate to="/feedback" replace />} />
    <Route path="/student/calendar" element={<Navigate to="/calendar" replace />} />
    <Route path="/student/matches" element={<Navigate to="/matches" replace />} />
    <Route path="/student/mentors" element={<Navigate to="/mentors" replace />} />
    <Route path="/student/notifications" element={<Navigate to="/notifications" replace />} />
    <Route path="/student/settings" element={<Navigate to="/settings" replace />} />
    <Route path="/student/profile" element={<Navigate to="/profile" replace />} />
  </>
);

const mentorRoutes = (
  <>
    <Route
      path="/mentor/onboarding"
      element={
        <ProtectedRoute role="mentor">
          <Onboarding role="mentor" />
        </ProtectedRoute>
      }
    />
    <Route
      path="/mentor"
      element={
        <ProtectedRoute role="mentor">
          <MentorDashboard />
        </ProtectedRoute>
      }
    />
    <Route
      path="/mentor/requests"
      element={
        <ProtectedRoute role="mentor">
          <MentorRequests />
        </ProtectedRoute>
      }
    />
    <Route
      path="/mentor/mentees"
      element={
        <ProtectedRoute role="mentor">
          <Mentees />
        </ProtectedRoute>
      }
    />
    <Route
      path="/mentor/calendar"
      element={
        <ProtectedRoute role="mentor">
          <MentorAvailability />
        </ProtectedRoute>
      }
    />
    <Route
      path="/mentor/availability"
      element={
        <ProtectedRoute role="mentor">
          <MentorAvailability />
        </ProtectedRoute>
      }
    />
    <Route
      path="/mentor/meetings"
      element={
        <ProtectedRoute role="mentor">
          <Meetings role="mentor" />
        </ProtectedRoute>
      }
    />
    <Route
      path="/mentor/goals"
      element={
        <ProtectedRoute role="mentor">
          <Goals role="mentor" />
        </ProtectedRoute>
      }
    />
    <Route
      path="/mentor/feedback"
      element={
        <ProtectedRoute role="mentor">
          <Feedback role="mentor" />
        </ProtectedRoute>
      }
    />
    <Route
      path="/mentor/profile"
      element={
        <ProtectedRoute role="mentor">
          <Profile />
        </ProtectedRoute>
      }
    />
    <Route path="/mentor/notifications" element={<Navigate to="/notifications" replace />} />
    <Route path="/mentor/settings" element={<Navigate to="/settings" replace />} />
  </>
);

const adminRoutes = (
  <>
    <Route
      path="/admin"
      element={
        <ProtectedRoute role="admin">
          <AdminDashboard />
        </ProtectedRoute>
      }
    />
    <Route
      path="/admin/users"
      element={
        <ProtectedRoute role="admin">
          <AdminUsers />
        </ProtectedRoute>
      }
    />
    <Route
      path="/admin/matching"
      element={
        <ProtectedRoute role="admin">
          <AdminMatching />
        </ProtectedRoute>
      }
    />
    <Route
      path="/admin/analytics"
      element={
        <ProtectedRoute role="admin">
          <AdminAnalytics />
        </ProtectedRoute>
      }
    />
    <Route
      path="/admin/audit"
      element={
        <ProtectedRoute role="admin">
          <AdminAudit />
        </ProtectedRoute>
      }
    />
    <Route
      path="/admin/administrators"
      element={
        <ProtectedRoute role="admin">
          <AdminAdministrators />
        </ProtectedRoute>
      }
    />
    <Route
      path="/admin/notifications"
      element={
        <ProtectedRoute role="admin">
          <AdminNotifications />
        </ProtectedRoute>
      }
    />
    <Route path="/admin/settings" element={<Navigate to="/settings" replace />} />
  </>
);

export default function AppRoutes() {
  return (
    <ErrorBoundary>
      <Suspense
        fallback={
          <div className="center-page" role="status" aria-live="polite">
            <div
              className="simple-card"
              style={{ maxWidth: 400, textAlign: 'center', padding: 32 }}
            >
              <div className="loading-spinner" style={{ margin: '0 auto 16px' }} />
              <h2 style={{ fontSize: '1.25rem', marginBottom: 6 }}>Loading...</h2>
              <p style={{ color: 'var(--foreground-muted)', fontSize: '0.9rem' }}>
                Preparing view...
              </p>
            </div>
          </div>
        }
      >
        <Routes>
          {publicRoutes}
          {sharedRoutes}
          {studentRoutes}
          {mentorRoutes}
          {adminRoutes}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </ErrorBoundary>
  );
}
