import React, { useState, useMemo } from 'react';
import AppShell from '../../components/AppShell';
import PageTitle from '../../components/PageTitle';
import EmptyState from '../../components/EmptyState';
import StatusChip from '../../components/StatusChip';
import TabBar from '../../components/TabBar';
import ModalShell from '../../components/ModalShell';
import ProgressModal from '../../components/ProgressModal';
import { useGoals, useMeetings, useUsers, useMentorshipRequests } from '../../hooks/useApi';
import { getSession } from '../../lib/storage';
import { apiPost, apiPatch, suggestGoalsWithAi } from '../../lib/api';
import { downloadCsv } from '../../lib/exportUtils';
import { useToast } from '../../components/Toast';
import {
  Target,
  Sparkles,
  Download,
  CalendarDays,
  Plus,
  CheckCircle,
  Clock,
  Edit2,
  Trash2,
} from 'lucide-react';

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
  const [newMeetingId, setNewMeetingId] = useState('');

  // AI suggestions state
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [suggestedSmartGoals, setSuggestedSmartGoals] = useState([]);

  const { data: allGoals = [], loading: loadingGoals, refetch: refetchGoals } = useGoals();
  const { data: allMeetings = [] } = useMeetings();
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

  // Relevant meetings for this student
  const relevantMeetings = useMemo(() => {
    return (allMeetings || []).filter((m) => {
      const sId = m.studentId?._id || m.studentId?.id || m.studentId;
      return String(sId) === String(activeTargetStudentId);
    });
  }, [allMeetings, activeTargetStudentId]);

  // AI SMART Goal Suggestions
  const handleGenerateAiGoals = async () => {
    if (isAiLoading) return;
    setIsAiLoading(true);

    try {
      const studentUser =
        allUsers.find((u) => (u.id || u._id) === activeTargetStudentId) || session;
      const res = await suggestGoalsWithAi({
        studentSkills: studentUser?.skills || [],
        studentInterests: studentUser?.interests || [],
        studentGoals: studentUser?.goals || [],
      });

      if (res?.goals && res.goals.length > 0) {
        // Editable SMART goals before saving
        setSuggestedSmartGoals(
          res.goals.map((g) => ({
            title: g.title || '',
            target: g.target || g.description || '',
            targetDate: g.targetDate || '',
          }))
        );
        setAiModalOpen(true);
      } else {
        toast.error('Could not generate SMART goals suggestions.');
      }
    } catch {
      toast.error('AI goal suggestions service temporarily unavailable.');
    } finally {
      setIsAiLoading(false);
    }
  };

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
        meetingId: newMeetingId || undefined,
        progress: 0,
      });

      toast.success('Goal milestone created successfully.');
      setNewTitle('');
      setNewTarget('');
      setNewTargetDate('');
      setNewMeetingId('');
      await refetchGoals();
    } catch (err) {
      toast.error(err?.message || 'Failed to create goal.');
    } finally {
      setIsAdding(false);
    }
  };

  // Adopt SMART Goal from AI Modal
  const handleAdoptSmartGoal = async (smartGoal, index) => {
    try {
      await apiPost('/goals', {
        studentId: activeTargetStudentId,
        title: smartGoal.title,
        target: smartGoal.target || smartGoal.description || '',
        targetDate: smartGoal.targetDate || undefined,
        progress: 0,
      });

      toast.success(`Adopted goal: "${smartGoal.title}"`);
      setSuggestedSmartGoals((prev) => prev.filter((_, i) => i !== index));
      await refetchGoals();
    } catch (err) {
      toast.error(err?.message || 'Failed to adopt SMART goal.');
    }
  };

  // Save Progress from ProgressModal
  const handleSaveProgress = async (newVal) => {
    if (!progressGoal) return;
    try {
      const gId = progressGoal.id || progressGoal._id;
      await apiPatch(`/goals/${gId}`, {
        progress: Number(newVal),
        status: newVal >= 100 ? 'completed' : 'in_progress',
      });

      toast.success('Milestone progress updated.');
      setProgressGoal(null);
      await refetchGoals();
    } catch (err) {
      toast.error(err?.message || 'Failed to update progress.');
    }
  };

  const handleExportCsv = () => {
    downloadCsv(
      'mentorship_goals_report.csv',
      ['Goal Title', 'Success Criteria', 'Target Date', 'Linked Meeting', 'Progress %', 'Status'],
      studentGoals.map((g) => [
        g.title,
        g.target || '',
        g.targetDate || 'None',
        g.meetingId ? 'Linked' : 'None',
        `${g.progress || 0}%`,
        g.status || 'in_progress',
      ])
    );
    toast.success('Goals exported to CSV.');
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
          eyebrow="Milestones & Accountability"
          title={currentRole === 'student' ? 'My Goals & Milestones' : 'Mentee Milestone Goals'}
          text="Track tangible career and technical competencies linked to your mentorship meetings."
        />

        <div style={{ display: 'inline-flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="uiverse-btn"
            disabled={isAiLoading}
            onClick={handleGenerateAiGoals}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            <Sparkles size={15} /> {isAiLoading ? 'Synthesizing...' : 'AI SMART Goal Suggestions'}
          </button>

          {studentGoals.length > 0 && (
            <button
              type="button"
              className="btn secondary"
              onClick={handleExportCsv}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              <Download size={14} /> Export CSV
            </button>
          )}
        </div>
      </div>

      {currentRole === 'mentor' && myMentees.length > 0 && (
        <section className="card" style={{ marginBottom: 16 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontWeight: 600 }}>Select Mentee:</span>
            <select
              value={activeTargetStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              style={{ maxWidth: 300 }}
            >
              {myMentees.map((m) => (
                <option key={m.id || m._id} value={m.id || m._id}>
                  {m.name} ({m.course || 'BCA'})
                </option>
              ))}
            </select>
          </label>
        </section>
      )}

      {/* Goal Creation Form */}
      <section className="card form-card" style={{ marginBottom: 20 }}>
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
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
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

            <label>
              <span style={{ fontWeight: 600, display: 'block', marginBottom: 4 }}>
                Link to Scheduled Meeting (Optional)
              </span>
              <select value={newMeetingId} onChange={(e) => setNewMeetingId(e.target.value)}>
                <option value="">No linked meeting</option>
                {relevantMeetings.map((m) => (
                  <option key={m.id || m._id} value={m.id || m._id}>
                    {m.date} ({m.time}) · {m.status}
                  </option>
                ))}
              </select>
            </label>
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
          text="Track goals by creating a new milestone or using the AI SMART Goal Advisor above."
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

      {/* AI SMART Goals Suggestions Modal */}
      {aiModalOpen && (
        <ModalShell
          title="Recommended SMART Goals"
          isOpen={aiModalOpen}
          onClose={() => setAiModalOpen(false)}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--foreground-muted)' }}>
              Synthesized by AI from your technical competencies and profile trajectory. Review,
              edit target dates, and adopt into your milestone roadmap.
            </p>

            {suggestedSmartGoals.length === 0 ? (
              <p
                style={{ textAlign: 'center', color: 'var(--foreground-muted)', padding: '20px 0' }}
              >
                All generated goals have been adopted!
              </p>
            ) : (
              suggestedSmartGoals.map((sg, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: 14,
                    borderRadius: 8,
                    border: '1px solid var(--border)',
                    background: 'var(--surface-sunken, #f8fafc)',
                  }}
                >
                  <label style={{ display: 'block', marginBottom: 6 }}>
                    <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Title:</span>
                    <input
                      type="text"
                      value={sg.title}
                      onChange={(e) => {
                        const val = e.target.value;
                        setSuggestedSmartGoals((prev) =>
                          prev.map((g, i) => (i === idx ? { ...g, title: val } : g))
                        );
                      }}
                      style={{ width: '100%', marginTop: 4 }}
                    />
                  </label>

                  <label style={{ display: 'block', marginBottom: 6 }}>
                    <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Success Criteria:</span>
                    <input
                      type="text"
                      value={sg.target}
                      onChange={(e) => {
                        const val = e.target.value;
                        setSuggestedSmartGoals((prev) =>
                          prev.map((g, i) => (i === idx ? { ...g, target: val } : g))
                        );
                      }}
                      style={{ width: '100%', marginTop: 4 }}
                    />
                  </label>

                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginTop: 10,
                    }}
                  >
                    <label
                      style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem' }}
                    >
                      <span>Target:</span>
                      <input
                        type="date"
                        value={sg.targetDate}
                        onChange={(e) => {
                          const val = e.target.value;
                          setSuggestedSmartGoals((prev) =>
                            prev.map((g, i) => (i === idx ? { ...g, targetDate: val } : g))
                          );
                        }}
                      />
                    </label>

                    <button
                      type="button"
                      className="uiverse-btn"
                      onClick={() => handleAdoptSmartGoal(sg, idx)}
                      style={{ fontSize: '0.8rem', padding: '6px 14px' }}
                    >
                      Adopt Goal
                    </button>
                  </div>
                </div>
              ))
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
              <button type="button" className="btn secondary" onClick={() => setAiModalOpen(false)}>
                Done
              </button>
            </div>
          </div>
        </ModalShell>
      )}
    </AppShell>
  );
}
