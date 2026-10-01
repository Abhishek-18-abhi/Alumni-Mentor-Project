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
} from 'lucide-react';
import { FiExternalLink } from 'react-icons/fi';
import Logo from '../components/Logo';

const SIMULATOR_SKILLS = [
  { id: 'react', label: 'React / Web', weight: 8 },
  { id: 'sysdesign', label: 'System Design', weight: 9 },
  { id: 'aws', label: 'AWS & Cloud', weight: 6 },
  { id: 'dsa', label: 'DSA & Algorithms', weight: 8 },
  { id: 'aiml', label: 'AI & Machine Learning', weight: 5 },
];

const FAQ_ITEMS = [
  {
    q: 'How does the explainable matching algorithm calculate match score?',
    a: 'MentorConnect utilizes a weighted multi-factor matching model across four dimensions: Skill Overlap (40%), Career Goal Alignment (30%), Weekly Calendar Availability (20%), and Active Mentor Capacity (10%). Unlike black-box AI, each factor provides an audit trail explaining exactly why a mentor was recommended.',
  },
  {
    q: 'Can an alumnus mentor multiple students simultaneously?',
    a: 'Yes. Each mentor sets an active mentee capacity limit (e.g., 2 to 5 concurrent students) during onboarding. The algorithm automatically caps incoming requests when capacity is reached to prevent mentor burnout and ensure high-quality guidance.',
  },
  {
    q: 'How are meetings scheduled and conducted?',
    a: 'Mentors configure weekly availability slots (e.g., Saturday 4:00 PM). Accepted students can book directly from open slots, with one-click Google Meet video links generated automatically and linked to both user calendars.',
  },
  {
    q: 'How does the platform ensure alumni credibility?',
    a: 'Alumni must provide their graduation year, degree, and current organization (e.g., Google, Amazon, Microsoft). College coordinators and administrators have direct oversight via the Admin Portal to audit profiles and maintain network integrity.',
  },
  {
    q: 'Is student and mentor data private and secure?',
    a: 'Yes. MentorConnect enforces strict Role-Based Access Control (RBAC) via secure JWT tokens. Student academic details and personal contact information are protected and accessible only to paired mentors and verified coordinators.',
  },
];

export default function Landing() {
  const nav = useNavigate();
  const [selectedSkills, setSelectedSkills] = useState(['react', 'sysdesign', 'dsa']);
  const [openFaq, setOpenFaq] = useState(0);

  const toggleSkill = (id) => {
    setSelectedSkills((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  // Base score 65% + weights for each selected skill
  const calculatedScore = Math.min(
    98,
    65 +
      selectedSkills.reduce((acc, id) => {
        const item = SIMULATOR_SKILLS.find((s) => s.id === id);
        return acc + (item ? item.weight : 0);
      }, 0)
  );

  return (
    <div className="landing">
      <header className="landing-nav">
        <Logo />
        <nav>
          <a href="#how">How it works</a>
          <a href="#faq">FAQ</a>
          <Link to="/admin/login">
            Administrator <FiExternalLink size={13} />
          </Link>
        </nav>
        <div>
          <button className="btn secondary" onClick={() => nav('/login')}>
            Login
          </button>
          <button className="btn primary" onClick={() => nav('/register')}>
            Get Started
          </button>
        </div>
      </header>

      {/* Hero Section with Interactive Match Simulator */}
      <section className="hero">
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
            Connect students with verified college alumni using transparent matching across goals, skills,
            schedule availability, and mentor capacity.
          </p>
          <div className="hero-actions">
            <button className="uiverse-btn" onClick={() => nav('/register')}>
              Get started <ArrowRight size={17} />
            </button>
            <button className="btn ghost" onClick={() => nav('/register?role=mentor')}>
              Become a mentor
            </button>
          </div>
        </div>

        {/* 21st.dev Style Interactive Match Engine Simulator */}
        <div className="hero-panel">
          <div className="match-simulator">
            <div className="sim-top">
              <div className="sim-mentor-meta">
                <div className="sim-avatar">AS</div>
                <div className="sim-mentor-info">
                  <b>Aarav Sharma</b>
                  <span>Sr. Software Engineer · Google</span>
                </div>
              </div>
              <span className="sim-badge">Alumni '21</span>
            </div>

            <div className="sim-score-box">
              <div>
                <div className="sim-score-value">
                  {calculatedScore}% <small>match</small>
                </div>
                <div className="sim-bar" style={{ width: '140px' }}>
                  <div className="sim-bar-fill" style={{ width: `${calculatedScore}%` }} />
                </div>
              </div>
              <div className="sim-score-label">
                Explainable Score
                <br />
                <span style={{ color: 'var(--success-text)', fontWeight: 700 }}>
                  {calculatedScore >= 85 ? 'High Compatibility' : 'Moderate Compatibility'}
                </span>
              </div>
            </div>

            <div className="sim-skills-section">
              <div className="sim-skills-label">Interactive Simulator: Toggle Target Skills</div>
              <div className="sim-chips-grid">
                {SIMULATOR_SKILLS.map((item) => {
                  const active = selectedSkills.includes(item.id);
                  return (
                    <button
                      key={item.id}
                      type="button"
                      className={`sim-chip-btn ${active ? 'active' : ''}`}
                      onClick={() => toggleSkill(item.id)}
                    >
                      {active ? <Check size={13} /> : '+'}
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="sim-reasons">
              <span className="sim-reason-pill">✓ {selectedSkills.length} Target Skills Overlap</span>
              <span className="sim-reason-pill">✓ Goal: Software Engineering</span>
              <span className="sim-reason-pill">✓ Weekend Slots Available</span>
              <span className="sim-reason-pill">✓ Mentor Capacity: 2 Slots Open</span>
            </div>
          </div>
        </div>
      </section>

      {/* Modern 21st.dev & shadcn Bento Grid Section */}
      <section id="how" className="section">
        <div className="section-heading">
          <span className="eyebrow">Platform Architecture</span>
          <h2>A Real Mentorship Workflow</h2>
          <p>Everything students, alumni mentors, and institutional coordinators need in one unified ecosystem.</p>
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
              Unlike black-box algorithms, our matching engine evaluates transparent criteria—giving students and
              coordinators clear insights into why an alumni pairing succeeds.
            </p>
            <div className="bento-meter-grid">
              <div className="bento-meter">
                <span>Technical Skills Overlap</span>
                <div className="bar-track">
                  <i style={{ width: '85%' }} />
                </div>
                <b>40% Weight</b>
              </div>
              <div className="bento-meter">
                <span>Career Goal Alignment</span>
                <div className="bar-track">
                  <i style={{ width: '75%' }} />
                </div>
                <b>30% Weight</b>
              </div>
              <div className="bento-meter">
                <span>Weekly Schedule Match</span>
                <div className="bar-track">
                  <i style={{ width: '90%' }} />
                </div>
                <b>20% Weight</b>
              </div>
              <div className="bento-meter">
                <span>Mentor Capacity Throttling</span>
                <div className="bar-track">
                  <i style={{ width: '100%' }} />
                </div>
                <b>10% Weight</b>
              </div>
            </div>
          </div>

          {/* Card 2: 1-column span - Verified Alumni */}
          <div className="bento-card">
            <div className="bento-header">
              <div className="feature-icon">
                <ShieldCheck size={20} />
              </div>
              <span className="bento-badge">Industry Alumni</span>
            </div>
            <h3>Verified Network</h3>
            <p>Connect directly with college graduates working across leading global technology organizations.</p>
            <div className="bento-chips-row">
              <span className="company-pill">Google</span>
              <span className="company-pill">Microsoft</span>
              <span className="company-pill">Amazon</span>
              <span className="company-pill">Uber</span>
            </div>
          </div>

          {/* Card 3: 1-column span - Frictionless Scheduling */}
          <div className="bento-card">
            <div className="bento-header">
              <div className="feature-icon">
                <CalendarDays size={20} />
              </div>
              <span className="bento-badge">Google Meet</span>
            </div>
            <h3>Frictionless Scheduling</h3>
            <p>Reserve available mentor calendar slots with instant meeting links and attendance records.</p>
            <div className="bento-slot-preview">
              <span>📅 Sat 4:00 PM · Confirmed</span>
              <span>🎥 One-Click Video Call</span>
            </div>
          </div>

          {/* Card 4: 2-column span - Goal & Feedback Loop */}
          <div className="bento-card bento-span-2">
            <div className="bento-header">
              <div className="feature-icon">
                <Target size={20} />
              </div>
              <span className="bento-badge">Measurable Outcomes</span>
            </div>
            <h3>Milestone Tracking & 360° Feedback</h3>
            <p>
              Students set tangible milestone goals, while mentors provide progress check-ins and confidential reviews
              to evaluate mentorship effectiveness.
            </p>
            <div className="bento-goal-row">
              <div className="bento-goal-item">
                <span>System Design & Architecture Review</span>
                <span className="status-chip">Completed</span>
              </div>
              <div className="bento-goal-item">
                <span>Technical Interview Simulation</span>
                <span className="status-chip" style={{ background: '#eff6ff', color: '#1d4ed8', borderColor: '#bfdbfe' }}>
                  In Progress
                </span>
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
            <p>Segregated, secure dashboards for Students, Alumni Mentors, and Academic Coordinators.</p>
            <div className="bento-chips-row">
              <span className="role-pill">🎓 Student</span>
              <span className="role-pill">💼 Mentor</span>
              <span className="role-pill">🛡️ Admin</span>
            </div>
          </div>
        </div>
      </section>

      {/* shadcn Style Collapsible FAQ Accordion */}
      <section id="faq" className="section faq-section">
        <div className="section-heading">
          <span className="eyebrow">Academic & Platform Insights</span>
          <h2>Frequently Asked Questions</h2>
          <p>Everything you need to know about the algorithm, platform security, and mentorship workflows.</p>
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

      <footer className="landing-footer">
        <Logo showText size={26} />
        <p>© {new Date().getFullYear()} MentorConnect. Empowering alumni-student mentorship.</p>
      </footer>
    </div>
  );
}
