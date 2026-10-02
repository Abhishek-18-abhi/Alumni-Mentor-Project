import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AppShell from '../../components/AppShell';
import PageTitle from '../../components/PageTitle';
import EmptyState from '../../components/EmptyState';
import StatusChip from '../../components/StatusChip';
import ModalShell from '../../components/ModalShell';
import TabBar from '../../components/TabBar';
import { useMeetings, useUsers, useMentorshipRequests } from '../../hooks/useApi';
import { getSession } from '../../lib/storage';
import { apiPost, apiPatch, apiGet } from '../../lib/api';
import { useToast } from '../../components/Toast';
import { DAYS, TIME_SLOTS } from '../../lib/constants';
import {
  CalendarDays,
  Clock,
  Video,
  Plus,
  FileText,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  User,
  ExternalLink,
  CheckCircle2,
  Calendar as CalendarIcon,
  ListFilter,
  Check,
  X,
  PlayCircle,
  PauseCircle,
  Settings2,
} from 'lucide-react';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function SessionsAndCalendar({ role, defaultTab = 'calendar' }) {
  const nav = useNavigate();
  const toast = useToast();
  const session = getSession();
  const currentRole = role || session?.role || 'student';
  const myId = session?.id || session?._id || session?.userId;

  // Primary Workspace Tab: 'calendar' | 'meetings' | 'availability'
  const [activeMainTab, setActiveMainTab] = useState(defaultTab);
  useEffect(() => {
    if (defaultTab) setActiveMainTab(defaultTab);
  }, [defaultTab]);

  // Meetings List sub-tab: 'upcoming' | 'past' | 'all'
  const [meetingsTab, setMeetingsTab] = useState('upcoming');

  // Calendar View mode: 'month' | 'agenda'
  const [calendarView, setCalendarView] = useState('month');
  const [currentDate, setCurrentDate] = useState(new Date());

  // Modals state
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState(null);
  const [logModalMeeting, setLogModalMeeting] = useState(null);
  const [logNotes, setLogNotes] = useState('');
  const [logOutcome, setLogOutcome] = useState('');
  const [logNextSteps, setLogNextSteps] = useState('');
  const [isSavingLog, setIsSavingLog] = useState(false);

  // Booking Form State
  const [bookPartnerId, setBookPartnerId] = useState('');
  const [bookTitle, setBookTitle] = useState('Mentorship Session');
  const [bookDate, setBookDate] = useState('');
  const [bookSlot, setBookSlot] = useState('');
  const [customTimeInput, setCustomTimeInput] = useState('');
  const [isCustomTime, setIsCustomTime] = useState(false);
  const [bookMode, setBookMode] = useState('Video call');
  const [bookLink, setBookLink] = useState('https://meet.google.com/new');
  const [isSubmittingBooking, setIsSubmittingBooking] = useState(false);

  // Mentor Availability Tab State (for mentors only)
  const [mentorCapacity, setMentorCapacity] = useState(5);
  const [mentorPause, setMentorPause] = useState(false);
  const [mentorSlots, setMentorSlots] = useState([]);
  const [isSavingAvailability, setIsSavingAvailability] = useState(false);

  // Load API data
  const { data: meetings = [], loading: meetingsLoading, refetch: refetchMeetings } = useMeetings();
  const { data: users = [] } = useUsers();
  const { data: requests = [] } = useMentorshipRequests();

  // Load mentor's profile for availability tab
  useEffect(() => {
    if (currentRole === 'mentor' && myId) {
      apiGet('/auth/me')
        .then((res) => {
          if (res?.user) {
            setMentorCapacity(res.user.capacity || 5);
            setMentorPause(Boolean(res.user.pauseRequests));
            setMentorSlots(res.user.availability || []);
          }
        })
        .catch(() => {});
    }
  }, [currentRole, myId]);

  // Find accepted mentorship relationships
  const acceptedPairs = useMemo(() => {
    return (requests || []).filter((r) => {
      const sId = r.studentId?._id || r.studentId?.id || r.studentId;
      const mId = r.mentorId?._id || r.mentorId?.id || r.mentorId;
      const matchesMe =
        currentRole === 'student' ? String(sId) === String(myId) : String(mId) === String(myId);
      return matchesMe && r.status === 'accepted';
    });
  }, [requests, currentRole, myId]);

  // Available partners for booking
  const availablePartners = useMemo(() => {
    // 1. Accepted partners first
    const acceptedList = (acceptedPairs || [])
      .map((r) => {
        const partnerId =
          currentRole === 'student'
            ? r.mentorId?._id || r.mentorId?.id || r.mentorId
            : r.studentId?._id || r.studentId?.id || r.studentId;
        const fullUser = (users || []).find((u) => (u.id || u._id) === partnerId);
        return fullUser || (currentRole === 'student' ? r.mentorId : r.studentId);
      })
      .filter(Boolean);

    if (acceptedList.length > 0) return acceptedList;

    // 2. Fallback to all potential users of the opposite role
    const targetRole = currentRole === 'student' ? 'mentor' : 'student';
    return (users || []).filter((u) => u.role === targetRole && (u.id || u._id) !== myId);
  }, [acceptedPairs, currentRole, users, myId]);

  // Currently selected partner in booking modal
  const selectedPartner = useMemo(() => {
    if (!bookPartnerId) return availablePartners[0] || null;
    return (
      (availablePartners || []).find((p) => (p.id || p._id) === bookPartnerId) ||
      availablePartners[0] ||
      null
    );
  }, [bookPartnerId, availablePartners]);

  // Is the currently selected partner an accepted connection?
  const isSelectedPartnerAccepted = useMemo(() => {
    if (!selectedPartner) return false;
    const pId = selectedPartner.id || selectedPartner._id;
    return (acceptedPairs || []).some((r) => {
      const sId = r.studentId?._id || r.studentId?.id || r.studentId;
      const mId = r.mentorId?._id || r.mentorId?.id || r.mentorId;
      const checkId = currentRole === 'student' ? mId : sId;
      return String(checkId) === String(pId);
    });
  }, [selectedPartner, acceptedPairs, currentRole]);

  // Selected mentor's availability slots
  const partnerAvailabilitySlots = useMemo(() => {
    if (currentRole === 'mentor') return []; // When mentor books, no restriction
    return selectedPartner?.availability || [];
  }, [currentRole, selectedPartner]);

  // Calculate day of the week for chosen booking date
  const selectedDayOfWeek = useMemo(() => {
    if (!bookDate) return null;
    const parts = bookDate.split('-');
    if (parts.length < 3) return null;
    const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    return isNaN(d.getTime()) ? null : DAY_NAMES[d.getDay()];
  }, [bookDate]);

  // Availability slots for selected day
  const slotsForSelectedDay = useMemo(() => {
    if (!selectedDayOfWeek || !partnerAvailabilitySlots.length) return [];
    return partnerAvailabilitySlots.filter((slot) => {
      const lower = slot.toLowerCase();
      return (
        lower.includes(selectedDayOfWeek.toLowerCase()) ||
        lower.includes(selectedDayOfWeek.slice(0, 3).toLowerCase())
      );
    });
  }, [selectedDayOfWeek, partnerAvailabilitySlots]);

  // Generate dynamic, guaranteed-valid time slot options
  const generatedSlotOptions = useMemo(() => {
    // 1. If mentor has specific slots for the chosen day
    if (slotsForSelectedDay.length > 0) {
      const options = [];
      slotsForSelectedDay.forEach((slot) => {
        const timeMatch = slot.match(/(\d{1,2}:\d{2})\s*(?:-\s*(\d{1,2}:\d{2}))?/);
        if (timeMatch) {
          const start = timeMatch[1].padStart(5, '0');
          const end = timeMatch[2] ? timeMatch[2].padStart(5, '0') : null;

          if (end && end > start) {
            const startH = parseInt(start.split(':')[0], 10);
            const endH = parseInt(end.split(':')[0], 10);
            // 1-hour increments
            for (let h = startH; h < endH; h++) {
              const sStr = `${String(h).padStart(2, '0')}:00`;
              const eStr = `${String(h + 1).padStart(2, '0')}:00`;
              options.push({
                value: `${sStr}-${eStr}`,
                label: `${sStr} - ${eStr} (1 Hour)`,
              });
            }
            // Full window
            options.push({
              value: `${start}-${end}`,
              label: `${start} - ${end} (Full Window)`,
            });
          } else {
            options.push({ value: start, label: `${start} (Scheduled Time)` });
          }
        }
      });
      return options;
    }

    // 2. If mentor has general slots or no slots for this day, or no availability set
    return [
      { value: '10:00-11:00', label: '10:00 - 11:00 AM (Morning)' },
      { value: '11:00-12:00', label: '11:00 - 12:00 PM (Morning)' },
      { value: '13:00-14:00', label: '13:00 - 14:00 PM (Afternoon)' },
      { value: '14:00-15:00', label: '14:00 - 15:00 PM (Afternoon)' },
      { value: '15:00-16:00', label: '15:00 - 16:00 PM (Afternoon)' },
      { value: '16:00-17:00', label: '16:00 - 17:00 PM (Evening)' },
      { value: '17:00-18:00', label: '17:00 - 18:00 PM (Evening)' },
      { value: '18:00-19:00', label: '18:00 - 19:00 PM (Evening)' },
    ];
  }, [slotsForSelectedDay]);

  // Keep bookSlot synchronized with first valid option when day changes
  useEffect(() => {
    if (generatedSlotOptions.length > 0 && !isCustomTime) {
      setBookSlot(generatedSlotOptions[0].value);
    }
  }, [generatedSlotOptions, isCustomTime]);

  // Filter meetings belonging to this user
  const userMeetings = useMemo(() => {
    return (meetings || []).filter((m) => {
      const sId = m.studentId?._id || m.studentId?.id || m.studentId;
      const mId = m.mentorId?._id || m.mentorId?.id || m.mentorId;
      return String(sId) === String(myId) || String(mId) === String(myId);
    });
  }, [meetings, myId]);

  const todayStr = new Date().toISOString().split('T')[0];

  // Filtered meetings for List view
  const displayedMeetings = useMemo(() => {
    return (userMeetings || [])
      .filter((m) => {
        if (meetingsTab === 'upcoming') {
          return m.status === 'scheduled' && m.date >= todayStr;
        }
        if (meetingsTab === 'past') {
          return m.status === 'completed' || m.date < todayStr;
        }
        return true;
      })
      .sort((a, b) =>
        meetingsTab === 'past' ? b.date.localeCompare(a.date) : a.date.localeCompare(b.date)
      );
  }, [userMeetings, meetingsTab, todayStr]);

  // Calendar month calculation
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
    userMeetings.forEach((m) => {
      if (!m.date) return;
      const d = String(m.date).split('T')[0];
      if (!map[d]) map[d] = [];
      map[d].push(m);
    });
    return map;
  }, [userMeetings]);

  const handlePrevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const handleNextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const handleTodayMonth = () => setCurrentDate(new Date());

  // Quick Open Booking from Calendar Click
  const handleDayClick = (dateStr) => {
    if (!dateStr || dateStr < todayStr) return;
    setBookDate(dateStr);
    setIsBookingOpen(true);
  };

  // Submit Meeting Booking
  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    if (isSubmittingBooking) return;

    const partnerIdToBook = selectedPartner?.id || selectedPartner?._id;
    if (!partnerIdToBook) {
      return toast.error('Please select a participant for the session.');
    }
    if (!bookDate) {
      return toast.error('Please select a meeting date.');
    }

    const finalTime = isCustomTime ? customTimeInput.trim() : bookSlot;
    if (!finalTime) {
      return toast.error('Please choose or enter a valid meeting time.');
    }

    setIsSubmittingBooking(true);
    try {
      const payload = {
        mentorId: currentRole === 'student' ? partnerIdToBook : myId,
        studentId: currentRole === 'student' ? myId : partnerIdToBook,
        title: bookTitle.trim() || 'Mentorship Session',
        date: bookDate,
        time: finalTime,
        mode: bookMode,
        link: bookLink.trim(),
      };

      await apiPost('/meetings', payload);

      toast.success('Mentorship session scheduled successfully!');
      setIsBookingOpen(false);
      setBookDate('');
      setBookSlot('');
      setCustomTimeInput('');
      setIsCustomTime(false);
      await refetchMeetings();
    } catch (err) {
      toast.error(err?.message || 'Failed to schedule meeting.');
    } finally {
      setIsSubmittingBooking(false);
    }
  };

  // Cancel Meeting Handler
  const handleCancelMeeting = async (meeting) => {
    const mId = meeting.id || meeting._id;
    if (!window.confirm('Are you sure you want to cancel this scheduled session?')) return;
    try {
      await apiPatch(`/meetings/${mId}`, { status: 'cancelled' });
      toast.success('Session cancelled.');
      if (selectedMeeting && (selectedMeeting.id === mId || selectedMeeting._id === mId)) {
        setSelectedMeeting(null);
      }
      await refetchMeetings();
    } catch (err) {
      toast.error(err?.message || 'Failed to cancel meeting.');
    }
  };

  // Meeting Notes / Outcome Modal
  const openLogModal = (meeting) => {
    setLogModalMeeting(meeting);
    setLogNotes(meeting.notes || meeting.log || '');
    setLogOutcome(meeting.outcome || '');
    setLogNextSteps(meeting.nextSteps || '');
    if (selectedMeeting) setSelectedMeeting(null);
  };

  const handleSaveLog = async (e) => {
    e.preventDefault();
    if (!logModalMeeting || isSavingLog) return;
    setIsSavingLog(true);

    try {
      const mId = logModalMeeting.id || logModalMeeting._id;
      await apiPatch(`/meetings/${mId}`, {
        notes: logNotes.trim(),
        log: logNotes.trim(),
        outcome: logOutcome.trim(),
        nextSteps: logNextSteps.trim(),
        status: 'completed',
      });

      toast.success('Meeting notes and outcomes saved.');
      setLogModalMeeting(null);
      await refetchMeetings();
    } catch (err) {
      toast.error(err?.message || 'Failed to update meeting record.');
    } finally {
      setIsSavingLog(false);
    }
  };

  // Mentor Save Availability
  const handleSaveMentorAvailability = async (e) => {
    e.preventDefault();
    if (mentorSlots.length === 0) {
      return toast.error('Please configure at least 1 weekly availability slot.');
    }
    setIsSavingAvailability(true);
    try {
      await apiPatch(`/users/${myId}`, {
        capacity: Number(mentorCapacity),
        pauseRequests: mentorPause,
        availability: mentorSlots,
      });
      toast.success('Availability settings saved successfully.');
    } catch (err) {
      toast.error(err?.message || 'Failed to save availability.');
    } finally {
      setIsSavingAvailability(false);
    }
  };

  const toggleMentorSlot = (slotStr) => {
    setMentorSlots((prev) =>
      prev.includes(slotStr) ? prev.filter((s) => s !== slotStr) : [...prev, slotStr]
    );
  };

  // Primary navigation tabs
  const mainTabs = useMemo(() => {
    const list = [
      { id: 'calendar', label: 'Calendar View', icon: CalendarDays },
      { id: 'meetings', label: `Meetings List (${userMeetings.length})`, icon: Clock },
    ];
    if (currentRole === 'mentor') {
      list.push({ id: 'availability', label: 'Availability & Capacity', icon: Settings2 });
    }
    return list;
  }, [currentRole, userMeetings.length]);

  // Meeting filter tabs
  const filterTabs = [
    {
      id: 'upcoming',
      label: 'Upcoming Sessions',
      count: userMeetings.filter((m) => m.status === 'scheduled' && m.date >= todayStr).length,
    },
    {
      id: 'past',
      label: 'Past & Completed',
      count: userMeetings.filter((m) => m.status === 'completed' || m.date < todayStr).length,
    },
    { id: 'all', label: 'All Records', count: userMeetings.length },
  ];

  return (
    <AppShell role={currentRole}>
      {/* Page Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: 12,
          marginBottom: 16,
        }}
      >
        <PageTitle
          eyebrow={currentRole === 'mentor' ? 'Alumni Mentor Workspace' : 'Student Workspace'}
          title={
            currentRole === 'mentor' ? 'Sessions & Calendar' : 'Mentorship Meetings & Calendar'
          }
          text="Easily schedule 1:1 sessions, visualize your mentorship calendar, join video calls, and record session notes."
        />

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button
            type="button"
            className="uiverse-btn"
            onClick={() => {
              setBookDate(todayStr);
              setIsBookingOpen(true);
            }}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            <Plus size={16} /> Schedule Meeting
          </button>
        </div>
      </div>

      {/* Main Workspace Navigation Switcher */}
      <div style={{ marginBottom: 20 }}>
        <TabBar
          tabs={mainTabs.map((t) => ({ id: t.id, label: t.label }))}
          activeTab={activeMainTab}
          onChange={setActiveMainTab}
        />
      </div>

      {/* ========================================================= */}
      {/* 1. CALENDAR VIEW                                          */}
      {/* ========================================================= */}
      {activeMainTab === 'calendar' && (
        <div>
          {/* Calendar Header Controls */}
          <section className="card" style={{ marginBottom: 16, padding: '12px 18px' }}>
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
                <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700 }}>
                  {monthNames[month]} {year}
                </h2>
                <div style={{ display: 'inline-flex', gap: 4 }}>
                  <button
                    type="button"
                    className="btn mini secondary icon-btn"
                    onClick={handlePrevMonth}
                    aria-label="Previous month"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    type="button"
                    className="btn mini secondary icon-btn"
                    onClick={handleNextMonth}
                    aria-label="Next month"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
                <button type="button" className="btn mini secondary" onClick={handleTodayMonth}>
                  Today
                </button>
              </div>

              <div style={{ display: 'inline-flex', gap: 6 }}>
                <button
                  type="button"
                  className={`btn mini ${calendarView === 'month' ? 'primary' : 'secondary'}`}
                  onClick={() => setCalendarView('month')}
                >
                  Month View
                </button>
                <button
                  type="button"
                  className={`btn mini ${calendarView === 'agenda' ? 'primary' : 'secondary'}`}
                  onClick={() => setCalendarView('agenda')}
                >
                  List / Agenda
                </button>
              </div>
            </div>
          </section>

          {/* Month Grid */}
          {calendarView === 'month' ? (
            <section className="card" style={{ padding: 14 }}>
              {/* Day headers */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(7, 1fr)',
                  textAlign: 'center',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  color: 'var(--foreground-muted)',
                  borderBottom: '1px solid var(--border)',
                  paddingBottom: 10,
                  marginBottom: 10,
                }}
              >
                {DAY_NAMES.map((d) => (
                  <div key={d}>{d.slice(0, 3)}</div>
                ))}
              </div>

              {/* Day cells */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(7, 1fr)',
                  gap: 8,
                }}
              >
                {calendarDays.map((cell, idx) => {
                  if (!cell.day) {
                    return (
                      <div
                        key={`empty-${idx}`}
                        style={{
                          minHeight: 90,
                          borderRadius: 6,
                          background: 'var(--surface-sunken, #f8fafc)',
                          opacity: 0.35,
                        }}
                      />
                    );
                  }

                  const dayMeetings = meetingsByDate[cell.dateStr] || [];
                  const isToday = cell.dateStr === todayStr;
                  const isPast = cell.dateStr < todayStr;

                  return (
                    <div
                      key={cell.dateStr}
                      onClick={() => handleDayClick(cell.dateStr)}
                      style={{
                        minHeight: 94,
                        padding: 8,
                        borderRadius: 8,
                        border: isToday
                          ? '2px solid var(--primary)'
                          : '1px solid var(--border, #e2e8f0)',
                        background: isToday ? 'rgba(79, 70, 229, 0.04)' : 'var(--surface, #ffffff)',
                        display: 'flex',
                        flexDirection: 'column',
                        cursor: !isPast ? 'pointer' : 'default',
                        transition: 'all 0.15s ease',
                      }}
                      title={!isPast ? 'Click to schedule a session on this day' : ''}
                    >
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: 4,
                        }}
                      >
                        <span
                          style={{
                            fontWeight: isToday ? 700 : 600,
                            fontSize: '0.85rem',
                            color: isToday ? 'var(--primary)' : 'inherit',
                          }}
                        >
                          {cell.day}
                        </span>
                        {dayMeetings.length > 0 && (
                          <span
                            style={{
                              width: 6,
                              height: 6,
                              borderRadius: '50%',
                              backgroundColor: 'var(--primary)',
                            }}
                          />
                        )}
                      </div>

                      {/* Meeting pills */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {dayMeetings.map((m) => {
                          const other =
                            currentRole === 'student'
                              ? typeof m.mentorId === 'object'
                                ? m.mentorId
                                : null
                              : typeof m.studentId === 'object'
                                ? m.studentId
                                : null;
                          const isCancelled = m.status === 'cancelled';
                          const isCompleted = m.status === 'completed';

                          return (
                            <button
                              key={m.id || m._id}
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedMeeting(m);
                              }}
                              style={{
                                border: 'none',
                                textAlign: 'left',
                                borderRadius: 4,
                                padding: '3px 6px',
                                fontSize: '0.74rem',
                                fontWeight: 500,
                                background: isCancelled
                                  ? 'rgba(239, 68, 68, 0.12)'
                                  : isCompleted
                                    ? 'rgba(100, 116, 139, 0.12)'
                                    : 'rgba(16, 185, 129, 0.12)',
                                color: isCancelled
                                  ? 'var(--danger-text, #b91c1c)'
                                  : isCompleted
                                    ? 'var(--foreground-muted)'
                                    : 'var(--success-text, #047857)',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                cursor: 'pointer',
                              }}
                            >
                              <b>{m.time?.split('-')[0]?.trim() || m.time}</b> ·{' '}
                              {other?.name || (currentRole === 'student' ? 'Mentor' : 'Student')}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          ) : (
            /* Agenda List View */
            <section className="card" style={{ padding: 18 }}>
              <h3 style={{ margin: '0 0 14px 0', fontSize: '1.05rem' }}>
                Monthly Agenda & Sessions
              </h3>
              {userMeetings.length === 0 ? (
                <EmptyState
                  icon={CalendarDays}
                  title="No sessions scheduled"
                  text="Click '+ Schedule Meeting' above to book your first mentorship session."
                  actionLabel="Schedule Meeting"
                  onAction={() => {
                    setBookDate(todayStr);
                    setIsBookingOpen(true);
                  }}
                />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {userMeetings.map((m) => {
                    const other =
                      currentRole === 'student'
                        ? typeof m.mentorId === 'object'
                          ? m.mentorId
                          : null
                        : typeof m.studentId === 'object'
                          ? m.studentId
                          : null;
                    return (
                      <div
                        key={m.id || m._id}
                        onClick={() => setSelectedMeeting(m)}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: 12,
                          borderRadius: 8,
                          border: '1px solid var(--border)',
                          background: 'var(--surface-sunken, #f8fafc)',
                          cursor: 'pointer',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div
                            style={{
                              padding: '8px 12px',
                              borderRadius: 6,
                              background: 'var(--primary)',
                              color: '#ffffff',
                              fontWeight: 700,
                              fontSize: '0.85rem',
                              textAlign: 'center',
                            }}
                          >
                            {m.date}
                          </div>
                          <div>
                            <b style={{ fontSize: '0.95rem' }}>{m.title || 'Mentorship Session'}</b>
                            <div style={{ fontSize: '0.82rem', color: 'var(--foreground-muted)' }}>
                              With{' '}
                              {other?.name || (currentRole === 'student' ? 'Mentor' : 'Student')} ·{' '}
                              {m.time} ({m.mode || 'Online'})
                            </div>
                          </div>
                        </div>
                        <StatusChip status={m.status} />
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* 2. MEETINGS LIST VIEW                                     */}
      {/* ========================================================= */}
      {activeMainTab === 'meetings' && (
        <div>
          <div style={{ marginBottom: 16 }}>
            <TabBar tabs={filterTabs} activeTab={meetingsTab} onChange={setMeetingsTab} />
          </div>

          {meetingsLoading ? (
            <div className="skeleton-container">
              <div className="skeleton-bar" style={{ height: 90, marginBottom: 12 }} />
              <div className="skeleton-bar" style={{ height: 90, marginBottom: 12 }} />
            </div>
          ) : displayedMeetings.length === 0 ? (
            <EmptyState
              icon={CalendarDays}
              title={`No ${meetingsTab} meetings`}
              text={
                currentRole === 'student'
                  ? 'Schedule a session with your paired mentor from their published availability slots.'
                  : 'Meetings scheduled with your mentees will appear here.'
              }
              actionLabel="Schedule Meeting"
              onAction={() => {
                setBookDate(todayStr);
                setIsBookingOpen(true);
              }}
            />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {displayedMeetings.map((m) => {
                const mId = m.id || m._id;
                const other =
                  currentRole === 'student'
                    ? typeof m.mentorId === 'object'
                      ? m.mentorId
                      : users.find((u) => (u.id || u._id) === m.mentorId)
                    : typeof m.studentId === 'object'
                      ? m.studentId
                      : users.find((u) => (u.id || u._id) === m.studentId);

                const hasLink = Boolean(m.link && m.link.trim());

                return (
                  <section key={mId} className="card" style={{ padding: 18 }}>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        flexWrap: 'wrap',
                        gap: 12,
                      }}
                    >
                      <div>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10,
                            marginBottom: 6,
                          }}
                        >
                          <b style={{ fontSize: '1.1rem' }}>{m.title || 'Mentorship Session'}</b>
                          <StatusChip status={m.status} />
                        </div>

                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 14,
                            flexWrap: 'wrap',
                            fontSize: '0.88rem',
                            color: 'var(--foreground-muted)',
                          }}
                        >
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                            <CalendarDays size={15} /> {m.date}
                          </span>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                            <Clock size={15} /> {m.time}
                          </span>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                            <User size={15} />{' '}
                            {other?.name || (currentRole === 'student' ? 'Mentor' : 'Student')} (
                            {currentRole === 'student' ? other?.jobTitle || 'Mentor' : 'Student'})
                          </span>
                          <span>
                            Mode: <b>{m.mode || 'Online'}</b>
                          </span>
                        </div>

                        {/* Meeting notes snippet if logged */}
                        {(m.notes || m.log) && (
                          <div
                            style={{
                              marginTop: 10,
                              padding: 10,
                              borderRadius: 6,
                              background: 'var(--surface-sunken, #f8fafc)',
                              fontSize: '0.85rem',
                              border: '1px solid var(--border)',
                            }}
                          >
                            <b>Discussion Notes:</b> {m.notes || m.log}
                          </div>
                        )}
                      </div>

                      {/* Action buttons */}
                      <div
                        style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}
                      >
                        {hasLink && m.status === 'scheduled' && (
                          <a
                            href={m.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn primary mini"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
                          >
                            <Video size={14} /> Join Video Call
                          </a>
                        )}

                        <button
                          type="button"
                          className="btn secondary mini"
                          onClick={() => openLogModal(m)}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
                        >
                          <FileText size={14} />{' '}
                          {m.status === 'completed' ? 'View/Edit Log' : 'Add Notes'}
                        </button>

                        {m.status === 'scheduled' && (
                          <button
                            type="button"
                            className="btn mini secondary"
                            onClick={() => handleCancelMeeting(m)}
                            style={{ color: 'var(--danger-text, #ef4444)' }}
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </div>
                  </section>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* 3. MENTOR AVAILABILITY TAB (For Mentors)                  */}
      {/* ========================================================= */}
      {activeMainTab === 'availability' && currentRole === 'mentor' && (
        <form onSubmit={handleSaveMentorAvailability}>
          {/* Capacity Settings */}
          <section className="card" style={{ marginBottom: 18, padding: 18 }}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '1.1rem' }}>Mentee Capacity & Intake</h3>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: 20,
              }}
            >
              <div>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: 6 }}>
                  Active Mentee Limit
                </label>
                <input
                  type="number"
                  min="1"
                  max="25"
                  value={mentorCapacity}
                  onChange={(e) =>
                    setMentorCapacity(Math.max(1, parseInt(e.target.value, 10) || 1))
                  }
                  style={{ width: '100%', maxWidth: 200 }}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: 6 }}>
                  Request Status
                </label>
                <button
                  type="button"
                  className={`btn ${mentorPause ? 'secondary' : 'primary'}`}
                  onClick={() => setMentorPause((p) => !p)}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                >
                  {mentorPause ? <PlayCircle size={16} /> : <PauseCircle size={16} />}
                  {mentorPause
                    ? 'Requests Paused (Click to Accept)'
                    : 'Accepting Students (Click to Pause)'}
                </button>
              </div>
            </div>
          </section>

          {/* Weekly Availability Slots */}
          <section className="card" style={{ padding: 18 }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 14,
              }}
            >
              <div>
                <h3 style={{ margin: 0, fontSize: '1.1rem' }}>
                  Weekly Recurring Availability Slots
                </h3>
                <p
                  style={{
                    margin: '4px 0 0',
                    fontSize: '0.85rem',
                    color: 'var(--foreground-muted)',
                  }}
                >
                  Select the recurring time intervals when you are available for 1:1 mentorship
                  sessions.
                </p>
              </div>
              <button type="submit" className="uiverse-btn" disabled={isSavingAvailability}>
                {isSavingAvailability ? 'Saving...' : 'Save Availability'}
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {DAYS.map((day) => (
                <div
                  key={day}
                  style={{
                    padding: 10,
                    borderRadius: 6,
                    background: 'var(--surface-sunken, #f8fafc)',
                    border: '1px solid var(--border)',
                  }}
                >
                  <b style={{ display: 'block', marginBottom: 6, fontSize: '0.9rem' }}>{day}</b>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {TIME_SLOTS.map((slot) => {
                      const slotKey = `${day} ${slot}`;
                      const isSelected = mentorSlots.includes(slotKey);
                      return (
                        <button
                          key={slotKey}
                          type="button"
                          onClick={() => toggleMentorSlot(slotKey)}
                          className={`btn mini ${isSelected ? 'primary' : 'secondary'}`}
                          style={{ fontSize: '0.78rem' }}
                        >
                          {isSelected && <Check size={12} style={{ marginRight: 4 }} />}
                          {slot}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </form>
      )}

      {/* ========================================================= */}
      {/* FOOLPROOF SCHEDULE MEETING MODAL                          */}
      {/* ========================================================= */}
      {isBookingOpen && (
        <ModalShell
          title="Schedule a Mentorship Meeting"
          isOpen={isBookingOpen}
          onClose={() => setIsBookingOpen(false)}
        >
          {availablePartners.length === 0 ? (
            <div style={{ padding: 10, textAlign: 'center' }}>
              <AlertCircle
                size={36}
                color="var(--warning-text, #f59e0b)"
                style={{ margin: '0 auto 10px' }}
              />
              <h4 style={{ margin: '0 0 6px 0' }}>No Active Mentorship Connection Found</h4>
              <p
                style={{ fontSize: '0.88rem', color: 'var(--foreground-muted)', marginBottom: 14 }}
              >
                {currentRole === 'student'
                  ? 'You need to connect with a mentor first before scheduling 1:1 meetings.'
                  : 'You have no accepted student mentees yet.'}
              </p>
              {currentRole === 'student' && (
                <button
                  type="button"
                  className="uiverse-btn"
                  onClick={() => {
                    setIsBookingOpen(false);
                    nav('/mentors');
                  }}
                >
                  Browse & Connect with Mentors
                </button>
              )}
            </div>
          ) : (
            <form
              onSubmit={handleBookingSubmit}
              style={{ display: 'flex', flexDirection: 'column', gap: 14 }}
            >
              {/* Select Participant */}
              <label>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 4,
                  }}
                >
                  <span style={{ fontWeight: 600 }}>
                    {currentRole === 'student' ? 'Select Mentor' : 'Select Mentee / Student'}
                  </span>
                  {currentRole === 'student' && isSelectedPartnerAccepted && (
                    <span
                      style={{
                        fontSize: '0.75rem',
                        color: 'var(--success-text, #059669)',
                        fontWeight: 600,
                      }}
                    >
                      ✓ Connected Mentor
                    </span>
                  )}
                </div>
                <select
                  value={bookPartnerId || selectedPartner?.id || selectedPartner?._id || ''}
                  onChange={(e) => setBookPartnerId(e.target.value)}
                  required
                >
                  {availablePartners.map((p) => {
                    const pId = p.id || p._id;
                    const isAccepted = (acceptedPairs || []).some((r) => {
                      const sId = r.studentId?._id || r.studentId?.id || r.studentId;
                      const mId = r.mentorId?._id || r.mentorId?.id || r.mentorId;
                      const checkId = currentRole === 'student' ? mId : sId;
                      return String(checkId) === String(pId);
                    });

                    return (
                      <option key={pId} value={pId}>
                        {isAccepted ? '⭐ ' : ''}
                        {p.name}{' '}
                        {p.jobTitle
                          ? `(${p.jobTitle})`
                          : currentRole === 'student'
                            ? '(Mentor)'
                            : '(Student)'}{' '}
                        {isAccepted ? '— Connected' : ''}
                      </option>
                    );
                  })}
                </select>
              </label>

              {/* Show warning banner if student selects a mentor not yet connected */}
              {currentRole === 'student' && !isSelectedPartnerAccepted && (
                <div
                  style={{
                    padding: 10,
                    borderRadius: 6,
                    background: 'rgba(245, 158, 11, 0.1)',
                    border: '1px solid rgba(245, 158, 11, 0.3)',
                    color: 'var(--warning-text, #b45309)',
                    fontSize: '0.82rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <AlertCircle size={16} />
                  <span>
                    You have not yet established an accepted connection with this mentor. You can
                    send a connection request from the Find Mentor page.
                  </span>
                </div>
              )}

              {/* Show Mentor's Published Availability as 1-Click Selectable Pills */}
              {currentRole === 'student' && (
                <div
                  style={{
                    padding: 10,
                    borderRadius: 6,
                    background: 'var(--surface-sunken, #f8fafc)',
                    border: '1px solid var(--border)',
                  }}
                >
                  <b style={{ fontSize: '0.85rem', display: 'block', marginBottom: 6 }}>
                    Mentor's Published Availability Schedule (Click to pick day & time):
                  </b>
                  {partnerAvailabilitySlots.length === 0 ? (
                    <span style={{ fontSize: '0.82rem', color: 'var(--foreground-muted)' }}>
                      This mentor has open scheduling (any convenient time slot can be chosen).
                    </span>
                  ) : (
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {partnerAvailabilitySlots.map((s) => (
                        <button
                          key={s}
                          type="button"
                          className="category-pill-tech"
                          onClick={() => {
                            // Extract time
                            const timeMatch = s.match(/(\d{1,2}:\d{2})\s*(?:-\s*(\d{1,2}:\d{2}))?/);
                            if (timeMatch) {
                              setBookSlot(timeMatch[0].replace(/\s/g, ''));
                              setIsCustomTime(false);
                            }
                            // Extract day and calculate upcoming date
                            const dayMatch = DAY_NAMES.find((d) =>
                              s.toLowerCase().includes(d.toLowerCase())
                            );
                            if (dayMatch) {
                              const targetDayIdx = DAY_NAMES.indexOf(dayMatch);
                              const now = new Date();
                              const currentDayIdx = now.getDay();
                              let diff = targetDayIdx - currentDayIdx;
                              if (diff <= 0) diff += 7; // Next occurrence
                              const nextDate = new Date(
                                now.getFullYear(),
                                now.getMonth(),
                                now.getDate() + diff
                              );
                              const y = nextDate.getFullYear();
                              const m = String(nextDate.getMonth() + 1).padStart(2, '0');
                              const d = String(nextDate.getDate()).padStart(2, '0');
                              setBookDate(`${y}-${m}-${d}`);
                              toast.info(`Selected ${dayMatch} ${timeMatch ? timeMatch[0] : ''}`);
                            }
                          }}
                          style={{
                            cursor: 'pointer',
                            fontSize: '0.78rem',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                          }}
                        >
                          <Clock size={12} /> {s}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Date & Time Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <label>
                  <span style={{ fontWeight: 600, display: 'block', marginBottom: 4 }}>Date</span>
                  <input
                    type="date"
                    min={todayStr}
                    value={bookDate}
                    onChange={(e) => setBookDate(e.target.value)}
                    required
                  />
                </label>

                <div>
                  <span style={{ fontWeight: 600, display: 'block', marginBottom: 4 }}>
                    Time Slot
                  </span>
                  {!isCustomTime ? (
                    <select
                      value={bookSlot}
                      onChange={(e) => {
                        if (e.target.value === '__custom__') {
                          setIsCustomTime(true);
                          setCustomTimeInput('');
                        } else {
                          setBookSlot(e.target.value);
                        }
                      }}
                      required
                    >
                      {generatedSlotOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                      <option value="__custom__">+ Enter Custom Time...</option>
                    </select>
                  ) : (
                    <div style={{ display: 'flex', gap: 6 }}>
                      <input
                        type="time"
                        value={customTimeInput}
                        onChange={(e) => setCustomTimeInput(e.target.value)}
                        placeholder="HH:MM"
                        required
                        style={{ flex: 1 }}
                      />
                      <button
                        type="button"
                        className="btn mini secondary"
                        onClick={() => setIsCustomTime(false)}
                      >
                        Presets
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Session Topic / Title */}
              <label>
                <span style={{ fontWeight: 600, display: 'block', marginBottom: 4 }}>
                  Session Topic / Focus
                </span>
                <input
                  type="text"
                  value={bookTitle}
                  onChange={(e) => setBookTitle(e.target.value)}
                  placeholder="e.g. Resume Review, Career Guidance, DSA Preparation"
                  required
                />
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
                  {[
                    'Resume Review',
                    'Mock Interview',
                    'Career Advice',
                    'Code Review',
                    'Capstone Review',
                  ].map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      className="category-pill-tech"
                      onClick={() => setBookTitle(tag)}
                      style={{ fontSize: '0.74rem', cursor: 'pointer' }}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </label>

              {/* Meeting Mode & Meeting Link */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <label>
                  <span style={{ fontWeight: 600, display: 'block', marginBottom: 4 }}>
                    Meeting Mode
                  </span>
                  <select value={bookMode} onChange={(e) => setBookMode(e.target.value)}>
                    <option value="Video call">Video call</option>
                    <option value="In-person">In-person</option>
                    <option value="Phone call">Phone call</option>
                  </select>
                </label>

                <label>
                  <span style={{ fontWeight: 600, display: 'block', marginBottom: 4 }}>
                    Meeting Link
                  </span>
                  <input
                    type="url"
                    value={bookLink}
                    onChange={(e) => setBookLink(e.target.value)}
                    placeholder="https://meet.google.com/..."
                  />
                </label>
              </div>

              {/* Modal Actions */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
                <button
                  type="button"
                  className="btn secondary"
                  onClick={() => setIsBookingOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="uiverse-btn" disabled={isSubmittingBooking}>
                  {isSubmittingBooking ? 'Scheduling...' : 'Confirm Meeting'}
                </button>
              </div>
            </form>
          )}
        </ModalShell>
      )}

      {/* ========================================================= */}
      {/* INTERACTIVE MEETING DETAILS MODAL                         */}
      {/* ========================================================= */}
      {selectedMeeting && (
        <ModalShell
          title={selectedMeeting.title || 'Mentorship Session Details'}
          isOpen={Boolean(selectedMeeting)}
          onClose={() => setSelectedMeeting(null)}
        >
          {(() => {
            const other =
              currentRole === 'student'
                ? typeof selectedMeeting.mentorId === 'object'
                  ? selectedMeeting.mentorId
                  : users.find((u) => (u.id || u._id) === selectedMeeting.mentorId)
                : typeof selectedMeeting.studentId === 'object'
                  ? selectedMeeting.studentId
                  : users.find((u) => (u.id || u._id) === selectedMeeting.studentId);

            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                >
                  <StatusChip status={selectedMeeting.status} />
                  <span style={{ fontSize: '0.85rem', color: 'var(--foreground-muted)' }}>
                    Mode: <b>{selectedMeeting.mode || 'Online'}</b>
                  </span>
                </div>

                <div
                  style={{
                    padding: 12,
                    borderRadius: 6,
                    background: 'var(--surface-sunken, #f8fafc)',
                    border: '1px solid var(--border)',
                  }}
                >
                  <div style={{ marginBottom: 6 }}>
                    <b>With:</b> {other?.name || (currentRole === 'student' ? 'Mentor' : 'Student')}{' '}
                    {other?.jobTitle ? `(${other.jobTitle})` : ''}
                  </div>
                  <div style={{ marginBottom: 6 }}>
                    <b>Date & Time:</b> {selectedMeeting.date} at {selectedMeeting.time}
                  </div>
                  {selectedMeeting.link && (
                    <div>
                      <b>Video Link:</b>{' '}
                      <a href={selectedMeeting.link} target="_blank" rel="noopener noreferrer">
                        {selectedMeeting.link}
                      </a>
                    </div>
                  )}
                </div>

                {(selectedMeeting.notes || selectedMeeting.log) && (
                  <div>
                    <b style={{ display: 'block', marginBottom: 4 }}>Discussion Notes:</b>
                    <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--foreground-muted)' }}>
                      {selectedMeeting.notes || selectedMeeting.log}
                    </p>
                  </div>
                )}

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginTop: 10,
                    flexWrap: 'wrap',
                    gap: 8,
                  }}
                >
                  <div style={{ display: 'flex', gap: 8 }}>
                    {selectedMeeting.link && selectedMeeting.status === 'scheduled' && (
                      <a
                        href={selectedMeeting.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn primary mini"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
                      >
                        <Video size={14} /> Join Call
                      </a>
                    )}
                    <button
                      type="button"
                      className="btn secondary mini"
                      onClick={() => openLogModal(selectedMeeting)}
                    >
                      <FileText size={14} /> Notes
                    </button>
                  </div>

                  {selectedMeeting.status === 'scheduled' && (
                    <button
                      type="button"
                      className="btn mini secondary"
                      onClick={() => handleCancelMeeting(selectedMeeting)}
                      style={{ color: 'var(--danger-text, #ef4444)' }}
                    >
                      Cancel Meeting
                    </button>
                  )}
                </div>
              </div>
            );
          })()}
        </ModalShell>
      )}

      {/* ========================================================= */}
      {/* MEETING NOTES & OUTCOMES MODAL                            */}
      {/* ========================================================= */}
      {logModalMeeting && (
        <ModalShell
          title={`Meeting Notes & Log · ${logModalMeeting.date}`}
          isOpen={Boolean(logModalMeeting)}
          onClose={() => setLogModalMeeting(null)}
        >
          <form
            onSubmit={handleSaveLog}
            style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
          >
            <label>
              <span style={{ fontWeight: 600, display: 'block', marginBottom: 4 }}>
                Discussion Notes
              </span>
              <textarea
                rows={3}
                value={logNotes}
                onChange={(e) => setLogNotes(e.target.value)}
                placeholder="Key topics discussed, technical questions covered..."
                required
              />
            </label>

            <label>
              <span style={{ fontWeight: 600, display: 'block', marginBottom: 4 }}>
                Session Outcomes & Takeaways
              </span>
              <textarea
                rows={2}
                value={logOutcome}
                onChange={(e) => setLogOutcome(e.target.value)}
                placeholder="Decisions made, milestone achievements, conceptual takeaways..."
              />
            </label>

            <label>
              <span style={{ fontWeight: 600, display: 'block', marginBottom: 4 }}>
                Recommended Next Steps
              </span>
              <textarea
                rows={2}
                value={logNextSteps}
                onChange={(e) => setLogNextSteps(e.target.value)}
                placeholder="Action items for student before next session..."
              />
            </label>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
              <button
                type="button"
                className="btn secondary"
                onClick={() => setLogModalMeeting(null)}
              >
                Cancel
              </button>
              <button type="submit" className="uiverse-btn" disabled={isSavingLog}>
                {isSavingLog ? 'Saving...' : 'Save & Complete Session'}
              </button>
            </div>
          </form>
        </ModalShell>
      )}
    </AppShell>
  );
}
