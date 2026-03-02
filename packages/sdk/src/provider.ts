import type { ProviderId } from '@videoviber/types';

// ─────────────────────────────────────────────────────────────
// Provider Abstraction Layer — Core Interfaces
// ─────────────────────────────────────────────────────────────

/** Result of a generation request submitted to a provider */
export interface ProviderJobResult {
    provider_job_id: string;
    status: 'submitted' | 'processing' | 'completed' | 'failed';
    video_url?: string;
    thumbnail_url?: string;
    duration_ms?: number;
    error_message?: string;
    metadata?: Record<string, unknown>;
}

/** Status polling result from a provider */
export interface ProviderJobStatus {
    provider_job_id: string;
    status: 'processing' | 'completed' | 'failed';
    progress?: number; // 0-100
    video_url?: string;
    thumbnail_url?: string;
    duration_ms?: number;
    error_message?: string;
    metadata?: Record<string, unknown>;
}

/** Input for text-to-video generation */
export interface TextToVideoInput {
    prompt: string;
    negative_prompt?: string;
    duration_seconds?: number;
    aspect_ratio?: string;
    resolution?: string;
    seed?: number;
    params?: Record<string, unknown>;
}

/** Input for image-to-video generation */
export interface ImageToVideoInput extends TextToVideoInput {
    image_url: string;
    motion_strength?: number;
}

/** Input for extending a video */
export interface ExtendVideoInput {
    video_url: string;
    prompt?: string;
    extend_seconds?: number;
    direction?: 'forward' | 'backward';
    params?: Record<string, unknown>;
}

/** Input for editing a video */
export interface EditVideoInput {
    video_url: string;
    prompt: string;
    mask_url?: string;
    params?: Record<string, unknown>;
}

/** Input for upscaling a video */
export interface UpscaleVideoInput {
    video_url: string;
    target_resolution?: string;
    params?: Record<string, unknown>;
}

/**
 * Abstract interface that every video provider adapter must implement.
 *
 * Product logic calls these methods exclusively — never provider APIs directly.
 * This ensures providers can be swapped, A/B tested, or added without
 * changing any product code.
 */
export interface VideoProvider {
    /** Provider identifier */
    readonly id: ProviderId;

    /** Human-readable provider name */
    readonly name: string;

    /** Whether this provider is currently available */
    isAvailable(): Promise<boolean>;

    /** Generate video from text prompt */
    generateTextToVideo(input: TextToVideoInput): Promise<ProviderJobResult>;

    /** Generate video from image + prompt */
    generateImageToVideo(input: ImageToVideoInput): Promise<ProviderJobResult>;

    /** Extend an existing video */
    extendVideo(input: ExtendVideoInput): Promise<ProviderJobResult>;

    /** Edit a video with a prompt */
    editVideo(input: EditVideoInput): Promise<ProviderJobResult>;

    /** Upscale video resolution */
    upscaleVideo(input: UpscaleVideoInput): Promise<ProviderJobResult>;

    /** Poll job status from the provider */
    getJobStatus(providerJobId: string): Promise<ProviderJobStatus>;

    /** Cancel a running job */
    cancelJob(providerJobId: string): Promise<void>;
}

/**
 * Configuration needed to initialize a provider adapter.
 */
export interface ProviderConfig {
    apiKey: string;
    baseUrl?: string;
    projectId?: string;
    region?: string;
    options?: Record<string, unknown>;
}
