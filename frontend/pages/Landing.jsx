import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowRight, Sparkles, Users, CalendarDays, Target, ShieldCheck } from 'lucide-react';
import { FiExternalLink } from 'react-icons/fi';
import Logo from '../components/Logo';
export default function Landing() {
  const nav = useNavigate();
  return (
    <div className="landing">
      <header className="landing-nav">
        <Logo />
        <nav>
          <a href="#how">How it works</a>
          <a href="#features">Features</a>
          <a href="#about">About</a>
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
      <section className="hero">
        <div className="hero-copy">
          <span className="eyebrow">
            <Sparkles size={15} /> Explainable mentorship matching
          </span>
          <h1>
            Find the right mentor.
            <br />
            <span>Build your future.</span>
          </h1>
          <p>
            Connect students with alumni using transparent matching across goals, skills, language,
            availability and mentor capacity.
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
        <div className="hero-panel">
          <div className="glow-card">
            <div className="mini-label">Explainable recommendation</div>
            <div className="score">
              94% <span>match</span>
            </div>
            <div className="reason-grid">
              <span>✓ Skills</span>
              <span>✓ Goals</span>
              <span>✓ Availability</span>
              <span>✓ Capacity</span>
            </div>
          </div>
        </div>
      </section>
      <section id="how" className="section">
        <div className="section-heading">
          <span className="eyebrow">How it works</span>
          <h2>A real mentorship workflow</h2>
        </div>
        <div id="features" className="feature-grid">
          <Feature
            icon={Users}
            title="Create profiles"
            text="Students and alumni manage their own information and preferences."
          />
          <Feature
            icon={Sparkles}
            title="Explainable matching"
            text="Recommendations show why a mentor matches the student."
          />
          <Feature
            icon={CalendarDays}
            title="Schedule and meet"
            text="Availability and meeting records stay connected to the mentorship."
          />
          <Feature
            icon={Target}
            title="Track outcomes"
            text="Goals, feedback and coordinator oversight complete the workflow."
          />
          <Feature
            icon={ShieldCheck}
            title="Role-based access"
            text="Student, alumni mentor and administrator workspaces are separated."
          />
          <Feature
            icon={Users}
            title="Real account data"
            text="Empty states remain empty until real users register."
          />
        </div>
      </section>
      <footer className="landing-footer">
        <Logo showText size={26} />
        <p>© {new Date().getFullYear()} MentorConnect. Empowering alumni-student mentorship.</p>
      </footer>
    </div>
  );
}
function Feature({ icon: Icon, title, text }) {
  return (
    <div className="feature">
      <div className="feature-icon">
        <Icon size={20} />
      </div>
      <h3>{title}</h3>
      <p>{text}</p>
    </div>
  );
}
