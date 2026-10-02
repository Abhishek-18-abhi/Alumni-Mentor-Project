import React, { useState, useMemo } from 'react';
import AppShell from '../../components/AppShell';
import PageTitle from '../../components/PageTitle';
import EmptyState from '../../components/EmptyState';
import StatusChip from '../../components/StatusChip';
import TabBar from '../../components/TabBar';
import ScoreBreakdown from '../../components/ScoreBreakdown';
import { useMentorshipRequests, useUsers } from '../../hooks/useApi';
import { getSession } from '../../lib/storage';
import { apiPatch, summarizeRequestWithAi } from '../../lib/api';
import { useToast } from '../../components/Toast';
import { Sparkles, CheckCircle, XCircle, Clock, ArrowUpDown, AlertCircle } from 'lucide-react';

export default function MentorRequests() {
  const toast = useToast();
  const session = getSession();
  const mentorId = session?.id || session?._id;

  const [tab, setTab] = useState('pending');
  const [sortBy, setSortBy] = useState('date'); // 'date' | 'score'
  const [respondingId, setRespondingId] = useState(null);
  const [aiSummaries, setAiSummaries] = useState({});
  const [summarizingId, setSummarizingId] = useState(null);

  const { data: requests = [], loading, refetch } = useMentorshipRequests();
  const { data: users = [] } = useUsers();

  const mentorProfile = (users || []).find((u) => u.id === mentorId || u._id === mentorId);
  const capacity = mentorProfile?.capacity || 5;
  const currentMentees = mentorProfile?.currentMentees || 0;
  const isFull = currentMentees >= capacity;

  // Filter requests directed to this mentor
  const myRequests = useMemo(() => {
    return (requests || []).filter((r) => {
      const mId = r.mentorId?._id || r.mentorId?.id || r.mentorId;
      return String(mId) === String(mentorId);
    });
  }, [requests, mentorId]);

  // Tab filtering
  const filtered = useMemo(() => {
    let items = myRequests;
    if (tab === 'pending') items = items.filter((r) => r.status === 'pending');
    else if (tab === 'accepted') items = items.filter((r) => r.status === 'accepted');
    else if (tab === 'rejected') items = items.filter((r) => r.status === 'rejected');

    return [...items].sort((a, b) => {
      if (sortBy === 'score') {
        const scoreA = a.matchSnapshot?.score || 0;
        const scoreB = b.matchSnapshot?.score || 0;
        return scoreB - scoreA;
      }
      return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    });
  }, [myRequests, tab, sortBy]);

  const handleAiSummary = async (r, student) => {
    const rId = r.id || r._id;
    if (summarizingId) return;
    setSummarizingId(rId);
    try {
      const res = await summarizeRequestWithAi({
        requestId: rId,
        message: r.message,
        requestMessage: r.message,
        studentSkills: student?.skills || [],
        sharedSkills: student?.skills || [],
        studentGoals: student?.goals || [],
        matchScore: r.matchSnapshot?.score || 0,
        factors: r.matchSnapshot?.factors || [],
        mentorDomain: mentorProfile?.domain || '',
      });
      if (res?.summary) {
        setAiSummaries((prev) => ({ ...prev, [rId]: res.summary }));
      } else {
        toast.error('Could not generate AI summary.');
      }
    } catch {
      toast.error('AI summary service temporarily unavailable.');
    } finally {
      setSummarizingId(null);
    }
  };

  const handleRespond = async (r, status) => {
    const rId = r.id || r._id;
    if (respondingId) return;
    setRespondingId(rId);

    try {
      await apiPatch(`/mentorship-requests/${rId}/respond`, { status });
      toast.success(status === 'accepted' ? 'Mentorship request accepted.' : 'Request declined.');
      await refetch();
    } catch (err) {
      toast.error(
        err?.message || `Failed to ${status === 'accepted' ? 'accept' : 'decline'} request.`
      );
    } finally {
      setRespondingId(null);
    }
  };

  const tabs = [
    {
      id: 'pending',
      label: 'Pending',
      count: myRequests.filter((r) => r.status === 'pending').length,
    },
    {
      id: 'accepted',
      label: 'Accepted Mentees',
      count: myRequests.filter((r) => r.status === 'accepted').length,
    },
    {
      id: 'rejected',
      label: 'Declined',
      count: myRequests.filter((r) => r.status === 'rejected').length,
    },
    { id: 'all', label: 'All Requests', count: myRequests.length },
  ];

  return (
    <AppShell role="mentor">
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <PageTitle
          eyebrow="Alumni Mentor Workspace"
          title="Student Requests"
          text="Review incoming mentorship inquiries. Check student compatibility, goals, and capacity limits."
        />

        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button
            type="button"
            className="btn mini secondary"
            onClick={() => setSortBy((s) => (s === 'date' ? 'score' : 'date'))}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}
          >
            <ArrowUpDown size={13} />
            Sort: {sortBy === 'score' ? 'Match Score' : 'Newest Date'}
          </button>
        </div>
      </div>

      {isFull && (
        <div className="alert-card alert-error" style={{ marginBottom: 16 }}>
          <AlertCircle size={18} />
          <div>
            <b>
              Capacity Limit Reached ({currentMentees} / {capacity})
            </b>
            <p style={{ margin: '2px 0 0 0', fontSize: '0.84rem' }}>
              You are currently guiding the maximum number of active mentees. Accepting another
              request requires increasing your capacity in Availability settings.
            </p>
          </div>
        </div>
      )}

      <div style={{ marginBottom: 16 }}>
        <TabBar tabs={tabs} activeTab={tab} onChange={setTab} />
      </div>

      {loading ? (
        <div className="skeleton-container" role="status" aria-live="polite">
          <div className="skeleton-bar" style={{ height: 100, marginBottom: 12 }} />
          <div className="skeleton-bar" style={{ height: 100, marginBottom: 12 }} />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Clock}
          title={`No ${tab} requests`}
          text="Incoming mentorship inquiries from students will appear here."
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {filtered.map((r) => {
            const rId = r.id || r._id;
            const student = r.studentId;
            const score = r.matchSnapshot?.score;
            const factors = r.matchSnapshot?.factors || [];
            const isPending = r.status === 'pending';
            const aiSummary = aiSummaries[rId];

            return (
              <section key={rId} className="card" style={{ padding: 18 }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    flexWrap: 'wrap',
                    gap: 12,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div className="mentor-avatar">{student?.name?.[0] || 'S'}</div>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '1.05rem' }}>
                        {student?.name || 'Student'}
                      </h3>
                      <p
                        style={{
                          margin: '2px 0 0 0',
                          fontSize: '0.85rem',
                          color: 'var(--foreground-muted)',
                        }}
                      >
                        {student?.course || 'BCA Student'}{' '}
                        {student?.college ? `· ${student.college}` : ''}
                      </p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {score !== undefined && (
                      <span className="match-score" style={{ fontWeight: 700 }}>
                        {score}% match
                      </span>
                    )}
                    <StatusChip status={r.status} />
                  </div>
                </div>

                {r.message && (
                  <div
                    style={{
                      margin: '14px 0',
                      padding: 12,
                      borderRadius: 6,
                      background: 'var(--surface-sunken, #f8fafc)',
                      borderLeft: '3px solid var(--primary)',
                      fontSize: '0.88rem',
                      lineHeight: 1.5,
                    }}
                  >
                    <b>Student Note:</b> "{r.message}"
                  </div>
                )}

                {/* Factors preview */}
                {factors.length > 0 && (
                  <div style={{ marginTop: 12 }}>
                    <ScoreBreakdown factors={factors} compact />
                  </div>
                )}

                {/* AI Executive Fit Summary */}
                <div
                  style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid var(--border)' }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Sparkles size={15} style={{ color: 'var(--primary)' }} />
                      <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                        AI Request Summary
                      </span>
                    </div>

                    {!aiSummary && (
                      <button
                        type="button"
                        className="btn mini secondary"
                        disabled={summarizingId === rId}
                        onClick={() => handleAiSummary(r, student)}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
                      >
                        <Sparkles size={12} />{' '}
                        {summarizingId === rId ? 'Generating...' : 'Summarize Request'}
                      </button>
                    )}
                  </div>

                  {aiSummary && (
                    <div
                      style={{
                        marginTop: 8,
                        padding: 10,
                        borderRadius: 6,
                        background: 'var(--background)',
                        fontSize: '0.84rem',
                        lineHeight: 1.5,
                      }}
                    >
                      <p style={{ margin: 0 }}>{aiSummary}</p>
                      <small
                        style={{
                          color: 'var(--foreground-muted)',
                          display: 'block',
                          marginTop: 4,
                          fontSize: '0.72rem',
                        }}
                      >
                        AI generated summary from factor contributions.
                      </small>
                    </div>
                  )}
                </div>

                {/* Action Buttons for Pending Requests */}
                {isPending && (
                  <div
                    style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}
                  >
                    <button
                      type="button"
                      className="btn secondary mini"
                      disabled={respondingId === rId}
                      onClick={() => handleRespond(r, 'rejected')}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
                    >
                      <XCircle size={14} /> Decline
                    </button>
                    <button
                      type="button"
                      className="btn primary mini"
                      disabled={respondingId === rId || isFull}
                      onClick={() => handleRespond(r, 'accepted')}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
                      title={
                        isFull
                          ? 'Capacity full. Increase capacity to accept.'
                          : 'Accept student request'
                      }
                    >
                      <CheckCircle size={14} /> {isFull ? 'At Capacity' : 'Accept Request'}
                    </button>
                  </div>
                )}
              </section>
            );
          })}
        </div>
      )}
    </AppShell>
  );
}
