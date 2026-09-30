import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, ArrowRight } from 'lucide-react';
import { MIN_PASSWORD_LENGTH } from '../lib/constants';
import Logo from '../components/Logo';
import { setupAdmin } from '../lib/auth';
import { apiGet } from '../lib/api';

export default function InitialAdminSetup() {
  const nav = useNavigate();
  const [f, setF] = useState({ name: '', email: '', password: '', setupToken: '' });
  const [e, setE] = useState('');
  const [loading, setLoading] = useState(true);
  const [needsSetup, setNeedsSetup] = useState(false);

  useEffect(() => {
    let cancelled = false;
    apiGet('/auth/setup-status')
      .then((result) => {
        if (!cancelled) {
          setNeedsSetup(Boolean(result?.needsSetup));
          setLoading(false);
        }
      })
      .catch((error) => {
        if (!cancelled) {
          setE(error.message || 'Unable to check administrator setup status.');
          setLoading(false);
        }
      });
    return () => { cancelled = true; };
  }, []);

  const sub = async (x) => {
    x.preventDefault();
    setE('');
    const r = await setupAdmin(f);
    if (!r.ok) return setE(r.error);
    nav('/admin');
  };

  if (loading) return <div className="center-page"><div className="simple-card"><ShieldCheck size={36} /><h1>Checking administrator setup</h1><p>Please wait while we verify whether first-time setup is available.</p></div></div>;

  if (!needsSetup) return <div className="center-page"><div className="simple-card"><ShieldCheck size={36} /><h1>Administrator setup is already complete</h1><p>An administrator account already exists, or first-time setup is not configured.</p><button className="btn primary" onClick={() => nav('/login')}>Go to login</button></div></div>;

  return (
    <div className="center-page">
      <div className="simple-card">
        <Logo />
        <div className="eyebrow">First-time setup</div>
        <h1>Create the first administrator</h1>
        <p>Enter the one-time setup token provided by the project owner.</p>
        <form onSubmit={sub} className="form-stack">
          <label>Name<input required value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></label>
          <label>Email<input required type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></label>
          <label>Password<input required type="password" minLength={MIN_PASSWORD_LENGTH} placeholder={`At least ${MIN_PASSWORD_LENGTH} characters`} value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} /></label>
          <label>One-time setup token<input required type="password" autoComplete="off" value={f.setupToken} onChange={(e) => setF({ ...f, setupToken: e.target.value })} /></label>
          {e && <div className="error-box">{e}</div>}
          <button className="uiverse-btn full" type="submit">Create administrator <ArrowRight size={17} /></button>
        </form>
      </div>
    </div>
  );
}
