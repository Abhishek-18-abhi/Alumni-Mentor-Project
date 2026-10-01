import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { Check, ChevronRight, Plus, X, CalendarDays } from 'lucide-react';
import { DOMAINS, MENTORSHIP_GOALS, DAYS, TIME_SLOTS } from '../lib/constants';
import { useToast } from '../components/Toast';
import AppShell from '../components/AppShell';
import PageTitle from '../components/PageTitle';
import { getCurrentUser, seedSkills, splitList } from '../lib/storage';
import { updateUser } from '../lib/auth';
function Chips({ items, selected, onToggle }) {
  return (
    <div className="chip-picker">
      {items.map((x) => (
        <button
          type="button"
          key={x}
          aria-pressed={selected.includes(x)}
          className={selected.includes(x) ? 'chip selected' : 'chip'}
          onClick={() => onToggle(x)}
        >
          {selected.includes(x) && <Check size={13} />} {x}
        </button>
      ))}
    </div>
  );
}
export default function Onboarding({ role = 'student' }) {
  const nav = useNavigate();
  const toast = useToast();
  const u = getCurrentUser();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    skills: u?.skills || [],
    interests: u?.interests || [],
    goals: u?.goals || [],
    languages: u?.languages || ['English'],
    availability: u?.availability || [],
    bio: u?.bio || '',
    capacity: u?.capacity || 1,
  });
  const [newSkill, setNewSkill] = useState('');
  if (!u) return <Navigate to="/login" replace />;
  const availableSkills = seedSkills().filter((x) => !form.skills.includes(x));
  const toggle = (key, x) =>
    setForm((f) => ({
      ...f,
      [key]: f[key].includes(x) ? f[key].filter((v) => v !== x) : [...f[key], x],
    }));
  const addSkill = () => {
    const x = newSkill.trim();
    if (x && !form.skills.includes(x)) setForm((f) => ({ ...f, skills: [...f.skills, x] }));
    setNewSkill('');
  };
  const toggleSlot = (day, time) => {
    const key = `${day} ${time}`;
    setForm((f) => ({
      ...f,
      availability: f.availability.includes(key)
        ? f.availability.filter((x) => x !== key)
        : [...f.availability, key],
    }));
  };
  const finish = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    if (!form.skills.length) return toast.error('Please select at least one skill.');
    setIsSubmitting(true);
    try {
      const result = await updateUser(u.id, { ...form, profileComplete: true });
      if (!result.ok) return toast.error(result.error || 'Could not complete onboarding.');
      toast.success('Profile saved to MongoDB.');
      nav(role === 'mentor' ? '/mentor' : '/student');
    } finally {
      setIsSubmitting(false);
    }
  };
  return (
    <AppShell role={role}>
      <PageTitle
        eyebrow="Profile onboarding"
        title={role === 'mentor' ? 'Build your mentor profile' : 'Tell us what you want to learn'}
        text="Your selections are stored in MongoDB and used by the matching engine. You can update them later from Profile."
      />
      <section className="card onboarding-card">
        <div className="steps">
          {['Skills & expertise', 'Interests & goals', 'Availability', 'Review'].map((x, i) => (
            <div
              className={step === i + 1 ? 'step active' : step > i + 1 ? 'step done' : 'step'}
              key={x}
            >
              <span>{step > i + 1 ? <Check size={14} /> : i + 1}</span>
              {x}
            </div>
          ))}
        </div>
        <form className="form-stack" onSubmit={finish}>
          {step === 1 && (
            <>
              <label>
                {role === 'mentor' ? 'Skills / expertise' : 'Skills you have or want to develop'}
              </label>
              <Chips
                items={seedSkills()}
                selected={form.skills}
                onToggle={(x) => toggle('skills', x)}
              />
              <div className="custom-skill">
                <input
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  placeholder="Add another skill"
                />
                <button type="button" className="btn secondary" onClick={addSkill}>
                  <Plus size={16} />
                  Add
                </button>
              </div>
              {form.skills.length > 0 && (
                <div className="selected-summary">
                  <b>Selected:</b> {form.skills.join(', ')}
                </div>
              )}
            </>
          )}
          {step === 2 && (
            <>
              <label>Interests / domains</label>
              <Chips
                items={DOMAINS}
                selected={form.interests}
                onToggle={(x) => toggle('interests', x)}
              />
              <label>Mentorship goals</label>
              <Chips
                items={MENTORSHIP_GOALS}
                selected={form.goals}
                onToggle={(x) => toggle('goals', x)}
              />
              <label>Languages</label>
              <input
                value={form.languages.join(', ')}
                onChange={(e) => setForm({ ...form, languages: splitList(e.target.value) })}
                placeholder="English, Hindi, Marathi"
              />
              <label>
                {role === 'mentor'
                  ? 'About your mentoring experience'
                  : 'What do you want from a mentor?'}
              </label>
              <textarea
                rows="5"
                value={form.bio}
                onChange={(e) => setForm({ ...form, bio: e.target.value })}
                placeholder="Write a short description..."
              />
            </>
          )}
          {step === 3 && (
            <>
              <div className="availability-box">
                <CalendarDays size={20} />
                <div>
                  <b>Weekly availability</b>
                  <span>Select the recurring slots when you are usually available.</span>
                </div>
              </div>
              <div className="slot-grid">
                {DAYS.map((day) => (
                  <div className="slot-day" key={day}>
                    <b>{day}</b>
                    {TIME_SLOTS.map((time) => (
                      <button
                        type="button"
                        aria-pressed={form.availability.includes(`${day} ${time}`)}
                        className={
                          form.availability.includes(`${day} ${time}`) ? 'slot selected' : 'slot'
                        }
                        onClick={() => toggleSlot(day, time)}
                        key={time}
                      >
                        {time}
                      </button>
                    ))}
                  </div>
                ))}
              </div>
              {role === 'mentor' && (
                <label>
                  Maximum mentees / capacity
                  <select
                    value={form.capacity}
                    onChange={(e) => setForm({ ...form, capacity: Number(e.target.value) })}
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((x) => (
                      <option key={x} value={x}>
                        {x}
                      </option>
                    ))}
                  </select>
                </label>
              )}
            </>
          )}
          {step === 4 && (
            <div className="review-grid">
              <div>
                <h3>Skills</h3>
                <div className="tag-row">
                  {form.skills.map((x) => (
                    <span key={x}>{x}</span>
                  ))}
                </div>
              </div>
              <div>
                <h3>Interests</h3>
                <div className="tag-row">
                  {form.interests.map((x) => (
                    <span key={x}>{x}</span>
                  ))}
                </div>
              </div>
              <div>
                <h3>Goals</h3>
                <div className="tag-row">
                  {form.goals.map((x) => (
                    <span key={x}>{x}</span>
                  ))}
                </div>
              </div>
              <div>
                <h3>Languages</h3>
                <p>{form.languages.join(', ')}</p>
                <h3>Availability</h3>
                <p>{form.availability.length} recurring slots selected</p>
              </div>
            </div>
          )}
          <div className="form-actions">
            <button
              type="button"
              className="btn secondary"
              disabled={step === 1}
              onClick={() => setStep((s) => s - 1)}
            >
              Back
            </button>
            {step < 4 ? (
              <button type="button" className="uiverse-btn" onClick={() => setStep((s) => s + 1)}>
                Continue <ChevronRight size={16} />
              </button>
            ) : (
              <button className="uiverse-btn" type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Finishing onboarding...' : 'Finish onboarding'}{' '}
                <Check size={16} />
              </button>
            )}
          </div>
        </form>
      </section>
    </AppShell>
  );
}
