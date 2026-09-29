import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, ArrowRight } from 'lucide-react';
import { MIN_PASSWORD_LENGTH } from '../lib/constants';
import Logo from '../components/Logo';
import { registerUser } from '../lib/auth';
import { getUsers } from '../lib/storage';
export default function InitialAdminSetup() {
  const nav = useNavigate();
  const [f, setF] = useState({ name: '', email: '', password: '' });
  const [e, setE] = useState('');
  if (getUsers().some((u) => u.role === 'admin'))
    return (
      <div className="center-page">
        <div className="simple-card">
          <ShieldCheck size={36} />
          <h1>Administrator setup is already complete</h1>
          <p>An administrator account already exists. Sign in with that account.</p>
          <button className="btn primary" onClick={() => nav('/login')}>
            Go to login
          </button>
        </div>
      </div>
    );
  const sub = (x) => {
    x.preventDefault();
    const r = registerUser({ ...f, role: 'admin' });
    if (!r.ok) return setE(r.error);
    nav('/admin');
  };
  return (
    <div className="center-page">
      <div className="simple-card">
        <Logo />
        <div className="eyebrow">First-time setup</div>
        <h1>Create the first administrator</h1>
        <p>This setup is available only while no administrator exists.</p>
        <form onSubmit={sub} className="form-stack">
          <label>
            Name
            <input required value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
          </label>
          <label>
            Email
            <input
              required
              type="email"
              value={f.email}
              onChange={(e) => setF({ ...f, email: e.target.value })}
            />
          </label>
          <label>
            Password
            <input
              required
              type="password"
              minLength={MIN_PASSWORD_LENGTH}
              placeholder={`At least ${MIN_PASSWORD_LENGTH} characters`}
              value={f.password}
              onChange={(e) => setF({ ...f, password: e.target.value })}
            />
          </label>
          {e && <div className="error-box">{e}</div>}
          <button className="uiverse-btn full">
            Create administrator <ArrowRight size={17} />
          </button>
        </form>
      </div>
    </div>
  );
}
