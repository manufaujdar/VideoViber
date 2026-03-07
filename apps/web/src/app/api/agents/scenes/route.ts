import { NextResponse, type NextRequest } from 'next/server';
import { callGeminiAgent, parseAgentJson } from '../_shared/gemini';
import { parseGuardedAgentBody } from '../_shared/request';
import { toAgentErrorMessage } from '../_shared/errors';

export async function POST(request: NextRequest) {
  try {
    const parsedRequest = await parseGuardedAgentBody(request, 'scenes');
    if (!parsedRequest.ok) {
      return parsedRequest.response;
    }

    const body = parsedRequest.body;
    const { scriptDraft, contextBible, strategyBrief } = body;

    const systemPrompt = `You are a scene architect who breaks scripts into production-ready scenes for AI video generation.

Analyze the approved script and break it into discrete, filmable scenes. Each scene should be a self-contained visual unit.

Return as JSON:
{
  "scenes": [
    {
      "id": "scene-1",
      "title": "Short scene title",
      "purpose": "What this scene achieves in the story",
      "duration": 3.5,
      "visualDescription": "Detailed visual description of what we see in this scene",
      "transition": "cut | dissolve | fade | wipe | none",
      "order": 1
    }
  ],
  "totalDuration": 30,
  "sceneCount": 8,
  "confidence": 0.85,
  "assumptions": []
}

Rules:
- Each scene should be 1-5 seconds for short-form, 3-15 seconds for long-form
- Use descriptive visual descriptions that can directly map to AI image/video prompts
- Respect [VISUAL:] and [TRANSITION:] markers from the script
- Sum of all scene durations should match the recommended total duration
- Scene count should be appropriate: 4-12 for shorts, 15-30 for long-form`;

    const userContent = [
      scriptDraft ? `**Script:**\n${JSON.stringify(scriptDraft)}` : '',
      contextBible ? `**Context:**\n${JSON.stringify(contextBible)}` : '',
      strategyBrief ? `**Strategy:**\n${JSON.stringify(strategyBrief)}` : '',
    ].filter(Boolean).join('\n\n');

    const result = await callGeminiAgent({
      systemPrompt,
      userContent,
      jsonMode: true,
      temperature: 0.7,
      maxOutputTokens: 4096,
    });

    const parsed = parseAgentJson<Record<string, unknown>>(result.content);

    return NextResponse.json({
      success: true,
      sceneBreakdown: parsed,
      confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.85,
      assumptions: Array.isArray(parsed.assumptions) ? parsed.assumptions : [],
    });
  } catch (error) {
    const message = toAgentErrorMessage(error, 'Agent request failed');
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
