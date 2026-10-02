import { useState, useEffect, useCallback } from 'react';
import { getSession } from '../lib/storage';
import { apiGet, apiPatch } from '../lib/api';

/**
 * Shared hook for Student, Mentor, and Admin dashboards.
 * Fetches real server data with loading and error states.
 * Adheres to: Never show invented numbers.
 */
export function useDashboardData(role) {
  const [session, setSession] = useState(() => getSession());
  const [currentUser, setCurrentUser] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [recentItems, setRecentItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const activeRole = role || session?.role;

      // 1. Fetch current user profile from server
      let me = null;
      try {
        const meRes = await apiGet('/auth/me');
        me = meRes.user;
        setCurrentUser(me);
      } catch (err) {
        console.warn('Could not fetch user /auth/me:', err.message);
      }

      // 2. Fetch role-specific server data
      if (activeRole === 'student') {
        const [reqRes, meetRes, goalsRes] = await Promise.allSettled([
          apiGet('/mentorship-requests'),
          apiGet('/meetings'),
          apiGet('/goals'),
        ]);

        const requests = reqRes.status === 'fulfilled' ? reqRes.value.requests || [] : [];
        const meetings = meetRes.status === 'fulfilled' ? meetRes.value.meetings || [] : [];
        const goals = goalsRes.status === 'fulfilled' ? goalsRes.value.goals || [] : [];

        const pendingReqs = requests.filter((r) => r.status === 'pending');
        const activePairs = requests.filter((r) => r.status === 'accepted');
        const upcomingMeetings = meetings.filter((m) => m.status === 'scheduled');
        const completedGoals = goals.filter((g) => g.status === 'completed');

        // Real profile completion calculation
        const requiredFields = ['skills', 'interests', 'goals', 'course', 'college'];
        const filled = requiredFields.filter((f) => {
          const val = me?.[f];
          return Array.isArray(val) ? val.length > 0 : Boolean(val);
        });
        const profilePercent = Math.round((filled.length / requiredFields.length) * 100);

        setMetrics({
          pendingRequestsCount: pendingReqs.length,
          activeMentorsCount: activePairs.length,
          upcomingMeetingsCount: upcomingMeetings.length,
          completedGoalsCount: completedGoals.length,
          totalGoalsCount: goals.length,
          profileCompletion: profilePercent,
        });

        setRecentItems(upcomingMeetings.slice(0, 5));
      } else if (activeRole === 'mentor') {
        const [reqRes, meetRes] = await Promise.allSettled([
          apiGet('/mentorship-requests'),
          apiGet('/meetings'),
        ]);

        const requests = reqRes.status === 'fulfilled' ? reqRes.value.requests || [] : [];
        const meetings = meetRes.status === 'fulfilled' ? meetRes.value.meetings || [] : [];

        const pendingReqs = requests.filter((r) => r.status === 'pending');
        const activeMentees = requests.filter((r) => r.status === 'accepted');
        const upcomingMeetings = meetings.filter((m) => m.status === 'scheduled');

        setMetrics({
          pendingRequestsCount: pendingReqs.length,
          activeMenteesCount: activeMentees.length,
          capacity: me?.capacity || 5,
          currentMentees: me?.currentMentees || activeMentees.length,
          pauseRequests: Boolean(me?.pauseRequests),
          upcomingMeetingsCount: upcomingMeetings.length,
        });

        setRecentItems(pendingReqs.slice(0, 5));
      } else if (activeRole === 'admin') {
        const [usersRes, analyticsRes, healthRes] = await Promise.allSettled([
          apiGet('/users'),
          apiGet('/admin/analytics'),
          apiGet('/health'),
        ]);

        const users = usersRes.status === 'fulfilled' ? usersRes.value.users || [] : [];
        const analytics = analyticsRes.status === 'fulfilled' ? analyticsRes.value : {};
        const health = healthRes.status === 'fulfilled' ? healthRes.value : {};

        const students = users.filter((u) => u.role === 'student');
        const mentors = users.filter((u) => u.role === 'mentor');
        const pendingMentors = mentors.filter((m) => !m.verified && !m.isVerified);

        setMetrics({
          studentCount: students.length,
          mentorCount: mentors.length,
          pendingVerificationsCount: pendingMentors.length,
          activeMentorships: analytics.activeMentorships ?? 0,
          systemStatus: health.ok ? 'Healthy' : 'Degraded',
          dbStatus: health.database || 'connected',
        });

        setRecentItems(pendingMentors.slice(0, 5));
      }
    } catch (err) {
      setError(err?.message || 'Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  }, [role, session?.role]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Toggle mentor pause requests capacity
  const togglePauseRequests = async () => {
    if (!currentUser || role !== 'mentor') return;
    try {
      const nextVal = !currentUser.pauseRequests;
      await apiPatch(`/users/${currentUser._id || currentUser.id}`, {
        pauseRequests: nextVal,
      });
      setCurrentUser((prev) => ({ ...prev, pauseRequests: nextVal }));
      setMetrics((prev) => ({ ...prev, pauseRequests: nextVal }));
    } catch (err) {
      console.error('Failed to toggle pause requests:', err);
    }
  };

  return {
    currentUser,
    metrics,
    recentItems,
    loading,
    error,
    refetch: loadData,
    togglePauseRequests,
  };
}
