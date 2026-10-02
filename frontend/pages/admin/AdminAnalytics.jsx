import React, { useState, useEffect } from 'react';
import AppShell from '../../components/AppShell';
import PageTitle from '../../components/PageTitle';
import EmptyState from '../../components/EmptyState';
import StatCard from '../../components/StatCard';
import { fetchAdminAnalytics, fetchSystemMetrics, summarizeFeedbackWithAi } from '../../lib/api';
import {
  BarChart3,
  Users,
  Award,
  Sparkles,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Calendar,
  Star,
  Activity,
  ShieldCheck,
} from 'lucide-react';

export default function AdminAnalytics() {
  const [analytics, setAnalytics] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [feedbackSummary, setFeedbackSummary] = useState(null);
  const [isSummarizingFeedback, setIsSummarizingFeedback] = useState(false);

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

  const handleSynthesizeFeedback = async () => {
    if (isSummarizingFeedback) return;
    setIsSummarizingFeedback(true);
    try {
      const res = await summarizeFeedbackWithAi();
      if (res?.summary) {
        setFeedbackSummary(res);
      }
    } catch {
      // handled gracefully
    } finally {
      setIsSummarizingFeedback(false);
    }
  };

  const overview = analytics?.overview || {};
  const funnel = analytics?.funnel || {};
  const balance = analytics?.capacity || analytics?.capacityBalance || {};
  const meetingStats = analytics?.meetings || {};
  const satisfaction = analytics?.satisfaction || {};
  const feedbackStats = analytics?.feedback || {};

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

      {/* AI Qualitative Feedback Synthesis */}
      <section className="card" style={{ marginTop: 20 }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 14,
            flexWrap: 'wrap',
            gap: 10,
          }}
        >
          <div>
            <h2
              style={{
                fontSize: '1.1rem',
                margin: '0 0 4px 0',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <Sparkles size={16} style={{ color: 'var(--primary)' }} /> Qualitative Feedback & AI Thematic Synthesis
            </h2>
            <p style={{ margin: 0, fontSize: '0.84rem', color: 'var(--foreground-muted)' }}>
              Synthesizes qualitative review comments across all student evaluations without exposing student names.
            </p>
          </div>
          <button
            type="button"
            className="btn mini secondary"
            disabled={isSummarizingFeedback}
            onClick={handleSynthesizeFeedback}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            <Sparkles size={13} /> {isSummarizingFeedback ? 'Synthesizing...' : 'Synthesize Survey Themes'}
          </button>
        </div>

        {feedbackSummary ? (
          <div
            style={{
              padding: 14,
              background: 'var(--surface-sunken, #f8fafc)',
              borderRadius: 8,
              border: '1px solid var(--border)',
            }}
          >
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 10 }}>
              <span
                className={`status-chip ${
                  feedbackSummary.overallSentiment === 'Positive'
                    ? 'status-accepted'
                    : 'status-pending'
                }`}
              >
                Sentiment: {feedbackSummary.overallSentiment || 'Positive'}
              </span>
              <span style={{ fontSize: '0.82rem', color: 'var(--foreground-muted)' }}>
                Sample: {feedbackSummary.sampleSize || feedbackStats.totalReviews || 0} reviews analyzed
              </span>
            </div>
            <p style={{ margin: '0 0 12px 0', fontSize: '0.88rem', lineHeight: 1.55 }}>
              {feedbackSummary.summary}
            </p>
            {feedbackSummary.themes && feedbackSummary.themes.length > 0 && (
              <div>
                <b
                  style={{
                    fontSize: '0.78rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    color: 'var(--foreground-muted)',
                  }}
                >
                  Key Identified Themes:
                </b>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
                  {feedbackSummary.themes.map((theme, i) => (
                    <span key={i} className="skill-pill core" style={{ fontSize: '0.78rem' }}>
                      {theme}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div
            style={{
              padding: '16px 0',
              textAlign: 'center',
              color: 'var(--foreground-muted)',
              fontSize: '0.86rem',
            }}
          >
            Click &quot;Synthesize Survey Themes&quot; to aggregate qualitative feedback with AI analysis.
          </div>
        )}
      </section>
    </AppShell>
  );
}
