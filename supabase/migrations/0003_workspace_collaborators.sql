-- ═══════════════════════════════════════════════════════════
-- Workspace Collaborators
-- Migration: 0003_workspace_collaborators
-- ═══════════════════════════════════════════════════════════

create table if not exists workspace_collaborators (
  id uuid primary key default uuid_generate_v4(),
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  email text not null,
  role text not null default 'viewer',
  status text not null default 'pending',
  display_name text not null default '',
  invited_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(owner_user_id, email)
);

alter table workspace_collaborators
  drop constraint if exists workspace_collaborators_role_check;

alter table workspace_collaborators
  add constraint workspace_collaborators_role_check
  check (role in ('admin', 'editor', 'viewer'));

alter table workspace_collaborators
  drop constraint if exists workspace_collaborators_status_check;

alter table workspace_collaborators
  add constraint workspace_collaborators_status_check
  check (status in ('pending', 'active'));

create index if not exists idx_workspace_collaborators_owner
  on workspace_collaborators(owner_user_id);

create index if not exists idx_workspace_collaborators_owner_status
  on workspace_collaborators(owner_user_id, status);

alter table workspace_collaborators enable row level security;

create policy "Users can view own collaborators"
  on workspace_collaborators for select
  using (auth.uid() = owner_user_id);

create policy "Users can create own collaborators"
  on workspace_collaborators for insert
  with check (auth.uid() = owner_user_id);

create policy "Users can update own collaborators"
  on workspace_collaborators for update
  using (auth.uid() = owner_user_id);

create policy "Users can delete own collaborators"
  on workspace_collaborators for delete
  using (auth.uid() = owner_user_id);

drop trigger if exists trg_workspace_collaborators_updated_at on workspace_collaborators;

create trigger trg_workspace_collaborators_updated_at
  before update on workspace_collaborators
  for each row execute function update_updated_at();
