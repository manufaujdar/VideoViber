'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  inviteTeamMember,
  listTeamMembers,
  removeTeamMember,
  type TeamMember,
  type TeamRole,
} from '@/features/account/team';
import { toast } from 'sonner';

const roleOptions: Array<{ value: Exclude<TeamRole, 'owner'>; label: string }> = [
  { value: 'editor', label: 'Editor' },
  { value: 'viewer', label: 'Viewer' },
  { value: 'admin', label: 'Admin' },
];

function roleLabel(role: TeamRole) {
  if (role === 'owner') return 'Owner';
  return role.charAt(0).toUpperCase() + role.slice(1);
}

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function TeamSettingsPage() {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<Exclude<TeamRole, 'owner'>>('editor');
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadMembers = useCallback(async () => {
    setLoading(true);
    const result = await listTeamMembers();

    if (!result.ok) {
      setLoadError(result.error);
      setMembers([]);
      setLoading(false);
      return;
    }

    setLoadError(null);
    setMembers(result.data);
    setLoading(false);
  }, []);

  useEffect(() => {
    void loadMembers();
  }, [loadMembers]);

  const activeMembers = useMemo(
    () => members.filter((member) => member.status === 'active'),
    [members]
  );

  const pendingMembers = useMemo(
    () => members.filter((member) => member.status === 'pending'),
    [members]
  );

  const handleInvite = async (event: React.FormEvent) => {
    event.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();

    if (!emailPattern.test(normalizedEmail)) {
      toast.error('Enter a valid collaborator email.');
      return;
    }

    setSubmitting(true);
    const result = await inviteTeamMember({
      email: normalizedEmail,
      role,
    });
    setSubmitting(false);

    if (!result.ok) {
      toast.error(result.error);
      return;
    }

    toast.success(`Invite saved for ${normalizedEmail}`);
    setEmail('');
    await loadMembers();
  };

  const handleRemove = async (member: TeamMember) => {
    if (member.isOwner) {
      return;
    }

    setRemovingId(member.id);
    const result = await removeTeamMember(member.id);
    setRemovingId(null);

    if (!result.ok) {
      toast.error(result.error);
      return;
    }

    toast.success(`Removed ${member.email}`);
    await loadMembers();
  };

  return (
    <div className="mx-auto max-w-2xl space-y-8 animate-fade-in-up">
      <div>
        <div className="vv-badge bg-accent/10 text-accent mb-3 font-mono tracking-widest">Workspace</div>
        <h1 className="text-3xl font-bold tracking-tight">Team & Access</h1>
        <p className="text-vv-secondary mt-2 text-sm leading-relaxed">
          Manage collaborator invitations and active workspace access from backend data.
        </p>
      </div>

      <div className="vv-card glass-strong border-white/5">
        <div className="p-6 border-b border-white/5">
          <h2 className="text-lg font-bold">Invite Collaborator</h2>
          <form onSubmit={handleInvite} className="mt-4 flex flex-col sm:flex-row gap-3">
            <input
              type="email"
              placeholder="colleague@studio.com"
              className="vv-input flex-1"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <select
              className="vv-input w-full sm:w-32"
              value={role}
              onChange={(e) => setRole(e.target.value as Exclude<TeamRole, 'owner'>)}
            >
              {roleOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <button
              type="submit"
              disabled={submitting}
              className="vv-btn-primary whitespace-nowrap px-6 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? 'Saving...' : 'Send Invite'}
            </button>
          </form>
        </div>

        <div className="p-6 space-y-6">
          {loading ? (
            <div className="text-vv-secondary text-sm">Loading collaborators...</div>
          ) : loadError ? (
            <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-4">
              <p className="text-sm text-red-200">{loadError}</p>
              <button onClick={() => void loadMembers()} className="vv-btn-secondary mt-3 px-3 py-1.5 text-xs">
                Retry
              </button>
            </div>
          ) : (
            <>
              <section>
                <h2 className="text-lg font-bold mb-4">Active Roster</h2>
                {activeMembers.length === 0 ? (
                  <p className="text-vv-secondary text-sm">No active collaborators yet.</p>
                ) : (
                  <ul className="space-y-3">
                    {activeMembers.map((member) => (
                      <li
                        key={member.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl bg-white/5 ring-1 ring-white/10 hover:bg-white/10 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-cyan-500/20 text-cyan-300 flex items-center justify-center font-bold text-lg uppercase">
                            {member.name.charAt(0)}
                          </div>
                          <div>
                            <h3 className="font-semibold text-white">{member.name}</h3>
                            <p className="text-xs text-vv-secondary">{member.email || 'Owner account'}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="vv-badge bg-white/10 text-vv-secondary font-mono text-[10px] uppercase">
                            {roleLabel(member.role)}
                          </span>
                          {!member.isOwner && (
                            <button
                              onClick={() => void handleRemove(member)}
                              disabled={removingId === member.id}
                              className="text-vv-muted hover:text-red-400 transition-colors p-1 disabled:cursor-not-allowed disabled:opacity-50"
                              title="Remove Access"
                            >
                              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <section>
                <h2 className="text-lg font-bold mb-4">Pending Invites</h2>
                {pendingMembers.length === 0 ? (
                  <p className="text-vv-secondary text-sm">No pending invitations.</p>
                ) : (
                  <ul className="space-y-3">
                    {pendingMembers.map((member) => (
                      <li
                        key={member.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl bg-amber-500/5 ring-1 ring-amber-400/20"
                      >
                        <div>
                          <p className="font-semibold text-white">{member.email}</p>
                          <p className="text-xs text-vv-secondary">
                            {roleLabel(member.role)} invite · {new Date(member.invitedAt).toLocaleString()}
                          </p>
                        </div>
                        <button
                          onClick={() => void handleRemove(member)}
                          disabled={removingId === member.id}
                          className="vv-btn-secondary text-xs px-3 py-1.5 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Revoke
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
