import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { AlertCircle, Check, Save } from 'lucide-react';
import { SKILLS, DOMAINS, MENTORSHIP_GOALS } from '../lib/constants';
import { useToast } from '../components/Toast';
import AppShell from '../components/AppShell';
import PageTitle from '../components/PageTitle';
import ChipPicker from '../components/ChipPicker';
import { getCurrentUser, splitList } from '../lib/storage';
import { updateUser } from '../lib/auth';

export default function Profile() {
  const toast = useToast();
  const u = getCurrentUser();
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const initialForm = {
    name: u?.name || '',
    college: u?.college || '',
    course: u?.course || 'BCA',
    year: u?.year || '3rd Year',
    jobTitle: u?.jobTitle || '',
    company: u?.company || '',
    experience: u?.experience || '',
    domain: u?.domain || DOMAINS[0] || 'Software Engineering',
    skills: u?.skills || [],
    interests: u?.interests || [],
    goals: u?.goals || [],
    languages: u?.languages || ['English'],
    capacity: u?.capacity || 3,
    bio: u?.bio || '',
  };

  const [form, setForm] = useState(initialForm);
  const [savedSnapshot, setSavedSnapshot] = useState(() => JSON.stringify(initialForm));

  const isDirty = JSON.stringify(form) !== savedSnapshot;

  // Unsaved changes warning
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  if (!u) return <Navigate to="/login" replace />;

  const save = async (e) => {
    e.preventDefault();
    if (isSaving) return;
    setError('');

    // Field Validations
    if (!form.name.trim()) {
      setError('Full name is required.');
      return;
    }

    if (u.role === 'student') {
      if (!form.college.trim()) {
        setError('College or institution name is required.');
        return;
      }
    } else if (u.role === 'mentor') {
      if (!form.jobTitle.trim() || !form.company.trim()) {
        setError('Job title and company are required for alumni mentors.');
        return;
      }
    }

    if (form.skills.length === 0) {
      setError('Please add at least one technical or professional skill.');
      return;
    }

    // Only set profileComplete when required fields exist
    const isProfileComplete = Boolean(
      form.name.trim() &&
      form.skills.length > 0 &&
      (u.role === 'student'
        ? Boolean(form.college.trim() && form.course && form.year)
        : Boolean(form.jobTitle.trim() && form.company.trim() && form.domain))
    );

    setIsSaving(true);
    try {
      const result = await updateUser(u.id, {
        ...form,
        capacity: Number(form.capacity) || 1,
        profileComplete: isProfileComplete,
      });

      if (!result.ok) {
        return setError(result.error || 'Could not save profile.');
      }

      setSavedSnapshot(JSON.stringify(form));
      toast.success('Profile updated successfully.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AppShell role={u.role}>
      <PageTitle
        eyebrow="Account"
        title="Profile"
        text="Manage your academic or professional information used by the matching engine."
      />

      <form className="profile-edit" onSubmit={save}>
        {/* Profile Card Header */}
        <section className="card">
          <div className="profile-card" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div className="large-avatar">{u.name?.[0]?.toUpperCase() || 'A'}</div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <h2 style={{ margin: 0 }}>{u.name}</h2>
                <span className="status-chip active" style={{ textTransform: 'capitalize' }}>
                  {u.role}
                </span>
                {u.isVerified && (
                  <span
                    className="status-chip active"
                    style={{ background: '#ecfdf5', color: '#047857' }}
                  >
                    Verified
                  </span>
                )}
              </div>
              <p style={{ margin: '4px 0 0', color: 'var(--foreground-muted)' }}>{u.email}</p>
            </div>
            {isDirty && (
              <span style={{ fontSize: '0.82rem', color: 'var(--warning-text)', fontWeight: 600 }}>
                ● Unsaved changes
              </span>
            )}
          </div>
        </section>

        {error && (
          <div className="error-box" role="alert" aria-live="assertive">
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        <section className="card form-stack">
          <h2>Basic Information</h2>
          <div className="two-col">
            <label>
              Full Name <span style={{ color: 'var(--danger)' }}>*</span>
              <input
                value={form.name}
                required
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </label>

            {u.role === 'student' ? (
              <>
                <label>
                  College / Institution <span style={{ color: 'var(--danger)' }}>*</span>
                  <input
                    value={form.college}
                    required
                    onChange={(e) => setForm({ ...form, college: e.target.value })}
                  />
                </label>
                <label>
                  Academic Course <span style={{ color: 'var(--danger)' }}>*</span>
                  <select
                    value={form.course}
                    onChange={(e) => setForm({ ...form, course: e.target.value })}
                  >
                    <option value="BCA">BCA</option>
                    <option value="MCA">MCA</option>
                    <option value="B.Sc CS">B.Sc Computer Science</option>
                    <option value="B.Tech">B.Tech IT/CS</option>
                    <option value="M.Sc CS">M.Sc Computer Science</option>
                    <option value="Other">Other</option>
                  </select>
                </label>
                <label>
                  Current Academic Year <span style={{ color: 'var(--danger)' }}>*</span>
                  <select
                    value={form.year}
                    onChange={(e) => setForm({ ...form, year: e.target.value })}
                  >
                    <option value="1st Year">1st Year</option>
                    <option value="2nd Year">2nd Year</option>
                    <option value="3rd Year">3rd Year</option>
                    <option value="Final Year">Final Year</option>
                  </select>
                </label>
              </>
            ) : (
              <>
                <label>
                  Job Title <span style={{ color: 'var(--danger)' }}>*</span>
                  <input
                    value={form.jobTitle}
                    required
                    placeholder="e.g. Senior Software Engineer"
                    onChange={(e) => setForm({ ...form, jobTitle: e.target.value })}
                  />
                </label>
                <label>
                  Company / Organization <span style={{ color: 'var(--danger)' }}>*</span>
                  <input
                    value={form.company}
                    required
                    placeholder="e.g. Microsoft"
                    onChange={(e) => setForm({ ...form, company: e.target.value })}
                  />
                </label>
                <label>
                  Experience
                  <input
                    value={form.experience}
                    placeholder="e.g. 4 years"
                    onChange={(e) => setForm({ ...form, experience: e.target.value })}
                  />
                </label>
                <label>
                  Primary Domain <span style={{ color: 'var(--danger)' }}>*</span>
                  <select
                    value={form.domain}
                    onChange={(e) => setForm({ ...form, domain: e.target.value })}
                  >
                    {DOMAINS.map((dom) => (
                      <option key={dom} value={dom}>
                        {dom}
                      </option>
                    ))}
                  </select>
                </label>
              </>
            )}
          </div>

          <label>
            Languages Fluent In
            <input
              value={form.languages.join(', ')}
              placeholder="e.g. English, Hindi, Spanish"
              onChange={(e) => setForm({ ...form, languages: splitList(e.target.value) })}
            />
          </label>

          {u.role === 'mentor' && (
            <label>
              Max Active Mentees Capacity
              <select
                value={form.capacity}
                onChange={(e) => setForm({ ...form, capacity: Number(e.target.value) })}
                style={{ maxWidth: 240 }}
              >
                {[1, 2, 3, 4, 5, 6].map((x) => (
                  <option key={x} value={x}>
                    {x} {x === 1 ? 'student limit' : 'concurrent students'}
                  </option>
                ))}
              </select>
            </label>
          )}

          <label>
            About / Bio
            <textarea
              rows="4"
              value={form.bio}
              onChange={(e) => setForm({ ...form, bio: e.target.value })}
              placeholder="Tell others about your interests, background, and goals..."
            />
          </label>

          <div style={{ marginTop: 12 }}>
            <label style={{ display: 'block', marginBottom: 6 }}>
              Technical Skills & Expertise <span style={{ color: 'var(--danger)' }}>*</span>
            </label>
            <ChipPicker
              options={SKILLS}
              selected={form.skills}
              onChange={(skills) => setForm({ ...form, skills })}
              allowCustom={true}
              placeholder="Add skill..."
            />
          </div>

          <div style={{ marginTop: 12 }}>
            <label style={{ display: 'block', marginBottom: 6 }}>Domain Interests</label>
            <ChipPicker
              options={DOMAINS}
              selected={form.interests}
              onChange={(interests) => setForm({ ...form, interests })}
              allowCustom={true}
              placeholder="Add domain..."
            />
          </div>

          <div style={{ marginTop: 12 }}>
            <label style={{ display: 'block', marginBottom: 6 }}>Mentorship Goals</label>
            <ChipPicker
              options={MENTORSHIP_GOALS}
              selected={form.goals}
              onChange={(goals) => setForm({ ...form, goals })}
              allowCustom={true}
              placeholder="Add goal..."
            />
          </div>

          <div style={{ marginTop: 16 }}>
            <button className="uiverse-btn" type="submit" disabled={isSaving}>
              {isSaving ? 'Saving profile...' : 'Save Profile Changes'} <Save size={16} />
            </button>
          </div>
        </section>
      </form>
    </AppShell>
  );
}
