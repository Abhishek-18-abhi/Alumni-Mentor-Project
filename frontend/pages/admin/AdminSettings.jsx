import React, { useState, useEffect } from 'react';
import AppShell from '../../components/AppShell';
import PageTitle from '../../components/PageTitle';
import { apiGet, apiPatch } from '../../lib/api';
import { useToast } from '../../components/Toast';
import { Save } from 'lucide-react';

export default function AdminSettings() {
  const toast = useToast();
  const [platformSettings, setPlatformSettings] = useState({
    matchingEnabled: true,
    registrationsEnabled: true,
    defaultMentorCapacity: 5,
    aiAdvisoryEnabled: true,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let mounted = true;
    const fetchConfig = async () => {
      try {
        const res = await apiGet('/platform-settings');
        if (mounted && res?.settings) {
          setPlatformSettings((prev) => ({ ...prev, ...res.settings }));
        }
      } catch (err) {
        console.warn('Failed to load admin settings:', err);
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
        text="Configure algorithmic matching parameters, user registration policies, and AI advisory controls."
      />

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
