import { NextResponse, type NextRequest } from 'next/server';
import { callGeminiAgent, parseAgentJson } from '../_shared/gemini';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { requirementReport, researchSummary, rawIdea } = body;

    const systemPrompt = `You are a gap detection agent for video production projects. Analyze the project data so far and identify what critical information is still missing.

Check for these common gaps:
- Audience definition clarity
- Call-to-action strategy
- Visual direction specifics
- Brand voice/tone definition
- Delivery constraints (deadline, budget)
- Asset availability
- Technical requirements
- Content compliance/legal considerations
- Distribution strategy
- Performance metrics definition

Return your analysis as JSON with this exact structure:
{
  "items": [
    {
      "id": "gap-1",
      "area": "Area name (e.g., Audience Definition)",
      "description": "What's missing and why it matters",
      "severity": "critical|important|optional"
    }
  ],
  "summary": "Overall assessment of project readiness",
  "confidence": 0.85,
  "assumptions": []
}

Only flag genuine gaps. Don't create artificial problems. Mark severity accurately:
- critical = blocks production quality
- important = would significantly improve output
- optional = nice to have`;

    const userContent = [
      rawIdea ? `**Original Idea:** ${rawIdea}` : '',
      requirementReport ? `**Requirement Report:** ${JSON.stringify(requirementReport)}` : '',
      researchSummary ? `**Research Summary:** ${JSON.stringify(researchSummary)}` : '',
    ]
      .filter(Boolean)
      .join('\n\n');

    const result = await callGeminiAgent({
      systemPrompt,
      userContent,
      jsonMode: true,
      temperature: 0.6,
      maxOutputTokens: 2048,
    });

    const parsed = parseAgentJson<Record<string, unknown>>(result.content);

    // Ensure items have filled=false, skipped=false, userInput=''
    if (Array.isArray(parsed.items)) {
      parsed.items = (parsed.items as Array<Record<string, unknown>>).map((item, i) => ({
        ...item,
        id: item.id || `gap-${i}`,
        filled: false,
        skipped: false,
        userInput: '',
      }));
    }

    return NextResponse.json({
      success: true,
      gaps: parsed,
      confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.85,
      assumptions: Array.isArray(parsed.assumptions) ? parsed.assumptions : [],
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Gap detection failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
