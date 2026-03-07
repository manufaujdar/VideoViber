export type TeamRole = 'owner' | 'admin' | 'editor' | 'viewer';
export type TeamMemberStatus = 'active' | 'pending';

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: TeamRole;
  status: TeamMemberStatus;
  invitedAt: string;
  isOwner: boolean;
}

export type TeamActionResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: string };
