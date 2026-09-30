import { describe, it, expect } from 'vitest';
import { scoreMatch, WEIGHTS } from '../matching';

const baseStudent = {
  skills: ['React', 'Node.js'],
  interests: ['Web Development'],
  goals: ['Career guidance'],
  languages: ['English'],
  availability: ['Monday 09:00-12:00'],
};

const baseMentor = {
  skills: ['React', 'Node.js'],
  interests: ['Web Development'],
  goals: ['Career guidance'],
  languages: ['English'],
  availability: ['Monday 09:00-12:00'],
  capacity: 3,
  currentMentees: 0,
};

describe('scoreMatch', () => {
  it('gives a high score for full overlap with open capacity', () => {
    const result = scoreMatch(baseStudent, baseMentor);
    expect(result.score).toBeGreaterThanOrEqual(95);
    expect(result.matched).toEqual(['react', 'node.js']);
    expect(result.capacity).toBe(true);
  });

  it('gives only the capacity points when nothing else overlaps', () => {
    const student = {
      ...baseStudent,
      skills: ['Python'],
      interests: ['AI / ML'],
      goals: ['Networking'],
      languages: ['Hindi'],
      availability: ['Tuesday 13:00-16:00'],
    };
    const result = scoreMatch(student, baseMentor);
    const expectedCapacityPoints = Math.round(100 * WEIGHTS.capacity);
    expect(result.score).toBe(expectedCapacityPoints);
    expect(result.matched).toEqual([]);
  });

  it('gives no capacity points when the mentor is full', () => {
    const fullMentor = { ...baseMentor, currentMentees: 3 };
    const result = scoreMatch(baseStudent, fullMentor);
    const capacityFactor = result.factors.find((f) => f.name === 'capacity');
    expect(capacityFactor.rawScore).toBe(0);
    expect(result.capacity).toBe(false);
  });

  it('does not crash on empty or missing profiles', () => {
    expect(() => scoreMatch({}, {})).not.toThrow();
    expect(() => scoreMatch(undefined, undefined)).not.toThrow();
    const result = scoreMatch({}, {});
    expect(result.score).toBe(0);
  });

  it('sums factor contributions to the overall score (within rounding)', () => {
    const result = scoreMatch(baseStudent, baseMentor);
    const total = result.factors.reduce((sum, f) => sum + f.contribution, 0);
    expect(Math.abs(total - result.score)).toBeLessThanOrEqual(1);
  });

  it('caps the score at 100 even if contributions would exceed it', () => {
    const result = scoreMatch(baseStudent, baseMentor);
    expect(result.score).toBeLessThanOrEqual(100);
  });
});
