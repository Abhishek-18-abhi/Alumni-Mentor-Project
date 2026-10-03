import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Feedback from '../pages/shared/Feedback';
import { setSession } from '../lib/storage';

// Mock hooks
vi.mock('../hooks/useApi', () => ({
  useFeedback: () => ({
    data: [
      {
        id: 'fb1',
        fromUserId: { name: 'Aravind Student', role: 'student' },
        toUserId: { _id: 'm1', name: 'Vikram Mentor', role: 'mentor' },
        rating: 5,
        comment: 'Great guidance on system design!',
        aspects: { usefulness: 5, clarity: 5, comfort: 5 },
        createdAt: '2026-10-01T10:00:00Z',
      },
    ],
    loading: false,
    refetch: vi.fn(),
  }),
  useMeetings: () => ({
    data: [
      {
        id: 'meet1',
        studentId: { _id: 's1', name: 'Aravind Student' },
        mentorId: { _id: 'm1', name: 'Vikram Mentor', company: 'TechCorp', domain: 'Engineering' },
        status: 'completed',
        date: '2026-09-25',
        time: '10:00',
      },
    ],
  }),
  useMentorshipRequests: () => ({
    data: [
      {
        id: 'req1',
        studentId: 's1',
        mentorId: { _id: 'm1', name: 'Vikram Mentor', company: 'TechCorp', domain: 'Engineering' },
        status: 'accepted',
      },
    ],
  }),
  useUsers: () => ({
    data: [
      {
        id: 'm1',
        _id: 'm1',
        name: 'Vikram Mentor',
        role: 'mentor',
        company: 'TechCorp',
        domain: 'Engineering',
      },
      { id: 's1', _id: 's1', name: 'Aravind Student', role: 'student' },
    ],
  }),
}));

describe('Feedback Page Role-Specific UI', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('Mentor view displays ONLY reviews received from students and no mentee evaluation form', () => {
    setSession({ id: 'm1', _id: 'm1', name: 'Vikram Mentor', role: 'mentor' });

    render(
      <MemoryRouter>
        <Feedback role="mentor" />
      </MemoryRouter>
    );

    // Mentor should see student reviews
    expect(screen.getByText('Student Reviews & Feedback')).toBeInTheDocument();
    expect(screen.getByText('All Student Reviews')).toBeInTheDocument();
    expect(screen.getByText('Aravind Student')).toBeInTheDocument();
    expect(screen.getByText('"Great guidance on system design!"')).toBeInTheDocument();

    // Mentor should NOT see "Evaluate Mentee" or "Reviews you submitted"
    expect(screen.queryByText(/evaluate a mentee/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/evaluate mentee/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/your submitted reviews/i)).not.toBeInTheDocument();
  });

  it('Student view displays mentor selector and rating submission form', () => {
    setSession({ id: 's1', _id: 's1', name: 'Aravind Student', role: 'student' });

    render(
      <MemoryRouter>
        <Feedback role="student" />
      </MemoryRouter>
    );

    // Student should see feedback form
    expect(screen.getByText('Mentor Feedback & Reviews')).toBeInTheDocument();
    expect(screen.getByText('Rate Your Mentor')).toBeInTheDocument();
    expect(screen.getByText(/choose mentor/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /submit feedback to mentor/i })).toBeInTheDocument();

    // Student should NOT see mentor evaluation text
    expect(screen.queryByText(/evaluate mentee/i)).not.toBeInTheDocument();
  });
});
