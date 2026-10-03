import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
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
  CheckCircle2,
  CalendarDays,
  Send,
  MessageSquare,
  Award,
  ThumbsUp,
  Sparkles,
  UserCheck,
} from 'lucide-react';

export default function Feedback({ role }) {
  const toast = useToast();
  const nav = useNavigate();
  const session = getSession();
  const currentRole = role || session?.role || 'student';
  const myId = session?.id || session?._id;

  // Active tab: default to 'received' for mentors, 'micro' for students
  const [activeTab, setActiveTab] = useState(currentRole === 'mentor' ? 'received' : 'micro');

  const [selectedMeetingId, setSelectedMeetingId] = useState('');
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

  const todayStr = new Date().toISOString().split('T')[0];

  // User's past meetings that were attended (scheduled in past or completed)
  const attendedPastMeetings = useMemo(() => {
    return (allMeetings || []).filter((m) => {
      const sId = m.studentId?._id || m.studentId?.id || m.studentId;
      const mId = m.mentorId?._id || m.mentorId?.id || m.mentorId;
      const isParticipant = String(sId) === String(myId) || String(mId) === String(myId);
      const isPastOrDone =
        m.status === 'completed' || (m.status === 'scheduled' && m.date <= todayStr);
      return isParticipant && isPastOrDone && m.status !== 'cancelled';
    });
  }, [allMeetings, myId, todayStr]);

  // Active accepted pairings
  const acceptedPairs = useMemo(() => {
    return (allRequests || []).filter((r) => {
      const sId = r.studentId?._id || r.studentId?.id || r.studentId;
      const mId = r.mentorId?._id || r.mentorId?.id || r.mentorId;
      const matchesMe =
        currentRole === 'student' ? String(sId) === String(myId) : String(mId) === String(myId);
      return matchesMe && r.status === 'accepted';
    });
  }, [allRequests, currentRole, myId]);

  // Feedback received by current user (for mentors, this is reviews from students)
  const receivedFeedback = useMemo(() => {
    return (allFeedback || []).filter((f) => {
      const toId = f.toUserId?._id || f.toUserId?.id || f.toUserId;
      return String(toId) === String(myId);
    });
  }, [allFeedback, myId]);

  // Feedback submitted by current user
  const mySubmittedFeedback = useMemo(() => {
    return (allFeedback || []).filter((f) => {
      const fFromId = f.fromUserId?._id || f.fromUserId?.id || f.fromUserId;
      return String(fFromId) === String(myId);
    });
  }, [allFeedback, myId]);

  // Statistics for received feedback
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!comment.trim() || submitting) return;

    let targetToUserId = '';
    let targetRequestId = '';

    if (activeTab === 'micro') {
      if (!selectedMeetingId) {
        return toast.error('Please select an attended past meeting to evaluate.');
      }
      const meeting = attendedPastMeetings.find((m) => (m.id || m._id) === selectedMeetingId);
      if (!meeting) return toast.error('Invalid meeting selection.');

      const partnerId =
        currentRole === 'student'
          ? meeting.mentorId?._id || meeting.mentorId?.id || meeting.mentorId
          : meeting.studentId?._id || meeting.studentId?.id || meeting.studentId;

      targetToUserId = partnerId;

      const req = acceptedPairs.find((r) => {
        const rMId = r.mentorId?._id || r.mentorId?.id || r.mentorId;
        const rSId = r.studentId?._id || r.studentId?.id || r.studentId;
        return currentRole === 'student'
          ? String(rMId) === String(partnerId)
          : String(rSId) === String(partnerId);
      });
      targetRequestId = req?.id || req?._id || '';
    } else {
      if (acceptedPairs.length === 0) {
        return toast.error('You need an active mentorship pairing to submit programme feedback.');
      }
      const pair = acceptedPairs[0];
      targetRequestId = pair.id || pair._id;
      targetToUserId =
        currentRole === 'student'
          ? pair.mentorId?._id || pair.mentorId?.id || pair.mentorId
          : pair.studentId?._id || pair.studentId?.id || pair.studentId;
    }

    setSubmitting(true);
    try {
      await apiPost('/feedback', {
        toUserId: targetToUserId,
        requestId: targetRequestId,
        meetingId: activeTab === 'micro' ? selectedMeetingId : undefined,
        rating: Number(rating),
        text: `[${activeTab === 'micro' ? 'Post-Meeting Micro-Survey' : 'End-of-Programme Satisfaction'}] ${comment.trim()}`,
        comment: comment.trim(),
        aspects: {
          usefulness: Number(usefulness),
          clarity: Number(clarity),
          comfort: Number(comfort),
        },
      });

      toast.success(
        activeTab === 'micro'
          ? 'Post-meeting evaluation submitted successfully!'
          : 'End-of-programme satisfaction survey submitted!'
      );
      setComment('');
      setSelectedMeetingId('');
      await refetchFeedback();
      setActiveTab('submitted');
    } catch (err) {
      toast.error(err?.message || 'Failed to submit feedback.');
    } finally {
      setSubmitting(false);
    }
  };

  const tabs =
    currentRole === 'mentor'
      ? [
          { id: 'received', label: `Reviews from Students (${receivedFeedback.length})` },
          { id: 'micro', label: 'Evaluate a Mentee' },
          { id: 'submitted', label: `Reviews You Submitted (${mySubmittedFeedback.length})` },
        ]
      : [
          { id: 'micro', label: 'Post-Meeting Micro-Survey' },
          { id: 'programme', label: 'End-of-Programme Satisfaction' },
          { id: 'received', label: `Feedback from Mentors (${receivedFeedback.length})` },
          { id: 'submitted', label: `Your Submitted Reviews (${mySubmittedFeedback.length})` },
        ];

  return (
    <AppShell role={currentRole}>
      <PageTitle
        eyebrow="Feedback & Quality Assurance"
        title={
          currentRole === 'mentor'
            ? 'Mentorship Feedback & Student Reviews'
            : 'Mentorship Feedback & Surveys'
        }
        text={
          currentRole === 'mentor'
            ? 'View student reviews and ratings for your mentorship sessions, and submit evaluations for mentees.'
            : 'Provide honest evaluations on meeting clarity, usefulness, and overall mentorship experience.'
        }
      />

      <div style={{ marginBottom: 18 }}>
        <TabBar tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
      </div>

      {/* TAB 1: REVIEWS RECEIVED FROM STUDENTS / PARTNERS */}
      {activeTab === 'received' && (
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
                    Average Score
                  </span>
                </div>

                <div>
                  <h2 style={{ fontSize: '1.25rem', margin: '0 0 6px 0' }}>
                    {currentRole === 'mentor'
                      ? 'Student Feedback & Performance'
                      : 'Received Mentorship Reviews'}
                  </h2>
                  <p
                    style={{
                      margin: 0,
                      color: 'var(--foreground-muted)',
                      fontSize: '0.9rem',
                      lineHeight: 1.5,
                    }}
                  >
                    Based on <b>{ratingStats.count}</b> verified session evaluations from students.
                  </p>
                </div>
              </div>

              {/* 3 Metric Pills */}
              <div
                style={{
                  display: 'flex',
                  gap: 12,
                  flexWrap: 'wrap',
                }}
              >
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
                text="When your mentees complete mentorship sessions and submit their evaluations, their reviews, star ratings, and feedback will be displayed here."
              />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {receivedFeedback.map((f) => {
                  const studentName = f.fromUserId?.name || 'Student';
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
                        "{f.comment || f.text || 'Excellent mentorship session.'}"
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      )}

      {/* TAB 2 & 3: EVALUATION SUBMISSION FORM */}
      {(activeTab === 'micro' || activeTab === 'programme') && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: 20,
          }}
        >
          {/* Survey Submission Form */}
          <section className="card form-card">
            <h2 style={{ fontSize: '1.15rem', margin: '0 0 14px 0' }}>
              {activeTab === 'micro'
                ? currentRole === 'mentor'
                  ? 'Evaluate Mentee Post-Session'
                  : 'Post-Meeting Micro-Evaluation'
                : 'End-of-Programme Satisfaction Review'}
            </h2>

            {activeTab === 'micro' && attendedPastMeetings.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px 0' }}>
                <p
                  style={{
                    color: 'var(--foreground-muted)',
                    fontSize: '0.9rem',
                    marginBottom: 14,
                    lineHeight: 1.5,
                  }}
                >
                  Post-meeting evaluations are only enabled after you have attended a scheduled
                  session.
                </p>
                <button
                  type="button"
                  className="btn secondary"
                  onClick={() => nav(currentRole === 'mentor' ? '/mentor/calendar' : '/calendar')}
                >
                  View Calendar & Meetings
                </button>
              </div>
            ) : (
              <form
                onSubmit={handleSubmit}
                style={{ display: 'flex', flexDirection: 'column', gap: 14 }}
              >
                {activeTab === 'micro' && (
                  <label>
                    <span style={{ fontWeight: 600, display: 'block', marginBottom: 4 }}>
                      Select Attended Meeting
                    </span>
                    <select
                      value={selectedMeetingId}
                      onChange={(e) => setSelectedMeetingId(e.target.value)}
                      required
                    >
                      <option value="">Choose a past meeting...</option>
                      {attendedPastMeetings.map((m) => {
                        const other =
                          currentRole === 'student'
                            ? typeof m.mentorId === 'object'
                              ? m.mentorId?.name
                              : allUsers.find((u) => (u.id || u._id) === m.mentorId)?.name
                            : typeof m.studentId === 'object'
                              ? m.studentId?.name
                              : allUsers.find((u) => (u.id || u._id) === m.studentId)?.name;

                        return (
                          <option key={m.id || m._id} value={m.id || m._id}>
                            {m.date} ({m.time}) · With {other || 'Partner'}
                          </option>
                        );
                      })}
                    </select>
                  </label>
                )}

                {/* 1-5 Star Overall Rating */}
                <div>
                  <span style={{ fontWeight: 600, display: 'block', marginBottom: 6 }}>
                    Overall Rating ({rating} of 5 stars)
                  </span>
                  <div style={{ display: 'flex', gap: 8 }}>
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
                        }}
                        aria-label={`${star} star`}
                      >
                        <Star size={24} fill={star <= rating ? '#f59e0b' : 'none'} />
                      </button>
                    ))}
                  </div>
                </div>

                {/* 1-5 Micro Scales */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                    gap: 12,
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
                      Usefulness (1-5)
                    </span>
                    <select
                      value={usefulness}
                      onChange={(e) => setUsefulness(Number(e.target.value))}
                    >
                      {[1, 2, 3, 4, 5].map((v) => (
                        <option key={v} value={v}>
                          {v} - {v === 5 ? 'High' : v === 1 ? 'Low' : 'Moderate'}
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
                      Clarity (1-5)
                    </span>
                    <select value={clarity} onChange={(e) => setClarity(Number(e.target.value))}>
                      {[1, 2, 3, 4, 5].map((v) => (
                        <option key={v} value={v}>
                          {v} - {v === 5 ? 'Clear' : v === 1 ? 'Confusing' : 'Fair'}
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
                      Comfort (1-5)
                    </span>
                    <select value={comfort} onChange={(e) => setComfort(Number(e.target.value))}>
                      {[1, 2, 3, 4, 5].map((v) => (
                        <option key={v} value={v}>
                          {v} - {v === 5 ? 'Great' : v === 1 ? 'Uneasy' : 'Good'}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <label>
                  <span style={{ fontWeight: 600, display: 'block', marginBottom: 4 }}>
                    Detailed Comments & Takeaways
                  </span>
                  <textarea
                    rows={4}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder={
                      currentRole === 'mentor'
                        ? 'Share feedback on student engagement, preparation, and follow-up recommendations...'
                        : 'Share constructive feedback regarding actionable advice, technical explanations, or guidance...'
                    }
                    required
                  />
                </label>

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 6 }}>
                  <button
                    type="submit"
                    className="uiverse-btn"
                    disabled={submitting || !comment.trim()}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                  >
                    <Send size={15} /> {submitting ? 'Submitting...' : 'Submit Evaluation'}
                  </button>
                </div>
              </form>
            )}
          </section>

          {/* Quick preview of submissions */}
          <section className="card">
            <h2 style={{ fontSize: '1.15rem', margin: '0 0 14px 0' }}>Your Submitted Reviews</h2>
            {mySubmittedFeedback.length === 0 ? (
              <EmptyState
                icon={Star}
                title="No evaluations submitted"
                text="Your submitted meeting evaluations and satisfaction surveys will appear here."
              />
            ) : (
              <div className="table-list">
                {mySubmittedFeedback.slice(0, 5).map((f) => (
                  <div
                    key={f.id || f._id}
                    style={{
                      padding: '12px 0',
                      borderBottom: '1px solid var(--border)',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: 6,
                      }}
                    >
                      <div style={{ display: 'flex', gap: 2 }}>
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            size={14}
                            color={s <= f.rating ? '#f59e0b' : 'var(--border)'}
                            fill={s <= f.rating ? '#f59e0b' : 'none'}
                          />
                        ))}
                      </div>
                      <small style={{ color: 'var(--foreground-muted)' }}>
                        {f.createdAt ? new Date(f.createdAt).toLocaleDateString() : 'Recorded'}
                      </small>
                    </div>
                    <p style={{ margin: 0, fontSize: '0.86rem', lineHeight: 1.5 }}>
                      {f.text || f.comment}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}

      {/* TAB 4: REVIEWS YOU SUBMITTED */}
      {activeTab === 'submitted' && (
        <section className="card">
          <h2 style={{ fontSize: '1.15rem', margin: '0 0 14px 0' }}>
            All Reviews You Have Submitted
          </h2>
          {mySubmittedFeedback.length === 0 ? (
            <EmptyState
              icon={Star}
              title="No evaluations submitted yet"
              text="Evaluations and reviews you have written will appear here."
            />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {mySubmittedFeedback.map((f) => (
                <div
                  key={f.id || f._id}
                  style={{
                    padding: '14px',
                    borderRadius: 8,
                    background: 'var(--surface-sunken, #f8fafc)',
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: 6,
                      flexWrap: 'wrap',
                      gap: 8,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ display: 'flex', gap: 2 }}>
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            size={15}
                            color={s <= f.rating ? '#f59e0b' : 'var(--border)'}
                            fill={s <= f.rating ? '#f59e0b' : 'none'}
                          />
                        ))}
                      </div>
                      <b style={{ color: '#f59e0b', fontSize: '0.9rem' }}>{f.rating}.0</b>
                    </div>
                    <small style={{ color: 'var(--foreground-muted)' }}>
                      {f.createdAt ? new Date(f.createdAt).toLocaleDateString() : 'Recorded'}
                    </small>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.88rem', lineHeight: 1.5 }}>
                    {f.text || f.comment}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>
      )}
    </AppShell>
  );
}
