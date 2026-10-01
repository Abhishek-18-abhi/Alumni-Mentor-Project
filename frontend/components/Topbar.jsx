import React, { useEffect, useState } from 'react';
import { Bell, Search, X, Menu } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import AccountMenu from './AccountMenu';
import { getNotifications, getSession, NOTIFICATIONS_CHANGED_EVENT } from '../lib/storage';
export default function Topbar({ onMenuToggle = () => {} }) {
  const nav = useNavigate();
  const loc = useLocation();
  const s = getSession();
  const [q, setQ] = useState('');
  const [unread, setUnread] = useState(0);
  useEffect(() => {
    const refresh = () =>
      setUnread(getNotifications().filter((n) => n.userId === s?.id && !n.read).length);
    refresh();
    // Same-tab changes (accepting a request, admin broadcast) and cross-tab changes
    // (the native `storage` event, which fires only in *other* tabs) both update the badge live.
    window.addEventListener(NOTIFICATIONS_CHANGED_EVENT, refresh);
    window.addEventListener('storage', refresh);
    return () => {
      window.removeEventListener(NOTIFICATIONS_CHANGED_EVENT, refresh);
      window.removeEventListener('storage', refresh);
    };
  }, [loc.pathname, s?.id]);
  const submit = (e) => {
    e.preventDefault();
    if (q.trim()) nav(`/mentors?search=${encodeURIComponent(q.trim())}`);
  };
  return (
    <header className="topbar">
      <button className="mobile-menu-btn" onClick={onMenuToggle} aria-label="Open navigation">
        <Menu size={21} />
      </button>
      <form className="global-search" onSubmit={submit}>
        <Search className="search-icon" size={17} />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search mentors, skills or domains..."
        />
        {q && (
          <button type="button" className="clear-search" onClick={() => setQ('')} aria-label="Clear search">
            <X size={14} />
          </button>
        )}
      </form>
      <div className="top-actions">
        <button
          className="icon-btn bell-btn"
          onClick={() => nav('/notifications')}
          aria-label="Notifications"
        >
          <Bell size={20} />
          {unread > 0 && <span className="notification-badge">{unread > 9 ? '9+' : unread}</span>}
        </button>
        <AccountMenu />
      </div>
    </header>
  );
}
