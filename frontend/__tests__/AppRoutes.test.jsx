import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AppRoutes from '../AppRoutes';
import { setSession } from '../lib/storage';

beforeEach(() => {
  localStorage.clear();
});

describe('/settings route', () => {
  it('renders the Settings page for a logged-in student instead of redirecting to Landing', () => {
    setSession({ id: 'u1', name: 'Test User', email: 'test@test.com', role: 'student' });
    render(
      <MemoryRouter initialEntries={['/settings']}>
        <AppRoutes />
      </MemoryRouter>
    );
    expect(screen.getByRole('heading', { name: 'Settings' })).toBeInTheDocument();
    expect(screen.queryByText(/mentor-matching/i)).not.toBeInTheDocument();
  });

  it('redirects to /login when there is no session', () => {
    render(
      <MemoryRouter initialEntries={['/settings']}>
        <AppRoutes />
      </MemoryRouter>
    );
    // AppShell redirects unauthenticated visitors to /login
    expect(screen.getByText(/use your registered email/i)).toBeInTheDocument();
  });
});
