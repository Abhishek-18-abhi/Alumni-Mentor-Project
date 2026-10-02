import React, { useState } from 'react';
import { Plus, Shield, Trash2, RefreshCw } from 'lucide-react';
import { MIN_PASSWORD_LENGTH } from '../lib/constants';
import { useToast } from '../components/Toast';
import ConfirmModal from '../components/ConfirmModal';
import ModalShell from '../components/ModalShell';
import AppShell from '../components/AppShell';
import PageTitle from '../components/PageTitle';
import { createAdmin } from '../lib/auth';
import { apiDelete } from '../lib/api';
import { getSession } from '../lib/storage';
import { useUsers } from '../hooks/useApi';

export default function AdminAdministrators() {
  const s = getSession();
  const { data: usersList, loading, refetch } = useUsers();
  const [show, setShow] = useState(false);
  const [f, setF] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [pendingRemoval, setPendingRemoval] = useState(null);
  const [isAdding, setIsAdding] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const toast = useToast();

  const users = usersList || [];
  const admins = users.filter((u) => u.role === 'admin');

  const add = async (e) => {
    e.preventDefault();
    if (isAdding) return;
    setIsAdding(true);
    try {
      const r = await createAdmin(f);
      if (!r.ok) return setError(r.error);
      await refetch();
      setF({ name: '', email: '', password: '' });
      setError('');
      setShow(false);
      toast.success('Administrator created.');
    } finally {
      setIsAdding(false);
    }
  };

  const remove = (id) => {
    if (admins.length <= 1) return toast.error('At least one administrator must remain.');
    const currentSessionId = s?.id || s?._id;
    if (id === currentSessionId)
      return toast.error('You cannot remove your own active administrator account.');
    setPendingRemoval(id);
  };

  const confirmRemove = async () => {
    const id = pendingRemoval;
    if (isRemoving || !id) return;
    if (admins.length <= 1) {
      setPendingRemoval(null);
      return toast.error('At least one administrator must remain.');
    }
    setIsRemoving(true);
    try {
      await apiDelete(`/users/${id}`);
      await refetch();
      setPendingRemoval(null);
      toast.success('Administrator removed.');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsRemoving(false);
    }
  };
  return (
    <AppShell role="admin">
      <PageTitle
        eyebrow="Administration"
        title="Administrators"
        text="Only existing administrators can add or remove administrator accounts."
        action={
          <button className="uiverse-btn" onClick={() => setShow(true)}>
            <Plus size={17} /> Add administrator
          </button>
        }
      />
      <section className="card">
        <div className="data-table">
          <div className="table-row table-head">
            <span>Administrator</span>
            <span>Email</span>
            <span>Created</span>
            <span>Role</span>
            <span>Action</span>
          </div>
          {admins.map((a) => {
            const adminId = a.id || a._id;
            const currentSessionId = s?.id || s?._id;
            const isSelf = adminId === currentSessionId;
            return (
              <div className="table-row" key={adminId}>
                <span className="person-cell">
                  <span className="mini-avatar">
                    <Shield size={15} />
                  </span>
                  <b>{a.name}</b>
                </span>
                <span>{a.email}</span>
                <span>{new Date(a.createdAt).toLocaleDateString()}</span>
                <span>
                  <span className="status-chip">Administrator</span>
                </span>
                <span>
                  <button
                    className="icon-btn danger"
                    disabled={admins.length <= 1 || isSelf}
                    title={isSelf ? 'Cannot remove current active administrator' : undefined}
                    onClick={() => remove(adminId)}
                  >
                    <Trash2 size={16} />
                  </button>
                </span>
              </div>
            );
          })}
        </div>
      </section>
      {show && (
        <ModalShell eyebrow="New admin" title="Add administrator" onClose={() => setShow(false)}>
          <form className="form-stack" onSubmit={add}>
            <label>
              Full name
              <input
                required
                value={f.name}
                onChange={(e) => setF({ ...f, name: e.target.value })}
              />
            </label>
            <label>
              Email
              <input
                required
                type="email"
                value={f.email}
                onChange={(e) => setF({ ...f, email: e.target.value })}
              />
            </label>
            <label>
              Temporary password
              <input
                required
                type="password"
                minLength={MIN_PASSWORD_LENGTH}
                placeholder={`At least ${MIN_PASSWORD_LENGTH} characters`}
                value={f.password}
                onChange={(e) => setF({ ...f, password: e.target.value })}
              />
            </label>
            {error && <div className="error-box">{error}</div>}
            <button className="uiverse-btn full" type="submit" disabled={isAdding}>
              {isAdding ? 'Creating administrator...' : 'Create administrator'}
            </button>
          </form>
        </ModalShell>
      )}
      {pendingRemoval && (
        <ConfirmModal
          title="Remove administrator?"
          message="This administrator will lose access immediately. This cannot be undone."
          confirmLabel="Remove"
          onConfirm={confirmRemove}
          onCancel={() => setPendingRemoval(null)}
        />
      )}
    </AppShell>
  );
}
