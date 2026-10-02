import React, { useEffect, useState } from 'react';
import { Bell, Search, X, PanelLeft, ChevronRight } from 'lucide-react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import AccountMenu from './AccountMenu';
import { getSession } from '../lib/storage';
import { apiGet } from '../lib/api';

const ROUTE_LABELS = {
  '/student': { section: 'Student', label: 'Dashboard' },
  '/mentors': { section: 'Student', label: 'Find Mentor' },
  '/matches': { section: 'Student', label: 'My Matches' },
  '/calendar': { section: 'Student', label: 'Calendar' },
  '/mentor': { section: 'Mentor', label: 'Dashboard' },
  '/mentor/requests': { section: 'Mentor', label: 'Requests' },
  '/mentor/mentees': { section: 'Mentor', label: 'Active Mentees' },
  '/mentor/calendar': { section: 'Mentor', label: 'Availability Matrix' },
  '/mentor/meetings': { section: 'Mentor', label: 'Meetings' },
  '/mentor/goals': { section: 'Mentor', label: 'Goals' },
  '/mentor/feedback': { section: 'Mentor', label: 'Feedback' },
  '/mentor/profile': { section: 'Mentor', label: 'Profile' },
  '/admin': { section: 'Administration', label: 'Overview' },
  '/admin/users': { section: 'Administration', label: 'Users' },
  '/admin/matching': { section: 'Administration', label: 'Matching Algorithm' },
  '/admin/analytics': { section: 'Administration', label: 'Analytics' },
  '/admin/audit': { section: 'Administration', label: 'Audit Logs' },
  '/admin/administrators': { section: 'Administration', label: 'Administrators' },
  '/admin/notifications': { section: 'Administration', label: 'Broadcasts' },
  '/admin/settings': { section: 'Administration', label: 'System Settings' },
  '/meetings': { section: 'Mentorship', label: 'Meetings' },
  '/goals': { section: 'Mentorship', label: 'Milestone Goals' },
  '/feedback': { section: 'Mentorship', label: '360° Feedback' },
  '/notifications': { section: 'Account', label: 'Notifications' },
  '/settings': { section: 'Account', label: 'Settings' },
  '/profile': { section: 'Account', label: 'Profile' },
};

export default function Topbar({ onMenuToggle = () => {} }) {
  const nav = useNavigate();
  const loc = useLocation();
  const s = getSession();
  const [q, setQ] = useState('');
  const [unread, setUnread] = useState(0);

  // Fetch unread count from API
  useEffect(() => {
    let active = true;
    const fetchUnread = () => {
      apiGet('/notifications')
        .then((res) => {
          if (active && res?.notifications) {
            const count = res.notifications.filter((n) => !n.read).length;
            setUnread(count);
          }
        })
        .catch(() => {
          // ignore background notification errors
        });
    };

    fetchUnread();
    const interval = setInterval(fetchUnread, 30000); // 30s background poll
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [loc.pathname]);

  // Role-aware search routing
  const submit = (e) => {
    e.preventDefault();
    const query = q.trim();
    if (!query) return;

    if (s?.role === 'admin') {
      nav(`/admin/users?search=${encodeURIComponent(query)}`);
    } else if (s?.role === 'mentor') {
      nav(`/mentor/requests?search=${encodeURIComponent(query)}`);
    } else {
      nav(`/mentors?search=${encodeURIComponent(query)}`);
    }
  };

  const getSearchPlaceholder = () => {
    if (s?.role === 'admin') return 'Search users, emails, or roles...';
    if (s?.role === 'mentor') return 'Search mentorship requests...';
    return 'Search mentors, skills, or domains...';
  };

  // Breadcrumbs computation
  const currentRouteMeta = ROUTE_LABELS[loc.pathname] || {
    section: s?.role ? s.role.charAt(0).toUpperCase() + s.role.slice(1) : 'App',
    label: loc.pathname.split('/').filter(Boolean).pop() || 'Page',
  };

  return (
    <header className="topbar">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button className="mobile-menu-btn" onClick={onMenuToggle} aria-label="Open navigation">
          <PanelLeft size={20} />
        </button>

        {/* Accessible Breadcrumbs */}
        <nav
          aria-label="Breadcrumbs"
          className="breadcrumbs-nav"
          style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem' }}
        >
          <span style={{ color: 'var(--foreground-muted)' }}>{currentRouteMeta.section}</span>
          <ChevronRight size={13} style={{ color: 'var(--foreground-muted)' }} />
          <span style={{ fontWeight: 600, color: 'var(--foreground)' }}>
            {currentRouteMeta.label}
          </span>
        </nav>
      </div>

      {/* Role-Aware Global Search Bar */}
      <form className="global-search" onSubmit={submit}>
        <Search className="search-icon" size={17} />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={getSearchPlaceholder()}
          aria-label={getSearchPlaceholder()}
        />
        {q && (
          <button
            type="button"
            className="clear-search"
            onClick={() => setQ('')}
            aria-label="Clear search query"
          >
            <X size={14} />
          </button>
        )}
      </form>

      <div className="top-actions">
        <button
          className="icon-btn bell-btn"
          onClick={() => nav('/notifications')}
          aria-label="Notifications"
          title={`${unread} unread notifications`}
        >
          <Bell size={19} />
          {unread > 0 && (
            <span className="notification-badge" role="status" aria-label={`${unread} unread`}>
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </button>

        <AccountMenu />
      </div>
    </header>
  );
}
