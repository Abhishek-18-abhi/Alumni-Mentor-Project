import React, { useState, useEffect } from 'react';
import AppShell from '../../components/AppShell';
import PageTitle from '../../components/PageTitle';
import { DAYS, TIME_SLOTS } from '../../lib/constants';
import { getSession } from '../../lib/storage';
import { apiGet, apiPatch } from '../../lib/api';
import { useToast } from '../../components/Toast';
import {
  CalendarDays,
  Users,
  PauseCircle,
  PlayCircle,
  Save,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';

export default function MentorAvailability() {
  const toast = useToast();
  const session = getSession();
  const mentorId = session?.id || session?._id;

  const [capacity, setCapacity] = useState(5);
  const [currentMentees, setCurrentMentees] = useState(0);
  const [pauseRequests, setPauseRequests] = useState(false);
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let mounted = true;
    const fetchProfile = async () => {
      try {
        const res = await apiGet('/auth/me');
        if (mounted && res.user) {
          setCapacity(res.user.capacity || 5);
          setCurrentMentees(res.user.currentMentees || 0);
          setPauseRequests(Boolean(res.user.pauseRequests));
          setSlots(res.user.availability || []);
        }
      } catch (err) {
        console.warn('Failed to load mentor availability profile:', err.message);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchProfile();
    return () => {
      mounted = false;
    };
  }, []);

  const toggleSlot = (slotStr) => {
    setSlots((prev) =>
      prev.includes(slotStr) ? prev.filter((s) => s !== slotStr) : [...prev, slotStr]
    );
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (slots.length === 0) {
      return toast.error('Please configure at least 1 weekly availability slot.');
    }
    if (capacity < 1) {
      return toast.error('Capacity must be at least 1 mentee.');
    }

    setSaving(true);
    try {
      await apiPatch(`/users/${mentorId}`, {
        capacity: Number(capacity),
        pauseRequests,
        availability: slots,
      });
      toast.success('Availability and capacity settings saved successfully.');
    } catch (err) {
      toast.error(err?.message || 'Failed to update availability.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppShell role="mentor">
      <PageTitle
        eyebrow="Alumni Mentor Workspace"
        title="Availability & Capacity"
        text="Configure weekly recurring meeting slots and active mentee capacity thresholds."
      />

      <form onSubmit={handleSave}>
        {/* Capacity & Intake Control Panel */}
        <section className="card" style={{ marginBottom: 20 }}>
          <h2 style={{ fontSize: '1.15rem', margin: '0 0 14px 0' }}>
            Mentorship Intake & Capacity
          </h2>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: 20,
            }}
          >
            <div>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: 6 }}>
                Active Mentee Capacity Limit
              </label>
              <input
                type="number"
                min="1"
                max="20"
                value={capacity}
                onChange={(e) => setCapacity(Math.max(1, parseInt(e.target.value, 10) || 1))}
                style={{ width: '100%', maxWidth: 240 }}
                required
              />
              <small style={{ color: 'var(--foreground-muted)', display: 'block', marginTop: 4 }}>
                Current load: <b>{currentMentees}</b> of <b>{capacity}</b> spots filled.
              </small>
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: 6 }}>
                Intake Pause Setting
              </label>
              <button
                type="button"
                className={`btn ${pauseRequests ? 'primary' : 'secondary'}`}
                onClick={() => setPauseRequests((p) => !p)}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
              >
                {pauseRequests ? <PlayCircle size={16} /> : <PauseCircle size={16} />}
                {pauseRequests
                  ? 'Requests Paused (Click to Resume)'
                  : 'Accepting Inquiries (Click to Pause)'}
              </button>
              <small style={{ color: 'var(--foreground-muted)', display: 'block', marginTop: 6 }}>
                {pauseRequests
                  ? 'Students currently cannot submit new mentorship inquiries.'
                  : 'New students can send mentorship requests within your capacity limit.'}
              </small>
            </div>
          </div>
        </section>

        {/* Weekly Slot Grid */}
        <section className="card" style={{ marginBottom: 20 }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 14,
            }}
          >
            <div>
              <h2 style={{ fontSize: '1.15rem', margin: 0 }}>Weekly Availability Slots</h2>
              <p
                style={{
                  margin: '4px 0 0 0',
                  fontSize: '0.86rem',
                  color: 'var(--foreground-muted)',
                }}
              >
                Click time intervals to publish slots for 1-on-1 student bookings. (Selected:{' '}
                {slots.length})
              </p>
            </div>
          </div>

          <div className="slot-grid">
            {DAYS.map((day) => (
              <div className="slot-day" key={day}>
                <b>{day}</b>
                {TIME_SLOTS.map((time) => {
                  const slotStr = `${day} ${time}`;
                  const isSelected = slots.includes(slotStr);
                  return (
                    <button
                      key={time}
                      type="button"
                      aria-pressed={isSelected}
                      className={isSelected ? 'slot selected' : 'slot'}
                      onClick={() => toggleSlot(slotStr)}
                      style={{
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {time}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </section>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button
            type="submit"
            className="uiverse-btn"
            disabled={saving}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            <Save size={15} /> {saving ? 'Saving Changes...' : 'Save Availability & Capacity'}
          </button>
        </div>
      </form>
    </AppShell>
  );
}
