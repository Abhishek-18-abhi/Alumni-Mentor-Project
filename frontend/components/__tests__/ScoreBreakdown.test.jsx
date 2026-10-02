import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ScoreBreakdown from '../../components/ScoreBreakdown';

const sampleFactors = [
  {
    name: 'skills',
    rawScore: 80,
    weight: 0.45,
    contribution: 36,
    matchedItems: ['React', 'Node.js'],
    explanation: 'Shared skills: React, Node.js (2 of 3).',
  },
  {
    name: 'interests',
    rawScore: 50,
    weight: 0.2,
    contribution: 10,
    matchedItems: ['Web Dev'],
    explanation: 'Shared interests: Web Dev (1 of 2).',
  },
  {
    name: 'goals',
    rawScore: 100,
    weight: 0.15,
    contribution: 15,
    matchedItems: ['Career guidance'],
    explanation: 'Shared goals: Career guidance (1 of 1).',
  },
  {
    name: 'languages',
    rawScore: 100,
    weight: 0.1,
    contribution: 10,
    matchedItems: ['English'],
    explanation: 'Shared languages: English (1 of 1).',
  },
  {
    name: 'availability',
    rawScore: 60,
    weight: 0.05,
    contribution: 3,
    matchedItems: [],
    explanation: '3 overlapping slots.',
  },
  {
    name: 'capacity',
    rawScore: 100,
    weight: 0.05,
    contribution: 5,
    matchedItems: [],
    explanation: 'Mentor has 2 open slots.',
  },
];

describe('ScoreBreakdown', () => {
  it('renders all factor labels and their contributions', () => {
    render(<ScoreBreakdown factors={sampleFactors} />);
    // Check for the human-readable labels (FACTOR_LABELS in ScoreBreakdown.jsx)
    expect(screen.getByText(/Technical Skills Overlap/)).toBeInTheDocument();
    expect(screen.getByText(/Academic & Career Interests/)).toBeInTheDocument();
    expect(screen.getByText(/Mentorship Goals Alignment/)).toBeInTheDocument();
    expect(screen.getByText(/Communication Languages/)).toBeInTheDocument();
    expect(screen.getByText(/Schedule Slot Overlap/)).toBeInTheDocument();
    expect(screen.getByText(/Mentor Active Capacity/)).toBeInTheDocument();
  });

  it('renders explanations for each factor', () => {
    render(<ScoreBreakdown factors={sampleFactors} />);
    expect(screen.getByText('Shared skills: React, Node.js (2 of 3).')).toBeInTheDocument();
    expect(screen.getByText('Shared interests: Web Dev (1 of 2).')).toBeInTheDocument();
    expect(screen.getByText('Mentor has 2 open slots.')).toBeInTheDocument();
  });

  it('renders total score header when score prop is provided', () => {
    render(<ScoreBreakdown factors={sampleFactors} score={79} />);
    expect(screen.getByText('79%')).toBeInTheDocument();
    expect(screen.getByText('Total Explainable Score')).toBeInTheDocument();
  });

  it('renders gracefully with empty factors array', () => {
    render(<ScoreBreakdown factors={[]} />);
    expect(screen.getByText(/No factor breakdown available/)).toBeInTheDocument();
  });

  it('renders gracefully with undefined factors', () => {
    render(<ScoreBreakdown />);
    expect(screen.getByText(/No factor breakdown available/)).toBeInTheDocument();
  });
});
