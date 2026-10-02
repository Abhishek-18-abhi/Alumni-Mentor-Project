import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import StatusChip from '../../components/StatusChip';

describe('StatusChip', () => {
  it('renders correct label for pending status', () => {
    render(<StatusChip status="pending" />);
    expect(screen.getByText('Pending')).toBeInTheDocument();
  });

  it('renders correct label for accepted status', () => {
    render(<StatusChip status="accepted" />);
    expect(screen.getByText('Accepted')).toBeInTheDocument();
  });

  it('renders correct label for rejected status (shows "Declined")', () => {
    render(<StatusChip status="rejected" />);
    expect(screen.getByText('Declined')).toBeInTheDocument();
  });

  it('renders correct label for withdrawn status', () => {
    render(<StatusChip status="withdrawn" />);
    expect(screen.getByText('Withdrawn')).toBeInTheDocument();
  });

  it('renders correct label for scheduled meetings', () => {
    render(<StatusChip status="scheduled" />);
    expect(screen.getByText('Scheduled')).toBeInTheDocument();
  });

  it('renders correct label for completed status', () => {
    render(<StatusChip status="completed" />);
    expect(screen.getByText('Completed')).toBeInTheDocument();
  });

  it('renders correct label for in_progress goals', () => {
    render(<StatusChip status="in_progress" />);
    expect(screen.getByText('In Progress')).toBeInTheDocument();
  });

  it('handles unknown status gracefully by showing raw status', () => {
    render(<StatusChip status="unknown_status" />);
    expect(screen.getByText('unknown_status')).toBeInTheDocument();
  });

  it('applies sm class when size is sm', () => {
    const { container } = render(<StatusChip status="active" size="sm" />);
    expect(container.querySelector('.status-chip-sm')).toBeTruthy();
  });

  it('uses label prop over default variant label', () => {
    render(<StatusChip status="pending" label="Custom Label" />);
    expect(screen.getByText('Custom Label')).toBeInTheDocument();
    expect(screen.queryByText('Pending')).not.toBeInTheDocument();
  });
});
