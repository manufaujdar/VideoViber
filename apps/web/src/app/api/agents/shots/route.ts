import { NextResponse, type NextRequest } from 'next/server';
import { callGeminiAgent, parseAgentJson } from '../_shared/gemini';
import { parseGuardedAgentBody } from '../_shared/request';
import { toAgentErrorMessage } from '../_shared/errors';

export async function POST(request: NextRequest) {
  try {
    const parsedRequest = await parseGuardedAgentBody(request, 'shots');
    if (!parsedRequest.ok) {
      return parsedRequest.response;
    }

    const body = parsedRequest.body;
    const { sceneBreakdown, contextBible, selectedConcept } = body;

    const systemPrompt = `You are a shot planner for AI video generation. For each scene, create detailed shot descriptions optimized for AI generation prompts.

Return as JSON:
{
  "shots": [
    {
      "id": "shot-1",
      "sceneId": "scene-1",
      "title": "Short shot name",
      "prompt": "Detailed AI-optimized generation prompt (include subject, style, mood, colors, composition)",
      "negativePrompt": "What to avoid in generation",
      "cameraAngle": "wide | medium | close-up | extreme-close-up | bird's-eye | low-angle | dutch-angle",
      "motion": "static | pan-left | pan-right | tilt-up | tilt-down | zoom-in | zoom-out | tracking | dolly | crane",
      "lighting": "Description of lighting setup",
      "continuityTags": ["tag1", "tag2"],
      "duration": 2.5,
      "order": 1
    }
  ],
  "totalShots": 12,
  "estimatedRenderTime": "~8 minutes",
  "confidence": 0.8,
  "assumptions": []
}

Rules:
- Prompts must be rich and specific for AI generation (150+ characters)
- Include negative prompts to prevent common artifacts
- Use continuity tags to ensure visual consistency across shots
- Camera angles and motion should serve the storytelling
- Duration of shots should add up to the scene duration`;

    const userContent = [
      sceneBreakdown ? `**Scenes:**\n${JSON.stringify(sceneBreakdown)}` : '',
      contextBible ? `**Context:**\n${JSON.stringify(contextBible)}` : '',
      selectedConcept ? `**Concept:**\n${JSON.stringify(selectedConcept)}` : '',
    ].filter(Boolean).join('\n\n');

    const result = await callGeminiAgent({
      systemPrompt,
      userContent,
      jsonMode: true,
      temperature: 0.75,
      maxOutputTokens: 8192,
    });

    const parsed = parseAgentJson<Record<string, unknown>>(result.content);

    return NextResponse.json({
      success: true,
      shotPlan: parsed,
      confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.8,
      assumptions: Array.isArray(parsed.assumptions) ? parsed.assumptions : [],
    });
  } catch (error) {
    const message = toAgentErrorMessage(error, 'Agent request failed');
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
