import { getSupabaseBrowserClient } from '@/lib/supabase-browser';
import type { TeamActionResult, TeamMember, TeamRole } from './types';

type CollaboratorRow = {
  id: string;
  email: string;
  role: string;
  status: string;
  display_name: string | null;
  invited_at: string | null;
};

function sanitizeRole(value: string | null | undefined): Exclude<TeamRole, 'owner'> {
  switch (value) {
    case 'admin':
      return 'admin';
    case 'editor':
      return 'editor';
    case 'viewer':
      return 'viewer';
    default:
      return 'viewer';
  }
}

function sanitizeStatus(value: string | null | undefined) {
  return value === 'active' ? 'active' : 'pending';
}

function fallbackNameFromEmail(email: string) {
  const local = email.split('@')[0] ?? '';
  const formatted = local.replace(/[._-]+/g, ' ').trim();
  return formatted.length > 0
    ? formatted.replace(/\b\w/g, (char) => char.toUpperCase())
    : 'Collaborator';
}

function toTeamMember(row: CollaboratorRow): TeamMember {
  const email = row.email.toLowerCase();
  const displayName = row.display_name?.trim();

  return {
    id: row.id,
    email,
    name: displayName && displayName.length > 0 ? displayName : fallbackNameFromEmail(email),
    role: sanitizeRole(row.role),
    status: sanitizeStatus(row.status),
    invitedAt: row.invited_at || new Date().toISOString(),
    isOwner: false,
  };
}

function compareMembers(a: TeamMember, b: TeamMember) {
  if (a.isOwner !== b.isOwner) {
    return a.isOwner ? -1 : 1;
  }

  if (a.status !== b.status) {
    return a.status === 'active' ? -1 : 1;
  }

  return a.name.localeCompare(b.name);
}

async function getAuthenticatedContext() {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) {
    return {
      ok: false as const,
      error:
        'Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.',
    };
  }

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    return { ok: false as const, error: error.message };
  }

  if (!user) {
    return { ok: false as const, error: 'Sign in to manage your workspace team.' };
  }

  return {
    ok: true as const,
    data: {
      supabase,
      user,
    },
  };
}

function toOwnerMember(user: { id: string; email?: string | null; created_at?: string; user_metadata?: Record<string, unknown> | null }) {
  const email = user.email?.toLowerCase() || '';
  const metadataName =
    typeof user.user_metadata?.full_name === 'string' ? user.user_metadata.full_name.trim() : '';

  const name = metadataName.length > 0 ? metadataName : email ? fallbackNameFromEmail(email) : 'Workspace Owner';

  return {
    id: `owner:${user.id}`,
    name,
    email,
    role: 'owner' as const,
    status: 'active' as const,
    invitedAt: user.created_at || new Date().toISOString(),
    isOwner: true,
  };
}

export async function listTeamMembers(): Promise<TeamActionResult<TeamMember[]>> {
  const context = await getAuthenticatedContext();
  if (!context.ok) {
    return context;
  }

  const { supabase, user } = context.data;
  const { data, error } = await supabase
    .from('workspace_collaborators')
    .select('id,email,role,status,display_name,invited_at')
    .eq('owner_user_id', user.id)
    .order('invited_at', { ascending: true });

  if (error) {
    return { ok: false, error: error.message };
  }

  const owner = toOwnerMember(user);
  const rows = Array.isArray(data) ? (data as CollaboratorRow[]) : [];
  const collaborators = rows
    .map(toTeamMember)
    .filter((member) => !owner.email || member.email !== owner.email);

  return {
    ok: true,
    data: [owner, ...collaborators].sort(compareMembers),
  };
}

export async function inviteTeamMember(params: {
  email: string;
  role: Exclude<TeamRole, 'owner'>;
}): Promise<TeamActionResult<TeamMember>> {
  const normalizedEmail = params.email.trim().toLowerCase();
  if (!normalizedEmail) {
    return { ok: false, error: 'Email is required.' };
  }

  const context = await getAuthenticatedContext();
  if (!context.ok) {
    return context;
  }

  const { supabase, user } = context.data;

  if (user.email && normalizedEmail === user.email.toLowerCase()) {
    return { ok: false, error: 'You already have owner access to this workspace.' };
  }

  const { data, error } = await supabase
    .from('workspace_collaborators')
    .upsert(
      {
        owner_user_id: user.id,
        email: normalizedEmail,
        role: sanitizeRole(params.role),
        status: 'pending',
        display_name: '',
        invited_at: new Date().toISOString(),
      },
      { onConflict: 'owner_user_id,email' }
    )
    .select('id,email,role,status,display_name,invited_at')
    .single();

  if (error) {
    return { ok: false, error: error.message };
  }

  return {
    ok: true,
    data: toTeamMember(data as CollaboratorRow),
  };
}

export async function removeTeamMember(memberId: string): Promise<TeamActionResult> {
  const context = await getAuthenticatedContext();
  if (!context.ok) {
    return context;
  }

  const { supabase, user } = context.data;

  const { error } = await supabase
    .from('workspace_collaborators')
    .delete()
    .eq('id', memberId)
    .eq('owner_user_id', user.id);

  if (error) {
    return { ok: false, error: error.message };
  }

  return { ok: true, data: undefined };
}
