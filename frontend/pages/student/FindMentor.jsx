import React, { useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import AppShell from '../../components/AppShell';
import PageTitle from '../../components/PageTitle';
import EmptyState from '../../components/EmptyState';
import TabBar from '../../components/TabBar';
import ScoreBreakdown from '../../components/ScoreBreakdown';
import ModalShell from '../../components/ModalShell';
import { useUsers } from '../../hooks/useApi';
import { getSession } from '../../lib/storage';
import { scoreMatch } from '../../lib/matching';
import { explainMatchWithAi } from '../../lib/api';
import { useToast } from '../../components/Toast';
import {
  Search,
  Users,
  Sparkles,
  ArrowRight,
  Filter,
  X,
  Clock,
  Briefcase,
  AlertCircle,
} from 'lucide-react';

const PAGE_SIZE = 6;

export default function FindMentor() {
  const nav = useNavigate();
  const [params, setParams] = useSearchParams();
  const [q, setQ] = useState(params.get('search') || '');
  const [activeTab, setActiveTab] = useState('all');
  const [selectedDomain, setSelectedDomain] = useState('all');
  const [page, setPage] = useState(1);
  const [inspectingMentor, setInspectingMentor] = useState(null);
  const [aiExplanation, setAiExplanation] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const toast = useToast();

  const session = getSession();
  const { data: allUsers = [], loading, error, refetch } = useUsers();

  const currentStudent = useMemo(() => {
    return (allUsers || []).find((u) => u.id === session?.id || u._id === session?.id) || session;
  }, [allUsers, session]);

  // Mentors only, excluding the current student themselves if dual registered
  const eligibleMentors = useMemo(() => {
    return (allUsers || []).filter((u) => {
      const uId = u.id || u._id;
      const myId = currentStudent?.id || currentStudent?._id;
      return u.role === 'mentor' && u.profileComplete && uId !== myId;
    });
  }, [allUsers, currentStudent]);

  // Compute matches
  const matchedMentors = useMemo(() => {
    return (eligibleMentors || [])
      .map((mentor) => ({
        ...mentor,
        id: mentor.id || mentor._id,
        match: scoreMatch(currentStudent, mentor),
      }))
      .sort((a, b) => b.match.score - a.match.score);
  }, [eligibleMentors, currentStudent]);

  // Distinct domains
  const availableDomains = useMemo(() => {
    const set = new Set();
    matchedMentors.forEach((m) => {
      if (m.domain) set.add(m.domain);
    });
    return Array.from(set);
  }, [matchedMentors]);

  // Filtering
  const filteredMentors = useMemo(() => {
    return matchedMentors.filter((m) => {
      // Search term
      if (q.trim()) {
        const text = [
          m.name,
          m.jobTitle,
          m.company,
          m.domain,
          ...(m.skills || []),
          ...(m.interests || []),
        ]
          .join(' ')
          .toLowerCase();
        if (!text.includes(q.toLowerCase())) return false;
      }

      // Domain
      if (selectedDomain !== 'all' && m.domain !== selectedDomain) {
        return false;
      }

      // Tabs
      if (activeTab === 'top') return m.match.score >= 80;
      if (activeTab === 'capacity')
        return (m.currentMentees || 0) < (m.capacity || 5) && !m.pauseRequests;

      return true;
    });
  }, [matchedMentors, q, selectedDomain, activeTab]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredMentors.length / PAGE_SIZE));
  const paginatedMentors = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredMentors.slice(start, start + PAGE_SIZE);
  }, [filteredMentors, page]);

  const clearAllFilters = () => {
    setQ('');
    setActiveTab('all');
    setSelectedDomain('all');
    setPage(1);
    setParams({});
  };

  const handleOpenWhyDrawer = async (mentor) => {
    setInspectingMentor(mentor);
    setAiExplanation('');
  };

  const handleGenerateAiWhy = async (mentor) => {
    if (!mentor || isAiLoading) return;
    setIsAiLoading(true);
    try {
      const res = await explainMatchWithAi({ mentorId: mentor.id || mentor._id });
      if (res?.explanation) {
        setAiExplanation(res.explanation);
      } else {
        toast.error('Could not generate AI explanation.');
      }
    } catch {
      toast.error('AI advisory service temporarily unavailable.');
    } finally {
      setIsAiLoading(false);
    }
  };

  const tabs = [
    { id: 'all', label: 'All Mentors', count: matchedMentors.length },
    {
      id: 'top',
      label: 'Top Matches (80%+)',
      count: matchedMentors.filter((m) => m.match.score >= 80).length,
    },
    {
      id: 'capacity',
      label: 'Available Capacity',
      count: matchedMentors.filter(
        (m) => (m.currentMentees || 0) < (m.capacity || 5) && !m.pauseRequests
      ).length,
    },
  ];

  return (
    <AppShell role="student">
      <PageTitle
        eyebrow="Student Workspace"
        title="Find a Mentor"
        text="Discover verified alumni mentors. Recommendations are calculated from transparent factor overlap."
      />

      {/* Filter and Search Bar */}
      <section className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <div className="search large-search" style={{ flex: 1, minWidth: 260 }}>
            <Search size={17} />
            <input
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setPage(1);
                setParams(e.target.value ? { search: e.target.value } : {});
              }}
              placeholder="Search mentors, skills, companies or domains..."
              aria-label="Search mentors"
            />
            {q && (
              <button
                type="button"
                className="icon-btn"
                onClick={() => {
                  setQ('');
                  setPage(1);
                  setParams({});
                }}
                aria-label="Clear search"
              >
                <X size={15} />
              </button>
            )}
          </div>

          {availableDomains.length > 0 && (
            <div style={{ minWidth: 180 }}>
              <select
                value={selectedDomain}
                onChange={(e) => {
                  setSelectedDomain(e.target.value);
                  setPage(1);
                }}
                aria-label="Filter by domain"
                style={{ height: '100%' }}
              >
                <option value="all">All Domains</option>
                {availableDomains.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
          )}

          {(q || selectedDomain !== 'all' || activeTab !== 'all') && (
            <button
              type="button"
              className="btn secondary"
              onClick={clearAllFilters}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              <X size={14} /> Clear filters
            </button>
          )}
        </div>

        <div style={{ marginTop: 14 }}>
          <TabBar
            tabs={tabs}
            activeTab={activeTab}
            onChange={(tab) => {
              setActiveTab(tab);
              setPage(1);
            }}
          />
        </div>
      </section>

      {/* Mentor Cards Grid */}
      {loading ? (
        <div className="mentor-grid">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="card skeleton-card" style={{ height: 260 }}>
              <div
                className="skeleton-bar"
                style={{ width: '50%', height: 22, marginBottom: 12 }}
              />
              <div
                className="skeleton-bar"
                style={{ width: '80%', height: 16, marginBottom: 16 }}
              />
              <div className="skeleton-bar" style={{ width: '100%', height: 40 }} />
            </div>
          ))}
        </div>
      ) : paginatedMentors.length === 0 ? (
        <EmptyState
          icon={Users}
          title={q ? 'No mentors match your search' : 'No mentors available in this filter'}
          text="Try adjusting your search criteria, domain filter, or clear filters."
          actionLabel="Clear all filters"
          onAction={clearAllFilters}
        />
      ) : (
        <>
          <div className="mentor-grid">
            {paginatedMentors.map((m) => {
              const currentMentees = m.currentMentees || 0;
              const capacity = m.capacity || 5;
              const isFull = currentMentees >= capacity;
              const isPaused = Boolean(m.pauseRequests);
              const canRequest = !isFull && !isPaused;

              return (
                <article
                  key={m.id || m._id}
                  className="mentor-card"
                  role="button"
                  tabIndex={0}
                  onClick={(e) => {
                    if (!e.target.closest('button') && !e.target.closest('a')) {
                      handleOpenWhyDrawer(m);
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      if (!e.target.closest('button') && !e.target.closest('a')) {
                        e.preventDefault();
                        handleOpenWhyDrawer(m);
                      }
                    }
                  }}
                >
                  <div className="mentor-avatar">{m.name?.[0] || 'M'}</div>
                  <div className="mentor-main">
                    <div>
                      <h3
                        style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}
                      >
                        {m.name}
                      </h3>
                      <p>
                        {m.jobTitle} {m.company ? `· ${m.company}` : ''}
                      </p>
                    </div>
                    <span className="match-score" style={{ fontWeight: 700 }}>
                      {m.match.score}% match
                    </span>
                  </div>

                  <p
                    style={{
                      fontSize: '0.86rem',
                      color: 'var(--foreground-muted)',
                      margin: '6px 0',
                    }}
                  >
                    {m.domain || m.interests?.join(', ') || 'Mentorship'}
                  </p>

                  {/* Skills preview */}
                  <div className="tag-row" style={{ marginBottom: 12 }}>
                    {(m.skills || []).slice(0, 4).map((skill) => (
                      <span key={skill} className="category-pill-tech">
                        {skill}
                      </span>
                    ))}
                  </div>

                  {/* Honest Capacity Indicator */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: '0.8rem',
                      color: isFull || isPaused ? 'var(--warning-text)' : 'var(--foreground-muted)',
                      marginBottom: 12,
                      padding: '4px 8px',
                      borderRadius: 6,
                      background: 'var(--surface-sunken, #f8fafc)',
                    }}
                  >
                    <span>Capacity</span>
                    <b>
                      {isPaused
                        ? 'Requests Paused'
                        : isFull
                          ? `Full (${currentMentees}/${capacity})`
                          : `${currentMentees}/${capacity} spots filled`}
                    </b>
                  </div>

                  <div style={{ display: 'flex', gap: 8, marginTop: 'auto' }}>
                    <button
                      type="button"
                      className="btn secondary mini"
                      style={{
                        flex: 1,
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 4,
                      }}
                      onClick={() => handleOpenWhyDrawer(m)}
                    >
                      <Sparkles size={13} /> Why this match?
                    </button>
                    <button
                      type="button"
                      className={`btn primary mini ${!canRequest ? 'disabled' : ''}`}
                      disabled={!canRequest}
                      onClick={() => nav(`/request?mentor=${m.id || m._id}`)}
                      title={
                        isPaused
                          ? 'Mentor paused intake'
                          : isFull
                            ? 'Mentor capacity full'
                            : 'Send request'
                      }
                    >
                      {isPaused ? 'Paused' : isFull ? 'Full' : 'Request'}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: 12,
                marginTop: 24,
              }}
            >
              <button
                type="button"
                className="btn secondary mini"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </button>
              <span style={{ fontSize: '0.88rem', color: 'var(--foreground-muted)' }}>
                Page {page} of {totalPages}
              </span>
              <button
                type="button"
                className="btn secondary mini"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {/* "Why this match" Modal Drawer */}
      {inspectingMentor && (
        <ModalShell
          title={`Explainable Match: ${inspectingMentor.name}`}
          isOpen={Boolean(inspectingMentor)}
          onClose={() => setInspectingMentor(null)}
        >
          <div style={{ padding: 4 }}>
            <p style={{ fontSize: '0.88rem', color: 'var(--foreground-muted)', marginBottom: 16 }}>
              Match compatibility is computed strictly from transparent factors: skills overlap
              (45%), interests (20%), goals (15%), languages (10%), availability (5%), and capacity
              (5%).
            </p>

            <ScoreBreakdown
              score={inspectingMentor.match.score}
              factors={inspectingMentor.match.factors}
            />

            {/* AI Explanation Assist */}
            <div
              className="ai-explain-panel"
              style={{
                marginTop: 20,
                padding: 14,
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
                  marginBottom: aiExplanation ? 10 : 0,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Sparkles size={16} style={{ color: 'var(--primary)' }} />
                  <b style={{ fontSize: '0.9rem' }}>AI Fit Analysis</b>
                </div>
                {!aiExplanation && (
                  <button
                    type="button"
                    className="btn mini secondary"
                    disabled={isAiLoading}
                    onClick={() => handleGenerateAiWhy(inspectingMentor)}
                  >
                    {isAiLoading ? 'Analyzing...' : 'Generate AI Summary'}
                  </button>
                )}
              </div>

              {aiExplanation ? (
                <div>
                  <p
                    style={{
                      margin: 0,
                      fontSize: '0.88rem',
                      lineHeight: 1.6,
                      color: 'var(--foreground)',
                    }}
                  >
                    {aiExplanation}
                  </p>
                  <small
                    style={{
                      display: 'block',
                      marginTop: 8,
                      color: 'var(--foreground-muted)',
                      fontSize: '0.74rem',
                    }}
                  >
                    AI explanation is grounded strictly in deterministic factors. Scores are never
                    overridden by AI.
                  </small>
                </div>
              ) : (
                <p
                  style={{
                    margin: '6px 0 0 0',
                    fontSize: '0.8rem',
                    color: 'var(--foreground-muted)',
                  }}
                >
                  Click above for an AI synthesis of this pairing based on your mutual skills and
                  goals.
                </p>
              )}
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: 10,
                marginTop: 20,
                position: 'sticky',
                bottom: -24,
                background: 'var(--surface)',
                paddingTop: 12,
                paddingBottom: 4,
                borderTop: '1px solid var(--border)',
                zIndex: 10,
              }}
            >
              <button
                type="button"
                className="btn secondary"
                onClick={() => setInspectingMentor(null)}
              >
                Close
              </button>
              <button
                type="button"
                className="btn primary"
                disabled={
                  (inspectingMentor.currentMentees || 0) >= (inspectingMentor.capacity || 5) ||
                  inspectingMentor.pauseRequests
                }
                onClick={() => {
                  const mId = inspectingMentor.id || inspectingMentor._id;
                  setInspectingMentor(null);
                  nav(`/request?mentor=${mId}`);
                }}
              >
                Request Mentorship
              </button>
            </div>
          </div>
        </ModalShell>
      )}
    </AppShell>
  );
}
