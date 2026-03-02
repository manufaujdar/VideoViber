# Entity Model

All 16 core entities with their schemas and relationships.

---

## 1. Project

The top-level container for a video creation workflow.

| Field | Type | Description |
|-------|------|-------------|
| `id` | `uuid` | Primary key |
| `user_id` | `uuid` | Owner (FK → auth.users) |
| `title` | `text` | Project title |
| `vibe_brief` | `text` | Original user input |
| `status` | `enum` | draft, planning, generating, editing, exported |
| `created_at` | `timestamptz` | |
| `updated_at` | `timestamptz` | |

---

## 2. Project Bible

Stores creative context for cross-shot consistency.

| Field | Type | Description |
|-------|------|-------------|
| `id` | `uuid` | Primary key |
| `project_id` | `uuid` | FK → projects |
| `style` | `jsonb` | Visual style descriptors |
| `subjects` | `jsonb` | Characters, objects, settings |
| `continuity_notes` | `text` | Free-form continuity notes |
| `world_rules` | `jsonb` | Physics, logic, world constraints |
| `brand_constraints` | `jsonb` | Colors, logos, tone restrictions |
| `camera_language` | `jsonb` | Default camera preferences |
| `created_at` | `timestamptz` | |
| `updated_at` | `timestamptz` | |

---

## 3. Scene

A narrative segment within a project.

| Field | Type | Description |
|-------|------|-------------|
| `id` | `uuid` | Primary key |
| `project_id` | `uuid` | FK → projects |
| `title` | `text` | Scene title |
| `description` | `text` | Scene description |
| `order_index` | `integer` | Position in narrative |
| `purpose` | `text` | Narrative purpose |
| `created_at` | `timestamptz` | |

---

## 4. Shot

An individual video clip specification within a scene.

| Field | Type | Description |
|-------|------|-------------|
| `id` | `uuid` | Primary key |
| `scene_id` | `uuid` | FK → scenes |
| `project_id` | `uuid` | FK → projects (denormalized) |
| `order_index` | `integer` | Position within scene |
| `purpose` | `text` | Shot's narrative purpose |
| `duration_target` | `real` | Target duration (seconds) |
| `prompt` | `text` | Generation prompt |
| `negative_prompt` | `text` | Negative prompt |
| `reference_assets` | `uuid[]` | FK → assets |
| `camera_instruction` | `jsonb` | Camera movement/angle |
| `motion_instruction` | `jsonb` | Subject/object motion |
| `continuity_tags` | `text[]` | Tags for consistency |
| `provider_choice` | `text` | Preferred provider |
| `generation_params` | `jsonb` | Provider-specific params |
| `status` | `enum` | Shot status |
| `created_at` | `timestamptz` | |
| `updated_at` | `timestamptz` | |

---

## 5. Asset

Any uploaded or generated media file.

| Field | Type | Description |
|-------|------|-------------|
| `id` | `uuid` | Primary key |
| `user_id` | `uuid` | Owner |
| `project_id` | `uuid` | FK → projects (nullable) |
| `type` | `enum` | image, video, audio, document |
| `storage_path` | `text` | Supabase Storage path |
| `original_filename` | `text` | Original file name |
| `mime_type` | `text` | MIME type |
| `size_bytes` | `bigint` | File size |
| `duration_ms` | `integer` | Duration (video/audio) |
| `width` | `integer` | Width in pixels |
| `height` | `integer` | Height in pixels |
| `metadata` | `jsonb` | Provider metadata, EXIF, etc. |
| `created_at` | `timestamptz` | |

---

## 6. Timeline

An ordered sequence of clips for a project.

| Field | Type | Description |
|-------|------|-------------|
| `id` | `uuid` | Primary key |
| `project_id` | `uuid` | FK → projects |
| `version` | `integer` | Timeline version |
| `is_active` | `boolean` | Active version flag |
| `created_at` | `timestamptz` | |

---

## 7. Timeline Clip

A single clip placed on the timeline.

| Field | Type | Description |
|-------|------|-------------|
| `id` | `uuid` | Primary key |
| `timeline_id` | `uuid` | FK → timelines |
| `asset_id` | `uuid` | FK → assets |
| `shot_id` | `uuid` | FK → shots (nullable) |
| `order_index` | `integer` | Position on timeline |
| `start_trim_ms` | `integer` | Trim from start |
| `end_trim_ms` | `integer` | Trim from end |
| `duration_ms` | `integer` | Effective duration |
| `created_at` | `timestamptz` | |

---

## 8. Generation

A request to generate video from a provider.

| Field | Type | Description |
|-------|------|-------------|
| `id` | `uuid` | Primary key |
| `shot_id` | `uuid` | FK → shots |
| `project_id` | `uuid` | FK → projects (denormalized) |
| `user_id` | `uuid` | FK → auth.users |
| `provider` | `text` | Provider ID (runway, veo, luma) |
| `operation` | `enum` | text_to_video, image_to_video, extend, edit, upscale |
| `status` | `enum` | Generation state machine state |
| `prompt` | `text` | Prompt sent to provider |
| `negative_prompt` | `text` | Negative prompt sent |
| `params` | `jsonb` | Provider-specific params |
| `provider_job_id` | `text` | External job ID |
| `error_message` | `text` | Error details if failed |
| `started_at` | `timestamptz` | When processing started |
| `completed_at` | `timestamptz` | When completed |
| `created_at` | `timestamptz` | |

---

## 9. Generation Variant

A result from a generation (one generation may produce multiple variants).

| Field | Type | Description |
|-------|------|-------------|
| `id` | `uuid` | Primary key |
| `generation_id` | `uuid` | FK → generations |
| `asset_id` | `uuid` | FK → assets |
| `variant_index` | `integer` | Variant number |
| `is_selected` | `boolean` | Selected for timeline |
| `quality_score` | `real` | QA agent score (nullable) |
| `metadata` | `jsonb` | Provider response metadata |
| `created_at` | `timestamptz` | |

---

## 10. Provider Account

A user's connection to a video provider.

| Field | Type | Description |
|-------|------|-------------|
| `id` | `uuid` | Primary key |
| `user_id` | `uuid` | FK → auth.users |
| `provider` | `text` | Provider ID |
| `is_active` | `boolean` | Whether this account is active |
| `display_name` | `text` | User-friendly label |
| `last_verified_at` | `timestamptz` | Last successful verification |
| `created_at` | `timestamptz` | |

---

## 11. Encrypted API Key

Stores provider API keys with encryption.

| Field | Type | Description |
|-------|------|-------------|
| `id` | `uuid` | Primary key |
| `provider_account_id` | `uuid` | FK → provider_accounts |
| `encrypted_key` | `bytea` | Encrypted API key |
| `key_hint` | `text` | Last 4 chars for display |
| `created_at` | `timestamptz` | |
| `updated_at` | `timestamptz` | |

---

## 12. Job

An async background task.

| Field | Type | Description |
|-------|------|-------------|
| `id` | `uuid` | Primary key |
| `user_id` | `uuid` | FK → auth.users |
| `project_id` | `uuid` | FK → projects (nullable) |
| `type` | `text` | Job type (generate, extend, export, plan) |
| `status` | `enum` | pending, running, completed, failed, canceled |
| `payload` | `jsonb` | Job input data |
| `result` | `jsonb` | Job output data |
| `error` | `text` | Error message if failed |
| `attempts` | `integer` | Number of retry attempts |
| `started_at` | `timestamptz` | |
| `completed_at` | `timestamptz` | |
| `created_at` | `timestamptz` | |

---

## 13. Version

Tracks versions of editable entities.

| Field | Type | Description |
|-------|------|-------------|
| `id` | `uuid` | Primary key |
| `entity_type` | `text` | Type of entity (project, shot, timeline) |
| `entity_id` | `uuid` | ID of the entity |
| `version_number` | `integer` | Sequential version number |
| `snapshot` | `jsonb` | Full entity state at this version |
| `change_description` | `text` | What changed |
| `created_by` | `uuid` | FK → auth.users |
| `created_at` | `timestamptz` | |

---

## 14. Export

A rendered output from a timeline.

| Field | Type | Description |
|-------|------|-------------|
| `id` | `uuid` | Primary key |
| `project_id` | `uuid` | FK → projects |
| `timeline_id` | `uuid` | FK → timelines |
| `user_id` | `uuid` | FK → auth.users |
| `status` | `enum` | pending, rendering, completed, failed |
| `format` | `text` | Output format (mp4, webm) |
| `resolution` | `text` | Output resolution |
| `asset_id` | `uuid` | FK → assets (completed export) |
| `job_id` | `uuid` | FK → jobs |
| `created_at` | `timestamptz` | |
| `completed_at` | `timestamptz` | |

---

## 15. Usage Event

Tracks resource consumption for billing/analytics.

| Field | Type | Description |
|-------|------|-------------|
| `id` | `uuid` | Primary key |
| `user_id` | `uuid` | FK → auth.users |
| `project_id` | `uuid` | FK → projects (nullable) |
| `event_type` | `text` | generation, export, storage, etc. |
| `provider` | `text` | Provider used (nullable) |
| `quantity` | `real` | Amount consumed |
| `unit` | `text` | seconds, bytes, credits |
| `metadata` | `jsonb` | Additional context |
| `created_at` | `timestamptz` | |

---

## 16. Billing Event

For future billing integration (V2+).

| Field | Type | Description |
|-------|------|-------------|
| `id` | `uuid` | Primary key |
| `user_id` | `uuid` | FK → auth.users |
| `usage_event_id` | `uuid` | FK → usage_events (nullable) |
| `amount_cents` | `integer` | Cost in cents |
| `currency` | `text` | Currency code |
| `status` | `text` | pending, invoiced, paid |
| `created_at` | `timestamptz` | |

---

## Entity Relationship Diagram

```mermaid
erDiagram
    PROJECT ||--o{ SCENE : contains
    PROJECT ||--|| PROJECT_BIBLE : has
    PROJECT ||--o{ SHOT : contains
    PROJECT ||--o{ TIMELINE : has
    PROJECT ||--o{ GENERATION : tracks
    PROJECT ||--o{ EXPORT : produces
    PROJECT ||--o{ ASSET : owns

    SCENE ||--o{ SHOT : contains

    SHOT ||--o{ GENERATION : triggers
    SHOT }o--o{ ASSET : references

    TIMELINE ||--o{ TIMELINE_CLIP : contains
    TIMELINE_CLIP }o--|| ASSET : uses
    TIMELINE_CLIP }o--o| SHOT : "derived from"

    GENERATION ||--o{ GENERATION_VARIANT : produces
    GENERATION_VARIANT }o--|| ASSET : "stored as"

    USER ||--o{ PROJECT : owns
    USER ||--o{ PROVIDER_ACCOUNT : manages
    PROVIDER_ACCOUNT ||--|| ENCRYPTED_API_KEY : secures

    EXPORT }o--|| TIMELINE : "renders from"
    EXPORT }o--o| ASSET : "stored as"
    EXPORT }o--|| JOB : "tracked by"

    USER ||--o{ USAGE_EVENT : incurs
    USAGE_EVENT }o--o| BILLING_EVENT : triggers

    VERSION }o--|| USER : "created by"
