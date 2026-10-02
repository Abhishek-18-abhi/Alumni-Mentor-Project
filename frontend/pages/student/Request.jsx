import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import AppShell from '../../components/AppShell';
import PageTitle from '../../components/PageTitle';
import EmptyState from '../../components/EmptyState';
import { useUsers, useMentorshipRequests } from '../../hooks/useApi';
import { getSession } from '../../lib/storage';
import { apiPost } from '../../lib/api';
import { useToast } from '../../components/Toast';
import { Send, Users, AlertCircle } from 'lucide-react';

export default function Request() {
  const [params] = useSearchParams();
  const mentorId = params.get('mentor');
  const nav = useNavigate();
  const toast = useToast();
  const session = getSession();

  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { data: allUsers = [], loading: loadingUsers } = useUsers();
  const { data: existingRequests = [], refetch: refetchRequests } = useMentorshipRequests();

  const mentor = (allUsers || []).find((u) => u.id === mentorId || u._id === mentorId);
  const student = (allUsers || []).find((u) => u.id === session?.id || u._id === session?.id) || session;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!mentor || !student || submitting) return;

    // Check if duplicate request already exists
    const duplicate = (existingRequests || []).find((r) => {
      const rStudentId = r.studentId?._id || r.studentId?.id || r.studentId;
      const rMentorId = r.mentorId?._id || r.mentorId?.id || r.mentorId;
      const sId = student.id || student._id;
      const mId = mentor.id || mentor._id;
      return (
        String(rStudentId) === String(sId) &&
        String(rMentorId) === String(mId) &&
        ['pending', 'accepted'].includes(r.status)
      );
    });

    if (duplicate) {
      return toast.error(
        duplicate.status === 'accepted'
          ? 'You are already actively paired with this mentor.'
          : 'You already have a pending mentorship request with this mentor.'
      );
    }

    setSubmitting(true);
    try {
      // POST to /api/mentorship-requests (backend calculates matchSnapshot server-side)
      await apiPost('/mentorship-requests', {
        mentorId: mentor.id || mentor._id,
        message: message.trim(),
      });

      toast.success('Mentorship request submitted successfully!');
      await refetchRequests();
      nav('/matches');
    } catch (err) {
      toast.error(err?.message || 'Failed to submit mentorship request.');
    } finally {
      setSubmitting(false);
    }
  };

  const isFull = (mentor?.currentMentees || 0) >= (mentor?.capacity || 5);
  const isPaused = Boolean(mentor?.pauseRequests);

  return (
    <AppShell role="student">
      <PageTitle
        eyebrow="Mentorship"
        title="Request Mentorship"
        text={mentor ? `Send an inquiry to ${mentor.name}.` : 'Select a mentor from discovery.'}
      />

      {loadingUsers ? (
        <div className="card skeleton-card" style={{ height: 260 }}>
          <div className="skeleton-bar" style={{ width: '40%', height: 24, marginBottom: 12 }} />
          <div className="skeleton-bar" style={{ width: '100%', height: 100 }} />
        </div>
      ) : !mentor ? (
        <EmptyState
          icon={Users}
          title="No mentor selected"
          text="Please select a verified mentor from the Find Mentor page to send an inquiry."
          actionLabel="Find a Mentor"
          onAction={() => nav('/mentors')}
        />
      ) : (
        <section className="card form-card" style={{ maxWidth: 640 }}>
          {/* Mentor Preview */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              padding: 16,
              borderRadius: 8,
              background: 'var(--surface-sunken, #f8fafc)',
              marginBottom: 20,
            }}
          >
            <div className="mentor-avatar">{mentor.name?.[0] || 'M'}</div>
            <div style={{ flex: 1 }}>
              <b style={{ fontSize: '1.05rem' }}>{mentor.name}</b>
              <p
                style={{
                  margin: '2px 0 0 0',
                  fontSize: '0.85rem',
                  color: 'var(--foreground-muted)',
                }}
              >
                {mentor.jobTitle} {mentor.company ? `· ${mentor.company}` : ''}
              </p>
              <span style={{ fontSize: '0.8rem', color: 'var(--foreground-muted)' }}>
                Domain: {mentor.domain || 'Software Engineering'} · Capacity:{' '}
                {mentor.currentMentees || 0}/{mentor.capacity || 5}
              </span>
            </div>
          </div>

          {(isFull || isPaused) && (
            <div className="alert-card alert-error" style={{ marginBottom: 18 }}>
              <AlertCircle size={18} />
              <div>
                <b>Mentorship Unavailable</b>
                <p style={{ margin: '2px 0 0 0', fontSize: '0.84rem' }}>
                  {isPaused
                    ? 'This mentor has temporarily paused new inquiries.'
                    : 'This mentor is currently at full capacity.'}
                </p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <label style={{ display: 'block', marginBottom: 14 }}>
              <span style={{ fontWeight: 600, display: 'block', marginBottom: 6 }}>
                Introductory message / guidance goals
              </span>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={5}
                required
                disabled={isFull || isPaused || submitting}
                placeholder="Explain what specific technical or career advice you're looking for, which project you're working on, or questions you have..."
                style={{ width: '100%', resize: 'vertical' }}
              />
              <small style={{ color: 'var(--foreground-muted)', display: 'block', marginTop: 4 }}>
                A clear, focused message helps the mentor review your fit faster.
              </small>
            </label>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
              <button
                type="button"
                className="btn secondary"
                onClick={() => nav(-1)}
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="uiverse-btn"
                disabled={isFull || isPaused || submitting}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                <Send size={15} /> {submitting ? 'Submitting...' : 'Send Mentorship Request'}
              </button>
            </div>
          </form>
        </section>
      )}
    </AppShell>
  );
}
