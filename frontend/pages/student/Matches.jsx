import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import AppShell from '../../components/AppShell';
import PageTitle from '../../components/PageTitle';
import EmptyState from '../../components/EmptyState';
import StatusChip from '../../components/StatusChip';
import ScoreBreakdown from '../../components/ScoreBreakdown';
import TabBar from '../../components/TabBar';
import { useMentorshipRequests, useRankedMatches } from '../../hooks/useApi';
import { getSession } from '../../lib/storage';
import { apiPatch } from '../../lib/api';
import { useToast } from '../../components/Toast';
import {
  Sparkles,
  CalendarDays,
  Clock,
  CheckCircle2,
  XCircle,
  Undo2,
  ArrowRight,
  MessageSquare,
} from 'lucide-react';

export default function Matches() {
  const nav = useNavigate();
  const toast = useToast();
  const session = getSession();
  const studentId = session?.id || session?._id;

  const [activeTab, setActiveTab] = useState('requests');
  const [withdrawingId, setWithdrawingId] = useState(null);

  const {
    data: requests = [],
    loading: loadingRequests,
    refetch: refetchRequests,
  } = useMentorshipRequests();

  const { data: serverMatches = [], loading: loadingMatches } = useRankedMatches(studentId);

  // Student's sent requests
  const myRequests = (requests || []).filter((r) => {
    const sId = r.studentId?._id || r.studentId?.id || r.studentId;
    return String(sId) === String(studentId);
  });

  const pendingRequests = (myRequests || []).filter((r) => r.status === 'pending');
  const acceptedRequests = (myRequests || []).filter((r) => r.status === 'accepted');

  const handleWithdrawRequest = async (requestId) => {
    if (!requestId || withdrawingId) return;
    setWithdrawingId(requestId);
    try {
      await apiPatch(`/mentorship-requests/${requestId}/withdraw`, {});
      toast.success('Mentorship request withdrawn successfully.');
      await refetchRequests();
    } catch (err) {
      toast.error(err?.message || 'Failed to withdraw request.');
    } finally {
      setWithdrawingId(null);
    }
  };

  const tabs = [
    { id: 'requests', label: 'My Inquiries & Pairings', count: myRequests.length },
    { id: 'ranked', label: 'Ranked Algorithm Recommendations', count: serverMatches.length },
  ];

  return (
    <AppShell role="student">
      <PageTitle
        eyebrow="Student Workspace"
        title="Mentorship Matches & Inquiries"
        text="Review your active mentor connections, pending requests, and algorithmic recommendations."
      />

      <div style={{ marginBottom: 20 }}>
        <TabBar tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
      </div>

      {activeTab === 'requests' ? (
        <section className="card">
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 16,
            }}
          >
            <h2 style={{ margin: 0, fontSize: '1.15rem' }}>Active & Pending Requests</h2>
            <Link to="/mentors" className="text-link" style={{ fontSize: '0.86rem' }}>
              Find more mentors <ArrowRight size={13} />
            </Link>
          </div>

          {loadingRequests ? (
            <div className="skeleton-container" role="status" aria-live="polite">
              <div className="skeleton-bar" style={{ height: 60, marginBottom: 12 }} />
              <div className="skeleton-bar" style={{ height: 60, marginBottom: 12 }} />
            </div>
          ) : myRequests.length === 0 ? (
            <EmptyState
              icon={Sparkles}
              title="No mentorship requests yet"
              text="Explore available alumni mentors and send an inquiry to initiate mentorship."
              actionLabel="Browse Mentors"
              onAction={() => nav('/mentors')}
            />
          ) : (
            <div className="table-list">
              {myRequests.map((req) => {
                const mentor = req.mentorId;
                const score = req.matchSnapshot?.score;
                const isPending = req.status === 'pending';
                const isAccepted = req.status === 'accepted';

                return (
                  <div
                    key={req.id || req._id}
                    className="table-row"
                    style={{
                      padding: '16px 0',
                      borderBottom: '1px solid var(--border)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: 12,
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 240 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div
                          className="mentor-avatar"
                          style={{ width: 36, height: 36, fontSize: '0.9rem' }}
                        >
                          {mentor?.name?.[0] || 'M'}
                        </div>
                        <div>
                          <b style={{ fontSize: '0.98rem' }}>{mentor?.name || 'Alumnus Mentor'}</b>
                          <p
                            style={{
                              margin: '2px 0 0 0',
                              fontSize: '0.82rem',
                              color: 'var(--foreground-muted)',
                            }}
                          >
                            {mentor?.jobTitle || 'Mentor'}{' '}
                            {mentor?.company ? `· ${mentor.company}` : ''}
                          </p>
                        </div>
                      </div>

                      {req.message && (
                        <p
                          style={{
                            margin: '8px 0 0 46px',
                            fontSize: '0.84rem',
                            color: 'var(--foreground-muted)',
                            fontStyle: 'italic',
                          }}
                        >
                          "{req.message}"
                        </p>
                      )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      {score !== undefined && (
                        <span className="match-score" style={{ fontWeight: 700 }}>
                          {score}% match
                        </span>
                      )}

                      <StatusChip status={req.status} />

                      {isAccepted && (
                        <Link
                          to="/meetings"
                          className="btn mini primary"
                          style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
                        >
                          <CalendarDays size={13} /> Book Meeting
                        </Link>
                      )}

                      {isPending && (
                        <button
                          type="button"
                          className="btn mini secondary"
                          disabled={withdrawingId === (req.id || req._id)}
                          onClick={() => handleWithdrawRequest(req.id || req._id)}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
                          title="Withdraw this pending mentorship request"
                        >
                          <Undo2 size={13} />{' '}
                          {withdrawingId === (req.id || req._id) ? 'Withdrawing...' : 'Withdraw'}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      ) : (
        <section className="card">
          <div style={{ marginBottom: 16 }}>
            <h2 style={{ margin: 0, fontSize: '1.15rem' }}>Server-Ranked Explainable Matches</h2>
            <p
              style={{ margin: '4px 0 0 0', fontSize: '0.86rem', color: 'var(--foreground-muted)' }}
            >
              Computed in real-time by the matching algorithm based on your profile skills,
              interests, goals, and mentor availability.
            </p>
          </div>

          {loadingMatches ? (
            <div className="skeleton-container" role="status" aria-live="polite">
              <div className="skeleton-bar" style={{ height: 80, marginBottom: 12 }} />
              <div className="skeleton-bar" style={{ height: 80, marginBottom: 12 }} />
            </div>
          ) : serverMatches.length === 0 ? (
            <EmptyState
              title="No recommendations found"
              text="Update your skills and career interests in your profile to generate match recommendations."
              actionLabel="Update Profile"
              onAction={() => nav('/profile')}
            />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {serverMatches.map((item) => {
                const mentor = item.mentor || item;
                const factors = item.factors || [];
                const score = item.score !== undefined ? item.score : item.match?.score;

                return (
                  <div
                    key={mentor.id || mentor._id}
                    className="card"
                    style={{
                      background: 'var(--surface-sunken, #f8fafc)',
                      border: '1px solid var(--border)',
                      padding: 18,
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: 12,
                        marginBottom: 12,
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div className="mentor-avatar">{mentor.name?.[0] || 'M'}</div>
                        <div>
                          <b style={{ fontSize: '1.05rem' }}>{mentor.name}</b>
                          <p
                            style={{
                              margin: '2px 0 0 0',
                              fontSize: '0.85rem',
                              color: 'var(--foreground-muted)',
                            }}
                          >
                            {mentor.jobTitle} {mentor.company ? `· ${mentor.company}` : ''} ·{' '}
                            {mentor.domain || 'Software'}
                          </p>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span
                          className="match-score"
                          style={{ fontWeight: 700, fontSize: '0.95rem' }}
                        >
                          {score}% match
                        </span>
                        <button
                          type="button"
                          className="btn primary mini"
                          onClick={() => nav(`/request?mentor=${mentor.id || mentor._id}`)}
                        >
                          Request
                        </button>
                      </div>
                    </div>

                    <ScoreBreakdown factors={factors} compact />
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
