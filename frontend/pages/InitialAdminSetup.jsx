import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, ArrowRight, Eye, EyeOff, Loader2 } from 'lucide-react';
import { MIN_PASSWORD_LENGTH } from '../lib/constants';
import Logo from '../components/Logo';
import { setupAdmin } from '../lib/auth';
import { apiGet } from '../lib/api';

export default function InitialAdminSetup() {
  const nav = useNavigate();
  const [f, setF] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [adminExists, setAdminExists] = useState(false);

  useEffect(() => {
    let active = true;
    apiGet('/auth/setup-status')
      .then((res) => {
        if (active) {
          setAdminExists(Boolean(res?.adminExists));
          setCheckingStatus(false);
        }
      })
      .catch((err) => {
        if (active) {
          console.warn('Failed to verify setup status:', err.message);
          setCheckingStatus(false);
        }
      });
    return () => {
      active = false;
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    setError('');

    if (f.password !== f.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (f.password.length < MIN_PASSWORD_LENGTH) {
      setError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
      return;
    }

    setIsSubmitting(true);
    try {
      const r = await setupAdmin({
        name: f.name,
        email: f.email,
        password: f.password,
      });
      if (!r.ok) {
        setF((prev) => ({ ...prev, password: '', confirmPassword: '' }));
        return setError(r.error);
      }
      nav('/admin');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (checkingStatus) {
    return (
      <div className="center-page" role="status" aria-live="polite">
        <div className="simple-card" style={{ maxWidth: 400, textAlign: 'center', padding: 32 }}>
          <Loader2 size={32} className="spin" style={{ margin: '0 auto 12px' }} />
          <h2>Checking Platform Status...</h2>
          <p style={{ color: 'var(--foreground-muted)' }}>Verifying administrator setup state...</p>
        </div>
      </div>
    );
  }

  if (adminExists) {
    return (
      <div className="center-page">
        <div className="simple-card" style={{ maxWidth: 440, textAlign: 'center', padding: 32 }}>
          <div
            className="empty-orb"
            style={{
              background: 'var(--primary-subtle)',
              color: 'var(--primary)',
              margin: '0 auto 16px',
            }}
          >
            <ShieldCheck size={32} />
          </div>
          <h1 style={{ fontSize: '1.4rem', marginBottom: 8 }}>Administrator Setup Complete</h1>
          <p
            style={{
              color: 'var(--foreground-muted)',
              fontSize: '0.92rem',
              marginBottom: 24,
              lineHeight: 1.5,
            }}
          >
            An administrator account already exists on this platform. Please sign in using your
            administrator credentials.
          </p>
          <button className="uiverse-btn full" onClick={() => nav('/admin/login')}>
            Go to administrator sign in
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="center-page">
      <div className="simple-card" style={{ maxWidth: 460 }}>
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <Logo />
          <div className="eyebrow" style={{ marginTop: 12 }}>
            First-Time Setup
          </div>
          <h1 style={{ fontSize: '1.5rem', marginTop: 4 }}>Create Platform Administrator</h1>
          <p style={{ color: 'var(--foreground-muted)', fontSize: '0.9rem' }}>
            Initialize the primary institutional administrator account.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="form-stack">
          <label>
            Full Name
            <input
              required
              autoComplete="name"
              placeholder="e.g. Dr. Jane Smith"
              value={f.name}
              onChange={(e) => setF({ ...f, name: e.target.value })}
            />
          </label>

          <label>
            Institutional Email
            <input
              required
              type="email"
              autoComplete="email"
              placeholder="admin@college.edu"
              value={f.email}
              onChange={(e) => setF({ ...f, email: e.target.value })}
            />
          </label>

          <label>
            Master Password
            <div className="password-input-wrap" style={{ position: 'relative', width: '100%' }}>
              <input
                required
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                minLength={MIN_PASSWORD_LENGTH}
                placeholder={`At least ${MIN_PASSWORD_LENGTH} characters`}
                value={f.password}
                onChange={(e) => setF({ ...f, password: e.target.value })}
                style={{ width: '100%', boxSizing: 'border-box', paddingRight: 42 }}
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </label>

          <label>
            Confirm Password
            <div className="password-input-wrap" style={{ position: 'relative', width: '100%' }}>
              <input
                required
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                minLength={MIN_PASSWORD_LENGTH}
                placeholder="Re-enter password"
                value={f.confirmPassword}
                onChange={(e) => setF({ ...f, confirmPassword: e.target.value })}
                style={{ width: '100%', boxSizing: 'border-box', paddingRight: 42 }}
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </label>

          {error && (
            <div className="error-box" role="alert" aria-live="assertive">
              {error}
            </div>
          )}

          <button className="uiverse-btn full" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Creating administrator...' : 'Create platform administrator'}{' '}
            <ArrowRight size={17} />
          </button>
        </form>
      </div>
    </div>
  );
}
