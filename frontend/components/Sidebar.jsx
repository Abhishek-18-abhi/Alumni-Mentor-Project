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
import { getSession, getRequests, getUsers } from '../lib/storage';
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

const SAMPLE_MENTORS = [
  {
    id: 'demo_mentor_priya',
    name: 'Priya Sharma',
    role: 'Google',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&auto=format&fit=crop&q=80',
    to: '/mentors',
  },
  {
    id: 'demo_mentor_rahul',
    name: 'Rahul Verma',
    role: 'Microsoft',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
    to: '/mentors',
  },
  {
    id: 'demo_mentor_ananya',
    name: 'Ananya Patel',
    role: 'Amazon',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=120&auto=format&fit=crop&q=80',
    to: '/mentors',
  },
  {
    id: 'demo_mentor_vikram',
    name: 'Vikram Rao',
    role: 'AWS',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
    to: '/mentors',
  },
  {
    id: 'demo_mentor_sneha',
    name: 'Sneha Reddy',
    role: 'Flipkart',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=120&auto=format&fit=crop&q=80',
    to: '/mentors',
  },
];

const SAMPLE_MENTEES = [
  {
    id: 'demo_student_arjun',
    name: 'Arjun Mehta',
    role: "BCA '25",
    avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=120&auto=format&fit=crop&q=80',
    to: '/mentor/mentees',
  },
  {
    id: 'demo_student_riya',
    name: 'Riya Gupta',
    role: "BCA '26",
    avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=120&auto=format&fit=crop&q=80',
    to: '/mentor/mentees',
  },
  {
    id: 'demo_student_devansh',
    name: 'Devansh Joshi',
    role: "BCA '25",
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80',
    to: '/mentor/mentees',
  },
  {
    id: 'demo_student_tanvi',
    name: 'Tanvi Kulkarni',
    role: "BCA '26",
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80',
    to: '/mentor/mentees',
  },
];

const SAMPLE_COORDINATORS = [
  {
    id: 'admin_1',
    name: 'Dr. K. Sharma',
    role: 'HOD BCA',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=120&auto=format&fit=crop&q=80',
    to: '/admin/administrators',
  },
  {
    id: 'admin_2',
    name: 'Prof. Verma',
    role: 'Placement',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=120&auto=format&fit=crop&q=80',
    to: '/admin/administrators',
  },
  {
    id: 'admin_3',
    name: 'Placement Cell',
    role: 'Alumni',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
    to: '/admin/users',
  },
];

function TeamMemberItem({ member, onClick }) {
  const [imgError, setImgError] = useState(false);
  const initials = member.name
    ? member.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'U';

  return (
    <div
      className="sidebar-team-item"
      onClick={onClick}
      role="button"
      tabIndex={0}
      title={`${member.name} - ${member.role}`}
    >
      <div className="sidebar-team-avatar-wrap">
        {!imgError && member.avatar ? (
          <img
            src={member.avatar}
            alt={member.name}
            className="sidebar-team-avatar"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="sidebar-team-avatar-fallback">{initials}</div>
        )}
        <span className="sidebar-team-status-dot" aria-label="Active" />
      </div>
      <span className="sidebar-team-name">{member.name}</span>
      <span className="sidebar-team-role">{member.role}</span>
    </div>
  );
}

export default function Sidebar({ role = 'student', isOpen = false, onClose = () => {} }) {
  const nav = useNavigate();
  const user = getSession();

  const handleLogout = () => {
    authLogout();
    nav('/login');
  };

  const navItems = navMaps[role] || navMaps.student;

  // Resolve team members dynamically according to project role and storage
  let sectionTitle = 'Your Mentors';
  let members = SAMPLE_MENTORS;

  try {
    const allUsers = getUsers();
    const allRequests = getRequests();

    if (role === 'student') {
      sectionTitle = 'Your Mentors';
      const acceptedReqs = allRequests.filter(
        (r) => r.studentId === user?.id && r.status === 'accepted'
      );
      const studentMentors = acceptedReqs
        .map((r) => allUsers.find((u) => u.id === r.mentorId))
        .filter(Boolean);

      if (studentMentors.length > 0) {
        members = studentMentors.map((m) => ({
          id: m.id,
          name: m.name,
          role: m.company || m.domain?.split('&')[0]?.trim() || 'Mentor',
          avatar: m.avatar || '',
          to: `/mentor/${m.id}`,
        }));
      } else {
        members = SAMPLE_MENTORS;
      }
    } else if (role === 'mentor') {
      sectionTitle = 'Your Mentees';
      const acceptedReqs = allRequests.filter(
        (r) => r.mentorId === user?.id && r.status === 'accepted'
      );
      const mentees = acceptedReqs
        .map((r) => allUsers.find((u) => u.id === r.studentId))
        .filter(Boolean);

      if (mentees.length > 0) {
        members = mentees.map((m) => ({
          id: m.id,
          name: m.name,
          role: m.course ? m.course.replace(/BCA\s*/i, '') : "BCA '25",
          avatar: m.avatar || '',
          to: '/mentor/mentees',
        }));
      } else {
        members = SAMPLE_MENTEES;
      }
    } else if (role === 'admin') {
      sectionTitle = 'Coordinators';
      members = SAMPLE_COORDINATORS;
    }
  } catch {
    // Graceful fallback to samples
  }

  const handleMemberClick = (member) => {
    onClose();
    if (member.to) {
      nav(member.to);
    } else if (role === 'mentor') {
      nav('/mentor/mentees');
    } else {
      nav('/mentors');
    }
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
          {role === 'admin' ? 'Administrator' : role === 'mentor' ? 'Alumni Mentor' : 'Student Hub'}
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="sidebar-nav">
        {navItems.map(([label, to, Icon]) => (
          <NavLink key={to} to={to} end onClick={onClose}>
            <Icon size={18} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Role-Specific Contacts / Mentors / Mentees Section */}
      <div className="sidebar-team-section">
        <div className="sidebar-section-header">{sectionTitle}</div>
        <div className="sidebar-team-list">
          {members.map((member) => (
            <TeamMemberItem
              key={member.id}
              member={member}
              onClick={() => handleMemberClick(member)}
            />
          ))}
        </div>
      </div>

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
