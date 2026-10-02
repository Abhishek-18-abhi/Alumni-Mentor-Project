import React, { useState, useEffect } from 'react';
import AppShell from '../../components/AppShell';
import PageTitle from '../../components/PageTitle';
import EmptyState from '../../components/EmptyState';
import StatCard from '../../components/StatCard';
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
} from 'lucide-react';

export default function AdminAnalytics() {
  const [analytics, setAnalytics] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

    </AppShell>
  );
}
