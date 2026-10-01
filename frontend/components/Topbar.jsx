import React, { useEffect, useState } from 'react';
import { Bell, Search, X, PanelLeft, Calendar, ChevronDown, Plus, Download } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import AccountMenu from './AccountMenu';
import { getNotifications, getSession, NOTIFICATIONS_CHANGED_EVENT, getUsers } from '../lib/storage';
import { downloadCsv } from '../lib/exportUtils';

export default function Topbar({ onMenuToggle = () => {} }) {
  const nav = useNavigate();
  const loc = useLocation();
  const s = getSession();
  const [q, setQ] = useState('');
  const [unread, setUnread] = useState(0);
  const [dateRange, setDateRange] = useState('Jan 1, 2025 - Feb 1, 2025');

  useEffect(() => {
    const refresh = () =>
      setUnread(getNotifications().filter((n) => n.userId === s?.id && !n.read).length);
    refresh();
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

  const handleExport = () => {
    try {
      const users = getUsers();
      const rows = users.map((u) => [
        u.name || 'Anonymous',
        u.role || 'Member',
        u.company || u.course || 'BCA',
        u.profileComplete ? 'Active' : 'Pending',
      ]);
      downloadCsv(
        `mentorconnect_report_${new Date().toISOString().slice(0, 10)}.csv`,
        ['Name', 'Role', 'Domain/Company', 'Status'],
        rows
      );
    } catch {
      // fallback gracefully
    }
  };

  const handleAddWidget = () => {
    window.dispatchEvent(new CustomEvent('open-add-widget'));
  };

  return (
    <header className="topbar">
      <button className="mobile-menu-btn" onClick={onMenuToggle} aria-label="Open navigation">
        <PanelLeft size={20} />
      </button>

      <form className="global-search" onSubmit={submit}>
        <Search className="search-icon" size={17} />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search mentors, skills or domains..."
        />
        {q ? (
          <button type="button" className="clear-search" onClick={() => setQ('')} aria-label="Clear search">
            <X size={14} />
          </button>
        ) : (
          <span className="search-shortcut-badge">⌘K</span>
        )}
      </form>

      <div className="top-actions">
        {/* Date Filter Pill */}
        <div
          className="topbar-filter-pill"
          title="Date Range"
          role="button"
          tabIndex={0}
          onClick={() => {
            const ranges = ['Jan 1, 2025 - Feb 1, 2025', 'Last 30 Days', 'This Quarter', 'Year to Date'];
            const nextIdx = (ranges.indexOf(dateRange) + 1) % ranges.length;
            setDateRange(ranges[nextIdx]);
          }}
        >
          <Calendar size={14} />
          <span>{dateRange}</span>
          <ChevronDown size={13} />
        </div>

        {/* Add Widget Button */}
        <button
          type="button"
          className="topbar-btn primary"
          onClick={handleAddWidget}
          title="Customize dashboard widgets"
        >
          <Plus size={15} />
          <span>Add widget</span>
        </button>

        {/* Export Button */}
        <button
          type="button"
          className="topbar-btn outline"
          onClick={handleExport}
          title="Export report CSV"
        >
          <Download size={14} />
          <span>Export</span>
        </button>

        <button
          className="icon-btn bell-btn"
          onClick={() => nav('/notifications')}
          aria-label="Notifications"
        >
          <Bell size={19} />
          {unread > 0 && <span className="notification-badge">{unread > 9 ? '9+' : unread}</span>}
        </button>

        <AccountMenu />
      </div>
    </header>
  );
}
