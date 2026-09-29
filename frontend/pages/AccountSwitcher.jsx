import React from 'react';
import { useNavigate } from 'react-router-dom';
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
import { getSession, getUsers, setSession } from '../lib/storage';
export default function AccountSwitcher() {
  const nav = useNavigate();
  const s = getSession();
  const users = getUsers();
  return (
    <AppShell role={s.role}>
      <PageTitle
        eyebrow="Account"
        title="Switch account"
        text="Choose from accounts that have actually been created in this browser."
      />
      <div className="account-grid">
        {users.map((u) => (
          <button
            key={u.id}
            className={`account-card ${u.id === s.id ? 'current' : ''}`}
            onClick={() => {
              setSession({ id: u.id, name: u.name, email: u.email, role: u.role });
              nav(u.role === 'admin' ? '/admin' : u.role === 'mentor' ? '/mentor' : '/student');
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
                {u.id === s.id ? '· Current' : ''}
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
