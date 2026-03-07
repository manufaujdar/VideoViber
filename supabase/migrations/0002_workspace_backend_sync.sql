-- ═══════════════════════════════════════════════════════════
-- VideoViber Workspace Sync Extensions
-- Migration: 0002_workspace_backend_sync
-- ═══════════════════════════════════════════════════════════

-- Persist project-level UI metadata used by the workspace.
alter table projects
  add column if not exists provider text not null default 'gemini',
  add column if not exists starred boolean not null default false,
  add column if not exists archived_at timestamptz;

create index if not exists idx_projects_archived_at on projects(archived_at);
create index if not exists idx_projects_starred on projects(starred);

-- Persist shot-level presentation and import metadata used by planner/timeline/workspace.
alter table shots
  add column if not exists title text not null default 'Untitled Shot',
  add column if not exists thumbnail_url text,
  add column if not exists video_url text,
  add column if not exists source_type text,
  add column if not exists asset_id uuid references assets(id) on delete set null,
  add column if not exists source_mime_type text,
  add column if not exists source_size_bytes bigint,
  add column if not exists imported_at timestamptz;

alter table shots
  drop constraint if exists shots_source_type_check;

alter table shots
  add constraint shots_source_type_check
  check (source_type is null or source_type in ('ai', 'import'));

-- Keep generation progress in first-class column for efficient list rendering.
alter table generations
  add column if not exists progress integer not null default 0;

alter table generations
  drop constraint if exists generations_progress_check;

alter table generations
  add constraint generations_progress_check
  check (progress >= 0 and progress <= 100);

-- Preserve resolved URL alongside storage path so clients can render assets immediately.
alter table assets
  add column if not exists public_url text;

-- User-level workspace preferences.
create table if not exists user_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '',
  default_provider text not null default 'gemini',
  default_resolution text not null default '1080p',
  auto_save boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table user_settings enable row level security;

create policy "Users can view own settings"
  on user_settings for select
  using (auth.uid() = user_id);

create policy "Users can create own settings"
  on user_settings for insert
  with check (auth.uid() = user_id);

create policy "Users can update own settings"
  on user_settings for update
  using (auth.uid() = user_id);

create policy "Users can delete own settings"
  on user_settings for delete
  using (auth.uid() = user_id);

drop trigger if exists trg_user_settings_updated_at on user_settings;

create trigger trg_user_settings_updated_at
  before update on user_settings
  for each row execute function update_updated_at();
