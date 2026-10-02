import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import TabBar from '../../components/TabBar';

const sampleTabs = [
  { id: 'all', label: 'All', count: 12 },
  { id: 'pending', label: 'Pending', count: 3 },
  { id: 'accepted', label: 'Accepted', count: 5 },
];

describe('TabBar', () => {
  it('renders all tab labels', () => {
    render(<TabBar tabs={sampleTabs} activeTab="all" onChange={() => {}} />);
    expect(screen.getByText('All')).toBeInTheDocument();
    expect(screen.getByText('Pending')).toBeInTheDocument();
    expect(screen.getByText('Accepted')).toBeInTheDocument();
  });

  it('marks active tab with aria-selected=true', () => {
    render(<TabBar tabs={sampleTabs} activeTab="pending" onChange={() => {}} />);
    const buttons = screen.getAllByRole('tab');
    const pendingBtn = buttons.find((b) => b.textContent.includes('Pending'));
    expect(pendingBtn.getAttribute('aria-selected')).toBe('true');
  });

  it('calls onChange when a tab is clicked', () => {
    const handleChange = vi.fn();
    render(<TabBar tabs={sampleTabs} activeTab="all" onChange={handleChange} />);
    fireEvent.click(screen.getByText('Accepted'));
    expect(handleChange).toHaveBeenCalledWith('accepted');
  });

  it('displays count badges when count is provided', () => {
    render(<TabBar tabs={sampleTabs} activeTab="all" onChange={() => {}} />);
    expect(screen.getByText('12')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('renders with role="tablist"', () => {
    render(<TabBar tabs={sampleTabs} activeTab="all" onChange={() => {}} />);
    expect(screen.getByRole('tablist')).toBeInTheDocument();
  });
});
