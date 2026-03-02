import { z } from 'zod';
import {
    GenerationStatus,
    ProjectStatus,
    JobStatus,
    ExportStatus,
    ProviderId,
    GenerationOperation,
    PatchType,
    AssetType,
    JobType,
} from './enums';

// ─────────────────────────────────────────────────────────────
// Zod Schemas — All 16 Core Entities
// ─────────────────────────────────────────────────────────────

// ─── Camera & Motion Instructions ─────────────────────────

export const cameraInstructionSchema = z.object({
    angle: z.string().optional(),
    movement: z.string().optional(),
    speed: z.string().optional(),
    framing: z.string().optional(),
    notes: z.string().optional(),
});
export type CameraInstruction = z.infer<typeof cameraInstructionSchema>;

export const motionInstructionSchema = z.object({
    subject_motion: z.string().optional(),
    background_motion: z.string().optional(),
    pace: z.string().optional(),
    notes: z.string().optional(),
});
export type MotionInstruction = z.infer<typeof motionInstructionSchema>;

// ─── 1. Project ───────────────────────────────────────────

export const projectSchema = z.object({
    id: z.string().uuid(),
    user_id: z.string().uuid(),
    title: z.string().min(1).max(200),
    vibe_brief: z.string().min(1),
    status: z.nativeEnum(ProjectStatus),
    created_at: z.string().datetime(),
    updated_at: z.string().datetime(),
});
export type Project = z.infer<typeof projectSchema>;

// ─── 2. Project Bible ─────────────────────────────────────

export const projectBibleSchema = z.object({
    id: z.string().uuid(),
    project_id: z.string().uuid(),
    style: z.record(z.unknown()).default({}),
    subjects: z.record(z.unknown()).default({}),
    continuity_notes: z.string().default(''),
    world_rules: z.record(z.unknown()).default({}),
    brand_constraints: z.record(z.unknown()).default({}),
    camera_language: z.record(z.unknown()).default({}),
    created_at: z.string().datetime(),
    updated_at: z.string().datetime(),
});
export type ProjectBible = z.infer<typeof projectBibleSchema>;

// ─── 3. Scene ─────────────────────────────────────────────

export const sceneSchema = z.object({
    id: z.string().uuid(),
    project_id: z.string().uuid(),
    title: z.string().min(1),
    description: z.string().default(''),
    order_index: z.number().int().min(0),
    purpose: z.string().default(''),
    created_at: z.string().datetime(),
});
export type Scene = z.infer<typeof sceneSchema>;

// ─── 4. Shot ──────────────────────────────────────────────

export const shotSchema = z.object({
    id: z.string().uuid(),
    scene_id: z.string().uuid(),
    project_id: z.string().uuid(),
    order_index: z.number().int().min(0),
    purpose: z.string().default(''),
    duration_target: z.number().positive().default(5),
    prompt: z.string().min(1),
    negative_prompt: z.string().default(''),
    reference_assets: z.array(z.string().uuid()).default([]),
    camera_instruction: cameraInstructionSchema.default({}),
    motion_instruction: motionInstructionSchema.default({}),
    continuity_tags: z.array(z.string()).default([]),
    provider_choice: z.string().optional(),
    generation_params: z.record(z.unknown()).default({}),
    status: z.nativeEnum(GenerationStatus),
    created_at: z.string().datetime(),
    updated_at: z.string().datetime(),
});
export type Shot = z.infer<typeof shotSchema>;

// ─── 5. Asset ─────────────────────────────────────────────

export const assetSchema = z.object({
    id: z.string().uuid(),
    user_id: z.string().uuid(),
    project_id: z.string().uuid().nullable().optional(),
    type: z.nativeEnum(AssetType),
    storage_path: z.string().min(1),
    original_filename: z.string().default(''),
    mime_type: z.string().default(''),
    size_bytes: z.number().int().min(0).default(0),
    duration_ms: z.number().int().nullable().optional(),
    width: z.number().int().nullable().optional(),
    height: z.number().int().nullable().optional(),
    metadata: z.record(z.unknown()).default({}),
    created_at: z.string().datetime(),
});
export type Asset = z.infer<typeof assetSchema>;

// ─── 6. Timeline ──────────────────────────────────────────

export const timelineSchema = z.object({
    id: z.string().uuid(),
    project_id: z.string().uuid(),
    version: z.number().int().min(1),
    is_active: z.boolean().default(true),
    created_at: z.string().datetime(),
});
export type Timeline = z.infer<typeof timelineSchema>;

// ─── 7. Timeline Clip ─────────────────────────────────────

export const timelineClipSchema = z.object({
    id: z.string().uuid(),
    timeline_id: z.string().uuid(),
    asset_id: z.string().uuid(),
    shot_id: z.string().uuid().nullable().optional(),
    order_index: z.number().int().min(0),
    start_trim_ms: z.number().int().min(0).default(0),
    end_trim_ms: z.number().int().min(0).default(0),
    duration_ms: z.number().int().min(0),
    created_at: z.string().datetime(),
});
export type TimelineClip = z.infer<typeof timelineClipSchema>;

// ─── 8. Generation ────────────────────────────────────────

export const generationSchema = z.object({
    id: z.string().uuid(),
    shot_id: z.string().uuid(),
    project_id: z.string().uuid(),
    user_id: z.string().uuid(),
    provider: z.nativeEnum(ProviderId),
    operation: z.nativeEnum(GenerationOperation),
    status: z.nativeEnum(GenerationStatus),
    prompt: z.string().min(1),
    negative_prompt: z.string().default(''),
    params: z.record(z.unknown()).default({}),
    provider_job_id: z.string().nullable().optional(),
    error_message: z.string().nullable().optional(),
    started_at: z.string().datetime().nullable().optional(),
    completed_at: z.string().datetime().nullable().optional(),
    created_at: z.string().datetime(),
});
export type Generation = z.infer<typeof generationSchema>;

// ─── 9. Generation Variant ────────────────────────────────

export const generationVariantSchema = z.object({
    id: z.string().uuid(),
    generation_id: z.string().uuid(),
    asset_id: z.string().uuid(),
    variant_index: z.number().int().min(0),
    is_selected: z.boolean().default(false),
    quality_score: z.number().nullable().optional(),
    metadata: z.record(z.unknown()).default({}),
    created_at: z.string().datetime(),
});
export type GenerationVariant = z.infer<typeof generationVariantSchema>;

// ─── 10. Provider Account ─────────────────────────────────

export const providerAccountSchema = z.object({
    id: z.string().uuid(),
    user_id: z.string().uuid(),
    provider: z.nativeEnum(ProviderId),
    is_active: z.boolean().default(true),
    display_name: z.string().default(''),
    last_verified_at: z.string().datetime().nullable().optional(),
    created_at: z.string().datetime(),
});
export type ProviderAccount = z.infer<typeof providerAccountSchema>;

// ─── 11. Encrypted API Key ───────────────────────────────

export const encryptedApiKeySchema = z.object({
    id: z.string().uuid(),
    provider_account_id: z.string().uuid(),
    key_hint: z.string().max(4).default(''),
    created_at: z.string().datetime(),
    updated_at: z.string().datetime(),
});
export type EncryptedApiKey = z.infer<typeof encryptedApiKeySchema>;

// ─── 12. Job ──────────────────────────────────────────────

export const jobSchema = z.object({
    id: z.string().uuid(),
    user_id: z.string().uuid(),
    project_id: z.string().uuid().nullable().optional(),
    type: z.nativeEnum(JobType),
    status: z.nativeEnum(JobStatus),
    payload: z.record(z.unknown()).default({}),
    result: z.record(z.unknown()).nullable().optional(),
    error: z.string().nullable().optional(),
    attempts: z.number().int().min(0).default(0),
    started_at: z.string().datetime().nullable().optional(),
    completed_at: z.string().datetime().nullable().optional(),
    created_at: z.string().datetime(),
});
export type Job = z.infer<typeof jobSchema>;

// ─── 13. Version ──────────────────────────────────────────

export const versionSchema = z.object({
    id: z.string().uuid(),
    entity_type: z.string().min(1),
    entity_id: z.string().uuid(),
    version_number: z.number().int().min(1),
    snapshot: z.record(z.unknown()),
    change_description: z.string().default(''),
    created_by: z.string().uuid(),
    created_at: z.string().datetime(),
});
export type Version = z.infer<typeof versionSchema>;

// ─── 14. Export ───────────────────────────────────────────

export const exportSchema = z.object({
    id: z.string().uuid(),
    project_id: z.string().uuid(),
    timeline_id: z.string().uuid(),
    user_id: z.string().uuid(),
    status: z.nativeEnum(ExportStatus),
    format: z.string().default('mp4'),
    resolution: z.string().default('1080p'),
    asset_id: z.string().uuid().nullable().optional(),
    job_id: z.string().uuid().nullable().optional(),
    created_at: z.string().datetime(),
    completed_at: z.string().datetime().nullable().optional(),
});
export type Export = z.infer<typeof exportSchema>;

// ─── 15. Usage Event ──────────────────────────────────────

export const usageEventSchema = z.object({
    id: z.string().uuid(),
    user_id: z.string().uuid(),
    project_id: z.string().uuid().nullable().optional(),
    event_type: z.string().min(1),
    provider: z.string().nullable().optional(),
    quantity: z.number().default(0),
    unit: z.string().default(''),
    metadata: z.record(z.unknown()).default({}),
    created_at: z.string().datetime(),
});
export type UsageEvent = z.infer<typeof usageEventSchema>;

// ─── 16. Billing Event ───────────────────────────────────

export const billingEventSchema = z.object({
    id: z.string().uuid(),
    user_id: z.string().uuid(),
    usage_event_id: z.string().uuid().nullable().optional(),
    amount_cents: z.number().int().default(0),
    currency: z.string().default('usd'),
    status: z.string().default('pending'),
    created_at: z.string().datetime(),
});
export type BillingEvent = z.infer<typeof billingEventSchema>;

// ─── Timeline Patch ──────────────────────────────────────

export const timelinePatchSchema = z.object({
    type: z.nativeEnum(PatchType),
    clip_id: z.string().uuid(),
    params: z.record(z.unknown()).default({}),
    timestamp: z.string().datetime(),
});
export type TimelinePatch = z.infer<typeof timelinePatchSchema>;
