import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  CalendarDays,
  MessageSquare,
  Target,
  Star,
  UserRound,
  Sparkles,
  ClipboardList,
  BarChart3,
  ShieldCheck,
  Settings,
  UserCog,
  Bell,
  ArrowRight,
  LogOut,
} from 'lucide-react';
import Logo from './Logo';
import { getSession } from '../lib/storage';
import { logout as authLogout } from '../lib/auth';

const maps = {
  student: [
    ['Dashboard', '/student', LayoutDashboard],
    ['Find Mentor', '/mentors', Users],
    ['My Matches', '/matches', Sparkles],
    ['Calendar', '/calendar', CalendarDays],
    ['Meetings', '/meetings', MessageSquare],
    ['Goals', '/goals', Target],
    ['Feedback', '/feedback', Star],
    ['Profile', '/profile', UserRound],
  ],
  mentor: [
    ['Dashboard', '/mentor', LayoutDashboard],
    ['Requests', '/mentor/requests', ClipboardList],
    ['My Mentees', '/mentor/mentees', Users],
    ['Calendar', '/mentor/calendar', CalendarDays],
    ['Meetings', '/mentor/meetings', MessageSquare],
    ['Goals', '/mentor/goals', Target],
    ['Feedback', '/mentor/feedback', Star],
    ['Profile', '/mentor/profile', UserRound],
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

export default function Sidebar({ role, isOpen = false, onClose = () => {} }) {
  const nav = useNavigate();
  const user = getSession();

  const handleLogout = () => {
    authLogout();
    nav('/login');
  };

  return (
    <aside className={`sidebar${isOpen ? ' mobile-open' : ''}`}>
      {/* Top Header Branding & Role */}
      <div className="sidebar-header">
        <Logo size={32} />
        <div className="sidebar-role-badge">
          <span className="role-pulse" />
          {role === 'admin' ? 'Administrator' : role === 'mentor' ? 'Alumni Mentor' : 'Student Hub'}
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="sidebar-nav">
        {maps[role].map(([label, to, Icon]) => (
          <NavLink key={to} to={to} end onClick={onClose}>
            <Icon size={18} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Interactive Middle Widget (Fills empty space with high-value actions) */}
      <div className="sidebar-middle-section">
        {role === 'student' && (
          <div className="sidebar-widget">
            <div className="widget-header">
              <div className="widget-icon">
                <Sparkles size={14} />
              </div>
              <span className="widget-title">Match Engine</span>
              <span className="widget-tag">94% Max</span>
            </div>
            <p className="widget-copy">
              Multi-factor matching active across skills, goals & availability.
            </p>
            <div className="widget-meter">
              <div className="widget-meter-label">
                <span>Algorithm Readiness</span>
                <b>Active</b>
              </div>
              <div className="widget-bar">
                <div className="widget-bar-fill" style={{ width: '92%' }} />
              </div>
            </div>
            <NavLink to="/mentors" className="widget-action-btn" onClick={onClose}>
              Find Mentors <ArrowRight size={13} />
            </NavLink>
          </div>
        )}

        {role === 'mentor' && (
          <div className="sidebar-widget">
            <div className="widget-header">
              <div className="widget-icon">
                <Target size={14} />
              </div>
              <span className="widget-title">Mentorship Capacity</span>
              <span className="widget-tag">Open</span>
            </div>
            <p className="widget-copy">
              Your mentee availability slots are live for student booking.
            </p>
            <div className="widget-meter">
              <div className="widget-meter-label">
                <span>Capacity Utilized</span>
                <b>2 Active</b>
              </div>
              <div className="widget-bar">
                <div className="widget-bar-fill" style={{ width: '50%' }} />
              </div>
            </div>
            <NavLink to="/mentor/calendar" className="widget-action-btn" onClick={onClose}>
              Manage Slots <ArrowRight size={13} />
            </NavLink>
          </div>
        )}

        {role === 'admin' && (
          <div className="sidebar-widget">
            <div className="widget-header">
              <div className="widget-icon">
                <ShieldCheck size={14} />
              </div>
              <span className="widget-title">System Health</span>
              <span
                className="widget-tag"
                style={{
                  background: 'var(--success-surface)',
                  color: 'var(--success-text)',
                  borderColor: 'var(--success-border)',
                }}
              >
                Active
              </span>
            </div>
            <p className="widget-copy">
              Platform verified. Coordinator audit logging enabled.
            </p>
            <NavLink to="/admin/analytics" className="widget-action-btn" onClick={onClose}>
              View Analytics <ArrowRight size={13} />
            </NavLink>
          </div>
        )}
      </div>

      {/* Interactive Bottom User Profile Card (shadcn Sidebar Footer) */}
      <div className="sidebar-footer">
        <div className="sidebar-user-card">
          <div className="sidebar-user-avatar">
            {user?.name?.[0]?.toUpperCase() || 'U'}
          </div>
          <div className="sidebar-user-info">
            <b>{user?.name || 'Account'}</b>
            <span>{user?.email || (role === 'admin' ? 'Coordinator' : 'Verified User')}</span>
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
