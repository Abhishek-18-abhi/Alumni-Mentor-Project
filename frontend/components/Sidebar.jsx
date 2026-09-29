import React from 'react';
import { NavLink } from 'react-router-dom';
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
} from 'lucide-react';
import Logo from './Logo';
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
  return (
    <aside className={`sidebar${isOpen ? ' mobile-open' : ''}`}>
      <Logo />
      <div className="role-label">
        {role === 'admin' ? 'Administrator' : role === 'mentor' ? 'Alumni Mentor' : 'Student'}
      </div>
      <nav>
        {maps[role].map(([label, to, Icon]) => (
          <NavLink key={to} to={to} end onClick={onClose}>
            <Icon size={18} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="sidebar-note">
        Account actions are available from the top-right profile menu.
      </div>
    </aside>
  );
}
