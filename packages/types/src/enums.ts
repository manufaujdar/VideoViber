// ─────────────────────────────────────────────────────────────
// Enums — Generation, Project, Job, and Provider states
// ─────────────────────────────────────────────────────────────

/** Generation state machine states */
export const GenerationStatus = {
    DRAFT: 'draft',
    PLANNED: 'planned',
    QUEUED: 'queued',
    SUBMITTED: 'submitted',
    PROCESSING: 'processing',
    COMPLETED: 'completed',
    FAILED: 'failed',
    CANCELED: 'canceled',
    EXPIRED: 'expired',
} as const;
export type GenerationStatus = (typeof GenerationStatus)[keyof typeof GenerationStatus];

/** Project lifecycle states */
export const ProjectStatus = {
    DRAFT: 'draft',
    PLANNING: 'planning',
    GENERATING: 'generating',
    EDITING: 'editing',
    EXPORTING: 'exporting',
    EXPORTED: 'exported',
} as const;
export type ProjectStatus = (typeof ProjectStatus)[keyof typeof ProjectStatus];

/** Job lifecycle states */
export const JobStatus = {
    PENDING: 'pending',
    RUNNING: 'running',
    COMPLETED: 'completed',
    FAILED: 'failed',
    CANCELED: 'canceled',
} as const;
export type JobStatus = (typeof JobStatus)[keyof typeof JobStatus];

/** Export lifecycle states */
export const ExportStatus = {
    PENDING: 'pending',
    RENDERING: 'rendering',
    COMPLETED: 'completed',
    FAILED: 'failed',
} as const;
export type ExportStatus = (typeof ExportStatus)[keyof typeof ExportStatus];

/** Supported video generation providers */
export const ProviderId = {
    RUNWAY: 'runway',
    VEO: 'veo',
    LUMA: 'luma',
    GEMINI: 'gemini',
} as const;
export type ProviderId = (typeof ProviderId)[keyof typeof ProviderId];

/** Generation operation types */
export const GenerationOperation = {
    TEXT_TO_VIDEO: 'text_to_video',
    IMAGE_TO_VIDEO: 'image_to_video',
    EXTEND: 'extend',
    EDIT: 'edit',
    UPSCALE: 'upscale',
} as const;
export type GenerationOperation = (typeof GenerationOperation)[keyof typeof GenerationOperation];

/** Timeline patch operations */
export const PatchType = {
    TRIM: 'trim',
    REPLACE: 'replace',
    EXTEND: 'extend',
    REORDER: 'reorder',
    REGENERATE: 'regenerate',
    RESTYLE: 'restyle',
    UPSCALE: 'upscale',
} as const;
export type PatchType = (typeof PatchType)[keyof typeof PatchType];

/** Asset types */
export const AssetType = {
    IMAGE: 'image',
    VIDEO: 'video',
    AUDIO: 'audio',
    DOCUMENT: 'document',
} as const;
export type AssetType = (typeof AssetType)[keyof typeof AssetType];

/** Job types */
export const JobType = {
    GENERATE: 'generate',
    EXTEND: 'extend',
    EXPORT: 'export',
    PLAN: 'plan',
    UPSCALE: 'upscale',
} as const;
export type JobType = (typeof JobType)[keyof typeof JobType];
