import { NextResponse, type NextRequest } from 'next/server';
import { callGeminiAgent, parseAgentJson } from '../_shared/gemini';
import { parseGuardedAgentBody } from '../_shared/request';
import { toAgentErrorMessage } from '../_shared/errors';

export async function POST(request: NextRequest) {
  try {
    const parsedRequest = await parseGuardedAgentBody(request, 'concepts');
    if (!parsedRequest.ok) {
      return parsedRequest.response;
    }

    const body = parsedRequest.body;
    const { rawIdea, requirementReport, strategyBrief, contextBible, researchSummary } = body;

    const systemPrompt = `You are a creative director generating concept variations for a video project. Based on the approved requirements, strategy, and context, create 3 distinct concept directions.

Each concept should be a genuinely different creative approach — not just variations in wording.

Return as JSON:
{
  "directions": [
    {
      "id": "concept-1",
      "name": "Short memorable name",
      "description": "1-2 paragraph description of the concept direction",
      "approach": "The storytelling/visual approach — how the video unfolds",
      "visualMood": "Specific visual mood and palette description",
      "narrativeStyle": "Narrative voice and pacing style",
      "selected": false
    }
  ],
  "selectedId": null,
  "confidence": 0.8,
  "assumptions": []
}

Generate exactly 3 directions. Make them meaningfully different from each other:
- One could be bold & cinematic
- One could be minimalist & elegant
- One could be energetic & trend-aware

Be specific with visual moods and narrative styles.`;

    const userContent = [
      rawIdea ? `**Original Idea:** ${rawIdea}` : '',
      requirementReport ? `**Requirements:** ${JSON.stringify(requirementReport)}` : '',
      strategyBrief ? `**Strategy:** ${JSON.stringify(strategyBrief)}` : '',
      contextBible ? `**Context Bible:** ${JSON.stringify(contextBible)}` : '',
      researchSummary ? `**Research:** ${JSON.stringify(researchSummary)}` : '',
    ].filter(Boolean).join('\n\n');

    const result = await callGeminiAgent({
      systemPrompt,
      userContent,
      jsonMode: true,
      temperature: 0.9,
      maxOutputTokens: 4096,
    });

    const parsed = parseAgentJson<Record<string, unknown>>(result.content);

    if (Array.isArray(parsed.directions)) {
      parsed.directions = (parsed.directions as Array<Record<string, unknown>>).map((d, i) => ({
        ...d,
        id: d.id || `concept-${i + 1}`,
        selected: false,
      }));
    }

    return NextResponse.json({
      success: true,
      concepts: parsed,
      confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.8,
      assumptions: Array.isArray(parsed.assumptions) ? parsed.assumptions : [],
    });
  } catch (error) {
    const message = toAgentErrorMessage(error, 'Agent request failed');
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
