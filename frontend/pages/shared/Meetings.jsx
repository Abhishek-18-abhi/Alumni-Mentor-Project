import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import AppShell from '../../components/AppShell';
import PageTitle from '../../components/PageTitle';
import EmptyState from '../../components/EmptyState';
import StatusChip from '../../components/StatusChip';
import ModalShell from '../../components/ModalShell';
import TabBar from '../../components/TabBar';
import { useMeetings, useUsers, useMentorshipRequests } from '../../hooks/useApi';
import { getSession } from '../../lib/storage';
import { apiPost, apiPatch } from '../../lib/api';
import { useToast } from '../../components/Toast';
import { CalendarDays, Clock, Video, Download, Plus, FileText, AlertCircle } from 'lucide-react';

function exportMeetingToIcs(meeting, otherParticipant) {
  const [startHour, startMin] = (meeting.time?.split('-')[0] || '09:00').trim().split(':');
  const [endHour, endMin] = (meeting.time?.split('-')[1] || '10:00').trim().split(':');
  const dateCompact = (meeting.date || '').replace(/-/g, '');
  const dtStart = `${dateCompact}T${startHour || '09'}${startMin || '00'}00`;
  const dtEnd = `${dateCompact}T${endHour || '10'}${endMin || '00'}00`;

  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//MentorConnect//Mentorship Meeting//EN',
    'BEGIN:VEVENT',
    `UID:${meeting.id || meeting._id}@mentorconnect.edu`,
    `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:Mentorship Session with ${otherParticipant?.name || 'Mentor'}`,
    `DESCRIPTION:Mentorship session on MentorConnect. Mode: ${meeting.mode || 'Video call'}.`,
    meeting.link ? `URL:${meeting.link}` : '',
    'STATUS:CONFIRMED',
    'END:VEVENT',
    'END:VCALENDAR',
  ]
    .filter(Boolean)
    .join('\r\n');

  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `mentorship-meeting-${meeting.date || 'session'}.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export default function Meetings({ role }) {
  const nav = useNavigate();
  const toast = useToast();
  const session = getSession();
  const currentRole = role || session?.role || 'student';
  const myId = session?.id || session?._id;

  const [tab, setTab] = useState('upcoming'); // 'upcoming' | 'past' | 'all'
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [logModalMeeting, setLogModalMeeting] = useState(null);
  const [logNotes, setLogNotes] = useState('');
  const [logOutcome, setLogOutcome] = useState('');
  const [logNextSteps, setLogNextSteps] = useState('');
  const [isSavingLog, setIsSavingLog] = useState(false);

  // Booking Form State
  const [bookMentorId, setBookMentorId] = useState('');
  const [bookDate, setBookDate] = useState('');
  const [bookSlot, setBookSlot] = useState('');
  const [bookMode, setBookMode] = useState('Video call');
  const [bookLink, setBookLink] = useState('');
  const [isSubmittingBooking, setIsSubmittingBooking] = useState(false);

  const { data: meetings = [], loading, refetch: refetchMeetings } = useMeetings();
  const { data: users = [] } = useUsers();
  const { data: requests = [] } = useMentorshipRequests();

  // Find accepted mentorship pairings
  const acceptedPairs = useMemo(() => {
    return (requests || []).filter((r) => {
      const sId = r.studentId?._id || r.studentId?.id || r.studentId;
      const mId = r.mentorId?._id || r.mentorId?.id || r.mentorId;
      const matchesMe =
        currentRole === 'student' ? String(sId) === String(myId) : String(mId) === String(myId);
      return matchesMe && r.status === 'accepted';
    });
  }, [requests, currentRole, myId]);

  // Pair partner user objects
  const availablePartners = useMemo(() => {
    return (acceptedPairs || [])
      .map((r) => {
        const partnerId =
          currentRole === 'student'
            ? r.mentorId?._id || r.mentorId?.id || r.mentorId
            : r.studentId?._id || r.studentId?.id || r.studentId;
        return (
          (users || []).find((u) => (u.id || u._id) === partnerId) ||
          (currentRole === 'student' ? r.mentorId : r.studentId)
        );
      })
      .filter(Boolean);
  }, [acceptedPairs, currentRole, users]);

  // Selected mentor for booking
  const selectedMentor = useMemo(() => {
    if (!bookMentorId) return availablePartners[0] || null;
    return (availablePartners || []).find((p) => (p.id || p._id) === bookMentorId) || null;
  }, [bookMentorId, availablePartners]);

  // Availability slots for selected mentor
  const mentorSlots = useMemo(() => {
    return selectedMentor?.availability || [];
  }, [selectedMentor]);

  // Filter meetings by participant and timeframe
  const userMeetings = useMemo(() => {
    return (meetings || []).filter((m) => {
      const sId = m.studentId?._id || m.studentId?.id || m.studentId;
      const mId = m.mentorId?._id || m.mentorId?.id || m.mentorId;
      return String(sId) === String(myId) || String(mId) === String(myId);
    });
  }, [meetings, myId]);

  const todayStr = new Date().toISOString().split('T')[0];

  const displayedMeetings = useMemo(() => {
    return (userMeetings || [])
      .filter((m) => {
        if (tab === 'upcoming') {
          return m.status === 'scheduled' && m.date >= todayStr;
        }
        if (tab === 'past') {
          return m.status === 'completed' || m.date < todayStr;
        }
        return true;
      })
      .sort((a, b) =>
        tab === 'past' ? b.date.localeCompare(a.date) : a.date.localeCompare(b.date)
      );
  }, [userMeetings, tab, todayStr]);

  // Handle meeting booking with availability and conflict enforcement
  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    if (isSubmittingBooking) return;

    const mentorIdToBook = selectedMentor?.id || selectedMentor?._id;
    if (!mentorIdToBook) {
      return toast.error('Please select an accepted mentor.');
    }
    if (!bookDate) {
      return toast.error('Please select a booking date.');
    }
    if (!bookSlot) {
      return toast.error("Please select a valid time slot from the mentor's availability.");
    }

    setIsSubmittingBooking(true);
    try {
      await apiPost('/meetings', {
        mentorId: mentorIdToBook,
        date: bookDate,
        time: bookSlot,
        mode: bookMode,
        link: bookLink.trim(),
      });

      toast.success('Mentorship meeting scheduled successfully.');
      setIsBookingOpen(false);
      setBookDate('');
      setBookSlot('');
      setBookLink('');
      await refetchMeetings();
    } catch (err) {
      toast.error(err?.message || 'Failed to schedule meeting.');
    } finally {
      setIsSubmittingBooking(false);
    }
  };

  // Open Log Modal
  const openLogModal = (meeting) => {
    setLogModalMeeting(meeting);
    setLogNotes(meeting.notes || '');
    setLogOutcome(meeting.outcome || '');
    setLogNextSteps(meeting.nextSteps || '');
  };

  const handleSaveLog = async (e) => {
    e.preventDefault();
    if (!logModalMeeting || isSavingLog) return;
    setIsSavingLog(true);

    try {
      const mId = logModalMeeting.id || logModalMeeting._id;
      await apiPatch(`/meetings/${mId}`, {
        notes: logNotes.trim(),
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

  const tabs = [
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
          eyebrow="Mentorship Workspace"
          title="Mentorship Meetings"
          text="Scheduled 1:1 sessions, availability slot picker, and post-session meeting logs."
        />

        {currentRole === 'student' && (
          <button
            type="button"
            className="uiverse-btn"
            onClick={() => setIsBookingOpen(true)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            <Plus size={15} /> Book Mentorship Meeting
          </button>
        )}
      </div>

      <div style={{ marginBottom: 16 }}>
        <TabBar tabs={tabs} activeTab={tab} onChange={setTab} />
      </div>

      {loading ? (
        <div className="skeleton-container" role="status" aria-live="polite">
          <div className="skeleton-bar" style={{ height: 80, marginBottom: 12 }} />
          <div className="skeleton-bar" style={{ height: 80, marginBottom: 12 }} />
        </div>
      ) : displayedMeetings.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title={`No ${tab} meetings`}
          text={
            currentRole === 'student'
              ? 'Schedule a session with your paired mentor from their published availability slots.'
              : 'Meetings booked by your accepted mentees will appear here.'
          }
          actionLabel={currentRole === 'student' ? 'Book a Session' : undefined}
          onAction={currentRole === 'student' ? () => setIsBookingOpen(true) : undefined}
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {displayedMeetings.map((m) => {
            const mId = m.id || m._id;
            const otherParticipant =
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
                    <b style={{ fontSize: '1.05rem' }}>
                      {m.date} · {m.time}
                    </b>
                    <p
                      style={{
                        margin: '4px 0 0 0',
                        fontSize: '0.86rem',
                        color: 'var(--foreground-muted)',
                      }}
                    >
                      With: <b>{otherParticipant?.name || 'Participant'}</b> (
                      {otherParticipant?.role || 'Partner'})
                    </p>
                    <span style={{ fontSize: '0.8rem', color: 'var(--foreground-muted)' }}>
                      Mode: {m.mode || 'Video call'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    <StatusChip status={m.status} />

                    {/* Real link or honest fallback text */}
                    {m.status !== 'cancelled' &&
                      (hasLink ? (
                        <a
                          href={m.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn mini join-btn"
                          title="Open Video Call Link"
                          style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
                        >
                          <Video size={13} /> Join Call
                        </a>
                      ) : (
                        <span
                          style={{
                            fontSize: '0.8rem',
                            color: 'var(--foreground-muted)',
                            fontStyle: 'italic',
                          }}
                        >
                          Link will be shared by mentor
                        </span>
                      ))}

                    {/* Export to .ics calendar file */}
                    <button
                      type="button"
                      className="btn mini secondary"
                      onClick={() => exportMeetingToIcs(m, otherParticipant)}
                      title="Export meeting to .ics calendar format"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
                    >
                      <Download size={13} /> .ics
                    </button>

                    {/* Meeting Log / Notes button */}
                    <button
                      type="button"
                      className="btn mini secondary"
                      onClick={() => openLogModal(m)}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
                    >
                      <FileText size={13} /> {m.notes ? 'View Notes' : 'Add Notes'}
                    </button>
                  </div>
                </div>

                {/* Display recorded notes/outcomes if present */}
                {(m.notes || m.outcome || m.nextSteps) && (
                  <div
                    style={{
                      marginTop: 14,
                      padding: 12,
                      borderRadius: 6,
                      background: 'var(--surface-sunken, #f8fafc)',
                      fontSize: '0.85rem',
                      lineHeight: 1.5,
                      border: '1px solid var(--border)',
                    }}
                  >
                    {m.notes && (
                      <p style={{ margin: '0 0 6px 0' }}>
                        <b>Discussion Notes:</b> {m.notes}
                      </p>
                    )}
                    {m.outcome && (
                      <p style={{ margin: '0 0 6px 0' }}>
                        <b>Outcomes:</b> {m.outcome}
                      </p>
                    )}
                    {m.nextSteps && (
                      <p style={{ margin: 0 }}>
                        <b>Next Steps:</b> {m.nextSteps}
                      </p>
                    )}
                  </div>
                )}
              </section>
            );
          })}
        </div>
      )}

      {/* Booking Modal */}
      {isBookingOpen && (
        <ModalShell
          title="Schedule a Mentorship Meeting"
          isOpen={isBookingOpen}
          onClose={() => setIsBookingOpen(false)}
        >
          {availablePartners.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <p style={{ color: 'var(--foreground-muted)', marginBottom: 16 }}>
                You do not have any accepted mentorship pairings yet. Please request mentorship and
                wait for mentor acceptance before booking.
              </p>
              <button
                type="button"
                className="btn primary"
                onClick={() => {
                  setIsBookingOpen(false);
                  nav('/mentors');
                }}
              >
                Find a Mentor
              </button>
            </div>
          ) : (
            <form
              onSubmit={handleBookingSubmit}
              style={{ display: 'flex', flexDirection: 'column', gap: 14 }}
            >
              <label>
                <span style={{ fontWeight: 600, display: 'block', marginBottom: 4 }}>
                  Select Mentor
                </span>
                <select
                  value={
                    bookMentorId || availablePartners[0]?.id || availablePartners[0]?._id || ''
                  }
                  onChange={(e) => setBookMentorId(e.target.value)}
                  required
                >
                  {availablePartners.map((p) => (
                    <option key={p.id || p._id} value={p.id || p._id}>
                      {p.name} ({p.jobTitle || 'Mentor'})
                    </option>
                  ))}
                </select>
              </label>

              {/* Published availability schedule */}
              <div
                style={{
                  padding: 12,
                  borderRadius: 6,
                  background: 'var(--surface-sunken, #f8fafc)',
                  border: '1px solid var(--border)',
                }}
              >
                <b style={{ fontSize: '0.85rem', display: 'block', marginBottom: 6 }}>
                  Mentor's Published Availability Schedule:
                </b>
                {mentorSlots.length === 0 ? (
                  <span style={{ fontSize: '0.82rem', color: 'var(--warning-text)' }}>
                    This mentor has not configured recurring slots. Please reach out to them.
                  </span>
                ) : (
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {mentorSlots.map((s) => (
                      <span key={s} className="category-pill-tech" style={{ fontSize: '0.78rem' }}>
                        {s}
                      </span>
                    ))}
                  </div>
                )}
              </div>

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

                <label>
                  <span style={{ fontWeight: 600, display: 'block', marginBottom: 4 }}>
                    Time Slot
                  </span>
                  <select value={bookSlot} onChange={(e) => setBookSlot(e.target.value)} required>
                    <option value="">Select Time Interval</option>
                    <option value="09:00-12:00">09:00 - 12:00 Morning</option>
                    <option value="13:00-16:00">13:00 - 16:00 Afternoon</option>
                    <option value="17:00-20:00">17:00 - 20:00 Evening</option>
                  </select>
                </label>
              </div>

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
                    Meeting Link (Optional)
                  </span>
                  <input
                    type="url"
                    placeholder="https://meet.google.com/... (optional)"
                    value={bookLink}
                    onChange={(e) => setBookLink(e.target.value)}
                  />
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
                <button
                  type="button"
                  className="btn secondary"
                  onClick={() => setIsBookingOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="uiverse-btn" disabled={isSubmittingBooking}>
                  {isSubmittingBooking ? 'Booking...' : 'Confirm Meeting'}
                </button>
              </div>
            </form>
          )}
        </ModalShell>
      )}

      {/* Meeting Log / Notes Modal */}
      {logModalMeeting && (
        <ModalShell
          title={`Meeting Log · ${logModalMeeting.date}`}
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
                Session Outcomes
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
                Next Steps & Action Items
              </span>
              <textarea
                rows={2}
                value={logNextSteps}
                onChange={(e) => setLogNextSteps(e.target.value)}
                placeholder="Tasks to complete before next meeting, study links, code reviews..."
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
                {isSavingLog ? 'Saving...' : 'Save Log Record'}
              </button>
            </div>
          </form>
        </ModalShell>
      )}
    </AppShell>
  );
}
