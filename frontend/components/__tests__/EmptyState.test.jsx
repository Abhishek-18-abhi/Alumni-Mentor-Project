import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import EmptyState from '../../components/EmptyState';

describe('EmptyState', () => {
  it('renders title and message', () => {
    render(<EmptyState title="No data" text="Nothing to show here." />);
    expect(screen.getByText('No data')).toBeInTheDocument();
    expect(screen.getByText('Nothing to show here.')).toBeInTheDocument();
  });

  it('renders action button when actionLabel is provided', () => {
    const mockFn = () => {};
    render(<EmptyState title="Empty" text="Test" actionLabel="Click Me" onAction={mockFn} />);
    expect(screen.getByText('Click Me')).toBeInTheDocument();
  });

  it('renders without action button when no actionLabel', () => {
    render(<EmptyState title="Empty" text="Test" />);
    expect(screen.queryByRole('button')).toBeNull();
  });
});
