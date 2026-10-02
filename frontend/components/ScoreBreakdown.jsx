import React from 'react';
import { WEIGHTS } from '../lib/matching';

const FACTOR_LABELS = {
  skills: 'Technical Skills Overlap',
  interests: 'Academic & Career Interests',
  goals: 'Mentorship Goals Alignment',
  languages: 'Communication Languages',
  availability: 'Schedule Slot Overlap',
  capacity: 'Mentor Active Capacity',
};

/**
 * Reusable ScoreBreakdown component
 * Displays transparent multi-factor explanation bars calculated server-side or by scoreMatch()
 * @param {{
 *   factors?: Array<{
 *     name: string,
 *     rawScore: number,
 *     weight: number,
 *     contribution: number,
 *     matchedItems?: string[],
 *     explanation?: string
 *   }>,
 *   score?: number,
 *   compact?: boolean,
 *   className?: string
 * }} props
 */
export default function ScoreBreakdown({ factors = [], score, compact = false, className = '' }) {
  if (!factors || factors.length === 0) {
    return (
      <div className={`score-breakdown empty ${className}`.trim()}>
        <p style={{ color: 'var(--foreground-muted)', fontSize: '0.85rem' }}>
          No factor breakdown available for this match.
        </p>
      </div>
    );
  }

  return (
    <div className={`score-breakdown ${compact ? 'compact' : ''} ${className}`.trim()}>
      {score !== undefined && (
        <div className="score-breakdown-header" style={{ marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>Total Explainable Score</span>
            <span className="match-score" style={{ fontSize: '1rem', fontWeight: 700 }}>
              {Math.round(score)}%
            </span>
          </div>
          <div className="sim-bar" style={{ width: '100%', marginTop: 6 }}>
            <div
              className="sim-bar-fill"
              style={{ width: `${Math.min(100, Math.max(0, score))}%` }}
            />
          </div>
        </div>
      )}

      <div className="factors-list" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {factors.map((f) => {
          const weightPercent = Math.round((f.weight || WEIGHTS[f.name] || 0) * 100);
          const raw = Math.round(f.rawScore || 0);
          const contribution =
            f.contribution !== undefined ? f.contribution : Math.round((raw * weightPercent) / 100);
          const label = FACTOR_LABELS[f.name] || f.name;

          return (
            <div key={f.name} className="factor-row">
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: 3,
                  fontSize: '0.84rem',
                }}
              >
                <span style={{ fontWeight: 600, color: 'var(--foreground)' }}>
                  {label}{' '}
                  <small style={{ color: 'var(--foreground-muted)' }}>
                    ({weightPercent}% weight)
                  </small>
                </span>
                <span style={{ fontWeight: 700, color: 'var(--primary)' }}>
                  +{contribution} pts{' '}
                  <small style={{ color: 'var(--foreground-muted)', fontWeight: 400 }}>
                    ({raw}%)
                  </small>
                </span>
              </div>
              <div className="sim-bar" style={{ width: '100%', height: 6 }}>
                <div
                  className="sim-bar-fill"
                  style={{ width: `${Math.min(100, Math.max(0, raw))}%` }}
                />
              </div>
              {!compact && f.explanation && (
                <p
                  style={{
                    margin: '4px 0 0 0',
                    fontSize: '0.78rem',
                    color: 'var(--foreground-muted)',
                    lineHeight: 1.35,
                  }}
                >
                  {f.explanation}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
