import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import AppShell from '../../components/AppShell';
import PageTitle from '../../components/PageTitle';
import EmptyState from '../../components/EmptyState';
import ScoreBreakdown from '../../components/ScoreBreakdown';
import { useUsers } from '../../hooks/useApi';
import { getSession } from '../../lib/storage';
import { scoreMatch } from '../../lib/matching';
import { explainMatchWithAi } from '../../lib/api';
import { useToast } from '../../components/Toast';
import { Sparkles, ArrowRight, Briefcase, CalendarDays, Globe, Users, Award } from 'lucide-react';

export default function MentorProfile() {
  const { id } = useParams();
  const nav = useNavigate();
  const toast = useToast();
  const session = getSession();

  const { data: allUsers = [], loading } = useUsers();
  const mentor = (allUsers || []).find((u) => u.id === id || u._id === id);
  const student = (allUsers || []).find((u) => u.id === session?.id || u._id === session?.id) || session;

  const match = mentor && student ? scoreMatch(student, mentor) : null;
  const [aiExplanation, setAiExplanation] = useState('');
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);

  const handleExplainWithAi = async () => {
    if (isGeneratingAi || !match || !mentor) return;
    setIsGeneratingAi(true);
    try {
      const res = await explainMatchWithAi({ mentorId: mentor.id || mentor._id });
      if (res?.explanation) {
        setAiExplanation(res.explanation);
      } else {
        toast.error('Could not generate AI fit explanation.');
      }
    } catch {
      toast.error('AI explanation request failed.');
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const isFull = (mentor?.currentMentees || 0) >= (mentor?.capacity || 5);
  const isPaused = Boolean(mentor?.pauseRequests);
  const canRequest = !isFull && !isPaused;

  return (
    <AppShell role="student">
      <PageTitle
        eyebrow="Mentor Profile"
        title={mentor?.name || 'Mentor Profile'}
        text={
          mentor
            ? `${mentor.jobTitle || 'Alumnus'} ${mentor.company ? '· ' + mentor.company : ''}`
            : 'Mentor details and compatibility analysis.'
        }
      />

      {loading ? (
        <div className="card skeleton-card" style={{ height: 350 }}>
          <div className="skeleton-bar" style={{ width: '40%', height: 28, marginBottom: 16 }} />
          <div className="skeleton-bar" style={{ width: '100%', height: 180 }} />
        </div>
      ) : !mentor ? (
        <EmptyState
          title="Mentor not found"
          text="This mentor profile may have been updated or removed."
          actionLabel="Back to Mentors"
          onAction={() => nav('/mentors')}
        />
      ) : (
        <div className="profile-grid">
          {/* Main Info Column */}
          <section className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div className="mentor-avatar" style={{ width: 56, height: 56, fontSize: '1.4rem' }}>
                {mentor.name?.[0] || 'M'}
              </div>
              <div>
                <h2
                  style={{
                    margin: 0,
                    fontSize: '1.3rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  {mentor.name}
                  {Boolean(mentor.verified || mentor.isVerified) && (
                    <span className="bento-badge" style={{ fontSize: '0.7rem' }}>
                      Verified Alumnus
                    </span>
                  )}
                </h2>
                <p
                  style={{
                    margin: '3px 0 0 0',
                    color: 'var(--foreground-muted)',
                    fontSize: '0.9rem',
                  }}
                >
                  {mentor.jobTitle || 'Industry Professional'}{' '}
                  {mentor.company ? `at ${mentor.company}` : ''}
                </p>
              </div>
            </div>

            <h3 style={{ fontSize: '1rem', marginTop: 20 }}>About</h3>
            <p style={{ lineHeight: 1.6, color: 'var(--foreground)' }}>
              {mentor.bio || 'This mentor has not provided an extended bio yet.'}
            </p>

            <h3 style={{ fontSize: '1rem', marginTop: 20 }}>Technical Skills</h3>
            <div className="tag-row">
              {(mentor.skills || []).map((x) => (
                <span key={x} className="category-pill-tech">
                  {x}
                </span>
              ))}
            </div>

            <h3 style={{ fontSize: '1rem', marginTop: 20 }}>Interests & Guidance Domains</h3>
            <div className="tag-row">
              {(mentor.interests || []).map((x) => (
                <span key={x} className="category-pill-purple">
                  {x}
                </span>
              ))}
            </div>

            {/* Explainable Factor Breakdown */}
            {match && (
              <div
                className="explain-box"
                style={{
                  marginTop: 24,
                  padding: 18,
                  borderRadius: 8,
                  background: 'var(--surface-sunken, #f8fafc)',
                  border: '1px solid var(--border)',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 14,
                  }}
                >
                  <b style={{ fontSize: '1.05rem' }}>Compatibility Analysis: {match.score}%</b>
                  <span className="match-score" style={{ fontWeight: 700 }}>
                    {match.score >= 80 ? 'Strong Match' : 'Moderate Match'}
                  </span>
                </div>

                <ScoreBreakdown score={match.score} factors={match.factors} />

                {/* AI Explanation Assist Panel */}
                <div
                  className="ai-explain-panel"
                  style={{ marginTop: 18, paddingTop: 14, borderTop: '1px solid var(--border)' }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: 8,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Sparkles size={16} style={{ color: 'var(--primary)' }} />
                      <span style={{ fontWeight: 600, fontSize: '0.92rem' }}>
                        Why this mentor? (AI Advisory)
                      </span>
                    </div>
                    {!aiExplanation && (
                      <button
                        type="button"
                        className="btn mini secondary"
                        disabled={isGeneratingAi}
                        onClick={handleExplainWithAi}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}
                      >
                        <Sparkles size={13} />{' '}
                        {isGeneratingAi ? 'Analyzing match factors...' : 'Explain Match with AI'}
                      </button>
                    )}
                  </div>
                  {aiExplanation && (
                    <div
                      style={{
                        marginTop: 12,
                        padding: 14,
                        borderRadius: 8,
                        background: 'var(--background)',
                        fontSize: '0.88rem',
                        lineHeight: 1.6,
                        border: '1px solid var(--border)',
                      }}
                    >
                      <p style={{ margin: 0, color: 'var(--foreground)' }}>{aiExplanation}</p>
                      <div
                        style={{
                          marginTop: 10,
                          fontSize: '0.74rem',
                          color: 'var(--foreground-muted)',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <span>Grounded strictly in server factor scores. No PII transmitted.</span>
                        <button
                          type="button"
                          className="btn mini"
                          onClick={() => setAiExplanation('')}
                          style={{ padding: '2px 8px', fontSize: '0.72rem' }}
                        >
                          Dismiss
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </section>

          {/* Mentorship Metadata & Actions Column */}
          <section className="card">
            <h2>Mentorship Overview</h2>
            <div className="detail-list" style={{ margin: '16px 0 24px 0' }}>
              <span>
                Experience{' '}
                <b>
                  {mentor.experience || mentor.yearsOfExperience
                    ? `${mentor.yearsOfExperience || mentor.experience} yrs`
                    : 'Not specified'}
                </b>
              </span>
              <span>
                Domain <b>{mentor.domain || 'Software Engineering'}</b>
              </span>
              <span>
                Languages <b>{(mentor.languages || []).join(', ') || 'English'}</b>
              </span>
              <span>
                Capacity Status{' '}
                <b>
                  {isPaused
                    ? 'Paused'
                    : isFull
                      ? `Full (${mentor.currentMentees || 0}/${mentor.capacity || 5})`
                      : `${mentor.currentMentees || 0} / ${mentor.capacity || 5} active mentees`}
                </b>
              </span>
              <span>
                Availability <b>{(mentor.availability || []).length} published weekly slots</b>
              </span>
            </div>

            <button
              type="button"
              className={`uiverse-btn full ${!canRequest ? 'disabled' : ''}`}
              disabled={!canRequest}
              onClick={() => nav(`/request?mentor=${mentor.id || mentor._id}`)}
            >
              {isPaused
                ? 'Requests Temporarily Paused'
                : isFull
                  ? 'Mentor Capacity Full'
                  : 'Request Mentorship'}
            </button>
            {!canRequest && (
              <p
                style={{
                  textAlign: 'center',
                  fontSize: '0.8rem',
                  color: 'var(--warning-text)',
                  marginTop: 8,
                }}
              >
                {isPaused
                  ? 'This mentor has temporarily paused incoming requests.'
                  : 'This mentor has reached maximum concurrent mentee capacity.'}
              </p>
            )}
          </section>
        </div>
      )}
    </AppShell>
  );
}
