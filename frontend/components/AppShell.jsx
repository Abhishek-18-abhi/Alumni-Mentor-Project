import React, { useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { getSession } from '../lib/storage';
export default function AppShell({ role, children }) {
  const s = getSession();
  const loc = useLocation();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  if (!s) return <Navigate to="/login" state={{ from: loc.pathname }} replace />;
  if (s.role !== role)
    return (
      <Navigate
        to={s.role === 'admin' ? '/admin' : s.role === 'mentor' ? '/mentor' : '/student'}
        replace
      />
    );
  return (
    <div className="app-shell">
      <Sidebar role={role} isOpen={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />
      {mobileNavOpen && <button className="sidebar-backdrop" aria-label="Close navigation" onClick={() => setMobileNavOpen(false)} />}
      <main className="main">
        <Topbar onMenuToggle={() => setMobileNavOpen((open) => !open)} />
        <div className="page">{children}</div>
      </main>
    </div>
  );
}
