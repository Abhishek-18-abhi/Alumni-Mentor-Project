import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ArrowRight,
  Users,
  Target,
  CalendarDays,
  ShieldCheck,
  Check,
  ChevronDown,
  Menu,
  X,
  Linkedin,
  Instagram,
  Youtube,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import Logo from '../components/Logo';
import HeroIllustration from '../components/HeroIllustration';
import TargetGraphic from '../components/TargetGraphic';
import ScoreBreakdown from '../components/ScoreBreakdown';
import { scoreMatch, WEIGHTS } from '../lib/matching';

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
    q: 'How does the explainable matching algorithm calculate match score?',
    a: `MentorConnect evaluates transparent criteria across six weighted dimensions: Technical Skills (${Math.round(WEIGHTS.skills * 100)}%), Career Interests (${Math.round(WEIGHTS.interests * 100)}%), Learning Goals (${Math.round(WEIGHTS.goals * 100)}%), Languages (${Math.round(WEIGHTS.languages * 100)}%), Calendar Availability (${Math.round(WEIGHTS.availability * 100)}%), and Active Mentor Capacity (${Math.round(WEIGHTS.capacity * 100)}%). Every single recommendation shows an exact breakdown of points contributed by each factor.`,
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
    q: 'Is student and mentor data private and secure?',
    a: 'Yes. MentorConnect enforces strict role-based access control (RBAC). Sensitive contact details are never exposed to public crawlers or third-party AI models. The system logs all critical state transitions to an audit ledger.',
  },
];

export default function Landing() {
  const nav = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);
  const [showSimulator, setShowSimulator] = useState(false);

  // Algorithm Simulator state for academic evaluation
  const [selectedMentorIdx, setSelectedMentorIdx] = useState(0);
  const [studentSkills, setStudentSkills] = useState(['React', 'System Design', 'DSA']);
  const [studentGoal, setStudentGoal] = useState('Software Engineering');

  const activeMentor = SAMPLE_MENTORS[selectedMentorIdx];
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
    <div className="landing-page-ref">
      {/* 1. Header / Navbar */}
      <header className="ref-nav">
        <div className="ref-nav-inner">
          <div className="ref-nav-brand" onClick={() => nav('/')} role="button" tabIndex={0}>
            <Logo showText={true} size={28} />
          </div>

          {/* Desktop Navigation Links */}
          <nav className="ref-nav-links">
            <a href="#" className="ref-link active">
              Home
            </a>
            <a href="#how-it-works" className="ref-link">
              How it Works
            </a>
            <a href="#features" className="ref-link">
              Features
            </a>
            <a href="#faq" className="ref-link">
              FAQ
            </a>
            <a
              href="#simulator"
              className="ref-link"
              onClick={(e) => {
                e.preventDefault();
                setShowSimulator(true);
                document.getElementById('simulator-anchor')?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              Blog
            </a>
          </nav>

          {/* Right Action Buttons */}
          <div className="ref-nav-actions">
            <button className="ref-btn-login" onClick={() => nav('/login')}>
              Login
            </button>
            <button className="ref-btn-primary" onClick={() => nav('/register')}>
              Get Started <ArrowRight size={14} />
            </button>

            {/* Mobile Hamburger Toggle */}
            <button
              type="button"
              className="ref-mobile-toggle"
              aria-label="Toggle menu"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="ref-mobile-drawer">
            <a href="#" onClick={() => setMobileMenuOpen(false)}>
              Home
            </a>
            <a href="#how-it-works" onClick={() => setMobileMenuOpen(false)}>
              How it Works
            </a>
            <a href="#features" onClick={() => setMobileMenuOpen(false)}>
              Features
            </a>
            <a href="#faq" onClick={() => setMobileMenuOpen(false)}>
              FAQ
            </a>
            <div className="ref-mobile-buttons">
              <button
                className="ref-btn-login"
                style={{ width: '100%', justifyContent: 'center' }}
                onClick={() => {
                  setMobileMenuOpen(false);
                  nav('/login');
                }}
              >
                Login
              </button>
              <button
                className="ref-btn-primary"
                style={{ width: '100%', justifyContent: 'center' }}
                onClick={() => {
                  setMobileMenuOpen(false);
                  nav('/register');
                }}
              >
                Get Started <ArrowRight size={14} />
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
      </header>

      {/* 2. Hero Section */}
      <section className="ref-hero">
        <div className="ref-hero-grid">
          {/* Left Column: Copy */}
          <div className="ref-hero-copy">
            <span className="ref-eyebrow">ALUMNI &nbsp;×&nbsp; MENTORS &nbsp;×&nbsp; STUDENTS</span>
            <h1 className="ref-hero-title">
              Find the right mentor.
              <br />
              <span className="ref-blue-text">Build your future.</span>
            </h1>
            <p className="ref-hero-subtitle">
              Connect with verified college alumni using transparent matching, personalized
              recommendations and real guidance — all in one place.
            </p>

            <div className="ref-hero-actions">
              <button className="ref-btn-primary ref-btn-lg" onClick={() => nav('/register')}>
                Get Started <ArrowRight size={15} />
              </button>
              <a href="#how-it-works" className="ref-btn-link">
                Learn More
              </a>
            </div>
          </div>

          {/* Right Column: Hero Illustration with Radiating Badges */}
          <div className="ref-hero-visual">
            <HeroIllustration />
          </div>
        </div>
      </section>

      {/* 3. Features Row (4 Pillars) */}
      <section id="features" className="ref-features-section">
        <div className="ref-features-grid">
          {/* Pillar 1: Verified Alumni */}
          <div className="ref-feature-card">
            <div className="ref-feature-icon-circle">
              <Users size={22} />
            </div>
            <h3 className="ref-feature-title">Verified Alumni</h3>
            <p className="ref-feature-text">
              Connect with trusted and verified alumni from your college.
            </p>
          </div>

          {/* Pillar 2: Smart Matching */}
          <div className="ref-feature-card">
            <div className="ref-feature-icon-circle">
              <Target size={22} />
            </div>
            <h3 className="ref-feature-title">Smart Matching</h3>
            <p className="ref-feature-text">
              AI-powered recommendations based on your goals, skills and interests.
            </p>
          </div>

          {/* Pillar 3: Flexible Scheduling */}
          <div className="ref-feature-card">
            <div className="ref-feature-icon-circle">
              <CalendarDays size={22} />
            </div>
            <h3 className="ref-feature-title">Flexible Scheduling</h3>
            <p className="ref-feature-text">
              Book sessions at your convenience with real-time availability.
            </p>
          </div>

          {/* Pillar 4: Secure & Private */}
          <div className="ref-feature-card">
            <div className="ref-feature-icon-circle">
              <ShieldCheck size={22} />
            </div>
            <h3 className="ref-feature-title">Secure & Private</h3>
            <p className="ref-feature-text">
              Your data and conversations are protected with industry standard security.
            </p>
          </div>
        </div>
      </section>

      {/* 4. "How it Works" Section */}
      <section id="how-it-works" className="ref-how-section">
        <div className="ref-how-grid">
          {/* Left Column: Heading & CTA */}
          <div className="ref-how-left">
            <span className="ref-section-eyebrow">SIMPLE STEPS</span>
            <h2 className="ref-section-heading">How it Works</h2>
            <p className="ref-section-desc">
              Get started in a few easy steps and begin your mentorship journey.
            </p>
            <button className="ref-btn-primary" onClick={() => nav('/register')}>
              Get Started <ArrowRight size={14} />
            </button>
          </div>

          {/* Right Column: Numbered Steps with Arrows */}
          <div className="ref-steps-row">
            {/* Step 1 */}
            <div className="ref-step-item">
              <div className="ref-step-number">1</div>
              <h4 className="ref-step-title">Register</h4>
              <p className="ref-step-text">Create your profile as a student or mentor.</p>
            </div>

            <div className="ref-step-arrow">→</div>

            {/* Step 2 */}
            <div className="ref-step-item">
              <div className="ref-step-number">2</div>
              <h4 className="ref-step-title">Get Matched</h4>
              <p className="ref-step-text">Our system suggests the best mentors for you.</p>
            </div>

            <div className="ref-step-arrow">→</div>

            {/* Step 3 */}
            <div className="ref-step-item">
              <div className="ref-step-number">3</div>
              <h4 className="ref-step-title">Connect</h4>
              <p className="ref-step-text">Send a request and schedule a session.</p>
            </div>

            <div className="ref-step-arrow">→</div>

            {/* Step 4 */}
            <div className="ref-step-item">
              <div className="ref-step-number">4</div>
              <h4 className="ref-step-title">Grow</h4>
              <p className="ref-step-text">Get guidance, track goals and provide feedback.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Value Proposition Banner ("More than just a mentorship platform.") */}
      <section className="ref-value-section">
        <div className="ref-value-banner">
          {/* Left Column: Copy & Checklist */}
          <div className="ref-value-copy">
            <span className="ref-section-eyebrow">REAL PEOPLE, REAL GUIDANCE.</span>
            <h2 className="ref-value-title">More than just a mentorship platform.</h2>
            <p className="ref-value-desc">
              MentorConnect brings together students, alumni and mentors in a meaningful way —
              helping you build skills, make better decisions and move closer to your goals.
            </p>

            <div className="ref-checklist">
              <div className="ref-check-item">
                <span className="ref-check-circle">
                  <Check size={13} strokeWidth={3} />
                </span>
                <span>Personalized mentor recommendations</span>
              </div>
              <div className="ref-check-item">
                <span className="ref-check-circle">
                  <Check size={13} strokeWidth={3} />
                </span>
                <span>Skill & career guidance</span>
              </div>
              <div className="ref-check-item">
                <span className="ref-check-circle">
                  <Check size={13} strokeWidth={3} />
                </span>
                <span>Goal tracking & progress updates</span>
              </div>
              <div className="ref-check-item">
                <span className="ref-check-circle">
                  <Check size={13} strokeWidth={3} />
                </span>
                <span>Direct and meaningful connections</span>
              </div>
            </div>
          </div>

          {/* Right Column: Target Graphic Card */}
          <div className="ref-value-visual">
            <TargetGraphic />
          </div>
        </div>
      </section>

      {/* Optional Academic Algorithm Simulator (Anchor for evaluators) */}
      <div id="simulator-anchor" style={{ textAlign: 'center', margin: '10px 0 20px' }}>
        <button
          type="button"
          className="ref-btn-ghost-pill"
          onClick={() => setShowSimulator(!showSimulator)}
        >
          <Sparkles size={14} />
          {showSimulator ? 'Hide Algorithm Simulator' : 'Test Explainable Algorithm Simulator ⚡'}
        </button>
      </div>

      {showSimulator && (
        <section id="simulator" className="ref-sim-section">
          <div className="ref-sim-card">
            <div className="ref-sim-header">
              <div>
                <span className="ref-section-eyebrow">ALGORITHM SIMULATOR</span>
                <h3>Live Multi-Factor Match Engine</h3>
                <p>
                  Experience the mathematical factor breakdown calculated transparently for alumni
                  pairings.
                </p>
              </div>
              <div className="ref-sim-mentor-switch">
                {SAMPLE_MENTORS.map((m, idx) => (
                  <button
                    key={m.id}
                    type="button"
                    className={`btn small ${selectedMentorIdx === idx ? 'primary' : 'secondary'}`}
                    onClick={() => setSelectedMentorIdx(idx)}
                  >
                    {m.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="ref-sim-body">
              <div className="ref-sim-left">
                <div className="ref-sim-score-row">
                  <div className="ref-sim-score-num">{matchResult.score}%</div>
                  <div>
                    <b>Explainable Match Compatibility</b>
                    <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--foreground-muted)' }}>
                      Calculated across skills, goals, availability, and capacity weights.
                    </p>
                  </div>
                </div>

                <div style={{ marginTop: 16 }}>
                  <label style={{ fontSize: '0.82rem', fontWeight: 600, display: 'block', marginBottom: 6 }}>
                    Toggle Student Target Skills:
                  </label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {AVAILABLE_SIM_SKILLS.map((skill) => {
                      const active = studentSkills.includes(skill);
                      return (
                        <button
                          key={skill}
                          type="button"
                          className={`chip ${active ? 'selected' : ''}`}
                          style={{ fontSize: '0.78rem', padding: '4px 10px' }}
                          onClick={() => toggleSkill(skill)}
                        >
                          {active && <Check size={12} />} {skill}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="ref-sim-right">
                <ScoreBreakdown factors={matchResult.factors} />
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 6. Frequently Asked Questions ("Still have questions?") */}
      <section id="faq" className="ref-faq-section">
        <div className="ref-faq-header">
          <span className="ref-section-eyebrow">FREQUENTLY ASKED QUESTIONS</span>
          <h2 className="ref-section-heading">Still have questions?</h2>
          <p className="ref-section-desc">Here are some common questions about MentorConnect.</p>
        </div>

        <div className="ref-faq-list">
          {FAQ_ITEMS.map((item, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div key={idx} className={`ref-faq-card ${isOpen ? 'open' : ''}`}>
                <button
                  type="button"
                  className="ref-faq-btn"
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  aria-expanded={isOpen}
                >
                  <span>{item.q}</span>
                  <ChevronDown size={18} className="ref-faq-chevron" />
                </button>
                {isOpen && (
                  <div className="ref-faq-content">
                    <p>{item.a}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* 7. Footer */}
      <footer className="ref-footer">
        <div className="ref-footer-top">
          <div className="ref-footer-brand">
            <Logo showText={true} size={28} />
          </div>

          <div className="ref-footer-nav">
            <a href="#" className="ref-footer-link">
              Home
            </a>
            <a href="#features" className="ref-footer-link">
              Features
            </a>
            <a href="#faq" className="ref-footer-link">
              FAQ
            </a>
            <a href="#how-it-works" className="ref-footer-link">
              Blog
            </a>
            <Link to="/admin/login" className="ref-footer-link admin-tag">
              Admin Portal
            </Link>
          </div>

          <div className="ref-footer-socials">
            <a href="https://linkedin.com" target="_blank" rel="noreferrer" aria-label="LinkedIn">
              <Linkedin size={18} />
            </a>
            <a href="https://instagram.com" target="_blank" rel="noreferrer" aria-label="Instagram">
              <Instagram size={18} />
            </a>
            <a href="https://youtube.com" target="_blank" rel="noreferrer" aria-label="YouTube">
              <Youtube size={18} />
            </a>
          </div>
        </div>

        <div className="ref-footer-bottom">
          <p>© {new Date().getFullYear()} MentorConnect. All rights reserved.</p>
          <div className="ref-footer-legal">
            <a href="#">Privacy Policy</a>
            <span>|</span>
            <a href="#">Terms of Service</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
