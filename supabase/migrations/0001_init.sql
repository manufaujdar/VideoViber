-- ═══════════════════════════════════════════════════════════
-- VideoViber v1 Schema
-- Migration: 0001_init
-- ═══════════════════════════════════════════════════════════

-- Enable required extensions
create extension if not exists "pgcrypto";
create extension if not exists "uuid-ossp";

-- ─── Custom Types ──────────────────────────────────────────

create type project_status as enum (
  'draft', 'planning', 'generating', 'editing', 'exporting', 'exported'
);

create type generation_status as enum (
  'draft', 'planned', 'queued', 'submitted', 'processing',
  'completed', 'failed', 'canceled', 'expired'
);

create type job_status as enum (
  'pending', 'running', 'completed', 'failed', 'canceled'
);

create type export_status as enum (
  'pending', 'rendering', 'completed', 'failed'
);

create type asset_type as enum (
  'image', 'video', 'audio', 'document'
);

create type generation_operation as enum (
  'text_to_video', 'image_to_video', 'extend', 'edit', 'upscale'
);

create type patch_type as enum (
  'trim', 'replace', 'extend', 'reorder', 'regenerate', 'restyle', 'upscale'
);


-- ═══════════════════════════════════════════════════════════
-- 1. Projects
-- ═══════════════════════════════════════════════════════════

create table projects (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  title       text not null default 'Untitled Project',
  vibe_brief  text not null default '',
  status      project_status not null default 'draft',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index idx_projects_user on projects(user_id);
create index idx_projects_status on projects(status);

alter table projects enable row level security;

create policy "Users can view own projects"
  on projects for select using (auth.uid() = user_id);

create policy "Users can create own projects"
  on projects for insert with check (auth.uid() = user_id);

create policy "Users can update own projects"
  on projects for update using (auth.uid() = user_id);

create policy "Users can delete own projects"
  on projects for delete using (auth.uid() = user_id);


-- ═══════════════════════════════════════════════════════════
-- 2. Project Bible
-- ═══════════════════════════════════════════════════════════

create table project_bibles (
  id                uuid primary key default uuid_generate_v4(),
  project_id        uuid not null unique references projects(id) on delete cascade,
  style             jsonb not null default '{}',
  subjects          jsonb not null default '{}',
  continuity_notes  text not null default '',
  world_rules       jsonb not null default '{}',
  brand_constraints jsonb not null default '{}',
  camera_language   jsonb not null default '{}',
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

alter table project_bibles enable row level security;

create policy "Users can manage own project bibles"
  on project_bibles for all
  using (
    exists (select 1 from projects where projects.id = project_bibles.project_id and projects.user_id = auth.uid())
  );


-- ═══════════════════════════════════════════════════════════
-- 3. Scenes
-- ═══════════════════════════════════════════════════════════

create table scenes (
  id          uuid primary key default uuid_generate_v4(),
  project_id  uuid not null references projects(id) on delete cascade,
  title       text not null default 'Untitled Scene',
  description text not null default '',
  order_index integer not null default 0,
  purpose     text not null default '',
  created_at  timestamptz not null default now()
);

create index idx_scenes_project on scenes(project_id, order_index);

alter table scenes enable row level security;

create policy "Users can manage own scenes"
  on scenes for all
  using (
    exists (select 1 from projects where projects.id = scenes.project_id and projects.user_id = auth.uid())
  );


-- ═══════════════════════════════════════════════════════════
-- 4. Shots
-- ═══════════════════════════════════════════════════════════

create table shots (
  id                  uuid primary key default uuid_generate_v4(),
  scene_id            uuid not null references scenes(id) on delete cascade,
  project_id          uuid not null references projects(id) on delete cascade,
  order_index         integer not null default 0,
  purpose             text not null default '',
  duration_target     real not null default 5.0,
  prompt              text not null default '',
  negative_prompt     text not null default '',
  reference_assets    uuid[] not null default '{}',
  camera_instruction  jsonb not null default '{}',
  motion_instruction  jsonb not null default '{}',
  continuity_tags     text[] not null default '{}',
  provider_choice     text,
  generation_params   jsonb not null default '{}',
  status              generation_status not null default 'draft',
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index idx_shots_scene on shots(scene_id, order_index);
create index idx_shots_project on shots(project_id);
create index idx_shots_status on shots(status);

alter table shots enable row level security;

create policy "Users can manage own shots"
  on shots for all
  using (
    exists (select 1 from projects where projects.id = shots.project_id and projects.user_id = auth.uid())
  );


-- ═══════════════════════════════════════════════════════════
-- 5. Assets
-- ═══════════════════════════════════════════════════════════

create table assets (
  id                uuid primary key default uuid_generate_v4(),
  user_id           uuid not null references auth.users(id) on delete cascade,
  project_id        uuid references projects(id) on delete set null,
  type              asset_type not null,
  storage_path      text not null,
  original_filename text not null default '',
  mime_type         text not null default '',
  size_bytes        bigint not null default 0,
  duration_ms       integer,
  width             integer,
  height            integer,
  metadata          jsonb not null default '{}',
  created_at        timestamptz not null default now()
);

create index idx_assets_user on assets(user_id);
create index idx_assets_project on assets(project_id);

alter table assets enable row level security;

create policy "Users can view own assets"
  on assets for select using (auth.uid() = user_id);

create policy "Users can create own assets"
  on assets for insert with check (auth.uid() = user_id);

create policy "Users can update own assets"
  on assets for update using (auth.uid() = user_id);

create policy "Users can delete own assets"
  on assets for delete using (auth.uid() = user_id);


-- ═══════════════════════════════════════════════════════════
-- 6. Timelines
-- ═══════════════════════════════════════════════════════════

create table timelines (
  id          uuid primary key default uuid_generate_v4(),
  project_id  uuid not null references projects(id) on delete cascade,
  version     integer not null default 1,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);

create index idx_timelines_project on timelines(project_id);

alter table timelines enable row level security;

create policy "Users can manage own timelines"
  on timelines for all
  using (
    exists (select 1 from projects where projects.id = timelines.project_id and projects.user_id = auth.uid())
  );


-- ═══════════════════════════════════════════════════════════
-- 7. Timeline Clips
-- ═══════════════════════════════════════════════════════════

create table timeline_clips (
  id            uuid primary key default uuid_generate_v4(),
  timeline_id   uuid not null references timelines(id) on delete cascade,
  asset_id      uuid not null references assets(id) on delete cascade,
  shot_id       uuid references shots(id) on delete set null,
  order_index   integer not null default 0,
  start_trim_ms integer not null default 0,
  end_trim_ms   integer not null default 0,
  duration_ms   integer not null default 0,
  created_at    timestamptz not null default now()
);

create index idx_timeline_clips_timeline on timeline_clips(timeline_id, order_index);

alter table timeline_clips enable row level security;

create policy "Users can manage own timeline clips"
  on timeline_clips for all
  using (
    exists (
      select 1 from timelines t
      join projects p on p.id = t.project_id
      where t.id = timeline_clips.timeline_id and p.user_id = auth.uid()
    )
  );


-- ═══════════════════════════════════════════════════════════
-- 8. Generations
-- ═══════════════════════════════════════════════════════════

create table generations (
  id              uuid primary key default uuid_generate_v4(),
  shot_id         uuid not null references shots(id) on delete cascade,
  project_id      uuid not null references projects(id) on delete cascade,
  user_id         uuid not null references auth.users(id) on delete cascade,
  provider        text not null,
  operation       generation_operation not null default 'text_to_video',
  status          generation_status not null default 'draft',
  prompt          text not null default '',
  negative_prompt text not null default '',
  params          jsonb not null default '{}',
  provider_job_id text,
  error_message   text,
  started_at      timestamptz,
  completed_at    timestamptz,
  created_at      timestamptz not null default now()
);

create index idx_generations_shot on generations(shot_id);
create index idx_generations_project on generations(project_id);
create index idx_generations_user on generations(user_id);
create index idx_generations_status on generations(status);

alter table generations enable row level security;

create policy "Users can manage own generations"
  on generations for all
  using (auth.uid() = user_id);


-- ═══════════════════════════════════════════════════════════
-- 9. Generation Variants
-- ═══════════════════════════════════════════════════════════

create table generation_variants (
  id             uuid primary key default uuid_generate_v4(),
  generation_id  uuid not null references generations(id) on delete cascade,
  asset_id       uuid not null references assets(id) on delete cascade,
  variant_index  integer not null default 0,
  is_selected    boolean not null default false,
  quality_score  real,
  metadata       jsonb not null default '{}',
  created_at     timestamptz not null default now()
);

create index idx_generation_variants_generation on generation_variants(generation_id);

alter table generation_variants enable row level security;

create policy "Users can manage own generation variants"
  on generation_variants for all
  using (
    exists (select 1 from generations g where g.id = generation_variants.generation_id and g.user_id = auth.uid())
  );


-- ═══════════════════════════════════════════════════════════
-- 10. Provider Accounts
-- ═══════════════════════════════════════════════════════════

create table provider_accounts (
  id               uuid primary key default uuid_generate_v4(),
  user_id          uuid not null references auth.users(id) on delete cascade,
  provider         text not null,
  is_active        boolean not null default true,
  display_name     text not null default '',
  last_verified_at timestamptz,
  created_at       timestamptz not null default now(),
  unique(user_id, provider)
);

create index idx_provider_accounts_user on provider_accounts(user_id);

alter table provider_accounts enable row level security;

create policy "Users can manage own provider accounts"
  on provider_accounts for all
  using (auth.uid() = user_id);


-- ═══════════════════════════════════════════════════════════
-- 11. Encrypted API Keys
-- ═══════════════════════════════════════════════════════════

create table encrypted_api_keys (
  id                  uuid primary key default uuid_generate_v4(),
  provider_account_id uuid not null unique references provider_accounts(id) on delete cascade,
  encrypted_key       bytea not null,
  key_hint            text not null default '',
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

alter table encrypted_api_keys enable row level security;

create policy "Users can manage own encrypted keys"
  on encrypted_api_keys for all
  using (
    exists (select 1 from provider_accounts pa where pa.id = encrypted_api_keys.provider_account_id and pa.user_id = auth.uid())
  );


-- ═══════════════════════════════════════════════════════════
-- 12. Jobs
-- ═══════════════════════════════════════════════════════════

create table jobs (
  id           uuid primary key default uuid_generate_v4(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  project_id   uuid references projects(id) on delete set null,
  type         text not null,
  status       job_status not null default 'pending',
  payload      jsonb not null default '{}',
  result       jsonb,
  error        text,
  attempts     integer not null default 0,
  started_at   timestamptz,
  completed_at timestamptz,
  created_at   timestamptz not null default now()
);

create index idx_jobs_user on jobs(user_id);
create index idx_jobs_status on jobs(status);
create index idx_jobs_project on jobs(project_id);

alter table jobs enable row level security;

create policy "Users can manage own jobs"
  on jobs for all
  using (auth.uid() = user_id);


-- ═══════════════════════════════════════════════════════════
-- 13. Versions
-- ═══════════════════════════════════════════════════════════

create table versions (
  id                  uuid primary key default uuid_generate_v4(),
  entity_type         text not null,
  entity_id           uuid not null,
  version_number      integer not null,
  snapshot            jsonb not null,
  change_description  text not null default '',
  created_by          uuid not null references auth.users(id) on delete cascade,
  created_at          timestamptz not null default now(),
  unique(entity_type, entity_id, version_number)
);

create index idx_versions_entity on versions(entity_type, entity_id);

alter table versions enable row level security;

create policy "Users can view own versions"
  on versions for select
  using (auth.uid() = created_by);

create policy "Users can create versions"
  on versions for insert
  with check (auth.uid() = created_by);


-- ═══════════════════════════════════════════════════════════
-- 14. Exports
-- ═══════════════════════════════════════════════════════════

create table exports (
  id           uuid primary key default uuid_generate_v4(),
  project_id   uuid not null references projects(id) on delete cascade,
  timeline_id  uuid not null references timelines(id) on delete cascade,
  user_id      uuid not null references auth.users(id) on delete cascade,
  status       export_status not null default 'pending',
  format       text not null default 'mp4',
  resolution   text not null default '1080p',
  asset_id     uuid references assets(id) on delete set null,
  job_id       uuid references jobs(id) on delete set null,
  created_at   timestamptz not null default now(),
  completed_at timestamptz
);

create index idx_exports_project on exports(project_id);
create index idx_exports_user on exports(user_id);

alter table exports enable row level security;

create policy "Users can manage own exports"
  on exports for all
  using (auth.uid() = user_id);


-- ═══════════════════════════════════════════════════════════
-- 15. Usage Events
-- ═══════════════════════════════════════════════════════════

create table usage_events (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  project_id  uuid references projects(id) on delete set null,
  event_type  text not null,
  provider    text,
  quantity    real not null default 0,
  unit        text not null default '',
  metadata    jsonb not null default '{}',
  created_at  timestamptz not null default now()
);

create index idx_usage_events_user on usage_events(user_id);
create index idx_usage_events_type on usage_events(event_type);

alter table usage_events enable row level security;

create policy "Users can view own usage events"
  on usage_events for select
  using (auth.uid() = user_id);

create policy "Users can create usage events"
  on usage_events for insert
  with check (auth.uid() = user_id);


-- ═══════════════════════════════════════════════════════════
-- 16. Billing Events
-- ═══════════════════════════════════════════════════════════

create table billing_events (
  id             uuid primary key default uuid_generate_v4(),
  user_id        uuid not null references auth.users(id) on delete cascade,
  usage_event_id uuid references usage_events(id) on delete set null,
  amount_cents   integer not null default 0,
  currency       text not null default 'usd',
  status         text not null default 'pending',
  created_at     timestamptz not null default now()
);

create index idx_billing_events_user on billing_events(user_id);

alter table billing_events enable row level security;

create policy "Users can view own billing events"
  on billing_events for select
  using (auth.uid() = user_id);


-- ═══════════════════════════════════════════════════════════
-- Updated At Trigger
-- ═══════════════════════════════════════════════════════════

create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_projects_updated_at
  before update on projects
  for each row execute function update_updated_at();

create trigger trg_project_bibles_updated_at
  before update on project_bibles
  for each row execute function update_updated_at();

create trigger trg_shots_updated_at
  before update on shots
  for each row execute function update_updated_at();

create trigger trg_encrypted_api_keys_updated_at
  before update on encrypted_api_keys
  for each row execute function update_updated_at();


-- ═══════════════════════════════════════════════════════════
-- Storage Buckets
-- ═══════════════════════════════════════════════════════════
-- NOTE: Storage buckets are created via Supabase Dashboard or CLI,
-- not via SQL migrations. Documented here for reference.
--
-- Buckets to create:
--   1. "assets"      — User uploads (images, reference files)
--   2. "generations" — Generated video clips from providers
--   3. "exports"     — Rendered export files
--   4. "thumbnails"  — Auto-generated thumbnails
--
-- Storage policies:
--   - Each bucket: users can CRUD objects matching their user_id prefix
--   - Path pattern: {bucket}/{user_id}/{project_id}/{filename}
