import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown, LogOut, UserRound, Repeat2, Shield, Plus, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getSession, getUsers } from '../lib/storage';
import { logout } from '../lib/auth';
export default function AccountMenu() {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  // Close the dropdown on outside click or Escape.
  useEffect(() => {
    if (!open) return undefined;
    const onMouseDown = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onMouseDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onMouseDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);
  const nav = useNavigate();
  const s = getSession();
  const users = getUsers();
  const roleLabel =
    s?.role === 'admin' ? 'Administrator' : s?.role === 'mentor' ? 'Alumni Mentor' : 'Student';
  const logout = () => {
    logout();
    setOpen(false);
    nav('/login');
  };
  return (
    <div className="account-wrap" ref={wrapRef}>
      <button
        className="account-trigger"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <div className="bell-placeholder">{s?.name?.[0]?.toUpperCase() || 'A'}</div>
        <div className="account-copy">
          <b>{s?.name || 'Guest'}</b>
          <span>{roleLabel}</span>
        </div>
        <ChevronDown size={17} />
      </button>
      {open && (
        <div className="account-menu">
          <div className="menu-user">
            <b>{s?.name}</b>
            <span>{s?.email}</span>
          </div>
          <button
            onClick={() => {
              setOpen(false);
              nav('/profile');
            }}
          >
            <UserRound size={17} />
            Profile
          </button>
          <button
            onClick={() => {
              setOpen(false);
              nav('/account-switcher');
            }}
          >
            <Repeat2 size={17} />
            Switch account
          </button>
          {s?.role === 'admin' && (
            <button
              onClick={() => {
                setOpen(false);
                nav('/admin/administrators');
              }}
            >
              <Shield size={17} />
              Manage administrators
            </button>
          )}
          <button
            onClick={() => {
              setOpen(false);
              nav('/account/add');
            }}
          >
            <Plus size={17} />
            Add another account
          </button>
          <button
            onClick={() => {
              setOpen(false);
              nav('/settings');
            }}
          >
            <Settings size={17} />
            Settings
          </button>
          <div className="menu-divider" />
          <button className="danger-text" onClick={logout}>
            <LogOut size={17} />
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
