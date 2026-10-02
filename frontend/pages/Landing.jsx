import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ArrowRight,
  Sparkles,
  Users,
  CalendarDays,
  Target,
  ShieldCheck,
  ChevronDown,
  Check,
  ExternalLink,
  Menu,
  X,
  GraduationCap,
  Activity,
  Layers,
} from 'lucide-react';
import Logo from '../components/Logo';
import ScoreBreakdown from '../components/ScoreBreakdown';
import { scoreMatch, WEIGHTS } from '../lib/matching';
import { usePublicStats } from '../hooks/useApi';

const SAMPLE_MENTORS = [
  {
    id: 'sample-aarav',
    name: 'Aarav Sharma',
    avatar: 'AS',
    title: 'Sr. Software Engineer · Google',
    graduationYear: 2021,
    degree: 'BCA',
    skills: ['React', 'Node.js', 'System Design', 'Cloud Computing', 'DSA'],
    interests: ['Web Development', 'Distributed Systems', 'Career Growth'],
    goals: ['Software Engineering', 'Full Stack Development'],
    languages: ['English', 'Hindi'],
    availability: ['Sat 10:00', 'Sun 16:00'],
    capacity: 3,
    currentMentees: 1,
  },
  {
    id: 'sample-priya',
    name: 'Priya Patel',
    avatar: 'PP',
    title: 'AI Research Engineer · Microsoft',
    graduationYear: 2020,
    degree: 'BCA / MCA',
    skills: ['Python', 'Machine Learning', 'AI & ML', 'Data Science', 'PyTorch'],
    interests: ['Artificial Intelligence', 'Deep Learning', 'Research'],
    goals: ['AI/ML Engineering', 'Research Publications'],
    languages: ['English', 'Gujarati', 'Hindi'],
    availability: ['Sat 14:00', 'Sun 11:00'],
    capacity: 2,
    currentMentees: 0,
  },
];

const AVAILABLE_SIM_SKILLS = [
  'React',
  'Node.js',
  'System Design',
  'DSA',
  'Python',
  'Machine Learning',
  'Cloud Computing',
];

const FAQ_ITEMS = [
  {
    q: 'How does the explainable matching algorithm calculate match scores?',
    a: `MentorConnect evaluates transparent criteria across six weighted dimensions: Technical Skills (${Math.round(WEIGHTS.skills * 100)}%), Career Interests (${Math.round(WEIGHTS.interests * 100)}%), Learning Goals (${Math.round(WEIGHTS.goals * 100)}%), Languages (${Math.round(WEIGHTS.languages * 100)}%), Calendar Availability (${Math.round(WEIGHTS.availability * 100)}%), and Active Mentor Capacity (${Math.round(WEIGHTS.capacity * 100)}%). Unlike black-box models, every single recommendation shows an exact breakdown of points contributed by each factor.`,
  },
  {
    q: 'Can an alumnus mentor multiple students simultaneously?',
    a: 'Yes. Each mentor configures an active mentee capacity threshold (e.g. 1 to 5 students). When a mentor reaches maximum capacity, the platform automatically throttles new incoming requests to prevent burnout and ensure responsive mentorship.',
  },
  {
    q: 'How are meetings scheduled and conducted?',
    a: 'Mentors publish recurring availability slots in their dashboard calendar. Paired students can book open slots without scheduling conflicts. Meetings track agendas, notes, and post-session milestone progress.',
  },
  {
    q: 'How does the platform ensure alumni credibility?',
    a: 'Alumni provide graduation year, degree, and current employer upon registration. Administrator accounts review and verify alumni profiles before their listings receive verified mentor status in the marketplace.',
  },
  {
    q: 'Is student and mentor data private and secure?',
    a: 'Yes. MentorConnect enforces strict role-based access control (RBAC). Sensitive contact details are never exposed to public crawlers or third-party AI models. The system logs all critical state transitions to an audit ledger.',
  },
];

export default function Landing() {
  const nav = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState(0);

  // Simulator state: pure real scoreMatch inputs
  const [selectedMentorIdx, setSelectedMentorIdx] = useState(0);
  const [studentSkills, setStudentSkills] = useState(['React', 'System Design', 'DSA']);
  const [studentGoal, setStudentGoal] = useState('Software Engineering');

  // Fetch real platform statistics (no fabricated data)
  const { data: stats } = usePublicStats();

  const activeMentor = SAMPLE_MENTORS[selectedMentorIdx];

  // Synthesize student profile for live pure scoreMatch
  const simulatedStudent = {
    id: 'sim-student',
    name: 'Sample Student',
    role: 'student',
    skills: studentSkills,
    interests: ['Web Development', 'Artificial Intelligence', 'Career Growth'],
    goals: [studentGoal],
    languages: ['English', 'Hindi'],
    availability: ['Sat 10:00', 'Sun 16:00'],
  };

  const matchResult = scoreMatch(simulatedStudent, activeMentor);

  const toggleSkill = (skill) => {
    setStudentSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    );
  };

  return (
    <div className="landing">
      {/* Navigation Header */}
      <header className="landing-nav">
        <Logo />

        {/* Desktop Navigation */}
        <nav className="landing-nav-links">
          <a href="#simulator">Algorithm Simulator</a>
          <a href="#how">How it works</a>
          <a href="#faq">FAQ</a>
        </nav>

        <div className="landing-nav-actions">
          <button className="btn secondary" onClick={() => nav('/login')}>
            Login
          </button>
          <button className="btn primary" onClick={() => nav('/register')}>
            Get Started
          </button>
          <button
            type="button"
            className="mobile-menu-toggle"
            aria-label="Toggle Navigation Menu"
            aria-expanded={mobileMenuOpen}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </header>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="mobile-nav-drawer" role="dialog" aria-label="Mobile Navigation">
          <a href="#simulator" onClick={() => setMobileMenuOpen(false)}>
            Algorithm Simulator
          </a>
          <a href="#how" onClick={() => setMobileMenuOpen(false)}>
            How it works
          </a>
          <a href="#faq" onClick={() => setMobileMenuOpen(false)}>
            FAQ
          </a>
          <div className="mobile-nav-buttons">
            <button
              className="btn secondary full"
              onClick={() => {
                setMobileMenuOpen(false);
                nav('/login');
              }}
            >
              Login
            </button>
            <button
              className="btn primary full"
              onClick={() => {
                setMobileMenuOpen(false);
                nav('/register');
              }}
            >
              Get Started
            </button>
            <Link
              to="/admin/login"
              className="admin-footer-link"
              style={{ textAlign: 'center', marginTop: 8 }}
              onClick={() => setMobileMenuOpen(false)}
            >
              Administrator Portal <ExternalLink size={12} />
            </Link>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section className="hero" id="simulator">
        <div className="hero-copy">
          <span className="eyebrow">
            <Sparkles size={15} /> Explainable Mentorship Matching
          </span>
          <h1>
            Find the right mentor.
            <br />
            <span>Build your future.</span>
          </h1>
          <p>
            Connect students with verified college alumni using transparent multi-factor matching
            across skills, career goals, schedule availability, and mentor capacity.
          </p>
          <div className="hero-actions">
            <button className="uiverse-btn" onClick={() => nav('/register')}>
              Get started <ArrowRight size={17} />
            </button>
            <button className="btn ghost" onClick={() => nav('/register?role=mentor')}>
              Become a mentor
            </button>
          </div>

          {/* Real Platform Statistics strip (grounded in server DB) */}
          <div className="landing-stats-strip" style={{ marginTop: 32 }}>
            <div className="stat-pill">
              <Users size={16} />
              <span>
                <b>{stats ? stats.totalStudents : '—'}</b> Active Students
              </span>
            </div>
            <div className="stat-pill">
              <GraduationCap size={16} />
              <span>
                <b>{stats ? stats.totalMentors : '—'}</b> Alumni Mentors
              </span>
            </div>
            <div className="stat-pill">
              <Activity size={16} />
              <span>
                <b>{stats ? stats.activeMentorships : '—'}</b> Pairings
              </span>
            </div>
          </div>
        </div>

        {/* Live Explainable Match Engine Simulator */}
        <div className="hero-panel">
          <div className="match-simulator">
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 12,
              }}
            >
              <span className="sim-skills-label" style={{ margin: 0 }}>
                Select Sample Alumni Mentor:
              </span>
              <div style={{ display: 'flex', gap: 6 }}>
                {SAMPLE_MENTORS.map((m, idx) => (
                  <button
                    key={m.id}
                    type="button"
                    className={`btn small ${selectedMentorIdx === idx ? 'primary' : 'secondary'}`}
                    style={{ fontSize: '0.78rem', padding: '4px 10px' }}
                    onClick={() => setSelectedMentorIdx(idx)}
                  >
                    {m.name.split(' ')[0]}
                  </button>
                ))}
              </div>
            </div>

            <div className="sim-top">
              <div className="sim-mentor-meta">
                <div className="sim-avatar">{activeMentor.avatar}</div>
                <div className="sim-mentor-info">
                  <b>{activeMentor.name}</b>
                  <span>{activeMentor.title}</span>
                </div>
              </div>
              <span className="sim-badge">
                Alumni '{activeMentor.graduationYear.toString().slice(-2)}
              </span>
            </div>

            {/* Score Display */}
            <div className="sim-score-box">
              <div>
                <div className="sim-score-value">
                  {matchResult.score}% <small>match</small>
                </div>
                <div className="sim-bar" style={{ width: '130px' }}>
                  <div className="sim-bar-fill" style={{ width: `${matchResult.score}%` }} />
                </div>
              </div>
              <div className="sim-score-label">
                Explainable Score
                <br />
                <span
                  style={{
                    color: matchResult.score >= 70 ? 'var(--success-text)' : 'var(--warning-text)',
                    fontWeight: 700,
                  }}
                >
                  {matchResult.score >= 70 ? 'High Compatibility' : 'Moderate Compatibility'}
                </span>
              </div>
            </div>

            {/* Simulator Controls: Skills */}
            <div className="sim-skills-section">
              <div className="sim-skills-label">Toggle Student Target Skills:</div>
              <div className="sim-chips-grid">
                {AVAILABLE_SIM_SKILLS.map((skill) => {
                  const active = studentSkills.includes(skill);
                  return (
                    <button
                      key={skill}
                      type="button"
                      className={`sim-chip-btn ${active ? 'active' : ''}`}
                      onClick={() => toggleSkill(skill)}
                    >
                      {active ? <Check size={13} /> : '+'} {skill}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Simulator Controls: Goal */}
            <div
              style={{
                marginTop: 10,
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                fontSize: '0.82rem',
              }}
            >
              <span style={{ color: 'var(--foreground-muted)', fontWeight: 600 }}>
                Target Goal:
              </span>
              <select
                value={studentGoal}
                onChange={(e) => setStudentGoal(e.target.value)}
                style={{
                  padding: '4px 8px',
                  borderRadius: 6,
                  border: '1px solid var(--border)',
                  background: 'var(--surface)',
                  fontSize: '0.8rem',
                }}
              >
                <option value="Software Engineering">Software Engineering</option>
                <option value="AI/ML Engineering">AI/ML Engineering</option>
                <option value="Cloud Architecture">Cloud Architecture</option>
              </select>
            </div>

            {/* Transparent Factor Breakdown */}
            <div style={{ marginTop: 14 }}>
              <div
                style={{
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  color: 'var(--foreground-muted)',
                  marginBottom: 8,
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                }}
              >
                Algorithmic Factor Contributions:
              </div>
              <ScoreBreakdown factors={matchResult.factors} />
            </div>
          </div>
        </div>
      </section>

      {/* Platform Architecture & Explainable Matching Bento Grid */}
      <section id="how" className="section">
        <div className="section-heading">
          <span className="eyebrow">Platform Architecture</span>
          <h2>A Real Mentorship Workflow</h2>
          <p>
            Everything students, alumni mentors, and institutional coordinators need in one unified
            ecosystem.
          </p>
        </div>

        <div className="bento-grid">
          {/* Card 1: 2-column span - Explainable Match Engine */}
          <div className="bento-card bento-span-2">
            <div className="bento-header">
              <div className="feature-icon">
                <Sparkles size={20} />
              </div>
              <span className="bento-badge">Core Algorithm</span>
            </div>
            <h3>Explainable Multi-Factor Matching</h3>
            <p>
              Unlike opaque black-box algorithms, our matching engine evaluates transparent
              criteria—giving students and coordinators clear insights into why an alumni pairing
              succeeds.
            </p>
            <div className="bento-meter-grid">
              <div className="bento-meter">
                <span>Technical Skills Overlap</span>
                <div className="bar-track">
                  <i style={{ width: `${WEIGHTS.skills * 100}%` }} />
                </div>
                <b>{Math.round(WEIGHTS.skills * 100)}% Weight</b>
              </div>
              <div className="bento-meter">
                <span>Domain & Career Interests</span>
                <div className="bar-track">
                  <i style={{ width: `${WEIGHTS.interests * 100}%` }} />
                </div>
                <b>{Math.round(WEIGHTS.interests * 100)}% Weight</b>
              </div>
              <div className="bento-meter">
                <span>Career Goal Alignment</span>
                <div className="bar-track">
                  <i style={{ width: `${WEIGHTS.goals * 100}%` }} />
                </div>
                <b>{Math.round(WEIGHTS.goals * 100)}% Weight</b>
              </div>
              <div className="bento-meter">
                <span>Communication Languages</span>
                <div className="bar-track">
                  <i style={{ width: `${WEIGHTS.languages * 100}%` }} />
                </div>
                <b>{Math.round(WEIGHTS.languages * 100)}% Weight</b>
              </div>
              <div className="bento-meter">
                <span>Weekly Schedule Match</span>
                <div className="bar-track">
                  <i style={{ width: `${WEIGHTS.availability * 100}%` }} />
                </div>
                <b>{Math.round(WEIGHTS.availability * 100)}% Weight</b>
              </div>
              <div className="bento-meter">
                <span>Mentor Capacity Throttling</span>
                <div className="bar-track">
                  <i style={{ width: `${WEIGHTS.capacity * 100}%` }} />
                </div>
                <b>{Math.round(WEIGHTS.capacity * 100)}% Weight</b>
              </div>
            </div>
          </div>

          {/* Card 2: 1-column span - Verified Alumni */}
          <div className="bento-card">
            <div className="bento-header">
              <div className="feature-icon">
                <ShieldCheck size={20} />
              </div>
              <span className="bento-badge">Verified Credentials</span>
            </div>
            <h3>Admin-Audited Alumni</h3>
            <p>
              Every alumnus account undergoes verification of graduation year and career track
              before pairing.
            </p>
            <div className="bento-chips-row">
              <span className="company-pill">BCA Alumni</span>
              <span className="company-pill">MCA Alumni</span>
              <span className="company-pill">Verified Status</span>
            </div>
          </div>

          {/* Card 3: 1-column span - Conflict-Free Scheduling */}
          <div className="bento-card">
            <div className="bento-header">
              <div className="feature-icon">
                <CalendarDays size={20} />
              </div>
              <span className="bento-badge">Scheduling</span>
            </div>
            <h3>Conflict-Free Booking</h3>
            <p>
              Direct slot booking with double-booking prevention, calendar export, and structured
              meeting logs.
            </p>
            <div className="bento-slot-preview">
              <span>📅 Available Slots Only</span>
              <span>⚡ Conflict-Free Validation</span>
            </div>
          </div>

          {/* Card 4: 2-column span - Goal & Feedback Loop */}
          <div className="bento-card bento-span-2">
            <div className="bento-header">
              <div className="feature-icon">
                <Target size={20} />
              </div>
              <span className="bento-badge">Accountability</span>
            </div>
            <h3>Milestone Tracking & 360° Feedback</h3>
            <p>
              Students set tangible milestone goals, while mentors provide progress check-ins and
              confidential reviews to evaluate mentorship effectiveness.
            </p>
            <div className="bento-goal-row">
              <div className="bento-goal-item">
                <span>System Design & Architecture Review</span>
                <span className="status-chip active">Completed</span>
              </div>
              <div className="bento-goal-item">
                <span>Technical Interview Simulation</span>
                <span className="status-chip pending">In Progress</span>
              </div>
            </div>
          </div>

          {/* Card 5: 1-column span - Role-Based Access Control */}
          <div className="bento-card">
            <div className="bento-header">
              <div className="feature-icon">
                <Users size={20} />
              </div>
              <span className="bento-badge">RBAC Architecture</span>
            </div>
            <h3>Tailored Workspaces</h3>
            <p>
              Segregated, secure dashboards for Students, Alumni Mentors, and Institutional
              Administrators.
            </p>
            <div className="bento-chips-row">
              <span className="role-pill">Student</span>
              <span className="role-pill">Mentor</span>
              <span className="role-pill">Admin</span>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Accordion */}
      <section id="faq" className="section faq-section">
        <div className="section-heading">
          <span className="eyebrow">Academic & Platform Insights</span>
          <h2>Frequently Asked Questions</h2>
          <p>
            Everything you need to know about the algorithm, platform security, and mentorship
            workflows.
          </p>
        </div>

        <div className="faq-container">
          {FAQ_ITEMS.map((item, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div key={idx} className={`faq-item ${isOpen ? 'open' : ''}`}>
                <button
                  type="button"
                  className="faq-question"
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  aria-expanded={isOpen}
                >
                  <span>{item.q}</span>
                  <ChevronDown size={18} className="faq-chevron" />
                </button>
                {isOpen && (
                  <div className="faq-answer">
                    <p>{item.a}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Footer with Administrator link moved to footer */}
      <footer className="landing-footer">
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 16,
          }}
        >
          <Logo showText size={26} />
          <p style={{ margin: 0 }}>
            © {new Date().getFullYear()} MentorConnect. Explainable Alumni-Mentor Matching.
          </p>
          <Link
            to="/admin/login"
            className="admin-footer-link"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.85rem' }}
          >
            Administrator Access <ExternalLink size={14} />
          </Link>
        </div>
      </footer>
    </div>
  );
}
