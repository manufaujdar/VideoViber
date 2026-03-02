import type { Shot, ProjectBible } from '@videoviber/types';

// ─────────────────────────────────────────────────────────────
// Structured Prompt Templates
//
// Prompts are stored as structured data, never raw strings only.
// These templates compose structured fields into provider-ready prompts.
// ─────────────────────────────────────────────────────────────

/**
 * Compose a full generation prompt from structured shot spec fields.
 * This ensures consistency and makes prompts auditable.
 */
export function composeShotPrompt(shot: Pick<Shot, 'prompt' | 'camera_instruction' | 'motion_instruction' | 'continuity_tags'>): string {
    const parts: string[] = [shot.prompt];

    if (shot.camera_instruction) {
        const cam = shot.camera_instruction;
        if (cam.angle) parts.push(`Camera angle: ${cam.angle}`);
        if (cam.movement) parts.push(`Camera movement: ${cam.movement}`);
        if (cam.speed) parts.push(`Camera speed: ${cam.speed}`);
        if (cam.framing) parts.push(`Framing: ${cam.framing}`);
    }

    if (shot.motion_instruction) {
        const motion = shot.motion_instruction;
        if (motion.subject_motion) parts.push(`Subject motion: ${motion.subject_motion}`);
        if (motion.background_motion) parts.push(`Background motion: ${motion.background_motion}`);
        if (motion.pace) parts.push(`Pace: ${motion.pace}`);
    }

    if (shot.continuity_tags && shot.continuity_tags.length > 0) {
        parts.push(`Continuity: ${shot.continuity_tags.join(', ')}`);
    }

    return parts.join('. ');
}

/**
 * System prompt template for the Shot Planner agent.
 */
export const SHOT_PLANNER_SYSTEM_PROMPT = `You are a professional video director and shot planner.
Given a creative brief (vibe), decompose it into:
1. A structured creative brief (1-2 paragraphs)
2. A narrative arc (beginning, middle, end)
3. Scene breakdown (2-4 scenes)
4. Shot list (4-8 shots with detailed specs)
5. A continuity pack (style, subjects, world rules)

Each shot must include:
- Purpose (what this shot communicates)
- Duration target (4-10 seconds)
- Detailed prompt for AI video generation
- Camera instruction (angle, movement, speed, framing)
- Motion instruction (subject motion, background, pace)
- Continuity tags (for cross-shot consistency)

Output must be valid JSON matching the structured schema.`;

/**
 * Compose a style-consistent prompt using the project bible.
 */
export function applyBibleToPrompt(
    basePrompt: string,
    bible: Pick<ProjectBible, 'style' | 'brand_constraints'>
): string {
    const parts: string[] = [basePrompt];

    const style = bible.style as Record<string, string> | undefined;
    if (style) {
        const styleDesc = Object.entries(style)
            .map(([k, v]) => `${k}: ${v}`)
            .join(', ');
        if (styleDesc) parts.push(`Style: ${styleDesc}`);
    }

    const brand = bible.brand_constraints as Record<string, string> | undefined;
    if (brand) {
        const brandDesc = Object.entries(brand)
            .map(([k, v]) => `${k}: ${v}`)
            .join(', ');
        if (brandDesc) parts.push(`Brand: ${brandDesc}`);
    }

    return parts.join('. ');
}
