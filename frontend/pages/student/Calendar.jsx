import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import AppShell from '../../components/AppShell';
import PageTitle from '../../components/PageTitle';
import StatusChip from '../../components/StatusChip';
import EmptyState from '../../components/EmptyState';
import { useMeetings } from '../../hooks/useApi';
import { getSession } from '../../lib/storage';
import { CalendarDays, Clock, Video, ChevronLeft, ChevronRight, Plus } from 'lucide-react';

export default function Calendar() {
  const nav = useNavigate();
  const session = getSession();
  const myId = session?.id || session?._id;

  const [view, setView] = useState('month'); // 'month' | 'week'
  const [currentDate, setCurrentDate] = useState(new Date());

  const { data: meetings = [], loading } = useMeetings();

  // User's relevant meetings
  const myMeetings = useMemo(() => {
    return (meetings || []).filter((m) => {
      const sId = m.studentId?._id || m.studentId?.id || m.studentId;
      const mId = m.mentorId?._id || m.mentorId?.id || m.mentorId;
      return String(sId) === String(myId) || String(mId) === String(myId);
    });
  }, [meetings, myId]);

  // Month navigation helpers
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const calendarDays = useMemo(() => {
    const days = [];
    for (let i = 0; i < firstDay; i++) {
      days.push({ day: null, dateStr: null });
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const monthPadded = String(month + 1).padStart(2, '0');
      const dayPadded = String(d).padStart(2, '0');
      const dateStr = `${year}-${monthPadded}-${dayPadded}`;
      days.push({ day: d, dateStr });
    }
    return days;
  }, [year, month, firstDay, daysInMonth]);

  const meetingsByDate = useMemo(() => {
    const map = {};
    myMeetings.forEach((m) => {
      if (!m.date) return;
      if (!map[m.date]) map[m.date] = [];
      map[m.date].push(m);
    });
    return map;
  }, [myMeetings]);

  const handlePrev = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNext = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  return (
    <AppShell role="student">
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <PageTitle
          eyebrow="Student Workspace"
          title="Mentorship Calendar"
          text="Visualize scheduled mentorship meetings, check slot conflicts, and manage bookings."
        />
        <button
          type="button"
          className="btn primary"
          onClick={() => nav('/meetings')}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
        >
          <Plus size={15} /> Book Meeting
        </button>
      </div>

      {/* Calendar Header Controls */}
      <section className="card" style={{ marginBottom: 16 }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h2 style={{ margin: 0, fontSize: '1.25rem' }}>
              {monthNames[month]} {year}
            </h2>
            <div style={{ display: 'inline-flex', gap: 4 }}>
              <button
                type="button"
                className="btn mini secondary icon-btn"
                onClick={handlePrev}
                aria-label="Previous month"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                type="button"
                className="btn mini secondary icon-btn"
                onClick={handleNext}
                aria-label="Next month"
              >
                <ChevronRight size={16} />
              </button>
            </div>
            <button type="button" className="btn mini secondary" onClick={handleToday}>
              Today
            </button>
          </div>

          <div style={{ display: 'inline-flex', gap: 6 }}>
            <button
              type="button"
              className={`btn mini ${view === 'month' ? 'primary' : 'secondary'}`}
              onClick={() => setView('month')}
            >
              Month View
            </button>
            <button
              type="button"
              className={`btn mini ${view === 'week' ? 'primary' : 'secondary'}`}
              onClick={() => setView('week')}
            >
              List / Agenda
            </button>
          </div>
        </div>
      </section>

      {/* Month Grid View */}
      {view === 'month' ? (
        <section className="card" style={{ padding: 12 }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, 1fr)',
              textAlign: 'center',
              fontWeight: 700,
              fontSize: '0.85rem',
              color: 'var(--foreground-muted)',
              paddingBottom: 10,
              borderBottom: '1px solid var(--border)',
            }}
          >
            <div>Sun</div>
            <div>Mon</div>
            <div>Tue</div>
            <div>Wed</div>
            <div>Thu</div>
            <div>Fri</div>
            <div>Sat</div>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, 1fr)',
              gap: 4,
              marginTop: 6,
            }}
          >
            {calendarDays.map((cd, idx) => {
              const dayMeetings = cd.dateStr ? meetingsByDate[cd.dateStr] || [] : [];
              const isToday = cd.dateStr === new Date().toISOString().split('T')[0];

              return (
                <div
                  key={idx}
                  style={{
                    minHeight: 85,
                    padding: 6,
                    borderRadius: 6,
                    background: cd.day
                      ? isToday
                        ? 'var(--primary-subtle)'
                        : 'var(--surface-sunken, #f8fafc)'
                      : 'transparent',
                    border: cd.day
                      ? isToday
                        ? '1px solid var(--primary-border)'
                        : '1px solid var(--border)'
                      : 'none',
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                >
                  {cd.day && (
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: 4,
                      }}
                    >
                      <span style={{ fontSize: '0.82rem', fontWeight: isToday ? 700 : 500 }}>
                        {cd.day}
                      </span>
                      {dayMeetings.length > 0 && (
                        <span
                          style={{
                            width: 6,
                            height: 6,
                            borderRadius: '50%',
                            background: 'var(--primary)',
                          }}
                        />
                      )}
                    </div>
                  )}

                  {dayMeetings.map((m) => {
                    const statusClass =
                      m.status === 'completed'
                        ? 'status-accepted'
                        : m.status === 'cancelled'
                          ? 'status-rejected'
                          : 'status-pending';

                    return (
                      <div
                        key={m.id || m._id}
                        onClick={() => nav('/meetings')}
                        style={{
                          fontSize: '0.72rem',
                          padding: '3px 5px',
                          borderRadius: 4,
                          marginBottom: 3,
                          cursor: 'pointer',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          lineHeight: 1.2,
                        }}
                        className={`status-chip ${statusClass}`}
                        title={`${m.time} · ${m.status}`}
                      >
                        {m.time ? m.time.split('-')[0] : 'Slot'} · {m.status}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </section>
      ) : (
        /* Agenda / List View */
        <section className="card">
          <h3 style={{ margin: '0 0 16px 0', fontSize: '1.1rem' }}>All Scheduled Sessions</h3>
          {myMeetings.length === 0 ? (
            <EmptyState
              icon={CalendarDays}
              title="No meetings scheduled"
              text="You have no confirmed or past sessions on record."
              actionLabel="Book a Meeting"
              onAction={() => nav('/meetings')}
            />
          ) : (
            <div className="table-list">
              {myMeetings.map((m) => (
                <div
                  key={m.id || m._id}
                  className="table-row"
                  style={{
                    padding: '12px 0',
                    borderBottom: '1px solid var(--border)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: 10,
                  }}
                >
                  <div>
                    <b>
                      {m.date} · {m.time}
                    </b>
                    <p
                      style={{
                        margin: '2px 0 0 0',
                        fontSize: '0.84rem',
                        color: 'var(--foreground-muted)',
                      }}
                    >
                      Mode: {m.mode || 'Video call'}
                    </p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <StatusChip status={m.status} />
                    {m.link && (
                      <a
                        href={m.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn mini join-btn"
                      >
                        <Video size={13} /> Join
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}
    </AppShell>
  );
}
