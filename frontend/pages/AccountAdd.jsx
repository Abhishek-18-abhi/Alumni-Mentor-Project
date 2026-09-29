import React from 'react';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, BriefcaseBusiness } from 'lucide-react';
import AppShell from '../components/AppShell';
import PageTitle from '../components/PageTitle';
import { getSession } from '../lib/storage';
export default function AccountAdd() {
  const s = getSession();
  const nav = useNavigate();
  return (
    <AppShell role={s.role}>
      <PageTitle
        eyebrow="Account"
        title="Add another account"
        text="Create a separate account, then use Switch account from the top-right menu."
      />
      <div className="role-cards large">
        <button onClick={() => nav('/register?role=student')}>
          <GraduationCap size={26} />
          <b>Student account</b>
          <span>Create a new student account.</span>
        </button>
        <button onClick={() => nav('/register?role=mentor')}>
          <BriefcaseBusiness size={26} />
          <b>Alumni mentor account</b>
          <span>Create a new alumni mentor account.</span>
        </button>
      </div>
    </AppShell>
  );
}
