import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AppRoutes from '../AppRoutes';
import { setSession } from '../lib/storage';

beforeEach(() => {
  localStorage.clear();
});

describe('Role-based route redirects', () => {
  it('redirects student trying to access /admin to their dashboard', () => {
    setSession({ id: 'u1', name: 'Student', email: 'stu@test.com', role: 'student' });
    render(
      <MemoryRouter initialEntries={['/admin']}>
        <AppRoutes />
      </MemoryRouter>
    );
    // ProtectedRoute with role="admin" redirects student to /student
    // So admin-specific content should NOT render
    expect(screen.queryByText(/Administrator Platform Portal/i)).not.toBeInTheDocument();
  });

  it('redirects mentor trying to access /student to /mentor', () => {
    setSession({ id: 'u2', name: 'Mentor', email: 'men@test.com', role: 'mentor' });
    render(
      <MemoryRouter initialEntries={['/student']}>
        <AppRoutes />
      </MemoryRouter>
    );
    // ProtectedRoute with role="student" redirects mentor to /mentor
    expect(screen.queryByText(/Student Workspace/i)).not.toBeInTheDocument();
  });

  it('renders NotFound page for unknown routes when logged in', () => {
    setSession({ id: 'u3', name: 'User', email: 'u@t.com', role: 'student' });
    render(
      <MemoryRouter initialEntries={['/some/nonexistent/page']}>
        <AppRoutes />
      </MemoryRouter>
    );
    expect(screen.getByText('404')).toBeInTheDocument();
    expect(screen.getByText(/Page Not Found/i)).toBeInTheDocument();
  });

  it('renders NotFound page for unknown routes when not logged in', () => {
    render(
      <MemoryRouter initialEntries={['/random/garbage/path']}>
        <AppRoutes />
      </MemoryRouter>
    );
    // Catch-all * route renders NotFound
    expect(screen.getByText('404')).toBeInTheDocument();
  });
});
