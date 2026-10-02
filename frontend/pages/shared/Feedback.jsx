import React, { useState, useMemo } from 'react';
import AppShell from '../../components/AppShell';
import PageTitle from '../../components/PageTitle';
import EmptyState from '../../components/EmptyState';
import TabBar from '../../components/TabBar';
import { useFeedback, useMeetings, useUsers, useMentorshipRequests } from '../../hooks/useApi';
import { getSession } from '../../lib/storage';
import { apiPost } from '../../lib/api';
import { useToast } from '../../components/Toast';
import { Star, CheckCircle2, CalendarDays, Send, MessageSquare, Award } from 'lucide-react';

export default function Feedback({ role }) {
  const toast = useToast();
  const session = getSession();
  const currentRole = role || session?.role || 'student';
  const myId = session?.id || session?._id;

  const [surveyType, setSurveyType] = useState('micro'); // 'micro' | 'programme'
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

  // Feedback submitted by current user
  const mySubmittedFeedback = useMemo(() => {
    return (allFeedback || []).filter((f) => {
      const fFromId = f.fromUserId?._id || f.fromUserId?.id || f.fromUserId;
      return String(fFromId) === String(myId);
    });
  }, [allFeedback, myId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!comment.trim() || submitting) return;

    let targetToUserId = '';
    let targetRequestId = '';

    if (surveyType === 'micro') {
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

      // Find associated request
      const req = acceptedPairs.find((r) => {
        const rMId = r.mentorId?._id || r.mentorId?.id || r.mentorId;
        const rSId = r.studentId?._id || r.studentId?.id || r.studentId;
        return currentRole === 'student'
          ? String(rMId) === String(partnerId)
          : String(rSId) === String(partnerId);
      });
      targetRequestId = req?.id || req?._id || '';
    } else {
      // Programme Survey
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
        meetingId: surveyType === 'micro' ? selectedMeetingId : undefined,
        rating: Number(rating),
        text: `[${surveyType === 'micro' ? 'Post-Meeting Micro-Survey' : 'End-of-Programme Satisfaction'}] ${comment.trim()}`,
        comment: comment.trim(),
        aspects: {
          usefulness: Number(usefulness),
          clarity: Number(clarity),
          comfort: Number(comfort),
        },
      });

      toast.success(
        surveyType === 'micro'
          ? 'Post-meeting evaluation submitted successfully!'
          : 'End-of-programme satisfaction survey submitted!'
      );
      setComment('');
      setSelectedMeetingId('');
      await refetchFeedback();
    } catch (err) {
      toast.error(err?.message || 'Failed to submit feedback.');
    } finally {
      setSubmitting(false);
    }
  };

  const tabs = [
    { id: 'micro', label: 'Post-Meeting Micro-Survey' },
    { id: 'programme', label: 'End-of-Programme Satisfaction' },
  ];

  return (
    <AppShell role={currentRole}>
      <PageTitle
        eyebrow="Feedback & Quality Assurance"
        title="Mentorship Feedback & Surveys"
        text="Provide honest evaluations on meeting clarity, usefulness, and overall mentorship experience."
      />

      <div style={{ marginBottom: 16 }}>
        <TabBar tabs={tabs} activeTab={surveyType} onChange={setSurveyType} />
      </div>

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
            {surveyType === 'micro'
              ? 'Post-Meeting Micro-Evaluation'
              : 'End-of-Programme Satisfaction Review'}
          </h2>

          {surveyType === 'micro' && attendedPastMeetings.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <p style={{ color: 'var(--foreground-muted)', fontSize: '0.9rem', marginBottom: 12 }}>
                Post-meeting micro-evaluations are only enabled after you have attended a scheduled
                session.
              </p>
              <button type="button" className="btn secondary" onClick={() => nav('/meetings')}>
                View Meetings
              </button>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              style={{ display: 'flex', flexDirection: 'column', gap: 14 }}
            >
              {surveyType === 'micro' && (
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
                            : users.find((u) => (u.id || u._id) === m.mentorId)?.name
                          : typeof m.studentId === 'object'
                            ? m.studentId?.name
                            : users.find((u) => (u.id || u._id) === m.studentId)?.name;

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
                  placeholder="Share constructive feedback regarding actionable advice, technical explanations, or guidance..."
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

        {/* Previous Feedback History */}
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
              {mySubmittedFeedback.map((f) => (
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
    </AppShell>
  );
}
