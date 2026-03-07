import { NextResponse, type NextRequest } from 'next/server';
import { callGeminiAgent, parseAgentJson } from '../_shared/gemini';
import { parseGuardedAgentBody } from '../_shared/request';
import { toAgentErrorMessage } from '../_shared/errors';

export async function POST(request: NextRequest) {
  try {
    const parsedRequest = await parseGuardedAgentBody(request, 'strategy');
    if (!parsedRequest.ok) {
      return parsedRequest.response;
    }

    const body = parsedRequest.body;
    const { requirementReport, researchSummary, rawIdea, targetPlatform, videoGoal } = body;

    const systemPrompt = `You are a strategic content planner for video production. Create a comprehensive strategic plan based on the approved project requirements and research.

Generate a strategic plan in JSON format with this exact structure:
{
  "contentObjective": "Clear, measurable content objective",
  "narrativeStrategy": "Detailed narrative strategy — how to tell this story effectively",
  "viewerJourney": "Describe the emotional/informational journey viewers should take",
  "videoStyle": "Specific visual and editing style recommendations",
  "durationRecommendation": "Recommended duration with reasoning based on platform and content type",
  "contentArchitecture": "Structural breakdown — intro, sections, transitions, conclusion",
  "confidence": 0.82,
  "assumptions": []
}

Be specific, professional, and creative. Use production terminology where appropriate.`;

    const userContent = [
      rawIdea ? `**Original Idea:** ${rawIdea}` : '',
      targetPlatform ? `**Platform:** ${targetPlatform}` : '',
      videoGoal ? `**Goal:** ${videoGoal}` : '',
      requirementReport ? `**Approved Requirements:** ${JSON.stringify(requirementReport)}` : '',
      researchSummary ? `**Research Findings:** ${JSON.stringify(researchSummary)}` : '',
    ]
      .filter(Boolean)
      .join('\n\n');

    const result = await callGeminiAgent({
      systemPrompt,
      userContent,
      jsonMode: true,
      temperature: 0.75,
      maxOutputTokens: 3072,
    });

    const parsed = parseAgentJson<Record<string, unknown>>(result.content);

    return NextResponse.json({
      success: true,
      strategy: parsed,
      confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.82,
      assumptions: Array.isArray(parsed.assumptions) ? parsed.assumptions : [],
    });
  } catch (error) {
    const message = toAgentErrorMessage(error, 'Agent request failed');
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
