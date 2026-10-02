import { describe, it, expect, beforeEach } from 'vitest';
import { scoreMatch, WEIGHTS, ALGORITHM_VERSION } from '../matching';

describe('scoreMatch with real profiles', () => {
  const student = {
    id: 's1',
    name: 'Test Student',
    skills: ['React', 'Node.js', 'Python'],
    interests: ['Web Development', 'AI'],
    goals: ['Career guidance', 'Technical skills'],
    languages: ['English', 'Hindi'],
    availability: ['Saturday 09:00-12:00', 'Sunday 13:00-16:00'],
  };

  const goodMentor = {
    id: 'm1',
    name: 'Good Mentor',
    skills: ['React', 'Node.js', 'System Design'],
    interests: ['Web Development', 'Cloud'],
    goals: ['Career guidance'],
    languages: ['English', 'Hindi'],
    availability: ['Saturday 09:00-12:00'],
    capacity: 3,
    currentMentees: 1,
  };

  const poorMentor = {
    id: 'm2',
    name: 'Poor Mentor',
    skills: ['Excel', 'Power BI'],
    interests: ['Business Intelligence'],
    goals: ['Networking'],
    languages: ['French'],
    availability: ['Monday 09:00-12:00'],
    capacity: 1,
    currentMentees: 1,
  };

  it('good mentor scores higher than poor mentor for same student', () => {
    const goodResult = scoreMatch(student, goodMentor);
    const poorResult = scoreMatch(student, poorMentor);
    expect(goodResult.score).toBeGreaterThan(poorResult.score);
  });

  it('every factor has name, rawScore, weight, contribution fields', () => {
    const result = scoreMatch(student, goodMentor);
    for (const factor of result.factors) {
      expect(factor).toHaveProperty('name');
      expect(factor).toHaveProperty('rawScore');
      expect(factor).toHaveProperty('weight');
      expect(factor).toHaveProperty('contribution');
      expect(typeof factor.rawScore).toBe('number');
      expect(typeof factor.contribution).toBe('number');
    }
  });

  it('score is the sum of all factor contributions', () => {
    const result = scoreMatch(student, goodMentor);
    const sumContributions = result.factors.reduce((acc, f) => acc + f.contribution, 0);
    expect(result.score).toBe(Math.round(sumContributions));
  });

  it('WEIGHTS sum to approximately 1.0', () => {
    const total = Object.values(WEIGHTS).reduce((a, b) => a + b, 0);
    expect(Math.abs(total - 1)).toBeLessThan(0.001);
  });

  it('includes all 6 factor dimensions', () => {
    const result = scoreMatch(student, goodMentor);
    expect(result.factors).toHaveLength(6);
    const names = result.factors.map((f) => f.name);
    expect(names).toContain('skills');
    expect(names).toContain('interests');
    expect(names).toContain('goals');
    expect(names).toContain('languages');
    expect(names).toContain('availability');
    expect(names).toContain('capacity');
  });

  it('capacity-full mentor gets 0 capacity contribution', () => {
    const result = scoreMatch(student, poorMentor);
    const capacityFactor = result.factors.find((f) => f.name === 'capacity');
    expect(capacityFactor.rawScore).toBe(0);
    expect(capacityFactor.contribution).toBe(0);
  });

  it('algorithm version is defined', () => {
    expect(ALGORITHM_VERSION).toBeTruthy();
    expect(typeof ALGORITHM_VERSION).toBe('string');
  });
});
