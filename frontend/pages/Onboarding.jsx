import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { Check, ChevronRight, CalendarDays, ArrowLeft, Save, AlertCircle } from 'lucide-react';
import { SKILLS, DOMAINS, MENTORSHIP_GOALS, DAYS, TIME_SLOTS } from '../lib/constants';
import { useToast } from '../components/Toast';
import AppShell from '../components/AppShell';
import PageTitle from '../components/PageTitle';
import ChipPicker from '../components/ChipPicker';
import { getCurrentUser, splitList } from '../lib/storage';
import { updateUser } from '../lib/auth';

export default function Onboarding({ role = 'student' }) {
  const nav = useNavigate();
  const toast = useToast();
  const u = getCurrentUser();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingLater, setIsSavingLater] = useState(false);
  const [stepError, setStepError] = useState('');

  const [form, setForm] = useState({
    skills: u?.skills || [],
    interests: u?.interests || [],
    goals: u?.goals || [],
    languages: u?.languages || ['English'],
    availability: u?.availability || [],
    bio: u?.bio || '',
    capacity: u?.capacity || 3,
  });

  if (!u) return <Navigate to="/login" replace />;

  const toggleSlot = (day, time) => {
    const key = `${day} ${time}`;
    setForm((f) => ({
      ...f,
      availability: f.availability.includes(key)
        ? f.availability.filter((x) => x !== key)
        : [...f.availability, key],
    }));
  };

  const validateStep = (currentStep) => {
    setStepError('');
    if (currentStep === 1) {
      if (form.skills.length === 0) {
        setStepError('Please select or add at least one technical or professional skill.');
        return false;
      }
    } else if (currentStep === 2) {
      if (form.interests.length === 0 && form.goals.length === 0) {
        setStepError('Please select at least one domain interest or mentorship goal.');
        return false;
      }
    } else if (currentStep === 3) {
      if (role === 'mentor') {
        if (!form.capacity || form.capacity < 1) {
          setStepError('Please configure your maximum active mentee capacity (minimum 1).');
          return false;
        }
        if (form.availability.length === 0) {
          setStepError('Mentors must select at least 1 recurring weekly availability slot.');
          return false;
        }
      }
    }
    return true;
  };

  const handleNextStep = () => {
    if (validateStep(step)) {
      setStep((s) => s + 1);
    }
  };

  const handleSaveAndContinueLater = async () => {
    if (isSavingLater) return;
    setIsSavingLater(true);
    try {
      const result = await updateUser(u.id, { ...form, profileComplete: false });
      if (!result.ok) {
        return toast.error(result.error || 'Failed to save progress.');
      }
      toast.success('Progress saved. You can finish onboarding anytime.');
      nav(role === 'mentor' ? '/mentor' : '/student');
    } finally {
      setIsSavingLater(false);
    }
  };

  const finish = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!validateStep(1) || !validateStep(2) || !validateStep(3)) {
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await updateUser(u.id, {
        ...form,
        capacity: Number(form.capacity) || 1,
        profileComplete: true,
      });
      if (!result.ok) return toast.error(result.error || 'Could not complete onboarding.');
      toast.success('Onboarding complete! Your profile is configured.');
      nav(role === 'mentor' ? '/mentor' : '/student');
    } finally {
      setIsSubmitting(false);
    }
  };

  const progressPercent = Math.round((step / 4) * 100);

  return (
    <AppShell role={role}>
      <PageTitle
        eyebrow="Profile onboarding"
        title={role === 'mentor' ? 'Build your mentor profile' : 'Tell us what you want to learn'}
        text="Your preferences are used by the explainable matching engine. You can update them anytime from your Profile."
      />

      <section className="card onboarding-card">
        {/* Accessible Progress Bar */}
        <div style={{ marginBottom: 20 }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: 6,
              fontSize: '0.85rem',
            }}
          >
            <span style={{ fontWeight: 600 }}>Step {step} of 4</span>
            <span style={{ color: 'var(--foreground-muted)' }}>{progressPercent}% Complete</span>
          </div>
          <div
            role="progressbar"
            aria-valuenow={step}
            aria-valuemin={1}
            aria-valuemax={4}
            aria-label="Onboarding Progress"
            style={{
              width: '100%',
              height: 6,
              background: 'var(--border)',
              borderRadius: 4,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${progressPercent}%`,
                height: '100%',
                background: 'var(--primary)',
                transition: 'width 0.3s ease',
              }}
            />
          </div>
        </div>

        {/* Step Indicator Header */}
        <div className="steps">
          {[
            'Skills & expertise',
            'Interests & goals',
            'Availability & capacity',
            'Review & finalize',
          ].map((x, i) => (
            <div
              className={step === i + 1 ? 'step active' : step > i + 1 ? 'step done' : 'step'}
              key={x}
            >
              <span>{step > i + 1 ? <Check size={14} /> : i + 1}</span>
              {x}
            </div>
          ))}
        </div>

        {stepError && (
          <div
            className="error-box"
            role="alert"
            aria-live="assertive"
            style={{ marginBottom: 16 }}
          >
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{stepError}</span>
          </div>
        )}

        <form className="form-stack" onSubmit={finish}>
          {step === 1 && (
            <>
              <label>
                {role === 'mentor'
                  ? 'Skills / Technical Expertise'
                  : 'Skills you have or want to develop'}
              </label>
              <ChipPicker
                options={SKILLS}
                selected={form.skills}
                onChange={(skills) => {
                  setForm((f) => ({ ...f, skills }));
                  if (skills.length > 0) setStepError('');
                }}
                allowCustom={true}
                placeholder="Add custom skill..."
              />
              {form.skills.length > 0 && (
                <div className="selected-summary" style={{ marginTop: 8 }}>
                  <b>Selected ({form.skills.length}):</b> {form.skills.join(', ')}
                </div>
              )}
            </>
          )}

          {step === 2 && (
            <>
              <label>Domains & Career Interests</label>
              <ChipPicker
                options={DOMAINS}
                selected={form.interests}
                onChange={(interests) => setForm((f) => ({ ...f, interests }))}
                allowCustom={true}
                placeholder="Add custom domain..."
              />

              <label style={{ marginTop: 14 }}>Mentorship Goals</label>
              <ChipPicker
                options={MENTORSHIP_GOALS}
                selected={form.goals}
                onChange={(goals) => setForm((f) => ({ ...f, goals }))}
                allowCustom={true}
                placeholder="Add custom goal..."
              />

              <label style={{ marginTop: 14 }}>Communication Languages</label>
              <input
                value={form.languages.join(', ')}
                onChange={(e) => setForm((f) => ({ ...f, languages: splitList(e.target.value) }))}
                placeholder="e.g. English, Hindi, Spanish"
              />

              <label style={{ marginTop: 14 }}>
                {role === 'mentor'
                  ? 'About your mentoring approach & experience'
                  : 'What are you looking to achieve from a mentor?'}
              </label>
              <textarea
                rows="4"
                value={form.bio}
                onChange={(e) => setForm({ ...form, bio: e.target.value })}
                placeholder="Write a short summary..."
              />
            </>
          )}

          {step === 3 && (
            <>
              {role === 'mentor' && (
                <div
                  style={{
                    marginBottom: 20,
                    padding: '16px',
                    background: 'var(--surface-sunken)',
                    borderRadius: 8,
                  }}
                >
                  <label style={{ fontWeight: 700, marginBottom: 6, display: 'block' }}>
                    Active Mentee Capacity Threshold{' '}
                    <span style={{ color: 'var(--danger)' }}>*</span>
                  </label>
                  <p
                    style={{
                      color: 'var(--foreground-muted)',
                      fontSize: '0.85rem',
                      marginBottom: 10,
                    }}
                  >
                    Maximum number of concurrent students you can mentor without overburdening your
                    schedule.
                  </p>
                  <select
                    value={form.capacity}
                    onChange={(e) => setForm({ ...form, capacity: Number(e.target.value) })}
                    style={{ maxWidth: 260 }}
                  >
                    {[1, 2, 3, 4, 5, 6].map((x) => (
                      <option key={x} value={x}>
                        {x} {x === 1 ? 'student limit' : 'concurrent students'}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="availability-box">
                <CalendarDays size={20} />
                <div>
                  <b>
                    Weekly Recurring Availability{' '}
                    {role === 'mentor' && <span style={{ color: 'var(--danger)' }}>*</span>}
                  </b>
                  <span>
                    Select the recurring weekly slots when you are available for sessions.
                  </span>
                </div>
              </div>

              <div className="slot-grid">
                {DAYS.map((day) => (
                  <div className="slot-day" key={day}>
                    <b>{day}</b>
                    {TIME_SLOTS.map((time) => {
                      const slotKey = `${day} ${time}`;
                      const isSelected = form.availability.includes(slotKey);
                      return (
                        <button
                          type="button"
                          aria-pressed={isSelected}
                          className={isSelected ? 'slot selected' : 'slot'}
                          onClick={() => toggleSlot(day, time)}
                          key={time}
                        >
                          {time}
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>

              <div style={{ marginTop: 8, fontSize: '0.85rem', color: 'var(--foreground-muted)' }}>
                {form.availability.length} recurring weekly slots selected.
              </div>
            </>
          )}

          {step === 4 && (
            <div className="review-grid">
              <div>
                <h3>Skills ({form.skills.length})</h3>
                <div className="tag-row">
                  {form.skills.map((x) => (
                    <span key={x}>{x}</span>
                  ))}
                </div>
              </div>
              <div>
                <h3>Domains ({form.interests.length})</h3>
                <div className="tag-row">
                  {form.interests.map((x) => (
                    <span key={x}>{x}</span>
                  ))}
                </div>
              </div>
              <div>
                <h3>Goals ({form.goals.length})</h3>
                <div className="tag-row">
                  {form.goals.map((x) => (
                    <span key={x}>{x}</span>
                  ))}
                </div>
              </div>
              <div>
                <h3>Languages & Availability</h3>
                <p>
                  <b>Languages:</b> {form.languages.join(', ')}
                </p>
                <p>
                  <b>Weekly Slots:</b> {form.availability.length} active slots
                </p>
                {role === 'mentor' && (
                  <p>
                    <b>Capacity:</b> {form.capacity} concurrent mentees
                  </p>
                )}
              </div>
            </div>
          )}

          <div
            className="form-actions"
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: 24,
            }}
          >
            <div>
              <button
                type="button"
                className="btn secondary"
                disabled={step === 1}
                onClick={() => {
                  setStepError('');
                  setStep((s) => s - 1);
                }}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                <ArrowLeft size={16} /> Back
              </button>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                type="button"
                className="btn ghost"
                onClick={handleSaveAndContinueLater}
                disabled={isSavingLater || isSubmitting}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                <Save size={15} /> Save & continue later
              </button>

              {step < 4 ? (
                <button type="button" className="uiverse-btn" onClick={handleNextStep}>
                  Continue <ChevronRight size={16} />
                </button>
              ) : (
                <button className="uiverse-btn" type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Finishing onboarding...' : 'Finish onboarding'}{' '}
                  <Check size={16} />
                </button>
              )}
            </div>
          </div>
        </form>
      </section>
    </AppShell>
  );
}
