import React, { useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { getSession } from '../lib/storage';

export default function AppShell({ role, children }) {
  const [s, setS] = useState(() => getSession());
  const loc = useLocation();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    const handleAuthChange = () => setS(getSession());
    window.addEventListener('mc:auth-expired', handleAuthChange);
    window.addEventListener('storage', handleAuthChange);
    return () => {
      window.removeEventListener('mc:auth-expired', handleAuthChange);
      window.removeEventListener('storage', handleAuthChange);
    };
  }, []);

  // Global compact mode synchronization
  useEffect(() => {
    const isCompact =
      localStorage.getItem('mc_compact_mode') === 'true' || Boolean(s?.settings?.compactMode);
    document.body.classList.toggle('compact-mode', Boolean(isCompact));
  }, [s]);

  if (!s) return <Navigate to="/login" state={{ from: loc.pathname }} replace />;
  if (role && s.role !== role)
    return (
      <Navigate
        to={s.role === 'admin' ? '/admin' : s.role === 'mentor' ? '/mentor' : '/student'}
        replace
      />
    );

  return (
    <div className="app-shell">
      <Sidebar role={role} isOpen={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />
      {mobileNavOpen && (
        <button
          className="sidebar-backdrop"
          aria-label="Close navigation"
          onClick={() => setMobileNavOpen(false)}
        />
      )}
      <main className="main" id="main-content">
        <Topbar onMenuToggle={() => setMobileNavOpen((open) => !open)} />
        <div className="page">{children}</div>
      </main>
    </div>
  );
}
