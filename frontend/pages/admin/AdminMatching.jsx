import React, { useState, useMemo } from 'react';
import AppShell from '../../components/AppShell';
import PageTitle from '../../components/PageTitle';
import EmptyState from '../../components/EmptyState';
import ScoreBreakdown from '../../components/ScoreBreakdown';
import ModalShell from '../../components/ModalShell';
import { useUsers, useMentorshipRequests } from '../../hooks/useApi';
import { scoreMatch } from '../../lib/matching';
import { Sparkles, Users, CheckCircle2, HelpCircle, Eye } from 'lucide-react';

export default function AdminMatching() {
  const { data: users = [], loading } = useUsers();
  const { data: requests = [] } = useMentorshipRequests();

  const [inspectPair, setInspectPair] = useState(null);

  const students = useMemo(
    () => (users || []).filter((u) => u.role === 'student' && u.profileComplete),
    [users]
  );
  const mentors = useMemo(
    () => (users || []).filter((u) => u.role === 'mentor' && u.profileComplete),
    [users]
  );

  // Compute all potential matches
  const pairs = useMemo(() => {
    return (students || [])
      .flatMap((student) =>
        (mentors || []).map((mentor) => ({
          student,
          mentor,
          result: scoreMatch(student, mentor),
        }))
      )
      .sort((a, b) => b.result.score - a.result.score);
  }, [students, mentors]);

  const acceptedCount = useMemo(() => {
    return (requests || []).filter((r) => r.status === 'accepted').length;
  }, [requests]);

  const avgScore = useMemo(() => {
    if (!pairs.length) return 0;
    return Math.round(pairs.reduce((sum, p) => sum + p.result.score, 0) / pairs.length);
  }, [pairs]);

  return (
    <AppShell role="admin">
      <PageTitle
        eyebrow="Administrator Platform Portal"
        title="Algorithm & Matching Management"
        text="Audit live multi-factor compatibility calculations across enrolled students and mentors."
      />

      {/* KPI Overview Row */}
      <div className="shopeers-kpi-grid" style={{ marginBottom: 20 }}>
        <div className="shopeers-kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">Completed Student Profiles</span>
            <div className="kpi-icon-badge blue">
              <Users size={18} />
            </div>
          </div>
          <div className="kpi-body">
            <span className="kpi-value">{students.length}</span>
          </div>
          <span className="kpi-period">Eligible for pairing</span>
        </div>

        <div className="shopeers-kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">Active Alumni Mentors</span>
            <div className="kpi-icon-badge green">
              <Users size={18} />
            </div>
          </div>
          <div className="kpi-body">
            <span className="kpi-value">{mentors.length}</span>
          </div>
          <span className="kpi-period">Onboarded mentors</span>
        </div>

        <div className="shopeers-kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">Active Mentorship Pairs</span>
            <div className="kpi-icon-badge purple">
              <CheckCircle2 size={18} />
            </div>
          </div>
          <div className="kpi-body">
            <span className="kpi-value">{acceptedCount}</span>
          </div>
          <span className="kpi-period">Accepted matches</span>
        </div>

        <div className="shopeers-kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">Average Compatibility</span>
            <div className="kpi-icon-badge orange">
              <Sparkles size={18} />
            </div>
          </div>
          <div className="kpi-body">
            <span className="kpi-value">{avgScore}%</span>
          </div>
          <span className="kpi-period">Across {pairs.length} pairings</span>
        </div>
      </div>

      <section className="card">
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 14,
          }}
        >
          <div>
            <h2 style={{ fontSize: '1.15rem', margin: 0 }}>Top Ranked Potential Pairings</h2>
            <p
              style={{ margin: '4px 0 0 0', fontSize: '0.86rem', color: 'var(--foreground-muted)' }}
            >
              Deterministic scoring based on skills (45%), interests (20%), goals (15%), languages
              (10%), availability (5%), capacity (5%).
            </p>
          </div>
          <span className="status-chip">{pairs.length} Calculated</span>
        </div>

        {loading ? (
          <div className="skeleton-container" role="status" aria-live="polite">
            <div className="skeleton-bar" style={{ height: 48, marginBottom: 8 }} />
            <div className="skeleton-bar" style={{ height: 48, marginBottom: 8 }} />
            <div className="skeleton-bar" style={{ height: 48, marginBottom: 8 }} />
          </div>
        ) : pairs.length === 0 ? (
          <EmptyState
            icon={Sparkles}
            title="No complete pairings yet"
            text="Matching requires at least one completed student profile and one completed mentor profile."
          />
        ) : (
          <div className="table-container" tabIndex={0} role="region" aria-label="Matching Table">
            <table className="shopeers-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Mentor</th>
                  <th>Score</th>
                  <th>Overlap</th>
                  <th>Capacity</th>
                  <th style={{ textAlign: 'right' }}>Factor Inspector</th>
                </tr>
              </thead>
              <tbody>
                {pairs.slice(0, 50).map((p) => {
                  const shared = p.result.factors.filter((f) => f.matchedItems?.length).length;
                  return (
                    <tr key={`${p.student.id || p.student._id}-${p.mentor.id || p.mentor._id}`}>
                      <td>
                        <b>{p.student.name}</b>
                        <br />
                        <small style={{ color: 'var(--foreground-muted)' }}>
                          {p.student.course || 'Student'}
                        </small>
                      </td>
                      <td>
                        <b>{p.mentor.name}</b>
                        <br />
                        <small style={{ color: 'var(--foreground-muted)' }}>
                          {p.mentor.jobTitle} {p.mentor.company ? `· ${p.mentor.company}` : ''}
                        </small>
                      </td>
                      <td>
                        <span className="match-score" style={{ fontWeight: 700 }}>
                          {p.result.score}%
                        </span>
                      </td>
                      <td>{shared} of 6 factors</td>
                      <td>
                        <span
                          style={{
                            color: p.result.capacity
                              ? 'var(--success-text)'
                              : 'var(--warning-text)',
                            fontWeight: 600,
                          }}
                        >
                          {p.result.capacity ? 'Available' : 'Full'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          type="button"
                          className="btn mini secondary"
                          onClick={() => setInspectPair(p)}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
                        >
                          <Eye size={13} /> View Factors
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Factor Breakdown Inspection Modal */}
      {inspectPair && (
        <ModalShell
          title={`Compatibility Breakdown: ${inspectPair.student.name} & ${inspectPair.mentor.name}`}
          isOpen={Boolean(inspectPair)}
          onClose={() => setInspectPair(null)}
        >
          <div style={{ padding: 4 }}>
            <p style={{ fontSize: '0.88rem', color: 'var(--foreground-muted)', marginBottom: 16 }}>
              Transparent mathematical contribution of each dimension. Scores sum up to a maximum
              100%.
            </p>

            <ScoreBreakdown score={inspectPair.result.score} factors={inspectPair.result.factors} />

            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                marginTop: 20,
                position: 'sticky',
                bottom: -24,
                background: 'var(--surface)',
                paddingTop: 12,
                paddingBottom: 4,
                borderTop: '1px solid var(--border)',
                zIndex: 10,
              }}
            >
              <button type="button" className="btn secondary" onClick={() => setInspectPair(null)}>
                Close Inspector
              </button>
            </div>
          </div>
        </ModalShell>
      )}
    </AppShell>
  );
}
