import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  CalendarDays,
  MessageSquare,
  Target,
  Star,
  Sparkles,
  ClipboardList,
  BarChart3,
  ShieldCheck,
  Settings,
  UserCog,
  Bell,
  LogOut,
} from 'lucide-react';
import Logo from './Logo';
import { getSession, getRequests, getMeetings } from '../lib/storage';
import { logout as authLogout } from '../lib/auth';

const navMaps = {
  student: [
    ['Dashboard', '/student', LayoutDashboard],
    ['Find Mentor', '/mentors', Users],
    ['My Matches', '/matches', Sparkles],
    ['Calendar', '/calendar', CalendarDays],
    ['Meetings', '/meetings', MessageSquare],
    ['Goals', '/goals', Target],
    ['Feedback', '/feedback', Star],
    ['Settings', '/settings', Settings],
  ],
  mentor: [
    ['Dashboard', '/mentor', LayoutDashboard],
    ['Requests', '/mentor/requests', ClipboardList],
    ['My Mentees', '/mentor/mentees', Users],
    ['Calendar', '/mentor/calendar', CalendarDays],
    ['Meetings', '/mentor/meetings', MessageSquare],
    ['Goals', '/mentor/goals', Target],
    ['Feedback', '/mentor/feedback', Star],
    ['Settings', '/mentor/profile', Settings],
  ],
  admin: [
    ['Overview', '/admin', LayoutDashboard],
    ['Users', '/admin/users', Users],
    ['Matching', '/admin/matching', Sparkles],
    ['Analytics', '/admin/analytics', BarChart3],
    ['Audit Logs', '/admin/audit', ShieldCheck],
    ['Administrators', '/admin/administrators', UserCog],
    ['Notifications', '/admin/notifications', Bell],
    ['Settings', '/admin/settings', Settings],
  ],
};

export default function Sidebar({ role = 'student', isOpen = false, onClose = () => {} }) {
  const nav = useNavigate();
  const user = getSession();

  const handleLogout = () => {
    authLogout();
    nav('/login');
  };

  const navItems = navMaps[role] || navMaps.student;



  let pendingRequestsCount = 0;
  let userMeetingsCount = 0;
  try {
    const allReqs = getRequests();
    const allMeetings = getMeetings();
    pendingRequestsCount = allReqs.filter(
      (r) => r.mentorId === user?.id && r.status === 'pending'
    ).length;
    userMeetingsCount = allMeetings.filter(
      (m) => (m.studentId === user?.id || m.mentorId === user?.id) && m.status !== 'cancelled'
    ).length;
  } catch {
    // fallback gracefully
  }

  const getNavBadge = (to) => {
    if (to === '/matches') return 'Live';
    if (to === '/mentor/requests' && pendingRequestsCount > 0) return String(pendingRequestsCount);
    if ((to === '/meetings' || to === '/mentor/meetings') && userMeetingsCount > 0) return String(userMeetingsCount);
    if (to === '/admin/audit') return 'Live';
    if (to === '/admin/matching') return 'AI';
    return null;
  };

  return (
    <aside className={`sidebar${isOpen ? ' mobile-open' : ''}`}>
      {/* Brand Header */}
      <div className="sidebar-header">
        <NavLink
          to={role === 'admin' ? '/admin' : role === 'mentor' ? '/mentor' : '/student'}
          className="sidebar-brand-link"
          onClick={onClose}
        >
          <Logo size={32} />
        </NavLink>
        <div className="sidebar-role-badge">
          <span className="role-pulse" />
          <span>{role === 'admin' ? 'Administrator' : role === 'mentor' ? 'Alumni Mentor' : 'Student Hub'}</span>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="sidebar-nav">
        {navItems.map(([label, to, Icon]) => {
          const badge = getNavBadge(to);
          return (
            <NavLink key={to} to={to} end onClick={onClose}>
              <Icon size={18} />
              <span>{label}</span>
              {badge && <span className="sidebar-nav-badge">{badge}</span>}
            </NavLink>
          );
        })}
      </nav>

      {/* Bottom User Card / Actions */}
      <div className="sidebar-footer">
        <div className="sidebar-user-card">
          <div className="sidebar-user-avatar">
            {user?.name?.[0]?.toUpperCase() || 'U'}
          </div>
          <div className="sidebar-user-info">
            <b>{user?.name || 'Account'}</b>
            <span>{user?.email || (role === 'admin' ? 'Administrator' : 'Active User')}</span>
          </div>
          <div className="sidebar-user-actions">
            <NavLink
              to={role === 'admin' ? '/admin/settings' : role === 'mentor' ? '/mentor/profile' : '/settings'}
              className="sidebar-mini-icon-btn"
              title="Settings"
              onClick={onClose}
            >
              <Settings size={15} />
            </NavLink>
            <button
              type="button"
              className="sidebar-mini-icon-btn danger"
              title="Log Out"
              onClick={handleLogout}
            >
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
