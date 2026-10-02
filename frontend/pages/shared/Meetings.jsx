import React from 'react';
import SessionsAndCalendar from './SessionsAndCalendar';

export default function Meetings({ role }) {
  return <SessionsAndCalendar role={role} defaultTab="meetings" />;
}
