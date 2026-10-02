import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Compass, Home, ArrowLeft } from 'lucide-react';
import { getSession } from '../lib/storage';

export default function NotFound() {
  const nav = useNavigate();
  const session = getSession();

  const handleDashboardRedirect = () => {
    if (!session) return nav('/');
    if (session.role === 'admin') return nav('/admin');
    if (session.role === 'mentor') return nav('/mentor');
    return nav('/student');
  };

  return (
    <div className="center-page" role="main">
      <div
        className="simple-card"
        style={{ maxWidth: 440, textAlign: 'center', padding: '36px 24px' }}
      >
        <div
          className="empty-orb"
          style={{
            background: 'var(--primary-subtle)',
            color: 'var(--primary)',
            margin: '0 auto 16px auto',
          }}
        >
          <Compass size={32} />
        </div>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: 8 }}>404</h1>
        <h2 style={{ fontSize: '1.2rem', marginBottom: 10 }}>Page Not Found</h2>
        <p
          style={{
            color: 'var(--foreground-muted)',
            fontSize: '0.92rem',
            marginBottom: 24,
            lineHeight: 1.5,
          }}
        >
          The requested page URL does not exist or may have been moved.
        </p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
          <button
            type="button"
            className="btn secondary"
            onClick={() => nav(-1)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            <ArrowLeft size={15} /> Go Back
          </button>
          <button
            type="button"
            className="btn primary"
            onClick={handleDashboardRedirect}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            <Home size={15} /> {session ? 'My Dashboard' : 'Home'}
          </button>
        </div>
      </div>
    </div>
  );
}
