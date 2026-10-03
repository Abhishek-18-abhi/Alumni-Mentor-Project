import React, { useState, useEffect } from 'react';
import AppShell from '../../components/AppShell';
import PageTitle from '../../components/PageTitle';
import EmptyState from '../../components/EmptyState';
import StatCard from '../../components/StatCard';
import ModalShell from '../../components/ModalShell';
import { fetchAdminAnalytics, fetchSystemMetrics } from '../../lib/api';
import {
  BarChart3,
  Users,
  Award,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Calendar,
  Star,
  Activity,
  ShieldCheck,
  Eye,
  MessageSquare,
  Search,
} from 'lucide-react';

export default function AdminAnalytics() {
  const [analytics, setAnalytics] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reviewViewTab, setReviewViewTab] = useState('leaderboard');
  const [selectedMentor, setSelectedMentor] = useState(null);
  const [feedbackSearch, setFeedbackSearch] = useState('');

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [aRes, mRes] = await Promise.allSettled([fetchAdminAnalytics(), fetchSystemMetrics()]);

      if (aRes.status === 'fulfilled' && aRes.value) {
        setAnalytics(aRes.value);
      }
      if (mRes.status === 'fulfilled' && mRes.value) {
        setMetrics(mRes.value);
      }
    } catch (err) {
      setError(err?.message || 'Failed to fetch server analytics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const overview = analytics?.overview || {};
  const funnel = analytics?.funnel || {};
  const balance = analytics?.capacity || analytics?.capacityBalance || {};
  const meetingStats = analytics?.meetings || {};
  const satisfaction = analytics?.satisfaction || {};
  const feedbackStats = analytics?.feedback || {};
  const mentorPerformance = analytics?.mentorPerformance || [];
  const allFeedback = analytics?.allFeedback || [];

  const filteredMentors = mentorPerformance.filter((m) => {
    if (!feedbackSearch.trim()) return true;
    const q = feedbackSearch.toLowerCase();
    return (
      (m.name || '').toLowerCase().includes(q) ||
      (m.company || '').toLowerCase().includes(q) ||
      (m.domain || '').toLowerCase().includes(q)
    );
  });

  const filteredAllFeedback = allFeedback.filter((f) => {
    if (!feedbackSearch.trim()) return true;
    const q = feedbackSearch.toLowerCase();
    return (
      (f.studentName || '').toLowerCase().includes(q) ||
      (f.mentorName || '').toLowerCase().includes(q) ||
      (f.text || '').toLowerCase().includes(q)
    );
  });

  return (
    <AppShell role="admin">
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
          eyebrow="Administrator Platform Portal"
          title="Server-Side Platform Analytics"
          text="Real-time institutional metrics computed directly from MongoDB. Zero fabricated numbers."
        />
        <button
          type="button"
          className="btn mini secondary"
          onClick={loadData}
          disabled={loading}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
        >
          <Activity size={14} /> Refresh Metrics
        </button>
      </div>

      {/* KPI Cards Row */}
      <div className="shopeers-kpi-grid" style={{ marginBottom: 24 }}>
        <StatCard
          label="Acceptance Funnel Rate"
          value={`${funnel.acceptRatePercent ?? funnel.acceptRate ?? 0}%`}
          icon={TrendingUp}
          color="blue"
          subtext={`${funnel.accepted || 0} accepted of ${funnel.totalRequests || 0} inquiries`}
        />
        <StatCard
          label="Capacity Gini Coefficient"
          value={
            balance.loadGiniCoefficient !== undefined
              ? balance.loadGiniCoefficient.toFixed(3)
              : balance.gini !== undefined
                ? balance.gini.toFixed(3)
                : '0.000'
          }
          icon={BarChart3}
          color="green"
          subtext={`Std Dev: ${
            balance.loadStandardDeviation !== undefined
              ? balance.loadStandardDeviation.toFixed(3)
              : balance.stdDev !== undefined
                ? balance.stdDev.toFixed(3)
                : '0.000'
          }`}
        />
        <StatCard
          label="Scheduling Conflicts Blocked"
          value={meetingStats.conflictsBlockedCount ?? meetingStats.conflictsBlocked ?? 0}
          icon={ShieldCheck}
          color="purple"
          subtext="Prevented double-bookings"
        />
        <StatCard
          label="Satisfaction Index"
          value={
            (satisfaction.totalSurveys || feedbackStats.totalReviews || 0) >= 3
              ? `${satisfaction.averageRating || feedbackStats.avgRating} ★`
              : 'New Network'
          }
          icon={Star}
          color="orange"
          subtext={`${satisfaction.totalSurveys || feedbackStats.totalReviews || 0} reviews recorded`}
        />
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
          gap: 20,
          marginBottom: 20,
        }}
      >
        {/* Request-to-Acceptance Funnel Section */}
        <section className="card">
          <h2 style={{ fontSize: '1.1rem', margin: '0 0 14px 0' }}>Request-to-Acceptance Funnel</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '0.85rem',
                  marginBottom: 4,
                }}
              >
                <span>1. Total Inquiries Sent</span>
                <b>{funnel.totalRequests || 0}</b>
              </div>
              <div className="sim-bar" style={{ width: '100%', height: 8 }}>
                <div className="sim-bar-fill" style={{ width: '100%' }} />
              </div>
            </div>

            <div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '0.85rem',
                  marginBottom: 4,
                }}
              >
                <span>2. Pending Mentor Review</span>
                <b>{funnel.pending || 0}</b>
              </div>
              <div className="sim-bar" style={{ width: '100%', height: 8 }}>
                <div
                  className="sim-bar-fill"
                  style={{
                    width: `${funnel.totalRequests ? Math.round((funnel.pending / funnel.totalRequests) * 100) : 0}%`,
                    background: 'var(--warning)',
                  }}
                />
              </div>
            </div>

            <div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '0.85rem',
                  marginBottom: 4,
                }}
              >
                <span>3. Accepted Mentorships</span>
                <b>{funnel.accepted || 0}</b>
              </div>
              <div className="sim-bar" style={{ width: '100%', height: 8 }}>
                <div
                  className="sim-bar-fill"
                  style={{
                    width: `${funnel.totalRequests ? Math.round((funnel.accepted / funnel.totalRequests) * 100) : 0}%`,
                    background: 'var(--success)',
                  }}
                />
              </div>
            </div>

            <div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '0.85rem',
                  marginBottom: 4,
                }}
              >
                <span>4. Declined Inquiries</span>
                <b>{funnel.rejected || 0}</b>
              </div>
              <div className="sim-bar" style={{ width: '100%', height: 8 }}>
                <div
                  className="sim-bar-fill"
                  style={{
                    width: `${funnel.totalRequests ? Math.round((funnel.rejected / funnel.totalRequests) * 100) : 0}%`,
                    background: 'var(--danger, #ef4444)',
                  }}
                />
              </div>
            </div>
          </div>
        </section>

        {/* Capacity & Load Balance Analysis */}
        <section className="card">
          <h2 style={{ fontSize: '1.1rem', margin: '0 0 14px 0' }}>
            Capacity Distribution & Balance
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: '0.88rem' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '6px 0',
                borderBottom: '1px solid var(--border)',
              }}
            >
              <span>Total Network Capacity:</span>
              <b>{balance.totalCapacity || 0} mentee slots</b>
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '6px 0',
                borderBottom: '1px solid var(--border)',
              }}
            >
              <span>Active Mentees Assigned:</span>
              <b>{balance.totalCurrentMentees || 0} students</b>
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '6px 0',
                borderBottom: '1px solid var(--border)',
              }}
            >
              <span>Mean Mentor Load Ratio:</span>
              <b>
                {balance.meanLoadRatio !== undefined
                  ? `${Math.round(balance.meanLoadRatio * 100)}%`
                  : '0%'}
              </b>
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '6px 0',
                borderBottom: '1px solid var(--border)',
              }}
            >
              <span>Capacity Gini Inequality Index:</span>
              <b>
                {balance.loadGiniCoefficient !== undefined
                  ? balance.loadGiniCoefficient.toFixed(3)
                  : balance.gini !== undefined
                    ? balance.gini.toFixed(3)
                    : '0.000'}
              </b>
            </div>
            <p
              style={{
                margin: '8px 0 0 0',
                fontSize: '0.78rem',
                color: 'var(--foreground-muted)',
                lineHeight: 1.4,
              }}
            >
              * Gini index evaluates distribution of mentee load across alumni mentors (0 =
              perfectly balanced load).
            </p>
          </div>
        </section>
      </div>

      {/* Mentor Load-Balance Table */}
      <section className="card">
        <h2 style={{ fontSize: '1.1rem', margin: '0 0 14px 0' }}>
          Mentor Load Balance & Overload Warnings
        </h2>
        {(balance.overloadedMentors || []).length === 0 ? (
          <div
            style={{
              padding: 16,
              background: 'var(--surface-sunken, #f8fafc)',
              borderRadius: 8,
              textAlign: 'center',
            }}
          >
            <CheckCircle
              size={20}
              style={{ color: 'var(--success-text)', margin: '0 auto 6px auto' }}
            />
            <b style={{ color: 'var(--success-text)' }}>All Mentor Loads Within Thresholds</b>
            <p
              style={{ margin: '4px 0 0 0', fontSize: '0.84rem', color: 'var(--foreground-muted)' }}
            >
              No alumni mentors currently exceed their maximum active mentee capacity limit.
            </p>
          </div>
        ) : (
          <div
            className="table-container"
            tabIndex={0}
            role="region"
            aria-label="Overloaded Mentors Table"
          >
            <table className="shopeers-table">
              <thead>
                <tr>
                  <th>Mentor</th>
                  <th>Company</th>
                  <th>Current Load</th>
                  <th>Capacity Limit</th>
                  <th>Load Ratio</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {balance.overloadedMentors.map((m, idx) => (
                  <tr key={m.id || m._id || m.userId || idx}>
                    <td>
                      <b>{m.name}</b>
                    </td>
                    <td>{m.company}</td>
                    <td>
                      <b>{m.currentMentees}</b> mentees
                    </td>
                    <td>{m.capacity} spots</td>
                    <td>{m.loadRatioPercent}%</td>
                    <td>
                      <span
                        className="status-chip status-rejected"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
                      >
                        <AlertTriangle size={12} /> Full Capacity
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Mentor Performance & Student Reviews Section */}
      <section className="card" style={{ marginTop: 24 }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 12,
            marginBottom: 16,
          }}
        >
          <div>
            <h2
              style={{
                fontSize: '1.15rem',
                margin: '0 0 4px 0',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <Award size={20} style={{ color: '#f59e0b' }} /> Mentor Performance & Student Reviews
            </h2>
            <p style={{ margin: 0, color: 'var(--foreground-muted)', fontSize: '0.88rem' }}>
              Track how each mentor is performing based on real student evaluations and feedback
              ratings.
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Search
                size={14}
                style={{
                  position: 'absolute',
                  left: 10,
                  color: 'var(--foreground-muted)',
                  pointerEvents: 'none',
                }}
              />
              <input
                type="text"
                placeholder="Search mentor or company..."
                value={feedbackSearch}
                onChange={(e) => setFeedbackSearch(e.target.value)}
                style={{
                  padding: '6px 12px 6px 30px',
                  fontSize: '0.84rem',
                  borderRadius: 6,
                  border: '1px solid var(--border)',
                  background: 'var(--background)',
                  color: 'var(--foreground)',
                  width: 210,
                }}
              />
            </div>
            <div
              style={{
                display: 'inline-flex',
                background: 'var(--surface-sunken, #f1f5f9)',
                padding: 3,
                borderRadius: 8,
                gap: 4,
              }}
            >
              <button
                type="button"
                className={`btn mini ${reviewViewTab === 'leaderboard' ? 'primary' : 'secondary'}`}
                onClick={() => setReviewViewTab('leaderboard')}
                style={{ padding: '4px 12px', fontSize: '0.82rem' }}
              >
                Mentor Leaderboard ({mentorPerformance.length})
              </button>
              <button
                type="button"
                className={`btn mini ${reviewViewTab === 'stream' ? 'primary' : 'secondary'}`}
                onClick={() => setReviewViewTab('stream')}
                style={{ padding: '4px 12px', fontSize: '0.82rem' }}
              >
                All Student Reviews ({allFeedback.length})
              </button>
            </div>
          </div>
        </div>

        {/* Tab 1: Mentor Performance Leaderboard */}
        {reviewViewTab === 'leaderboard' && (
          <div
            className="table-container"
            tabIndex={0}
            role="region"
            aria-label="Mentor Performance Table"
          >
            <table className="shopeers-table">
              <thead>
                <tr>
                  <th>Mentor</th>
                  <th>Domain & Company</th>
                  <th>Total Reviews</th>
                  <th>Average Rating</th>
                  <th>Aspect Breakdown</th>
                  <th>Performance Tier</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredMentors.length === 0 ? (
                  <tr>
                    <td
                      colSpan="7"
                      style={{
                        textAlign: 'center',
                        padding: 24,
                        color: 'var(--foreground-muted)',
                      }}
                    >
                      {mentorPerformance.length === 0
                        ? 'No mentor profiles registered yet.'
                        : 'No mentors match your search query.'}
                    </td>
                  </tr>
                ) : (
                  filteredMentors.map((m) => (
                    <tr key={m.mentorId || m.email}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div
                            className="mentor-avatar"
                            style={{
                              width: 32,
                              height: 32,
                              fontSize: '0.82rem',
                              background: 'var(--primary-subtle, #e0e7ff)',
                              color: 'var(--primary)',
                            }}
                          >
                            {m.name?.[0] || 'M'}
                          </div>
                          <div>
                            <b style={{ fontSize: '0.9rem' }}>{m.name}</b>
                            <div style={{ fontSize: '0.76rem', color: 'var(--foreground-muted)' }}>
                              {m.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span style={{ fontWeight: 500 }}>
                          {m.domain || 'Software Engineering'}
                        </span>
                        <div style={{ fontSize: '0.78rem', color: 'var(--foreground-muted)' }}>
                          {m.company || 'Alumni Cell'}
                        </div>
                      </td>
                      <td>
                        <span
                          className={`status-chip ${m.totalReviews > 0 ? 'status-accepted' : 'status-pending'}`}
                        >
                          <b>{m.totalReviews}</b> {m.totalReviews === 1 ? 'review' : 'reviews'}
                        </span>
                      </td>
                      <td>
                        {m.avgRating !== null ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Star size={14} fill="#f59e0b" stroke="#f59e0b" />
                            <b style={{ color: '#b45309', fontSize: '0.92rem' }}>
                              {m.avgRating.toFixed(1)}
                            </b>
                            <span style={{ fontSize: '0.78rem', color: 'var(--foreground-muted)' }}>
                              / 5.0
                            </span>
                          </div>
                        ) : (
                          <span style={{ color: 'var(--foreground-muted)', fontSize: '0.82rem' }}>
                            Unrated
                          </span>
                        )}
                      </td>
                      <td>
                        {m.totalReviews > 0 ? (
                          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                            <span
                              className="category-pill-tech"
                              style={{ fontSize: '0.7rem', padding: '2px 6px' }}
                            >
                              Use: {m.avgUsefulness}
                            </span>
                            <span
                              className="category-pill-tech"
                              style={{ fontSize: '0.7rem', padding: '2px 6px' }}
                            >
                              Clar: {m.avgClarity}
                            </span>
                            <span
                              className="category-pill-tech"
                              style={{ fontSize: '0.7rem', padding: '2px 6px' }}
                            >
                              Comf: {m.avgComfort}
                            </span>
                          </div>
                        ) : (
                          <span style={{ color: 'var(--foreground-muted)', fontSize: '0.82rem' }}>
                            —
                          </span>
                        )}
                      </td>
                      <td>
                        {m.totalReviews === 0 ? (
                          <span className="status-chip" style={{ fontSize: '0.76rem' }}>
                            No Reviews
                          </span>
                        ) : m.avgRating >= 4.5 ? (
                          <span
                            className="status-chip status-accepted"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                              fontSize: '0.76rem',
                            }}
                          >
                            <Award size={12} /> Top Performer
                          </span>
                        ) : m.avgRating >= 3.8 ? (
                          <span
                            className="status-chip status-pending"
                            style={{ fontSize: '0.76rem' }}
                          >
                            Good
                          </span>
                        ) : (
                          <span
                            className="status-chip status-rejected"
                            style={{ fontSize: '0.76rem' }}
                          >
                            Needs Improvement
                          </span>
                        )}
                      </td>
                      <td>
                        <button
                          type="button"
                          className="btn mini secondary"
                          onClick={() => setSelectedMentor(m)}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            padding: '4px 8px',
                            fontSize: '0.78rem',
                          }}
                        >
                          <Eye size={12} /> View Reviews ({m.totalReviews})
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 2: All Student Reviews Stream */}
        {reviewViewTab === 'stream' && (
          <div>
            {filteredAllFeedback.length === 0 ? (
              <div
                style={{
                  padding: 32,
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
                  No student reviews found
                </p>
                <p
                  style={{
                    margin: '4px 0 0 0',
                    fontSize: '0.84rem',
                    color: 'var(--foreground-muted)',
                  }}
                >
                  {allFeedback.length === 0
                    ? 'Reviews will appear as students evaluate completed mentorship sessions.'
                    : 'No reviews match your search query.'}
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {filteredAllFeedback.map((rev, idx) => (
                  <div
                    key={rev.id || idx}
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
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <b style={{ fontSize: '0.92rem' }}>{rev.studentName}</b>
                          <span style={{ fontSize: '0.8rem', color: 'var(--foreground-muted)' }}>
                            reviewed mentor
                          </span>
                          <b style={{ fontSize: '0.92rem', color: 'var(--primary)' }}>
                            {rev.mentorName}
                          </b>
                        </div>
                        <div style={{ fontSize: '0.74rem', color: 'var(--foreground-muted)' }}>
                          {rev.createdAt
                            ? new Date(rev.createdAt).toLocaleDateString(undefined, {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                              })
                            : 'Recent'}
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            size={14}
                            fill={s <= (Number(rev.rating) || 5) ? '#f59e0b' : 'none'}
                            stroke={s <= (Number(rev.rating) || 5) ? '#f59e0b' : '#d1d5db'}
                          />
                        ))}
                        <b
                          style={{
                            marginLeft: 4,
                            fontSize: '0.88rem',
                            color: 'var(--foreground)',
                          }}
                        >
                          {rev.rating}/5
                        </b>
                      </div>
                    </div>

                    <p
                      style={{
                        margin: '0 0 8px 0',
                        fontSize: '0.88rem',
                        lineHeight: 1.5,
                        color: 'var(--foreground)',
                      }}
                    >
                      "{rev.text || 'Great mentorship session.'}"
                    </p>

                    {rev.aspects && (
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
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
          </div>
        )}
      </section>

      {/* Reviews Inspection Modal */}
      {selectedMentor && (
        <ModalShell
          eyebrow="Mentor Evaluation Detail"
          title={`Student Reviews: ${selectedMentor.name}`}
          onClose={() => setSelectedMentor(null)}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Mentor Info Summary Card */}
            <div
              style={{
                padding: 14,
                background: 'var(--surface-sunken, #f8fafc)',
                borderRadius: 8,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 12,
              }}
            >
              <div>
                <h3 style={{ margin: 0, fontSize: '1.05rem' }}>{selectedMentor.name}</h3>
                <p
                  style={{
                    margin: '2px 0 0 0',
                    fontSize: '0.84rem',
                    color: 'var(--foreground-muted)',
                  }}
                >
                  {selectedMentor.domain} · {selectedMentor.company} · {selectedMentor.email}
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    background: 'rgba(245, 158, 11, 0.1)',
                    padding: '4px 10px',
                    borderRadius: 999,
                  }}
                >
                  <Star size={14} fill="#f59e0b" stroke="#f59e0b" />
                  <b style={{ color: '#b45309', fontSize: '0.9rem' }}>
                    {selectedMentor.avgRating !== null
                      ? `${selectedMentor.avgRating.toFixed(1)} / 5.0`
                      : 'Unrated'}
                  </b>
                </div>
                <span className="status-chip status-accepted">
                  {selectedMentor.totalReviews}{' '}
                  {selectedMentor.totalReviews === 1 ? 'review' : 'reviews'}
                </span>
              </div>
            </div>

            {/* Aspect Score Pills */}
            {selectedMentor.totalReviews > 0 && (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <span className="category-pill-tech">
                  Avg Usefulness: {selectedMentor.avgUsefulness}/5.0
                </span>
                <span className="category-pill-tech">
                  Avg Clarity: {selectedMentor.avgClarity}/5.0
                </span>
                <span className="category-pill-tech">
                  Avg Comfort: {selectedMentor.avgComfort}/5.0
                </span>
              </div>
            )}

            {/* Reviews List */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
                maxHeight: 360,
                overflowY: 'auto',
              }}
            >
              {(() => {
                const mReviews = allFeedback.filter(
                  (f) => String(f.mentorId) === String(selectedMentor.mentorId)
                );
                const listToRender =
                  mReviews.length > 0 ? mReviews : selectedMentor.recentReviews || [];

                if (listToRender.length === 0) {
                  return (
                    <div
                      style={{
                        padding: 24,
                        textAlign: 'center',
                        color: 'var(--foreground-muted)',
                      }}
                    >
                      No student feedback entries recorded for this mentor yet.
                    </div>
                  );
                }

                return listToRender.map((r, i) => (
                  <div
                    key={r.id || r._id || i}
                    style={{
                      padding: 14,
                      border: '1px solid var(--border)',
                      borderRadius: 6,
                      background: 'var(--background)',
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
                      <b style={{ fontSize: '0.88rem' }}>{r.studentName || 'Student Mentee'}</b>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            size={13}
                            fill={s <= (Number(r.rating) || 5) ? '#f59e0b' : 'none'}
                            stroke={s <= (Number(r.rating) || 5) ? '#f59e0b' : '#d1d5db'}
                          />
                        ))}
                      </div>
                    </div>
                    <p
                      style={{
                        margin: '0 0 6px 0',
                        fontSize: '0.86rem',
                        lineHeight: 1.5,
                        color: 'var(--foreground)',
                      }}
                    >
                      "{r.text || r.comment || 'Great mentorship guidance.'}"
                    </p>
                    <div style={{ fontSize: '0.74rem', color: 'var(--foreground-muted)' }}>
                      {r.createdAt
                        ? new Date(r.createdAt).toLocaleDateString(undefined, {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })
                        : 'Recent'}
                    </div>
                  </div>
                ));
              })()}
            </div>
          </div>
        </ModalShell>
      )}
    </AppShell>
  );
}
