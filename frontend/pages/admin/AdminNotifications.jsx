import React, { useState } from 'react';
import AppShell from '../../components/AppShell';
import PageTitle from '../../components/PageTitle';
import { useUsers } from '../../hooks/useApi';
import { apiPost } from '../../lib/api';
import { useToast } from '../../components/Toast';
import { Bell, Send, Users, AlertCircle } from 'lucide-react';

export default function AdminNotifications() {
  const toast = useToast();
  const { data: users = [] } = useUsers();

  const [target, setTarget] = useState('all');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const eligibleRecipients = (users || []).filter(
    (u) => u.role === 'student' || u.role === 'mentor'
  );

  const handleSend = async (e) => {
    e.preventDefault();
    if (!title.trim() || !message.trim() || sending) return;

    let recipients = [];
    if (target === 'all') {
      recipients = eligibleRecipients;
    } else if (target === 'students') {
      recipients = eligibleRecipients.filter((u) => u.role === 'student');
    } else if (target === 'mentors') {
      recipients = eligibleRecipients.filter((u) => u.role === 'mentor');
    } else {
      recipients = eligibleRecipients.filter((u) => (u.id || u._id) === target);
    }

    if (recipients.length === 0) {
      return toast.error('No matching recipients found.');
    }

    setSending(true);
    try {
      const recipientIds = recipients.map((r) => r.id || r._id).filter(Boolean);

      try {
        await apiPost('/notifications/broadcast', {
          userIds: recipientIds,
          title: title.trim(),
          message: message.trim(),
          type: 'info',
        });
      } catch (broadcastErr) {
        // Fallback to individual posts if bulk endpoint has an issue
        await Promise.all(
          recipientIds.map((uId) =>
            apiPost('/notifications', {
              userId: uId,
              title: title.trim(),
              message: message.trim(),
              type: 'info',
            })
          )
        );
      }

      toast.success(`Broadcast notification sent to ${recipients.length} users.`);
      setTitle('');
      setMessage('');
    } catch (err) {
      toast.error(err?.message || 'Failed to send broadcast notifications.');
    } finally {
      setSending(false);
    }
  };

  return (
    <AppShell role="admin">
      <PageTitle
        eyebrow="Administrator Platform Portal"
        title="Broadcast System Notifications"
        text="Send institutional announcements, event updates, and alerts directly to user workspaces."
      />

      <section className="card form-card" style={{ maxWidth: 640 }}>
        <form onSubmit={handleSend} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <label>
            <span style={{ fontWeight: 600, display: 'block', marginBottom: 4 }}>
              Recipient Group
            </span>
            <select value={target} onChange={(e) => setTarget(e.target.value)}>
              <option value="all">
                All Users (Students & Mentors) — {eligibleRecipients.length} users
              </option>
              <option value="students">
                All Students Only — {eligibleRecipients.filter((u) => u.role === 'student').length}{' '}
                students
              </option>
              <option value="mentors">
                All Mentors Only — {eligibleRecipients.filter((u) => u.role === 'mentor').length}{' '}
                mentors
              </option>
              <optgroup label="Specific User">
                {eligibleRecipients.map((u) => (
                  <option key={u.id || u._id} value={u.id || u._id}>
                    {u.name} ({u.email})
                  </option>
                ))}
              </optgroup>
            </select>
          </label>

          <label>
            <span style={{ fontWeight: 600, display: 'block', marginBottom: 4 }}>
              Notification Subject
            </span>
            <input
              type="text"
              placeholder="e.g. Upcoming Alumni Guest Lecture & Q&A"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </label>

          <label>
            <span style={{ fontWeight: 600, display: 'block', marginBottom: 4 }}>
              Message Content
            </span>
            <textarea
              rows={4}
              placeholder="Enter announcement details, instructions, or meeting links..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
            />
          </label>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
            <button
              type="submit"
              className="uiverse-btn"
              disabled={sending || !title.trim() || !message.trim()}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              <Send size={15} /> {sending ? 'Broadcasting...' : 'Broadcast Notification'}
            </button>
          </div>
        </form>
      </section>
    </AppShell>
  );
}
