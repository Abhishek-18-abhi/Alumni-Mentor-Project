import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import AppShell from '../../components/AppShell';
import PageTitle from '../../components/PageTitle';
import EmptyState from '../../components/EmptyState';
import ScoreBreakdown from '../../components/ScoreBreakdown';
import { useUsers, useFeedback } from '../../hooks/useApi';
import { getSession } from '../../lib/storage';
import { scoreMatch } from '../../lib/matching';
import { explainMatchWithAi } from '../../lib/api';
import { useToast } from '../../components/Toast';
import {
  Sparkles,
  ArrowRight,
  Briefcase,
  CalendarDays,
  Globe,
  Users,
  Award,
  Star,
  MessageSquare,
} from 'lucide-react';

export default function MentorProfile() {
  const { id } = useParams();
  const nav = useNavigate();
  const toast = useToast();
  const session = getSession();

  const { data: allUsers = [], loading } = useUsers();
  const mentor = (allUsers || []).find((u) => u.id === id || u._id === id);
  const student =
    (allUsers || []).find((u) => u.id === session?.id || u._id === session?.id) || session;

  const { data: mentorFeedback = [] } = useFeedback({ mentorId: id });
  const reviewsCount = mentorFeedback.length;
  const avgRating =
    reviewsCount > 0
      ? (
          mentorFeedback.reduce((acc, f) => acc + (Number(f.rating) || 5), 0) / reviewsCount
        ).toFixed(1)
      : null;

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
        <>
          <div className="profile-grid">
            {/* Main Info Column */}
            <section className="card">
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <div
                  className="mentor-avatar"
                  style={{ width: 56, height: 56, fontSize: '1.4rem' }}
                >
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
                          <span>
                            Grounded strictly in server factor scores. No PII transmitted.
                          </span>
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
                  Rating{' '}
                  <b>
                    {reviewsCount > 0 ? (
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          color: '#f59e0b',
                        }}
                      >
                        <Star size={14} fill="#f59e0b" stroke="#f59e0b" /> {avgRating} (
                        {reviewsCount} {reviewsCount === 1 ? 'review' : 'reviews'})
                      </span>
                    ) : (
                      'No reviews yet'
                    )}
                  </b>
                </span>
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

          {/* Student Reviews & Feedback Card */}
          <section className="card" style={{ marginTop: 24 }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 12,
                marginBottom: 18,
              }}
            >
              <div>
                <h2
                  style={{
                    margin: 0,
                    fontSize: '1.2rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <Star size={20} style={{ color: '#f59e0b' }} /> Student Reviews & Feedback
                </h2>
                <p
                  style={{
                    margin: '4px 0 0 0',
                    color: 'var(--foreground-muted)',
                    fontSize: '0.88rem',
                  }}
                >
                  Authentic evaluations submitted by students who completed mentorship sessions.
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                {reviewsCount > 0 && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      background: 'rgba(245, 158, 11, 0.1)',
                      padding: '6px 14px',
                      borderRadius: 999,
                    }}
                  >
                    <div style={{ display: 'flex', gap: 2 }}>
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          size={15}
                          fill={s <= Math.round(Number(avgRating)) ? '#f59e0b' : 'none'}
                          stroke={s <= Math.round(Number(avgRating)) ? '#f59e0b' : '#d1d5db'}
                        />
                      ))}
                    </div>
                    <b style={{ color: '#b45309', fontSize: '1rem' }}>{avgRating}</b>
                    <span style={{ color: 'var(--foreground-muted)', fontSize: '0.84rem' }}>
                      ({reviewsCount} {reviewsCount === 1 ? 'review' : 'reviews'})
                    </span>
                  </div>
                )}
                <button
                  type="button"
                  className="btn mini secondary"
                  onClick={() => nav(`/feedback?mentor=${mentor.id || mentor._id}`)}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                >
                  <Star size={13} fill="#f59e0b" stroke="#f59e0b" /> Leave Feedback
                </button>
              </div>
            </div>

            {reviewsCount === 0 ? (
              <div
                style={{
                  padding: '28px 16px',
                  textAlign: 'center',
                  background: 'var(--surface-sunken, #f8fafc)',
                  borderRadius: 8,
                }}
              >
                <MessageSquare
                  size={28}
                  style={{ color: 'var(--foreground-muted)', margin: '0 auto 8px auto' }}
                />
                <p style={{ margin: 0, fontWeight: 600, color: 'var(--foreground)' }}>
                  No student reviews yet
                </p>
                <p
                  style={{
                    margin: '4px 0 0 0',
                    fontSize: '0.84rem',
                    color: 'var(--foreground-muted)',
                  }}
                >
                  Reviews will appear here as students complete mentorship sessions and evaluate
                  their experience.
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {mentorFeedback.map((rev) => (
                  <div
                    key={rev._id || rev.id}
                    style={{
                      padding: 16,
                      borderRadius: 8,
                      border: '1px solid var(--border)',
                      background: 'var(--card-bg, #ffffff)',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        flexWrap: 'wrap',
                        gap: 8,
                        marginBottom: 8,
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div
                          className="mentor-avatar"
                          style={{
                            width: 34,
                            height: 34,
                            fontSize: '0.85rem',
                            background: 'var(--primary-subtle, #e0e7ff)',
                            color: 'var(--primary)',
                          }}
                        >
                          {rev.fromUserId?.name?.[0] || 'S'}
                        </div>
                        <div>
                          <b style={{ fontSize: '0.95rem' }}>
                            {rev.fromUserId?.name || 'Student Mentee'}
                          </b>
                          <div style={{ fontSize: '0.75rem', color: 'var(--foreground-muted)' }}>
                            {rev.createdAt
                              ? new Date(rev.createdAt).toLocaleDateString(undefined, {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                })
                              : ''}
                          </div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            size={15}
                            fill={star <= (Number(rev.rating) || 5) ? '#f59e0b' : 'none'}
                            stroke={star <= (Number(rev.rating) || 5) ? '#f59e0b' : '#d1d5db'}
                          />
                        ))}
                      </div>
                    </div>

                    <p
                      style={{
                        margin: '0 0 8px 0',
                        fontSize: '0.9rem',
                        lineHeight: 1.5,
                        color: 'var(--foreground)',
                      }}
                    >
                      "{rev.comment || rev.text || 'Great mentorship session.'}"
                    </p>

                    {rev.aspects && (
                      <div
                        style={{
                          display: 'flex',
                          gap: 8,
                          flexWrap: 'wrap',
                          fontSize: '0.78rem',
                          color: 'var(--foreground-muted)',
                        }}
                      >
                        {rev.aspects.usefulness && (
                          <span className="category-pill-tech" style={{ fontSize: '0.72rem' }}>
                            Usefulness: {rev.aspects.usefulness}/5
                          </span>
                        )}
                        {rev.aspects.clarity && (
                          <span className="category-pill-tech" style={{ fontSize: '0.72rem' }}>
                            Clarity: {rev.aspects.clarity}/5
                          </span>
                        )}
                        {rev.aspects.comfort && (
                          <span className="category-pill-tech" style={{ fontSize: '0.72rem' }}>
                            Comfort: {rev.aspects.comfort}/5
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </AppShell>
  );
}
