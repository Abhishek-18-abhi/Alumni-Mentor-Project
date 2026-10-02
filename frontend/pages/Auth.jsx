import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  ShieldCheck,
  GraduationCap,
  BriefcaseBusiness,
  Eye,
  EyeOff,
  AlertCircle,
  Info,
} from 'lucide-react';
import { MIN_PASSWORD_LENGTH, DOMAINS } from '../lib/constants';
import Logo from '../components/Logo';
import { login, registerUser, logout } from '../lib/auth';
import { getSession } from '../lib/storage';

export default function Auth({ register = false, adminLogin = false }) {
  const nav = useNavigate();
  const loc = useLocation();
  const params = new URLSearchParams(loc.search);

  // If already logged in, redirect to respective role dashboard
  useEffect(() => {
    const session = getSession();
    if (session) {
      nav(
        session.role === 'admin' ? '/admin' : session.role === 'mentor' ? '/mentor' : '/student',
        { replace: true }
      );
    }
  }, [nav]);

  const [mode, setMode] = useState(params.get('role') === 'mentor' ? 'mentor' : 'student');
  const [showPassword, setShowPassword] = useState(false);
  const [languagesInput, setLanguagesInput] = useState('English');

  const currentYear = new Date().getFullYear();
  const gradYears = Array.from({ length: 16 }, (_, i) => currentYear - i);

  const [form, setForm] = useState({
    name: '',
    email: loc.state?.email || '',
    password: '',
    college: 'College of Computer Applications',
    course: 'BCA',
    year: '3rd Year',
    jobTitle: '',
    company: '',
    experience: '',
    domain: DOMAINS[0] || 'Software Engineering',
    degree: 'BCA',
    graduationYear: (currentYear - 2).toString(),
    capacity: '3',
  });

  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    setError('');
    setIsSubmitting(true);

    try {
      if (register) {
        const parsedLanguages = languagesInput
          .split(',')
          .map((x) => x.trim())
          .filter(Boolean);
        const payload = {
          ...form,
          role: mode,
          languages: parsedLanguages.length > 0 ? parsedLanguages : ['English'],
          capacity: Number(form.capacity) || 3,
          graduationYear: mode === 'mentor' ? Number(form.graduationYear) : undefined,
          degree: mode === 'mentor' ? form.degree : undefined,
        };

        const r = await registerUser(payload);
        if (!r.ok) {
          setForm((f) => ({ ...f, password: '' }));
          setError(r.error);
          return;
        }
        nav(mode === 'mentor' ? '/mentor/onboarding' : '/onboarding');
      } else {
        const r = await login(form.email, form.password);
        if (!r.ok) {
          setForm((f) => ({ ...f, password: '' }));
          setError(r.error);
          return;
        }

        // Strict rejection for non-admin attempting admin login
        if (adminLogin && r.user.role !== 'admin') {
          logout();
          setError('Access denied. Administrator privileges are required to access this portal.');
          return;
        }

        nav(r.user.role === 'admin' ? '/admin' : r.user.role === 'mentor' ? '/mentor' : '/student');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <div className={`auth-card ${register ? 'register-mode' : ''}`}>
        <div className="auth-logo-center">
          <Logo size={36} />
        </div>
        <div className="auth-head">
          <span className="eyebrow">
            {register ? 'Get Started' : adminLogin ? 'Administrator Access' : 'Welcome back'}
          </span>
          <h1>
            {register
              ? 'Create your account'
              : adminLogin
                ? 'Administrator sign in'
                : 'Sign in to MentorConnect'}
          </h1>
          <p>
            {register
              ? 'Choose Student or Alumni Mentor to complete onboarding.'
              : adminLogin
                ? 'Use your administrator credentials to access platform controls.'
                : 'Use your registered email and password to access your account.'}
          </p>
        </div>

        {register && (
          <div className="role-cards">
            <button
              type="button"
              className={mode === 'student' ? 'selected' : ''}
              onClick={() => setMode('student')}
              disabled={isSubmitting}
            >
              <GraduationCap size={20} />
              <b>Student</b>
              <small>Find and work with alumni</small>
            </button>
            <button
              type="button"
              className={mode === 'mentor' ? 'selected' : ''}
              onClick={() => setMode('mentor')}
              disabled={isSubmitting}
            >
              <BriefcaseBusiness size={20} />
              <b>Alumni Mentor</b>
              <small>Guide students and manage capacity</small>
            </button>
          </div>
        )}

        {register && mode === 'mentor' && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '10px 14px',
              borderRadius: 8,
              background: 'var(--primary-subtle)',
              color: 'var(--primary)',
              fontSize: '0.85rem',
              marginBottom: 16,
            }}
          >
            <Info size={18} style={{ flexShrink: 0 }} />
            <span>
              Mentor accounts start as <b>pending verification</b> and are reviewed by institutional
              administrators before receiving matching invitations.
            </span>
          </div>
        )}

        <form onSubmit={submit} className="form-stack">
          {register && (
            <label>
              Full name
              <input
                name="name"
                autoComplete="name"
                value={form.name}
                onChange={change}
                required
                placeholder="Enter your full name"
              />
            </label>
          )}

          <label>
            Email address
            <input
              name="email"
              type="email"
              autoComplete="email"
              value={form.email}
              onChange={change}
              required
              placeholder="you@example.com"
            />
          </label>

          <label>
            Password
            <div style={{ position: 'relative' }}>
              <input
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete={register ? 'new-password' : 'current-password'}
                value={form.password}
                onChange={change}
                required
                minLength={register ? MIN_PASSWORD_LENGTH : undefined}
                placeholder={
                  register ? `At least ${MIN_PASSWORD_LENGTH} characters` : 'Enter password'
                }
                style={{ paddingRight: 40 }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: 10,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--foreground-muted)',
                  display: 'flex',
                  alignItems: 'center',
                }}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
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
                <select name="course" value={form.course} onChange={change}>
                  <option value="BCA">BCA</option>
                  <option value="MCA">MCA</option>
                  <option value="B.Sc CS">B.Sc Computer Science</option>
                  <option value="B.Tech">B.Tech IT/CS</option>
                  <option value="M.Sc CS">M.Sc Computer Science</option>
                </select>
              </label>
            </div>
          )}

          {register && mode === 'mentor' && (
            <>
              <div className="two-col">
                <label>
                  Current Job Title
                  <input
                    name="jobTitle"
                    value={form.jobTitle}
                    onChange={change}
                    required
                    placeholder="e.g. Software Engineer"
                  />
                </label>
                <label>
                  Company / Organization
                  <input
                    name="company"
                    value={form.company}
                    onChange={change}
                    required
                    placeholder="e.g. Google, TCS, Infosys"
                  />
                </label>
              </div>

              <div className="two-col">
                <label>
                  Degree Obtained
                  <select name="degree" value={form.degree} onChange={change}>
                    <option value="BCA">BCA</option>
                    <option value="MCA">MCA</option>
                    <option value="B.Sc CS">B.Sc Computer Science</option>
                    <option value="B.Tech">B.Tech IT/CS</option>
                    <option value="M.Tech">M.Tech</option>
                    <option value="Other">Other</option>
                  </select>
                </label>
                <label>
                  Graduation Year
                  <select name="graduationYear" value={form.graduationYear} onChange={change}>
                    {gradYears.map((yr) => (
                      <option key={yr} value={yr}>
                        {yr}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="two-col">
                <label>
                  Years of Experience
                  <input
                    name="experience"
                    value={form.experience}
                    onChange={change}
                    required
                    placeholder="e.g. 3 years"
                  />
                </label>
                <label>
                  Primary Domain
                  <select name="domain" value={form.domain} onChange={change}>
                    {DOMAINS.map((dom) => (
                      <option key={dom} value={dom}>
                        {dom}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <label>
                Languages Fluent In
                <input
                  type="text"
                  value={languagesInput}
                  onChange={(e) => setLanguagesInput(e.target.value)}
                  placeholder="e.g. English, Hindi, Spanish"
                />
              </label>

              <div style={{ marginTop: 12 }}>
                <label>
                  Max Active Mentee Capacity
                  <select name="capacity" value={form.capacity} onChange={change}>
                    {[1, 2, 3, 4, 5, 6].map((x) => (
                      <option key={x} value={x}>
                        {x} {x === 1 ? 'student' : 'concurrent students'}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </>
          )}

          {error && (
            <div className="error-box" role="alert" aria-live="assertive">
              <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 2 }} />
              <span>{error}</span>
            </div>
          )}

          <button className="uiverse-btn full" type="submit" disabled={isSubmitting}>
            {isSubmitting
              ? register
                ? 'Creating account...'
                : 'Signing in...'
              : register
                ? 'Create account'
                : 'Sign in'}{' '}
            <ArrowRight size={17} />
          </button>
        </form>

        {adminLogin && (
          <div className="admin-hint">
            <ShieldCheck size={16} />
            <span>
              Administrator accounts are created through first-time setup or by an existing
              administrator.
            </span>
          </div>
        )}
        {adminLogin && (
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
        <div className="auth-back-home">
          <button type="button" onClick={() => nav('/')}>
            ← Back to home
          </button>
        </div>
      </div>
    </div>
  );
}
