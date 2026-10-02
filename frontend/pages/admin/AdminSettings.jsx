import React, { useState, useEffect } from 'react';
import AppShell from '../../components/AppShell';
import PageTitle from '../../components/PageTitle';
import StatCard from '../../components/StatCard';
import { apiGet, apiPatch, fetchAiStatus, fetchSystemMetrics } from '../../lib/api';
import { useToast } from '../../components/Toast';
import {
  Settings,
  Sparkles,
  Server,
  Activity,
  CheckCircle,
  AlertCircle,
  Save,
  Cpu,
  Clock,
} from 'lucide-react';

export default function AdminSettings() {
  const toast = useToast();
  const [platformSettings, setPlatformSettings] = useState({
    matchingEnabled: true,
    registrationsEnabled: true,
    defaultMentorCapacity: 5,
    aiAdvisoryEnabled: true,
  });
  const [metrics, setMetrics] = useState(null);
  const [aiStatus, setAiStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let mounted = true;
    const fetchConfig = async () => {
      try {
        const [settingsRes, metricsRes, aiRes] = await Promise.allSettled([
          apiGet('/platform-settings'),
          fetchSystemMetrics(),
          fetchAiStatus(),
        ]);

        if (mounted) {
          if (settingsRes.status === 'fulfilled' && settingsRes.value?.settings) {
            setPlatformSettings((prev) => ({ ...prev, ...settingsRes.value.settings }));
          }
          if (metricsRes.status === 'fulfilled' && metricsRes.value) {
            setMetrics(metricsRes.value);
          }
          if (aiRes.status === 'fulfilled' && aiRes.value) {
            setAiStatus(aiRes.value);
          }
        }
      } catch (err) {
        console.warn('Failed to load admin settings:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchConfig();
    return () => {
      mounted = false;
    };
  }, []);

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await apiPatch('/platform-settings', platformSettings);
      toast.success('Platform operational settings updated successfully.');
    } catch (err) {
      toast.error(err?.message || 'Failed to update settings.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppShell role="admin">
      <PageTitle
        eyebrow="Administrator Platform Portal"
        title="Platform & System Settings"
        text="Configure algorithmic matching parameters, system health thresholds, and AI advisory controls."
      />

      {/* System Telemetry & Metrics Panel */}
      <section className="card" style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: '1.15rem', margin: '0 0 14px 0' }}>
          System Health & Latency Telemetry
        </h2>
        <div className="shopeers-kpi-grid">
          <StatCard
            label="API Latency (p50)"
            value={metrics?.latency?.p50 !== undefined ? `${metrics.latency.p50} ms` : '< 10 ms'}
            icon={Clock}
            color="blue"
            subtext={`p95: ${metrics?.latency?.p95 !== undefined ? `${metrics.latency.p95} ms` : '< 30 ms'}`}
          />
          <StatCard
            label="HTTP Request Count"
            value={metrics?.requests?.total || 0}
            icon={Activity}
            color="green"
            subtext={`Error rate: ${metrics?.requests?.errorRate || '0.0%'}`}
          />
          <StatCard
            label="AI Advisory Calls"
            value={aiStatus?.totalCalls || metrics?.ai?.totalCalls || 0}
            icon={Sparkles}
            color="purple"
            subtext={`Fallback rate: ${aiStatus?.fallbackRate || '0.0%'}`}
          />
          <StatCard
            label="Service Uptime"
            value={metrics?.uptimeFormatted || 'Healthy'}
            icon={Server}
            color="orange"
            subtext="Node/Express API Cluster"
          />
        </div>
      </section>

      {/* Platform Configuration Form */}
      <form onSubmit={handleSaveSettings}>
        <section className="card form-card" style={{ marginBottom: 20 }}>
          <h2 style={{ fontSize: '1.15rem', margin: '0 0 14px 0' }}>
            Platform Features & Governance
          </h2>
          <div className="settings-options">
            <label className="setting-toggle">
              <span>
                <b>Algorithmic Matching Engine</b>
                <small>
                  Allow students to discover and calculate multi-factor compatibility scores
                </small>
              </span>
              <input
                type="checkbox"
                checked={platformSettings.matchingEnabled}
                onChange={(e) =>
                  setPlatformSettings((prev) => ({ ...prev, matchingEnabled: e.target.checked }))
                }
              />
            </label>

            <label className="setting-toggle">
              <span>
                <b>Public User Registrations</b>
                <small>Allow new students and alumni mentors to create platform accounts</small>
              </span>
              <input
                type="checkbox"
                checked={platformSettings.registrationsEnabled}
                onChange={(e) =>
                  setPlatformSettings((prev) => ({
                    ...prev,
                    registrationsEnabled: e.target.checked,
                  }))
                }
              />
            </label>

            <label className="setting-toggle">
              <span>
                <b>AI Advisory Features (Explanations & Goal Suggestions)</b>
                <small>Enable LLM reasoning assistance grounded strictly in factor scores</small>
              </span>
              <input
                type="checkbox"
                checked={platformSettings.aiAdvisoryEnabled}
                onChange={(e) =>
                  setPlatformSettings((prev) => ({ ...prev, aiAdvisoryEnabled: e.target.checked }))
                }
              />
            </label>

            <div style={{ marginTop: 12 }}>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: 4 }}>
                Default New Mentor Capacity Limit
              </label>
              <input
                type="number"
                min="1"
                max="20"
                value={platformSettings.defaultMentorCapacity}
                onChange={(e) =>
                  setPlatformSettings((prev) => ({
                    ...prev,
                    defaultMentorCapacity: parseInt(e.target.value, 10) || 5,
                  }))
                }
                style={{ maxWidth: 200 }}
              />
            </div>
          </div>
        </section>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button
            type="submit"
            className="uiverse-btn"
            disabled={saving}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            <Save size={15} /> {saving ? 'Saving...' : 'Save Platform Settings'}
          </button>
        </div>
      </form>
    </AppShell>
  );
}
