// ─────────────────────────────────────────────────────────────
// Media Utilities — FFmpeg & Remotion Interfaces
//
// These are contracts for video processing operations.
// Implementation will use @remotion/renderer and fluent-ffmpeg.
// ─────────────────────────────────────────────────────────────

/** Input for stitching multiple clips into one video */
export interface StitchInput {
    clips: Array<{
        url: string;
        start_trim_ms?: number;
        end_trim_ms?: number;
        order_index: number;
    }>;
    output_format: 'mp4' | 'webm';
    resolution?: string;
}

/** Result of a stitch operation */
export interface StitchResult {
    output_path: string;
    duration_ms: number;
    file_size_bytes: number;
}

/** Input for trimming a single clip */
export interface TrimInput {
    url: string;
    start_ms: number;
    end_ms: number;
    output_format?: 'mp4' | 'webm';
}

/** Input for concatenating clips end-to-end */
export interface ConcatInput {
    urls: string[];
    output_format?: 'mp4' | 'webm';
    crossfade_ms?: number;
}

/** Result of a probe operation */
export interface ProbeResult {
    duration_ms: number;
    width: number;
    height: number;
    fps: number;
    codec: string;
    file_size_bytes: number;
    has_audio: boolean;
}

/**
 * Media Processor interface.
 *
 * Abstracts FFmpeg/Remotion operations behind a clean contract.
 * Implementations can run locally (dev) or in cloud workers (prod).
 */
export interface MediaProcessor {
    /** Stitch multiple clips with optional trimming into one video */
    stitch(input: StitchInput): Promise<StitchResult>;

    /** Trim a single clip */
    trim(input: TrimInput): Promise<StitchResult>;

    /** Concatenate clips end-to-end */
    concat(input: ConcatInput): Promise<StitchResult>;

    /** Probe a video file for metadata */
    probe(url: string): Promise<ProbeResult>;

    /** Generate a thumbnail from a video at a specific timestamp */
    thumbnail(url: string, timestamp_ms: number): Promise<string>;
}
