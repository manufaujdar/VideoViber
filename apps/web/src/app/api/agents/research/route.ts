import { NextResponse, type NextRequest } from 'next/server';
import { callGeminiAgent, parseAgentJson } from '../_shared/gemini';
import { parseGuardedAgentBody } from '../_shared/request';
import { toAgentErrorMessage } from '../_shared/errors';

export async function POST(request: NextRequest) {
  try {
    const parsedRequest = await parseGuardedAgentBody(request, 'research');
    if (!parsedRequest.ok) {
      return parsedRequest.response;
    }

    const body = parsedRequest.body;
    const { rawIdea, targetPlatform, roughAudience, videoGoal, requirementReport } = body;

    const systemPrompt = `You are a trend and audience research agent for video content production. Research and analyze the following aspects for the given topic and audience:

1. Content trends on the target platform
2. Viral content structures and hook styles
3. Audience tone and communication patterns
4. Visual trends relevant to the topic
5. Content fatigue patterns (what to avoid)
6. Competitor/reference content structures
7. Effective pacing and formats

Return your analysis as JSON with this exact structure:
{
  "trendSummary": "Overview of relevant trends",
  "competitorSummary": "What similar/competing content looks like",
  "contentOpportunities": "Underexplored angles and opportunities",
  "anglesToAvoid": "Oversaturated or ineffective approaches",
  "recommendedDirections": "Top recommended narrative directions",
  "cards": [
    {
      "id": "unique-id",
      "title": "Card title",
      "description": "Detailed description",
      "category": "trend|competitor|opportunity|avoid|hook|style",
      "relevance": 0.9
    }
  ],
  "confidence": 0.75,
  "assumptions": ["Based on general platform trends", "No real-time data accessed"]
}

Generate 6-10 research cards. Be specific and actionable. Mark your confidence and assumptions clearly.`;

    const userContent = [
      `**Topic/Idea:** ${rawIdea || 'Not provided'}`,
      `**Platform:** ${targetPlatform || 'Not specified'}`,
      `**Audience:** ${roughAudience || 'Not specified'}`,
      `**Goal:** ${videoGoal || 'Not specified'}`,
      requirementReport ? `**Approved Requirement Report:** ${JSON.stringify(requirementReport)}` : '',
    ]
      .filter(Boolean)
      .join('\n');

    const result = await callGeminiAgent({
      systemPrompt,
      userContent,
      jsonMode: true,
      temperature: 0.8,
      maxOutputTokens: 4096,
    });

    const parsed = parseAgentJson<Record<string, unknown>>(result.content);

    // Ensure cards have selected=false
    if (Array.isArray(parsed.cards)) {
      parsed.cards = (parsed.cards as Array<Record<string, unknown>>).map((card, i) => ({
        ...card,
        id: card.id || `research-${i}`,
        selected: false,
      }));
    }

    return NextResponse.json({
      success: true,
      research: parsed,
      confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.75,
      assumptions: Array.isArray(parsed.assumptions) ? parsed.assumptions : ['Based on general knowledge, no real-time data accessed'],
    });
  } catch (error) {
    const message = toAgentErrorMessage(error, 'Agent request failed');
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
