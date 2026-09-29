import React, { useState } from 'react';
import { DOMAINS, MENTORSHIP_GOALS } from '../lib/constants';
import { useToast } from '../components/Toast';
import AppShell from '../components/AppShell';
import PageTitle from '../components/PageTitle';
import {
  getCurrentUser,
  saveUsers,
  getUsers,
  seedSkills,
  splitList,
  addAudit,
} from '../lib/storage';
export default function Profile() {
  const toast = useToast();
  const u = getCurrentUser();
  const [form, setForm] = useState({
    name: u?.name || '',
    college: u?.college || '',
    course: u?.course || '',
    year: u?.year || '',
    jobTitle: u?.jobTitle || '',
    company: u?.company || '',
    experience: u?.experience || '',
    domain: u?.domain || '',
    skills: u?.skills || [],
    interests: u?.interests || [],
    goals: u?.goals || [],
    languages: u?.languages || ['English'],
    capacity: u?.capacity || 1,
    bio: u?.bio || '',
  });
  const toggle = (key, x) =>
    setForm((f) => ({
      ...f,
      [key]: f[key].includes(x) ? f[key].filter((v) => v !== x) : [...f[key], x],
    }));
  const save = (e) => {
    e.preventDefault();
    const users = getUsers().map((x) =>
      x.id === u.id ? { ...x, ...form, profileComplete: true } : x
    );
    saveUsers(users);
    addAudit(u.id, 'Updated profile', 'Profile');
    toast.success('Profile saved.');
  };
  if (!u) return null;
  return (
    <AppShell role={u.role}>
      <PageTitle
        eyebrow="Account"
        title="Profile"
        text="Edit the information used by search and matching. Data is saved in this browser."
      />
      <form className="profile-edit" onSubmit={save}>
        <section className="card">
          <div className="profile-card">
            <div className="large-avatar">{u.name?.[0] || 'A'}</div>
            <div>
              <h2>{u.name}</h2>
              <p>{u.email}</p>
              <span className="status-chip">{u.role}</span>
            </div>
          </div>
        </section>
        <section className="card form-stack">
          <h2>Basic information</h2>
          <div className="two-col">
            <label>
              Full name
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </label>
            {u.role === 'student' ? (
              <>
                <label>
                  College
                  <input
                    value={form.college}
                    onChange={(e) => setForm({ ...form, college: e.target.value })}
                  />
                </label>
                <label>
                  Course
                  <input
                    value={form.course}
                    onChange={(e) => setForm({ ...form, course: e.target.value })}
                  />
                </label>
                <label>
                  Year
                  <input
                    value={form.year}
                    onChange={(e) => setForm({ ...form, year: e.target.value })}
                  />
                </label>
              </>
            ) : (
              <>
                <label>
                  Job title
                  <input
                    value={form.jobTitle}
                    onChange={(e) => setForm({ ...form, jobTitle: e.target.value })}
                  />
                </label>
                <label>
                  Company
                  <input
                    value={form.company}
                    onChange={(e) => setForm({ ...form, company: e.target.value })}
                  />
                </label>
                <label>
                  Experience
                  <input
                    value={form.experience}
                    onChange={(e) => setForm({ ...form, experience: e.target.value })}
                  />
                </label>
                <label>
                  Domain
                  <input
                    value={form.domain}
                    onChange={(e) => setForm({ ...form, domain: e.target.value })}
                  />
                </label>
              </>
            )}
          </div>
          <label>
            Languages
            <input
              value={form.languages.join(', ')}
              onChange={(e) => setForm({ ...form, languages: splitList(e.target.value) })}
            />
          </label>
          {u.role === 'mentor' && (
            <label>
              Capacity
              <select
                value={form.capacity}
                onChange={(e) => setForm({ ...form, capacity: Number(e.target.value) })}
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </select>
            </label>
          )}
          <label>
            About / mentoring needs
            <textarea
              rows="5"
              value={form.bio}
              onChange={(e) => setForm({ ...form, bio: e.target.value })}
            />
          </label>
          <h3>Skills</h3>
          <div className="chip-picker">
            {seedSkills().map((x) => (
              <button
                type="button"
                aria-pressed={form.skills.includes(x)}
                className={form.skills.includes(x) ? 'chip selected' : 'chip'}
                onClick={() => toggle('skills', x)}
                key={x}
              >
                {x}
              </button>
            ))}
          </div>
          <h3>Interests</h3>
          <div className="chip-picker">
            {DOMAINS.map((x) => (
              <button
                type="button"
                aria-pressed={form.interests.includes(x)}
                className={form.interests.includes(x) ? 'chip selected' : 'chip'}
                onClick={() => toggle('interests', x)}
                key={x}
              >
                {x}
              </button>
            ))}
          </div>
          <h3>Goals</h3>
          <div className="chip-picker">
            {MENTORSHIP_GOALS.map((x) => (
              <button
                type="button"
                aria-pressed={form.goals.includes(x)}
                className={form.goals.includes(x) ? 'chip selected' : 'chip'}
                onClick={() => toggle('goals', x)}
                key={x}
              >
                {x}
              </button>
            ))}
          </div>
          <button className="uiverse-btn">Save profile</button>
        </section>
      </form>
    </AppShell>
  );
}
