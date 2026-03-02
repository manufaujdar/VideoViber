import type { Shot, ProjectBible, Scene, TimelinePatch } from '@videoviber/types';

// ─────────────────────────────────────────────────────────────
// Runtime Agent Interfaces
//
// These define the contract for each agent in the
// planner → workers → reviewer execution model.
// ─────────────────────────────────────────────────────────────

/**
 * Prompt Planner Agent
 *
 * Converts a vibe brief into structured creative output:
 * creative brief, narrative arc, scene breakdown, shot list.
 */
export interface PromptPlannerAgent {
    /**
     * Takes a vibe brief and optional reference images,
     * returns a full creative decomposition.
     */
    plan(input: {
        vibe_brief: string;
        reference_image_urls?: string[];
        constraints?: Record<string, unknown>;
    }): Promise<{
        creative_brief: string;
        narrative_arc: {
            beginning: string;
            middle: string;
            end: string;
        };
        scenes: Array<Omit<Scene, 'id' | 'project_id' | 'created_at'>>;
        shots: Array<Omit<Shot, 'id' | 'scene_id' | 'project_id' | 'status' | 'created_at' | 'updated_at'>>;
        bible: Omit<ProjectBible, 'id' | 'project_id' | 'created_at' | 'updated_at'>;
    }>;
}

/**
 * Continuity Memory Agent
 *
 * Ensures cross-shot visual and narrative consistency.
 * Reviews shot specs against the project bible.
 */
export interface ContinuityMemoryAgent {
    /**
     * Check a shot spec for continuity issues.
     * Returns suggestions for improvement.
     */
    check(input: {
        shot: Shot;
        bible: ProjectBible;
        previous_shots: Shot[];
    }): Promise<{
        is_consistent: boolean;
        issues: string[];
        suggestions: string[];
        revised_prompt?: string;
    }>;
}

/**
 * Edit Agent
 *
 * Applies timeline patches and computes new timeline state.
 */
export interface EditAgent {
    /**
     * Apply a set of patches to the current timeline.
     * Returns the updated timeline state.
     */
    applyPatches(input: {
        timeline_id: string;
        patches: TimelinePatch[];
    }): Promise<{
        success: boolean;
        new_version: number;
        errors?: string[];
    }>;
}

/**
 * Render Agent
 *
 * Orchestrates FFmpeg/Remotion to stitch clips and export.
 */
export interface RenderAgent {
    /**
     * Stitch timeline clips into a single video.
     */
    render(input: {
        timeline_id: string;
        format: string;
        resolution: string;
    }): Promise<{
        asset_id: string;
        storage_path: string;
        duration_ms: number;
    }>;
}

/**
 * QA Agent
 *
 * Evaluates generated video quality.
 */
export interface QAAgent {
    /**
     * Score a generated video variant.
     */
    evaluate(input: {
        asset_id: string;
        shot: Shot;
        prompt: string;
    }): Promise<{
        quality_score: number; // 0-1
        issues: string[];
        pass: boolean;
    }>;
}
