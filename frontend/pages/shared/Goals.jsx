import React, { useState, useMemo } from 'react';
import AppShell from '../../components/AppShell';
import PageTitle from '../../components/PageTitle';
import EmptyState from '../../components/EmptyState';
import StatusChip from '../../components/StatusChip';
import TabBar from '../../components/TabBar';
import ProgressModal from '../../components/ProgressModal';
import { useGoals, useUsers, useMentorshipRequests } from '../../hooks/useApi';
import { getSession } from '../../lib/storage';
import { apiPost, apiPatch } from '../../lib/api';
import { useToast } from '../../components/Toast';
import { Target, CalendarDays, Plus, CheckCircle, Clock, Edit2, Trash2 } from 'lucide-react';

export default function Goals({ role }) {
  const toast = useToast();
  const session = getSession();
  const currentRole = role || session?.role || 'student';
  const myId = session?.id || session?._id;

  const [tab, setTab] = useState('all'); // 'all' | 'active' | 'completed'
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [progressGoal, setProgressGoal] = useState(null);

  // New goal form
  const [newTitle, setNewTitle] = useState('');
  const [newTarget, setNewTarget] = useState('');
  const [newTargetDate, setNewTargetDate] = useState('');

  const { data: allGoals = [], loading: loadingGoals, refetch: refetchGoals } = useGoals();
  const { data: allUsers = [] } = useUsers();
  const { data: allRequests = [] } = useMentorshipRequests();

  // Find paired students if role === 'mentor'
  const myMentees = useMemo(() => {
    if (currentRole !== 'mentor') return [];
    const accepted = (allRequests || []).filter((r) => {
      const mId = r.mentorId?._id || r.mentorId?.id || r.mentorId;
      return String(mId) === String(myId) && r.status === 'accepted';
    });
    return (accepted || [])
      .map((r) => {
        const sId = r.studentId?._id || r.studentId?.id || r.studentId;
        return (allUsers || []).find((u) => (u.id || u._id) === sId) || r.studentId;
      })
      .filter(Boolean);
  }, [allRequests, currentRole, myId, allUsers]);

  const activeTargetStudentId =
    currentRole === 'student' ? myId : selectedStudentId || myMentees[0]?.id || myMentees[0]?._id;

  // Filter goals
  const studentGoals = useMemo(() => {
    return (allGoals || []).filter((g) => {
      const gStudentId = g.studentId?._id || g.studentId?.id || g.studentId;
      return String(gStudentId) === String(activeTargetStudentId);
    });
  }, [allGoals, activeTargetStudentId]);

  const displayedGoals = useMemo(() => {
    return (studentGoals || []).filter((g) => {
      if (tab === 'active') return g.status !== 'completed';
      if (tab === 'completed') return g.status === 'completed';
      return true;
    });
  }, [studentGoals, tab]);

  // Add a goal
  const handleAddGoal = async (e) => {
    e.preventDefault();
    if (!newTitle.trim() || isAdding) return;
    if (!activeTargetStudentId) return toast.error('No target student specified.');

    setIsAdding(true);
    try {
      await apiPost('/goals', {
        studentId: activeTargetStudentId,
        title: newTitle.trim(),
        target: newTarget.trim(),
        targetDate: newTargetDate || undefined,
        progress: 0,
      });

      toast.success('Goal milestone created successfully.');
      setNewTitle('');
      setNewTarget('');
      setNewTargetDate('');
      await refetchGoals();
    } catch (err) {
      toast.error(err?.message || 'Failed to create goal.');
    } finally {
      setIsAdding(false);
    }
  };

  // Save Progress from ProgressModal
  const handleSaveProgress = async (newVal) => {
    if (!progressGoal) return;
    try {
      const gId = progressGoal.id || progressGoal._id;
      const numVal = Math.min(100, Math.max(0, Number(newVal) || 0));
      await apiPatch(`/goals/${gId}`, {
        progress: numVal,
        status: numVal >= 100 ? 'completed' : 'active',
      });

      toast.success('Milestone progress updated.');
      setProgressGoal(null);
      await refetchGoals();
    } catch (err) {
      toast.error(err?.message || 'Failed to update progress.');
    }
  };

  const tabs = [
    { id: 'all', label: 'All Goals', count: studentGoals.length },
    {
      id: 'active',
      label: 'In Progress',
      count: studentGoals.filter((g) => g.status !== 'completed').length,
    },
    {
      id: 'completed',
      label: 'Completed',
      count: studentGoals.filter((g) => g.status === 'completed').length,
    },
  ];

  return (
    <AppShell role={currentRole}>
      <div style={{ marginBottom: 16 }}>
        <PageTitle
          eyebrow="Milestones & Accountability"
          title={currentRole === 'student' ? 'My Goals & Milestones' : 'Mentee Milestone Goals'}
          text="Track tangible career and technical competencies to achieve your professional milestones."
        />
      </div>

      {/* Goal Creation Form */}
      <section className="card" style={{ marginBottom: 20, width: '100%' }}>
        <h3 style={{ margin: '0 0 14px 0', fontSize: '1.05rem', fontWeight: 700 }}>
          Add New Milestone Goal
        </h3>
        <form
          onSubmit={handleAddGoal}
          style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: 12,
            }}
          >
            <label>
              <span style={{ fontWeight: 600, display: 'block', marginBottom: 4 }}>Goal Title</span>
              <input
                type="text"
                placeholder="e.g. Master System Design & Microservices"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                required
              />
            </label>

            <label>
              <span style={{ fontWeight: 600, display: 'block', marginBottom: 4 }}>
                Success Criteria / Deliverable
              </span>
              <input
                type="text"
                placeholder="e.g. Implement rate limiter and deploy to AWS"
                value={newTarget}
                onChange={(e) => setNewTarget(e.target.value)}
              />
            </label>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns:
                currentRole === 'mentor'
                  ? 'repeat(auto-fit, minmax(260px, 1fr))'
                  : 'minmax(260px, 320px)',
              gap: 12,
            }}
          >
            <label>
              <span style={{ fontWeight: 600, display: 'block', marginBottom: 4 }}>
                Target Completion Date
              </span>
              <input
                type="date"
                value={newTargetDate}
                onChange={(e) => setNewTargetDate(e.target.value)}
              />
            </label>

            {currentRole === 'mentor' && (
              <label>
                <span style={{ fontWeight: 600, display: 'block', marginBottom: 4 }}>
                  Select Mentee
                </span>
                <select
                  value={activeTargetStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  disabled={myMentees.length === 0}
                >
                  {myMentees.length === 0 ? (
                    <option value="">No active mentees paired</option>
                  ) : (
                    myMentees.map((m) => (
                      <option key={m.id || m._id} value={m.id || m._id}>
                        {m.name} ({m.course || 'BCA'})
                      </option>
                    ))
                  )}
                </select>
              </label>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 4 }}>
            <button
              type="submit"
              className="uiverse-btn"
              disabled={isAdding || !newTitle.trim()}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              <Plus size={15} /> {isAdding ? 'Saving...' : 'Add Milestone Goal'}
            </button>
          </div>
        </form>
      </section>

      {/* Tabs */}
      <div style={{ marginBottom: 16 }}>
        <TabBar tabs={tabs} activeTab={tab} onChange={setTab} />
      </div>

      {/* Goals Grid */}
      {loadingGoals ? (
        <div className="skeleton-container" role="status" aria-live="polite">
          <div className="skeleton-bar" style={{ height: 90, marginBottom: 12 }} />
          <div className="skeleton-bar" style={{ height: 90, marginBottom: 12 }} />
        </div>
      ) : displayedGoals.length === 0 ? (
        <EmptyState
          icon={Target}
          title={`No ${tab} goals`}
          text="Track goals by creating a new milestone goal above."
        />
      ) : (
        <div className="goal-grid">
          {displayedGoals.map((g) => {
            const gId = g.id || g._id;
            const progress = g.progress || 0;
            const isCompleted = g.status === 'completed' || progress >= 100;

            return (
              <article key={gId} className="card goal-card">
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    gap: 8,
                  }}
                >
                  <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700 }}>{g.title}</h3>
                  <StatusChip status={isCompleted ? 'completed' : 'in_progress'} size="sm" />
                </div>

                {g.target && (
                  <p style={{ margin: '6px 0', fontSize: '0.86rem', color: 'var(--foreground)' }}>
                    {g.target}
                  </p>
                )}

                <div
                  style={{
                    display: 'flex',
                    gap: 12,
                    fontSize: '0.78rem',
                    color: 'var(--foreground-muted)',
                    margin: '8px 0',
                  }}
                >
                  {g.targetDate && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      <Clock size={12} /> Target: {g.targetDate}
                    </span>
                  )}
                  {g.meetingId && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      <CalendarDays size={12} /> Linked Meeting
                    </span>
                  )}
                </div>

                <div
                  className="sim-bar"
                  style={{ width: '100%', height: 6, margin: '10px 0 6px 0' }}
                >
                  <div
                    className="sim-bar-fill"
                    style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
                  />
                </div>

                <div
                  className="goal-foot"
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginTop: 'auto',
                  }}
                >
                  <span style={{ fontWeight: 600, fontSize: '0.82rem' }}>{progress}% Complete</span>
                  <button
                    type="button"
                    className="btn mini secondary"
                    onClick={() => setProgressGoal(g)}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
                  >
                    <Edit2 size={12} /> Update Progress
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Progress Update Modal */}
      {progressGoal && (
        <ProgressModal
          goalTitle={progressGoal.title}
          initial={progressGoal.progress || 0}
          onSave={handleSaveProgress}
          onCancel={() => setProgressGoal(null)}
        />
      )}
    </AppShell>
  );
}
