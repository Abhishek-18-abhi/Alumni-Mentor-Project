import React from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import {
  ArrowRight,
  LogIn,
  UserPlus,
  Shield,
  BriefcaseBusiness,
  GraduationCap,
} from 'lucide-react';
import AppShell from '../components/AppShell';
import PageTitle from '../components/PageTitle';
import { getSession, getUsers } from '../lib/storage';
import { logout } from '../lib/auth';
export default function AccountSwitcher() {
  const nav = useNavigate();
  const s = getSession();
  const users = getUsers();

  if (!s) {
    return <Navigate to="/login" replace />;
  }

  return (
    <AppShell role={s?.role}>
      <PageTitle
        eyebrow="Account"
        title="Switch account"
        text="Choose an account to sign in again. Each account uses its own secure server session."
      />
      <div className="account-grid">
        {users.map((u) => (
          <button
            key={u.id || u._id || u.email}
            className={`account-card ${u.id === s?.id ? 'current' : ''}`}
            onClick={() => {
              logout();
              nav('/login', { state: { email: u.email } });
            }}
          >
            <div className="account-icon">
              {u.role === 'admin' ? (
                <Shield />
              ) : u.role === 'mentor' ? (
                <BriefcaseBusiness />
              ) : (
                <GraduationCap />
              )}
            </div>
            <div>
              <b>{u.name}</b>
              <span>{u.email}</span>
              <small>
                {u.role === 'admin'
                  ? 'Administrator'
                  : u.role === 'mentor'
                    ? 'Alumni Mentor'
                    : 'Student'}{' '}
                {u.id === s?.id ? '· Current' : ''}
              </small>
            </div>
            <ArrowRight size={17} />
          </button>
        ))}
        <button className="account-card add" onClick={() => nav('/account/add')}>
          <div className="account-icon">
            <UserPlus />
          </div>
          <div>
            <b>Add another account</b>
            <span>Register a student or alumni mentor</span>
          </div>
          <ArrowRight size={17} />
        </button>
      </div>
      <div className="notice">
        <LogIn size={18} />
        <span>
          Administrator accounts cannot be created from this screen. An existing administrator must
          create additional administrators.
        </span>
      </div>
    </AppShell>
  );
}
