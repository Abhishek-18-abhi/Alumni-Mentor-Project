import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowRight, ShieldCheck, GraduationCap, BriefcaseBusiness } from 'lucide-react';
import { MIN_PASSWORD_LENGTH } from '../lib/constants';
import Logo from '../components/Logo';
import { login, registerUser } from '../lib/auth';
export default function Auth({ register = false, adminLogin = false }) {
  const nav = useNavigate();
  const loc = useLocation();
  const params = new URLSearchParams(loc.search);
  const [mode, setMode] = useState(params.get('role') === 'mentor' ? 'mentor' : 'student');
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    college: '',
    course: 'BCA',
    year: '3rd Year',
    jobTitle: '',
    company: '',
    experience: '',
    domain: '',
    languages: 'English',
    capacity: '1',
  });
  const [error, setError] = useState('');
  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const submit = (e) => {
    e.preventDefault();
    setError('');
    if (register) {
      const r = registerUser({ ...form, role: mode });
      if (!r.ok) return setError(r.error);
      nav(mode === 'mentor' ? '/mentor/onboarding' : '/onboarding');
    } else {
      const r = login(form.email, form.password);
      if (!r.ok) return setError(r.error);
      nav(r.user.role === 'admin' ? '/admin' : r.user.role === 'mentor' ? '/mentor' : '/student');
    }
  };
  return (
    <div className="auth-page">
      <div className="auth-side">
        <Logo />
        <div>
          <span className="eyebrow">MentorConnect</span>
          <h2>{register ? 'Build your mentorship profile.' : 'Welcome back.'}</h2>
          <p>
            {register
              ? 'Create a real account. Your profile data will be saved in this browser and used by the matching workflow.'
              : 'Sign in with an account created in this browser.'}
          </p>
        </div>
      </div>
      <div className="auth-card">
        <div className="auth-head">
          <span className="eyebrow">
            {register ? 'Create account' : adminLogin ? 'Administrator access' : 'Secure sign in'}
          </span>
          <h1>
            {register ? 'Join MentorConnect' : adminLogin ? 'Administrator sign in' : 'Sign in'}
          </h1>
          <p>
            {register
              ? 'Choose Student or Alumni Mentor and complete onboarding.'
              : 'Use your registered email and password.'}
          </p>
        </div>
        {register && (
          <div className="role-cards">
            <button
              type="button"
              className={mode === 'student' ? 'selected' : ''}
              onClick={() => setMode('student')}
            >
              <GraduationCap size={20} />
              <b>Student</b>
              <small>Find and work with alumni</small>
            </button>
            <button
              type="button"
              className={mode === 'mentor' ? 'selected' : ''}
              onClick={() => setMode('mentor')}
            >
              <BriefcaseBusiness size={20} />
              <b>Alumni Mentor</b>
              <small>Guide students and manage capacity</small>
            </button>
          </div>
        )}
        <form onSubmit={submit} className="form-stack">
          {register && (
            <label>
              Full name
              <input
                name="name"
                value={form.name}
                onChange={change}
                required
                placeholder="Enter your full name"
              />
            </label>
          )}
          <label>
            Email
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={change}
              required
              placeholder="you@example.com"
            />
          </label>
          <label>
            Password
            <input
              name="password"
              type="password"
              value={form.password}
              onChange={change}
              required
              minLength={register ? MIN_PASSWORD_LENGTH : undefined}
              placeholder={
                register ? `At least ${MIN_PASSWORD_LENGTH} characters` : 'Enter password'
              }
            />
          </label>
          {register && mode === 'student' && (
            <div className="two-col">
              <label>
                College / Institution
                <input
                  name="college"
                  value={form.college}
                  onChange={change}
                  required
                  placeholder="Your college"
                />
              </label>
              <label>
                Course
                <input name="course" value={form.course} onChange={change} />
              </label>
            </div>
          )}
          {register && mode === 'mentor' && (
            <>
              <div className="two-col">
                <label>
                  Job title
                  <input
                    name="jobTitle"
                    value={form.jobTitle}
                    onChange={change}
                    required
                    placeholder="Senior Data Analyst"
                  />
                </label>
                <label>
                  Company
                  <input
                    name="company"
                    value={form.company}
                    onChange={change}
                    required
                    placeholder="Company name"
                  />
                </label>
              </div>
              <div className="two-col">
                <label>
                  Experience
                  <input
                    name="experience"
                    value={form.experience}
                    onChange={change}
                    required
                    placeholder="5 years"
                  />
                </label>
                <label>
                  Domain
                  <input
                    name="domain"
                    value={form.domain}
                    onChange={change}
                    required
                    placeholder="Data Analytics"
                  />
                </label>
              </div>
              <div className="two-col">
                <label>
                  Languages
                  <input name="languages" value={form.languages} onChange={change} />
                </label>
                <label>
                  Capacity
                  <select name="capacity" value={form.capacity} onChange={change}>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((x) => (
                      <option key={x}>{x}</option>
                    ))}
                  </select>
                </label>
              </div>
            </>
          )}
          {error && <div className="error-box">{error}</div>}
          <button className="uiverse-btn full" type="submit">
            {register ? 'Create account' : 'Sign in'} <ArrowRight size={17} />
          </button>
        </form>
        {!register && (
          <div className="admin-hint">
            <ShieldCheck size={16} />
            <span>
              Administrator accounts are created through first-time setup or by another
              administrator.
            </span>
          </div>
        )}
        {!register && (
          <button className="setup-link" onClick={() => nav('/admin/setup')}>
            First-time administrator setup
          </button>
        )}
        <div className="auth-switch">
          {register ? 'Already registered?' : 'New to MentorConnect?'}{' '}
          <button onClick={() => nav(register ? '/login' : '/register')}>
            {register ? 'Sign in' : 'Create account'}
          </button>
        </div>
      </div>
    </div>
  );
}
