import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AppShell from '../components/AppShell';
import PageTitle from '../components/PageTitle';
import {
  Users,
  CalendarDays,
  Target,
  Sparkles,
  TrendingUp,
  Clock,
  CheckCircle2,
  Award,
  Star,
  Send,
  ArrowRight,
  Search,
  Plus,
  X,
  Compass,
  Briefcase,
  Layers,
  BarChart2,
} from 'lucide-react';
import { getUsers, getMeetings, getRequests, getGoals, getSession } from '../lib/storage';

/* -------------------------------------------------------------------------- */
/* Shopeers 4-Card KPI Metric Row                                             */
/* -------------------------------------------------------------------------- */
function ShopeersKpiGrid({ metrics }) {
  return (
    <div className="shopeers-kpi-grid">
      {metrics.map((m, idx) => {
        const Icon = m.icon;
        return (
          <div key={idx} className="shopeers-kpi-card">
            <div className="kpi-header">
              <span className="kpi-title">{m.label}</span>
              <div className={`kpi-icon-badge ${m.color || 'blue'}`}>
                <Icon size={18} />
              </div>
            </div>
            <div className="kpi-body">
              <span className="kpi-value">{m.value}</span>
              <div className={`kpi-trend ${m.isNegative ? 'negative' : 'positive'}`}>
                <TrendingUp size={12} style={{ transform: m.isNegative ? 'rotate(180deg)' : 'none' }} />
                <span>{m.trend}</span>
              </div>
            </div>
            <span className="kpi-period">{m.period || 'vs. last month'}</span>
          </div>
        );
      })}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Shopeers Area Chart Card ("Mentorship Activity & Growth" / "Total Profit")  */
/* -------------------------------------------------------------------------- */
function ShopeersAreaChart({ title, subtitle, total, trend, breakdown = [] }) {
  const [period, setPeriod] = useState('Monthly');
  const [hoveredPoint, setHoveredPoint] = useState({ x: 440, y: 35, label: 'Jan 20: 38 hrs • 94% match' });

  return (
    <div className="shopeers-chart-card">
      <div className="chart-card-header">
        <div className="chart-card-title">
          <h3>{title}</h3>
          <p>{subtitle}</p>
        </div>
        <div className="chart-filters">
          {['Weekly', 'Monthly', 'Yearly'].map((p) => (
            <button
              key={p}
              type="button"
              className={`chart-filter-btn${period === p ? ' active' : ''}`}
              onClick={() => setPeriod(p)}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      <div className="chart-card-metric">
        <span className="chart-metric-total">{total}</span>
        <div className="kpi-trend positive">
          <TrendingUp size={13} />
          <span>{trend}</span>
        </div>
      </div>

      {/* SVG Spline Curve with Gradient Fill */}
      <div className="chart-visual-wrapper">
        <svg
          className="chart-svg"
          viewBox="0 0 700 190"
          preserveAspectRatio="none"
          onMouseMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const relX = Math.max(0, Math.min(680, ((e.clientX - rect.left) / rect.width) * 700));
            // Approximate curve Y value
            const relY = Math.max(25, Math.min(150, 110 - Math.sin((relX / 700) * Math.PI * 2.2) * 55));
            setHoveredPoint({
              x: Math.round(relX),
              y: Math.round(relY),
              label: `Day ${Math.max(1, Math.round((relX / 700) * 30))}: ${(relX / 18).toFixed(0)} hrs`,
            });
          }}
        >
          <defs>
            <linearGradient id="shopeersAreaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2563eb" stopOpacity="0.28" />
              <stop offset="60%" stopColor="#3b82f6" stopOpacity="0.08" />
              <stop offset="100%" stopColor="#2563eb" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Subtle Horizontal Grid lines */}
          <line x1="0" y1="40" x2="700" y2="40" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="4 4" />
          <line x1="0" y1="90" x2="700" y2="90" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="4 4" />
          <line x1="0" y1="140" x2="700" y2="140" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="4 4" />

          {/* Area Fill */}
          <path
            d="M 0,140 C 90,135 150,65 240,75 C 330,85 410,25 500,40 C 580,55 640,25 700,30 L 700,190 L 0,190 Z"
            fill="url(#shopeersAreaGradient)"
          />

          {/* Main Spline Line */}
          <path
            d="M 0,140 C 90,135 150,65 240,75 C 330,85 410,25 500,40 C 580,55 640,25 700,30"
            fill="none"
            stroke="#2563eb"
            strokeWidth="3.2"
            strokeLinecap="round"
          />

          {/* Interactive Tooltip & Point */}
          {hoveredPoint && (
            <g>
              <line
                x1={hoveredPoint.x}
                y1="10"
                x2={hoveredPoint.x}
                y2="190"
                stroke="#94a3b8"
                strokeWidth="1.2"
                strokeDasharray="3 3"
              />
              <circle
                cx={hoveredPoint.x}
                cy={hoveredPoint.y}
                r="6.5"
                fill="#2563eb"
                stroke="#ffffff"
                strokeWidth="3"
                style={{ filter: 'drop-shadow(0 2px 5px rgba(37,99,235,0.4))' }}
              />
              <rect
                x={Math.max(10, Math.min(540, hoveredPoint.x - 70))}
                y={Math.max(5, hoveredPoint.y - 32)}
                width="140"
                height="24"
                rx="6"
                fill="#0f172a"
                opacity="0.92"
              />
              <text
                x={Math.max(80, Math.min(610, hoveredPoint.x))}
                y={Math.max(21, hoveredPoint.y - 16)}
                fill="#ffffff"
                fontSize="11"
                fontWeight="600"
                textAnchor="middle"
              >
                {hoveredPoint.label}
              </text>
            </g>
          )}
        </svg>

        <div className="chart-x-labels">
          <span>Jan 01</span>
          <span>Jan 07</span>
          <span>Jan 14</span>
          <span>Jan 21</span>
          <span>Jan 28</span>
          <span>Feb 01</span>
        </div>
      </div>

      {/* Category Breakdown Row */}
      <div className="chart-breakdown-row">
        {breakdown.map((item, idx) => (
          <div key={idx} className="breakdown-pill">
            <span className="breakdown-dot" style={{ backgroundColor: item.color }} />
            <div className="breakdown-info">
              <span className="breakdown-name">{item.name}</span>
              <span className="breakdown-val">{item.value}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Weekly Peak Activity Bar Chart Card ("Most Day Active")                    */
/* -------------------------------------------------------------------------- */
function WeeklyActivityCard({ peakDay = 'Tue', peakHours = '8.5 hrs' }) {
  const days = [
    { label: 'Sun', height: '35%' },
    { label: 'Mon', height: '60%' },
    { label: 'Tue', height: '90%', isPeak: true },
    { label: 'Wed', height: '55%' },
    { label: 'Thu', height: '70%' },
    { label: 'Fri', height: '45%' },
    { label: 'Sat', height: '25%' },
  ];

  return (
    <div className="weekly-activity-card">
      <div className="weekly-card-header">
        <h4>Most Day Active</h4>
        <span className="weekly-peak-pill">
          {peakDay} • {peakHours}
        </span>
      </div>
      <div className="weekly-bars-container">
        {days.map((d) => (
          <div key={d.label} className={`weekly-bar-col${d.isPeak ? ' peak' : ''}`}>
            <div className="weekly-bar-track">
              <div className="weekly-bar-fill" style={{ height: d.height }} />
            </div>
            <span className="weekly-bar-label">{d.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Milestone Progress Radial Gauge Card                                       */
/* -------------------------------------------------------------------------- */
function MilestoneGaugeCard({
  percent = 82,
  label = 'Active Match Retention',
  change = '+ 8% vs last month',
}) {
  const circumference = 2 * Math.PI * 40; // ~251.3
  const strokeDashoffset = circumference - (percent / 100) * circumference * 0.75;

  return (
    <div className="milestone-gauge-card">
      <div className="weekly-card-header" style={{ width: '100%' }}>
        <h4>Progress Milestone</h4>
        <span className="weekly-peak-pill" style={{ background: '#ecfdf5', color: '#059669', borderColor: '#a7f3d0' }}>
          {change}
        </span>
      </div>
      <div className="gauge-svg-wrap">
        <svg width="125" height="125" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="40"
            fill="none"
            stroke="#f1f5f9"
            strokeWidth="10"
            strokeDasharray={`${circumference * 0.75} ${circumference * 0.25}`}
            strokeDashoffset="0"
            strokeLinecap="round"
            transform="rotate(135 50 50)"
          />
          <circle
            cx="50"
            cy="50"
            r="40"
            fill="none"
            stroke="#10b981"
            strokeWidth="10"
            strokeDasharray={`${circumference * 0.75} ${circumference * 0.25}`}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            transform="rotate(135 50 50)"
            style={{ transition: 'stroke-dashoffset 0.8s cubic-bezier(0.16,1,0.3,1)' }}
          />
        </svg>
        <div className="gauge-center-content">
          <b>{percent}%</b>
          <span>{label}</span>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* AI Assistant Widget with Glowing 3D Orb & Interactive Chat Pill           */
/* -------------------------------------------------------------------------- */
function AiAssistantCard({ role = 'student' }) {
  const [prompt, setPrompt] = useState('');
  const [reply, setReply] = useState(
    role === 'student'
      ? '💡 Tip: Top match for your skills is Priya Sharma (Google) for Cloud & Scalable Systems.'
      : role === 'mentor'
        ? '💡 Tip: 2 mentees requested review on BCA final year capstone architecture.'
        : '💡 Tip: Algorithm matching accuracy increased by 14% this quarter.'
  );
  const [loading, setLoading] = useState(false);

  const handleAsk = (e) => {
    e?.preventDefault();
    if (!prompt.trim()) return;
    setLoading(true);
    const q = prompt;
    setPrompt('');
    setTimeout(() => {
      setLoading(false);
      if (q.toLowerCase().includes('resume') || q.toLowerCase().includes('cv')) {
        setReply('✨ AI: Highlight your React, SQL, and Capstone projects at the top of your resume.');
      } else if (q.toLowerCase().includes('mentor') || q.toLowerCase().includes('match')) {
        setReply('✨ AI: Recommended: Ananya Patel (Amazon) & Vikram Rao (AWS) are available for 1:1 sessions.');
      } else if (q.toLowerCase().includes('interview') || q.toLowerCase().includes('job')) {
        setReply('✨ AI: Schedule a mock technical round with our alumni network under the Meetings tab.');
      } else {
        setReply(`✨ AI: Great question! Explore the matches directory to connect with mentors specialized in "${q}".`);
      }
    }, 450);
  };

  return (
    <div className="ai-assistant-card">
      <div className="ai-assistant-header">
        <div className="ai-assistant-status">
          <span className="role-pulse" />
          <span>Online • AI Copilot</span>
        </div>
        <Sparkles size={16} color="#2563eb" />
      </div>

      <div className="ai-orb-container">
        <div className="ai-3d-orb" />
        <div className="ai-orb-copy">
          <h5>MentorConnect AI</h5>
          <p>{loading ? 'Analyzing career match engine...' : reply}</p>
        </div>
      </div>

      <form className="ai-chat-input-pill" onSubmit={handleAsk}>
        <input
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Ask AI Copilot for advice..."
        />
        <button type="submit" className="ai-send-btn" aria-label="Ask AI">
          <Send size={13} />
        </button>
      </form>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Shopeers Data Table Card ("Top Recommended Mentors" / "Best Selling...")   */
/* -------------------------------------------------------------------------- */
function TopMentorsTableCard({ mentors = [], title = 'Top Recommended Mentors' }) {
  const [search, setSearch] = useState('');
  const nav = useNavigate();

  const filtered = mentors.filter((m) => {
    if (!search.trim()) return true;
    const term = search.toLowerCase();
    return (
      m.name?.toLowerCase().includes(term) ||
      m.company?.toLowerCase().includes(term) ||
      m.domain?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="shopeers-table-card">
      <div className="shopeers-table-header">
        <h3>{title}</h3>
        <div className="shopeers-table-actions">
          <div className="shopeers-search-pill">
            <Search size={14} color="#94a3b8" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter mentors..."
            />
          </div>
          <Link to="/mentors" className="topbar-btn outline" style={{ padding: '6px 12px', fontSize: '0.78rem' }}>
            <span>View All</span>
            <ArrowRight size={13} />
          </Link>
        </div>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table className="shopeers-table">
          <thead>
            <tr>
              <th>Mentor</th>
              <th>Expertise / Domain</th>
              <th>Rating</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.slice(0, 5).map((m) => {
              const initials = m.name
                ? m.name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .slice(0, 2)
                    .toUpperCase()
                : 'M';
              return (
                <tr key={m.id}>
                  <td>
                    <div className="table-mentor-cell">
                      {m.avatar ? (
                        <img src={m.avatar} alt={m.name} className="table-mentor-avatar" />
                      ) : (
                        <div className="table-mentor-avatar-fallback">{initials}</div>
                      )}
                      <div className="table-mentor-meta">
                        <b>{m.name}</b>
                        <span>{m.company || m.role || 'Alumni Mentor'}</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="tag-row">
                      <span>{m.domain?.split('&')[0]?.trim() || 'Software Engineering'}</span>
                      {m.yearsOfExperience && <span>{m.yearsOfExperience}y exp</span>}
                    </div>
                  </td>
                  <td>
                    <div className="table-rating-pill">
                      <Star size={12} fill="#d97706" color="#d97706" />
                      <span>{m.rating || '5.0'} (42)</span>
                    </div>
                  </td>
                  <td>
                    <div className="table-status-pill online">
                      <span className="role-pulse" />
                      <span>Available Now</span>
                    </div>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button
                      type="button"
                      className="table-action-btn"
                      onClick={() => nav('/mentors')}
                    >
                      <span>Connect</span>
                      <ArrowRight size={12} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Shopeers "+ Add Widget" Drawer / Modal Customizer                          */
/* -------------------------------------------------------------------------- */
function AddWidgetModal({ isOpen, onClose, activeWidgets, onToggleWidget }) {
  if (!isOpen) return null;

  const availableWidgets = [
    { id: 'areaChart', title: 'Mentorship Growth Chart', desc: 'Spline wave chart tracking active hours & bookings.' },
    { id: 'weeklyActivity', title: 'Most Day Active', desc: 'Weekly peak hours bar chart visualization.' },
    { id: 'milestoneGauge', title: 'Progress Radial Gauge', desc: 'Circular progress tracking retention & milestones.' },
    { id: 'aiAssistant', title: 'AI Mentor Copilot', desc: 'Interactive 3D glowing assistant for career tips.' },
    { id: 'tableCard', title: 'Top Recommended Mentors', desc: 'Full-width rich data table of available alumni.' },
  ];

  return (
    <div className="widget-modal-backdrop" onClick={onClose}>
      <div className="widget-modal-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="widget-modal-head">
          <h3>Customize Dashboard Widgets</h3>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>
        <div className="widget-modal-grid">
          {availableWidgets.map((w) => {
            const isActive = activeWidgets[w.id] !== false;
            return (
              <div
                key={w.id}
                className={`widget-toggle-card${isActive ? ' active' : ''}`}
                onClick={() => onToggleWidget(w.id)}
              >
                <div className={`kpi-icon-badge ${isActive ? 'blue' : ''}`} style={{ width: 32, height: 32 }}>
                  {isActive ? <CheckCircle2 size={16} /> : <Plus size={16} />}
                </div>
                <div>
                  <h5>{w.title}</h5>
                  <p>{w.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ========================================================================== */
/* STUDENT DASHBOARD                                                          */
/* ========================================================================== */
export function StudentDashboard() {
  const s = getUsers().find((u) => u.id === getSession()?.id);
  const users = getUsers();
  const active = getRequests().filter((r) => r.studentId === s?.id && r.status === 'accepted');
  const meetings = getMeetings().filter((m) => m.studentId === s?.id && m.status !== 'cancelled');
  const goals = getGoals().filter((g) => g.studentId === s?.id);
  const mentors = users.filter((u) => u.role === 'mentor' && u.profileComplete);

  const [isWidgetModalOpen, setIsWidgetModalOpen] = useState(false);
  const [widgets, setWidgets] = useState({
    areaChart: true,
    weeklyActivity: true,
    milestoneGauge: true,
    aiAssistant: true,
    tableCard: true,
  });

  useEffect(() => {
    const handleOpen = () => setIsWidgetModalOpen(true);
    window.addEventListener('open-add-widget', handleOpen);
    return () => window.removeEventListener('open-add-widget', handleOpen);
  }, []);

  const toggleWidget = (id) => {
    setWidgets((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const metrics = [
    {
      label: 'Total Mentorship Hours',
      value: `${(meetings.length * 1.5 + 24.5).toFixed(1)} hrs`,
      trend: '+ 15.5%',
      icon: Clock,
      color: 'blue',
      period: 'vs. last month',
    },
    {
      label: 'Sessions Completed',
      value: `${meetings.length || 12} sessions`,
      trend: '+ 8.2%',
      icon: CheckCircle2,
      color: 'green',
      period: 'vs. last month',
    },
    {
      label: 'Active Mentor Connections',
      value: `${active.length || 4} mentors`,
      trend: '+ 12.0%',
      icon: Sparkles,
      color: 'purple',
      period: 'vs. last month',
    },
    {
      label: 'Milestone Completion',
      value: `${goals.length ? Math.min(100, Math.round((goals.filter((g) => g.status === 'completed').length / goals.length) * 100)) : 94.2}%`,
      trend: '+ 4.6%',
      icon: Target,
      color: 'orange',
      period: 'vs. last month',
    },
  ];

  const breakdown = [
    { name: '1:1 Mentoring', value: '45%', color: '#2563eb' },
    { name: 'Mock Interviews', value: '30%', color: '#06b6d4' },
    { name: 'Resume Reviews', value: '15%', color: '#10b981' },
    { name: 'Career Roadmaps', value: '10%', color: '#f97316' },
  ];

  return (
    <AppShell role="student">
      <PageTitle
        eyebrow="Student Workspace • BCA Alumni Network"
        title={`Welcome back${s?.name ? `, ${s.name.split(' ')[0]}` : ''}`}
        text="Track your mentorship progress, upcoming meeting hours, and career milestones."
      />

      {/* 4 Shopeers KPI Cards */}
      <ShopeersKpiGrid metrics={metrics} />

      {/* Two-Column Layout */}
      <div className="shopeers-dashboard-grid">
        {/* Left Column: Spline Area Chart */}
        {widgets.areaChart && (
          <ShopeersAreaChart
            title="Mentorship Activity & Growth"
            subtitle="Monthly cumulative hours and 1-on-1 alumni engagement"
            total={`${(meetings.length * 1.5 + 148.5).toFixed(1)} hrs`}
            trend="+ 15.5% vs. last period"
            breakdown={breakdown}
          />
        )}

        {/* Right Column: Stacked Widgets */}
        <div className="shopeers-side-col">
          {widgets.weeklyActivity && (
            <WeeklyActivityCard peakDay="Tue" peakHours="8.5 hrs" />
          )}
          {widgets.milestoneGauge && (
            <MilestoneGaugeCard percent={82} label="Active Match Retention" change="+ 8% vs last month" />
          )}
          {widgets.aiAssistant && (
            <AiAssistantCard role="student" />
          )}
        </div>
      </div>

      {/* Bottom Full-Width Table Card */}
      {widgets.tableCard && (
        <TopMentorsTableCard
          mentors={mentors.length > 0 ? mentors : users.filter((u) => u.role === 'mentor')}
          title="Top Recommended Mentors"
        />
      )}

      {/* Customize Widgets Modal */}
      <AddWidgetModal
        isOpen={isWidgetModalOpen}
        onClose={() => setIsWidgetModalOpen(false)}
        activeWidgets={widgets}
        onToggleWidget={toggleWidget}
      />
    </AppShell>
  );
}

/* ========================================================================== */
/* MENTOR DASHBOARD                                                           */
/* ========================================================================== */
export function MentorDashboard() {
  const s = getUsers().find((u) => u.id === getSession()?.id);
  const req = getRequests().filter((r) => r.mentorId === s?.id);
  const meetings = getMeetings().filter((m) => m.mentorId === s?.id);
  const mentees = req.filter((r) => r.status === 'accepted');
  const allUsers = getUsers();

  const [isWidgetModalOpen, setIsWidgetModalOpen] = useState(false);
  const [widgets, setWidgets] = useState({
    areaChart: true,
    weeklyActivity: true,
    milestoneGauge: true,
    aiAssistant: true,
    tableCard: true,
  });

  useEffect(() => {
    const handleOpen = () => setIsWidgetModalOpen(true);
    window.addEventListener('open-add-widget', handleOpen);
    return () => window.removeEventListener('open-add-widget', handleOpen);
  }, []);

  const toggleWidget = (id) => {
    setWidgets((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const metrics = [
    {
      label: 'Mentoring Hours Delivered',
      value: `${(meetings.length * 1.5 + 48.0).toFixed(1)} hrs`,
      trend: '+ 18.2%',
      icon: Clock,
      color: 'blue',
      period: 'vs. last month',
    },
    {
      label: 'Active Mentees',
      value: `${mentees.length || 4} students`,
      trend: '+ 5.0%',
      icon: Users,
      color: 'green',
      period: 'vs. last month',
    },
    {
      label: 'Average Mentee Rating',
      value: '4.95 ★',
      trend: '+ 2.1%',
      icon: Star,
      color: 'purple',
      period: 'vs. last month',
    },
    {
      label: 'Capacity Utilization',
      value: `${s?.currentMentees || mentees.length || 3} / ${s?.capacity || 5}`,
      trend: '+ 8.0%',
      icon: Award,
      color: 'orange',
      period: 'vs. last month',
    },
  ];

  const breakdown = [
    { name: 'Architecture Review', value: '40%', color: '#2563eb' },
    { name: 'Career Guidance', value: '35%', color: '#06b6d4' },
    { name: 'Code Walkthrough', value: '15%', color: '#10b981' },
    { name: 'Placement Prep', value: '10%', color: '#f97316' },
  ];

  const recommendedStudents = allUsers
    .filter((u) => u.role === 'student')
    .map((u) => ({
      ...u,
      role: u.course || "BCA '25",
      domain: u.interests?.join(', ') || 'Web Development, Cloud',
    }));

  return (
    <AppShell role="mentor">
      <PageTitle
        eyebrow="Alumni Mentor Workspace"
        title={`Welcome back${s?.name ? `, ${s.name.split(' ')[0]}` : ''}`}
        text="Overview of your active mentees, incoming pairing requests, and weekly session hours."
      />

      {/* 4 KPI Cards */}
      <ShopeersKpiGrid metrics={metrics} />

      {/* Two-Column Grid */}
      <div className="shopeers-dashboard-grid">
        {widgets.areaChart && (
          <ShopeersAreaChart
            title="Mentoring Engagement & Impact"
            subtitle="Student contact hours and weekly consultation volume"
            total={`${(meetings.length * 1.5 + 86).toFixed(1)} hrs`}
            trend="+ 18.2% vs. last period"
            breakdown={breakdown}
          />
        )}

        <div className="shopeers-side-col">
          {widgets.weeklyActivity && (
            <WeeklyActivityCard peakDay="Thu" peakHours="6.0 hrs" />
          )}
          {widgets.milestoneGauge && (
            <MilestoneGaugeCard percent={88} label="Mentee Goal Completion" change="+ 12% vs last month" />
          )}
          {widgets.aiAssistant && (
            <AiAssistantCard role="mentor" />
          )}
        </div>
      </div>

      {/* Bottom Table Card */}
      {widgets.tableCard && (
        <TopMentorsTableCard
          mentors={recommendedStudents}
          title="Active Mentees & Pairing Inquiries"
        />
      )}

      <AddWidgetModal
        isOpen={isWidgetModalOpen}
        onClose={() => setIsWidgetModalOpen(false)}
        activeWidgets={widgets}
        onToggleWidget={toggleWidget}
      />
    </AppShell>
  );
}

/* ========================================================================== */
/* ADMIN DASHBOARD                                                            */
/* ========================================================================== */
export function AdminDashboard() {
  const users = getUsers();
  const meetings = getMeetings();
  const requests = getRequests();

  const [isWidgetModalOpen, setIsWidgetModalOpen] = useState(false);
  const [widgets, setWidgets] = useState({
    areaChart: true,
    weeklyActivity: true,
    milestoneGauge: true,
    aiAssistant: true,
    tableCard: true,
  });

  useEffect(() => {
    const handleOpen = () => setIsWidgetModalOpen(true);
    window.addEventListener('open-add-widget', handleOpen);
    return () => window.removeEventListener('open-add-widget', handleOpen);
  }, []);

  const toggleWidget = (id) => {
    setWidgets((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const studentCount = users.filter((u) => u.role === 'student').length;
  const mentorCount = users.filter((u) => u.role === 'mentor').length;

  const metrics = [
    {
      label: 'Platform Engagement',
      value: '1,280 hrs',
      trend: '+ 22.4%',
      icon: Clock,
      color: 'blue',
      period: 'vs. last month',
    },
    {
      label: 'Enrolled Students',
      value: `${studentCount} students`,
      trend: '+ 14.8%',
      icon: Users,
      color: 'green',
      period: 'vs. last month',
    },
    {
      label: 'Alumni Mentors',
      value: `${mentorCount} onboarded`,
      trend: '+ 9.2%',
      icon: Award,
      color: 'purple',
      period: 'vs. last month',
    },
    {
      label: 'Mentorship Matches',
      value: `${requests.length || 36} total`,
      trend: '+ 11.5%',
      icon: Sparkles,
      color: 'orange',
      period: 'vs. last month',
    },
  ];

  const breakdown = [
    { name: 'Engineering & Tech', value: '45%', color: '#2563eb' },
    { name: 'Product & Design', value: '25%', color: '#06b6d4' },
    { name: 'Data Science & AI', value: '20%', color: '#10b981' },
    { name: 'Higher Education', value: '10%', color: '#f97316' },
  ];

  return (
    <AppShell role="admin">
      <PageTitle
        eyebrow="Administrator Platform Portal"
        title="College Platform Overview"
        text="University-wide mentorship analytics, pairing ratios, and active alumni engagement."
      />

      <ShopeersKpiGrid metrics={metrics} />

      <div className="shopeers-dashboard-grid">
        {widgets.areaChart && (
          <ShopeersAreaChart
            title="University-Wide Mentorship Adoption"
            subtitle="Active student engagements and monthly completed alumni sessions"
            total="1,280 hrs"
            trend="+ 22.4% vs. last period"
            breakdown={breakdown}
          />
        )}

        <div className="shopeers-side-col">
          {widgets.weeklyActivity && (
            <WeeklyActivityCard peakDay="Wed" peakHours="142 hrs" />
          )}
          {widgets.milestoneGauge && (
            <MilestoneGaugeCard percent={94} label="Match Success Index" change="+ 6% vs last quarter" />
          )}
          {widgets.aiAssistant && (
            <AiAssistantCard role="admin" />
          )}
        </div>
      </div>

      {widgets.tableCard && (
        <TopMentorsTableCard
          mentors={users.filter((u) => u.role === 'mentor')}
          title="Top Performing Alumni Mentors"
        />
      )}

      <AddWidgetModal
        isOpen={isWidgetModalOpen}
        onClose={() => setIsWidgetModalOpen(false)}
        activeWidgets={widgets}
        onToggleWidget={toggleWidget}
      />
    </AppShell>
  );
}
