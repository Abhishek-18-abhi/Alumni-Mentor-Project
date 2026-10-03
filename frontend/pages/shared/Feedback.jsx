import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import AppShell from '../../components/AppShell';
import PageTitle from '../../components/PageTitle';
import EmptyState from '../../components/EmptyState';
import TabBar from '../../components/TabBar';
import { useFeedback, useMeetings, useUsers, useMentorshipRequests } from '../../hooks/useApi';
import { getSession } from '../../lib/storage';
import { apiPost } from '../../lib/api';
import { useToast } from '../../components/Toast';
import {
  Star,
  Send,
  MessageSquare,
  Award,
  CheckCircle2,
  CalendarDays,
  UserCheck,
  Briefcase,
  ArrowRight,
} from 'lucide-react';

export default function Feedback({ role }) {
  const toast = useToast();
  const nav = useNavigate();
  const [searchParams] = useSearchParams();
  const session = getSession();
  const currentRole = role || session?.role || 'student';
  const myId = session?.id || session?._id;

  // Student Tab state: 'give' or 'submitted'
  const [studentTab, setStudentTab] = useState('give');

  // Form state for students
  const [selectedMentorId, setSelectedMentorId] = useState(
    () => searchParams.get('mentor') || searchParams.get('mentorId') || ''
  );
  const [rating, setRating] = useState(5);
  const [usefulness, setUsefulness] = useState(5);
  const [clarity, setClarity] = useState(5);
  const [comfort, setComfort] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const {
    data: allFeedback = [],
    loading: loadingFeedback,
    refetch: refetchFeedback,
  } = useFeedback();
  const { data: allMeetings = [] } = useMeetings();
  const { data: allRequests = [] } = useMentorshipRequests();
  const { data: allUsers = [] } = useUsers();

  // For students: mentors the student has had accepted mentorship requests OR meetings with
  const availableMentors = useMemo(() => {
    if (currentRole !== 'student') return [];
    const mentorMap = new Map();

    // 1. From accepted mentorship requests
    (allRequests || []).forEach((r) => {
      const sId = String(r.studentId?._id || r.studentId?.id || r.studentId || '');
      if (sId === String(myId) && r.status === 'accepted') {
        const mObj =
          typeof r.mentorId === 'object'
            ? r.mentorId
            : (allUsers || []).find((u) => String(u._id || u.id) === String(r.mentorId));
        if (mObj) {
          const mId = String(mObj._id || mObj.id);
          mentorMap.set(mId, {
            id: mId,
            name: mObj.name || 'Mentor',
            company: mObj.company || '',
            domain: mObj.domain || '',
            jobTitle: mObj.jobTitle || '',
            requestId: r._id || r.id,
          });
        }
      }
    });

    // 2. From meetings
    (allMeetings || []).forEach((m) => {
      const sId = String(m.studentId?._id || m.studentId?.id || m.studentId || '');
      if (sId === String(myId) && m.status !== 'cancelled') {
        const mObj =
          typeof m.mentorId === 'object'
            ? m.mentorId
            : (allUsers || []).find((u) => String(u._id || u.id) === String(m.mentorId));
        if (mObj) {
          const mId = String(mObj._id || mObj.id);
          if (!mentorMap.has(mId)) {
            mentorMap.set(mId, {
              id: mId,
              name: mObj.name || 'Mentor',
              company: mObj.company || '',
              domain: mObj.domain || '',
              jobTitle: mObj.jobTitle || '',
              requestId: '',
            });
          }
        }
      }
    });

    return Array.from(mentorMap.values());
  }, [currentRole, allRequests, allMeetings, allUsers, myId]);

  // Set default selected mentor if only 1 exists and none selected
  useEffect(() => {
    if (currentRole === 'student' && !selectedMentorId && availableMentors.length > 0) {
      setSelectedMentorId(availableMentors[0].id);
    }
  }, [currentRole, selectedMentorId, availableMentors]);

  // Feedback received by this mentor (reviews from students)
  const receivedFeedback = useMemo(() => {
    return (allFeedback || []).filter((f) => {
      const toId = f.toUserId?._id || f.toUserId?.id || f.toUserId;
      return String(toId) === String(myId);
    });
  }, [allFeedback, myId]);

  // Feedback submitted by this student
  const studentSubmittedFeedback = useMemo(() => {
    return (allFeedback || []).filter((f) => {
      const fromId = f.fromUserId?._id || f.fromUserId?.id || f.fromUserId;
      return String(fromId) === String(myId);
    });
  }, [allFeedback, myId]);

  // Overall rating statistics for mentor
  const ratingStats = useMemo(() => {
    if (!receivedFeedback.length) {
      return { avg: null, count: 0, usefulness: 5, clarity: 5, comfort: 5 };
    }
    const count = receivedFeedback.length;
    const totalRating = receivedFeedback.reduce((acc, f) => acc + (Number(f.rating) || 5), 0);
    const totalU = receivedFeedback.reduce((acc, f) => acc + (f.aspects?.usefulness || 5), 0);
    const totalC = receivedFeedback.reduce((acc, f) => acc + (f.aspects?.clarity || 5), 0);
    const totalCf = receivedFeedback.reduce((acc, f) => acc + (f.aspects?.comfort || 5), 0);

    return {
      avg: (totalRating / count).toFixed(1),
      count,
      usefulness: (totalU / count).toFixed(1),
      clarity: (totalC / count).toFixed(1),
      comfort: (totalCf / count).toFixed(1),
    };
  }, [receivedFeedback]);

  const handleStudentSubmit = async (e) => {
    e.preventDefault();
    if (!selectedMentorId) {
      return toast.error('Please select a mentor to review.');
    }
    if (!comment.trim() || submitting) return;

    const chosenMentor = availableMentors.find((m) => m.id === selectedMentorId);

    setSubmitting(true);
    try {
      await apiPost('/feedback', {
        toUserId: selectedMentorId,
        requestId: chosenMentor?.requestId || undefined,
        rating: Number(rating),
        text: comment.trim(),
        comment: comment.trim(),
        aspects: {
          usefulness: Number(usefulness),
          clarity: Number(clarity),
          comfort: Number(comfort),
        },
      });

      toast.success(`Your review has been submitted for ${chosenMentor?.name || 'your mentor'}!`);
      setComment('');
      await refetchFeedback();
      setStudentTab('submitted');
    } catch (err) {
      toast.error(err?.message || 'Failed to submit feedback.');
    } finally {
      setSubmitting(false);
    }
  };

  // ---------------------------------------------------------------------------
  // MENTOR VIEW: Clean dashboard showing ONLY reviews received from students
  // ---------------------------------------------------------------------------
  if (currentRole === 'mentor') {
    return (
      <AppShell role="mentor">
        <PageTitle
          eyebrow="Student Evaluations"
          title="Student Reviews & Feedback"
          text="Reviews, ratings, and testimonials given to you by students with whom you've conducted mentorship meetings."
        />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Summary Banner */}
          <section className="card" style={{ padding: '24px' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 20,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'var(--primary-subtle, rgba(37,99,235,0.08))',
                    borderRadius: 14,
                    padding: '16px 24px',
                    minWidth: 120,
                  }}
                >
                  <b style={{ fontSize: '2.4rem', color: 'var(--primary)', lineHeight: 1 }}>
                    {ratingStats.avg || '—'}
                  </b>
                  <div style={{ display: 'flex', gap: 2, marginTop: 6 }}>
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        size={15}
                        color={
                          ratingStats.avg && s <= Math.round(Number(ratingStats.avg))
                            ? '#f59e0b'
                            : 'var(--border)'
                        }
                        fill={
                          ratingStats.avg && s <= Math.round(Number(ratingStats.avg))
                            ? '#f59e0b'
                            : 'none'
                        }
                      />
                    ))}
                  </div>
                  <span
                    style={{
                      fontSize: '0.75rem',
                      color: 'var(--foreground-muted)',
                      marginTop: 4,
                      fontWeight: 600,
                    }}
                  >
                    Average Rating
                  </span>
                </div>

                <div>
                  <h2 style={{ fontSize: '1.25rem', margin: '0 0 6px 0' }}>
                    Student Feedback & Satisfaction
                  </h2>
                  <p
                    style={{
                      margin: 0,
                      color: 'var(--foreground-muted)',
                      fontSize: '0.9rem',
                      lineHeight: 1.5,
                    }}
                  >
                    Based on <b>{ratingStats.count}</b> verified student review
                    {ratingStats.count === 1 ? '' : 's'}.
                  </p>
                </div>
              </div>

              {/* 3 Metric Pills */}
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <div
                  style={{
                    background: 'var(--surface-sunken, #f8fafc)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 10,
                    padding: '10px 16px',
                    textAlign: 'center',
                    minWidth: 100,
                  }}
                >
                  <span
                    style={{
                      display: 'block',
                      fontSize: '0.74rem',
                      color: 'var(--foreground-muted)',
                      textTransform: 'uppercase',
                      fontWeight: 600,
                    }}
                  >
                    Usefulness
                  </span>
                  <b style={{ fontSize: '1.2rem', color: 'var(--foreground)' }}>
                    {ratingStats.count ? `${ratingStats.usefulness}/5` : '—'}
                  </b>
                </div>

                <div
                  style={{
                    background: 'var(--surface-sunken, #f8fafc)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 10,
                    padding: '10px 16px',
                    textAlign: 'center',
                    minWidth: 100,
                  }}
                >
                  <span
                    style={{
                      display: 'block',
                      fontSize: '0.74rem',
                      color: 'var(--foreground-muted)',
                      textTransform: 'uppercase',
                      fontWeight: 600,
                    }}
                  >
                    Clarity
                  </span>
                  <b style={{ fontSize: '1.2rem', color: 'var(--foreground)' }}>
                    {ratingStats.count ? `${ratingStats.clarity}/5` : '—'}
                  </b>
                </div>

                <div
                  style={{
                    background: 'var(--surface-sunken, #f8fafc)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 10,
                    padding: '10px 16px',
                    textAlign: 'center',
                    minWidth: 100,
                  }}
                >
                  <span
                    style={{
                      display: 'block',
                      fontSize: '0.74rem',
                      color: 'var(--foreground-muted)',
                      textTransform: 'uppercase',
                      fontWeight: 600,
                    }}
                  >
                    Comfort
                  </span>
                  <b style={{ fontSize: '1.2rem', color: 'var(--foreground)' }}>
                    {ratingStats.count ? `${ratingStats.comfort}/5` : '—'}
                  </b>
                </div>
              </div>
            </div>
          </section>

          {/* List of Reviews Received */}
          <section className="card">
            <h3 style={{ fontSize: '1.1rem', margin: '0 0 16px 0' }}>All Student Reviews</h3>

            {receivedFeedback.length === 0 ? (
              <EmptyState
                icon={Star}
                title="No student evaluations yet"
                text="When students complete mentorship meetings with you and leave their feedback, their reviews, star ratings, and comments will appear here."
              />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {receivedFeedback.map((f) => {
                  const studentName = f.fromUserId?.name || 'Student Mentee';
                  return (
                    <div
                      key={f.id || f._id}
                      style={{
                        padding: '16px',
                        background: 'var(--surface-sunken, #f8fafc)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 10,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 10,
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          flexWrap: 'wrap',
                          gap: 10,
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div
                            className="mentor-avatar"
                            style={{
                              width: 36,
                              height: 36,
                              fontSize: '0.95rem',
                              background: 'var(--primary)',
                              color: '#fff',
                            }}
                          >
                            {studentName[0] || 'S'}
                          </div>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <b style={{ fontSize: '0.96rem' }}>{studentName}</b>
                              <span
                                className="status-chip blue"
                                style={{ fontSize: '0.72rem', padding: '1px 7px' }}
                              >
                                Student Mentee
                              </span>
                            </div>
                            <small
                              style={{
                                color: 'var(--foreground-muted)',
                                fontSize: '0.78rem',
                                display: 'block',
                                marginTop: 2,
                              }}
                            >
                              {f.createdAt
                                ? new Date(f.createdAt).toLocaleDateString(undefined, {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric',
                                  })
                                : 'Recorded session review'}
                            </small>
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <div style={{ display: 'flex', gap: 2 }}>
                            {[1, 2, 3, 4, 5].map((s) => (
                              <Star
                                key={s}
                                size={16}
                                color={s <= f.rating ? '#f59e0b' : 'var(--border)'}
                                fill={s <= f.rating ? '#f59e0b' : 'none'}
                              />
                            ))}
                          </div>
                          <b style={{ color: '#f59e0b', fontSize: '0.95rem', marginLeft: 4 }}>
                            {f.rating}.0
                          </b>
                        </div>
                      </div>

                      {/* Aspect Score Badges */}
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        <span
                          style={{
                            fontSize: '0.75rem',
                            padding: '2px 8px',
                            borderRadius: 6,
                            background: 'var(--surface)',
                            border: '1px solid var(--border)',
                          }}
                        >
                          Usefulness: <b>{f.aspects?.usefulness ?? 5}/5</b>
                        </span>
                        <span
                          style={{
                            fontSize: '0.75rem',
                            padding: '2px 8px',
                            borderRadius: 6,
                            background: 'var(--surface)',
                            border: '1px solid var(--border)',
                          }}
                        >
                          Clarity: <b>{f.aspects?.clarity ?? 5}/5</b>
                        </span>
                        <span
                          style={{
                            fontSize: '0.75rem',
                            padding: '2px 8px',
                            borderRadius: 6,
                            background: 'var(--surface)',
                            border: '1px solid var(--border)',
                          }}
                        >
                          Comfort: <b>{f.aspects?.comfort ?? 5}/5</b>
                        </span>
                      </div>

                      {/* Comment text */}
                      <p
                        style={{
                          margin: 0,
                          fontSize: '0.9rem',
                          lineHeight: 1.6,
                          color: 'var(--foreground)',
                          padding: '10px 14px',
                          background: 'var(--surface)',
                          borderRadius: 8,
                          borderLeft: '3px solid var(--primary)',
                        }}
                      >
                        "{f.comment || f.text || 'Great mentorship guidance.'}"
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </AppShell>
    );
  }

  // ---------------------------------------------------------------------------
  // STUDENT VIEW: Choose mentor, rate and submit review + view past submissions
  // ---------------------------------------------------------------------------
  const studentTabs = [
    { id: 'give', label: 'Submit Mentor Feedback' },
    { id: 'submitted', label: `Your Submitted Reviews (${studentSubmittedFeedback.length})` },
  ];

  return (
    <AppShell role="student">
      <PageTitle
        eyebrow="Student Feedback"
        title="Mentor Feedback & Reviews"
        text="Choose a mentor you have connected with, rate your mentorship session experience, and submit your review."
      />

      <div style={{ marginBottom: 18 }}>
        <TabBar tabs={studentTabs} activeTab={studentTab} onChange={setStudentTab} />
      </div>

      {studentTab === 'give' && (
        <div style={{ maxWidth: 760 }}>
          <section className="card form-card">
            <h2
              style={{
                fontSize: '1.2rem',
                margin: '0 0 4px 0',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <Star size={20} style={{ color: '#f59e0b' }} /> Rate Your Mentor
            </h2>
            <p
              style={{
                margin: '0 0 18px 0',
                fontSize: '0.88rem',
                color: 'var(--foreground-muted)',
              }}
            >
              Select a mentor and share your honest feedback to help recognize excellence and
              support mentor growth.
            </p>

            {availableMentors.length === 0 ? (
              <div
                style={{
                  padding: '32px 20px',
                  textAlign: 'center',
                  background: 'var(--surface-sunken, #f8fafc)',
                  borderRadius: 10,
                }}
              >
                <MessageSquare
                  size={32}
                  style={{ color: 'var(--foreground-muted)', margin: '0 auto 10px auto' }}
                />
                <h3 style={{ margin: '0 0 6px 0', fontSize: '1.05rem' }}>
                  No Connected Mentors Yet
                </h3>
                <p
                  style={{
                    color: 'var(--foreground-muted)',
                    fontSize: '0.88rem',
                    margin: '0 auto 16px auto',
                    maxWidth: 440,
                    lineHeight: 1.5,
                  }}
                >
                  Feedback can be submitted after you connect with a mentor or complete a mentorship
                  meeting.
                </p>
                <Link
                  to="/mentors"
                  className="btn primary"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                >
                  Find a Mentor <ArrowRight size={14} />
                </Link>
              </div>
            ) : (
              <form
                onSubmit={handleStudentSubmit}
                style={{ display: 'flex', flexDirection: 'column', gap: 18 }}
              >
                {/* 1. Choose Mentor Dropdown */}
                <label>
                  <span
                    style={{
                      fontWeight: 600,
                      display: 'block',
                      marginBottom: 6,
                      fontSize: '0.92rem',
                    }}
                  >
                    Choose Mentor <span style={{ color: 'var(--danger, #ef4444)' }}>*</span>
                  </span>
                  <select
                    value={selectedMentorId}
                    onChange={(e) => setSelectedMentorId(e.target.value)}
                    required
                    style={{ padding: '10px 12px', fontSize: '0.92rem' }}
                  >
                    <option value="">-- Select a mentor you connected with --</option>
                    {availableMentors.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} {m.company ? `(${m.company})` : m.domain ? `(${m.domain})` : ''}
                      </option>
                    ))}
                  </select>
                </label>

                {/* 2. Overall Star Rating */}
                <div>
                  <span
                    style={{
                      fontWeight: 600,
                      display: 'block',
                      marginBottom: 6,
                      fontSize: '0.92rem',
                    }}
                  >
                    Overall Rating ({rating} of 5 stars){' '}
                    <span style={{ color: 'var(--danger, #ef4444)' }}>*</span>
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ display: 'flex', gap: 4 }}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setRating(star)}
                          className="icon-btn"
                          style={{
                            color: star <= rating ? '#f59e0b' : 'var(--border)',
                            background: 'transparent',
                            padding: 4,
                            cursor: 'pointer',
                          }}
                          aria-label={`${star} star`}
                        >
                          <Star
                            size={28}
                            fill={star <= rating ? '#f59e0b' : 'none'}
                            stroke={star <= rating ? '#f59e0b' : '#d1d5db'}
                          />
                        </button>
                      ))}
                    </div>
                    <span
                      style={{
                        fontWeight: 600,
                        fontSize: '0.92rem',
                        color: '#b45309',
                        marginLeft: 6,
                      }}
                    >
                      {rating === 5
                        ? 'Exceptional (5/5)'
                        : rating === 4
                          ? 'Very Good (4/5)'
                          : rating === 3
                            ? 'Good (3/5)'
                            : rating === 2
                              ? 'Fair (2/5)'
                              : 'Needs Improvement (1/5)'}
                    </span>
                  </div>
                </div>

                {/* 3. Aspect Rating Scales */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                    gap: 12,
                    background: 'var(--surface-sunken, #f8fafc)',
                    padding: 14,
                    borderRadius: 8,
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  <label>
                    <span
                      style={{
                        fontSize: '0.84rem',
                        fontWeight: 600,
                        display: 'block',
                        marginBottom: 4,
                      }}
                    >
                      Usefulness of Advice (1-5)
                    </span>
                    <select
                      value={usefulness}
                      onChange={(e) => setUsefulness(Number(e.target.value))}
                    >
                      {[5, 4, 3, 2, 1].map((v) => (
                        <option key={v} value={v}>
                          {v} -{' '}
                          {v === 5
                            ? 'Extremely Useful'
                            : v === 4
                              ? 'Very Helpful'
                              : v === 3
                                ? 'Helpful'
                                : v === 2
                                  ? 'Somewhat Useful'
                                  : 'Not Useful'}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label>
                    <span
                      style={{
                        fontSize: '0.84rem',
                        fontWeight: 600,
                        display: 'block',
                        marginBottom: 4,
                      }}
                    >
                      Clarity of Guidance (1-5)
                    </span>
                    <select value={clarity} onChange={(e) => setClarity(Number(e.target.value))}>
                      {[5, 4, 3, 2, 1].map((v) => (
                        <option key={v} value={v}>
                          {v} -{' '}
                          {v === 5
                            ? 'Crystal Clear'
                            : v === 4
                              ? 'Clear'
                              : v === 3
                                ? 'Moderate'
                                : v === 2
                                  ? 'A bit unclear'
                                  : 'Confusing'}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label>
                    <span
                      style={{
                        fontSize: '0.84rem',
                        fontWeight: 600,
                        display: 'block',
                        marginBottom: 4,
                      }}
                    >
                      Communication & Comfort (1-5)
                    </span>
                    <select value={comfort} onChange={(e) => setComfort(Number(e.target.value))}>
                      {[5, 4, 3, 2, 1].map((v) => (
                        <option key={v} value={v}>
                          {v} -{' '}
                          {v === 5
                            ? 'Very Welcoming'
                            : v === 4
                              ? 'Comfortable'
                              : v === 3
                                ? 'Good'
                                : v === 2
                                  ? 'Neutral'
                                  : 'Uncomfortable'}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                {/* 4. Comments & Review Text */}
                <label>
                  <span
                    style={{
                      fontWeight: 600,
                      display: 'block',
                      marginBottom: 6,
                      fontSize: '0.92rem',
                    }}
                  >
                    Your Review & Feedback{' '}
                    <span style={{ color: 'var(--danger, #ef4444)' }}>*</span>
                  </span>
                  <textarea
                    rows={4}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Describe how this mentor helped you, highlights from your discussions, actionable insights received, or general appreciation..."
                    required
                  />
                </label>

                {/* 5. Submit Button */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 4 }}>
                  <button
                    type="submit"
                    className="uiverse-btn"
                    disabled={submitting || !comment.trim() || !selectedMentorId}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                  >
                    <Send size={15} />{' '}
                    {submitting ? 'Submitting Review...' : 'Submit Feedback to Mentor'}
                  </button>
                </div>
              </form>
            )}
          </section>
        </div>
      )}

      {studentTab === 'submitted' && (
        <section className="card" style={{ maxWidth: 840 }}>
          <h2 style={{ fontSize: '1.15rem', margin: '0 0 16px 0' }}>Your Submitted Reviews</h2>
          {studentSubmittedFeedback.length === 0 ? (
            <EmptyState
              icon={MessageSquare}
              title="No reviews submitted yet"
              text="You haven't submitted any mentor feedback yet. Choose a mentor above to submit your first review!"
            />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {studentSubmittedFeedback.map((f) => {
                const mentorName = f.toUserId?.name || 'Mentor';
                return (
                  <div
                    key={f.id || f._id}
                    style={{
                      padding: 16,
                      background: 'var(--surface-sunken, #f8fafc)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 10,
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: 10,
                        marginBottom: 10,
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div
                          className="mentor-avatar"
                          style={{
                            width: 36,
                            height: 36,
                            fontSize: '0.95rem',
                            background: 'var(--primary-subtle, #e0e7ff)',
                            color: 'var(--primary)',
                          }}
                        >
                          {mentorName[0] || 'M'}
                        </div>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <b style={{ fontSize: '0.96rem' }}>{mentorName}</b>
                            <span
                              className="status-chip blue"
                              style={{ fontSize: '0.72rem', padding: '1px 7px' }}
                            >
                              Alumni Mentor
                            </span>
                          </div>
                          <small style={{ color: 'var(--foreground-muted)', fontSize: '0.78rem' }}>
                            {f.createdAt
                              ? new Date(f.createdAt).toLocaleDateString(undefined, {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                })
                              : 'Submitted review'}
                          </small>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            size={16}
                            color={s <= f.rating ? '#f59e0b' : 'var(--border)'}
                            fill={s <= f.rating ? '#f59e0b' : 'none'}
                          />
                        ))}
                        <b style={{ color: '#f59e0b', fontSize: '0.95rem', marginLeft: 4 }}>
                          {f.rating}.0
                        </b>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
                      <span
                        style={{
                          fontSize: '0.75rem',
                          padding: '2px 8px',
                          borderRadius: 6,
                          background: 'var(--surface)',
                          border: '1px solid var(--border)',
                        }}
                      >
                        Usefulness: <b>{f.aspects?.usefulness ?? 5}/5</b>
                      </span>
                      <span
                        style={{
                          fontSize: '0.75rem',
                          padding: '2px 8px',
                          borderRadius: 6,
                          background: 'var(--surface)',
                          border: '1px solid var(--border)',
                        }}
                      >
                        Clarity: <b>{f.aspects?.clarity ?? 5}/5</b>
                      </span>
                      <span
                        style={{
                          fontSize: '0.75rem',
                          padding: '2px 8px',
                          borderRadius: 6,
                          background: 'var(--surface)',
                          border: '1px solid var(--border)',
                        }}
                      >
                        Comfort: <b>{f.aspects?.comfort ?? 5}/5</b>
                      </span>
                    </div>

                    <p
                      style={{
                        margin: 0,
                        fontSize: '0.9rem',
                        lineHeight: 1.6,
                        color: 'var(--foreground)',
                        padding: '10px 14px',
                        background: 'var(--surface)',
                        borderRadius: 8,
                        borderLeft: '3px solid var(--primary)',
                      }}
                    >
                      "{f.comment || f.text || 'Great session.'}"
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}
    </AppShell>
  );
}
