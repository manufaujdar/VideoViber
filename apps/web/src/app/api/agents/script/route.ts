import { NextResponse, type NextRequest } from 'next/server';
import { callGeminiAgent, parseAgentJson } from '../_shared/gemini';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { rawIdea, requirementReport, strategyBrief, contextBible, selectedConcept } = body;

    const systemPrompt = `You are a professional script writer for video production. Write a complete script draft based on the approved concept direction, strategy, and context bible.

Return as JSON with this exact structure:
{
  "hook": "The opening hook (first 3-5 seconds) — must grab attention immediately",
  "body": "The main body of the script with clear sections, transitions, and visual notes inline",
  "cta": "The call-to-action or closing statement",
  "fullScript": "The complete script combining hook + body + CTA as a continuous readable text",
  "visualNotes": "Separate section of visual direction notes for each script section",
  "confidence": 0.82,
  "assumptions": []
}

Writing rules:
- Keep the language natural and engaging
- Include [VISUAL:] markers for important visual cues
- Include [TRANSITION:] markers between sections
- Include [MUSIC:] markers for audio direction
- Match the tone and style specified in the context bible
- Respect the duration recommendation from the strategy
- The hook must be compelling within the first 3 seconds
- End with a clear, actionable CTA`;

    const userContent = [
      rawIdea ? `**Original Idea:** ${rawIdea}` : '',
      selectedConcept ? `**Selected Concept:** ${JSON.stringify(selectedConcept)}` : '',
      requirementReport ? `**Requirements:** ${JSON.stringify(requirementReport)}` : '',
      strategyBrief ? `**Strategy:** ${JSON.stringify(strategyBrief)}` : '',
      contextBible ? `**Context Bible:** ${JSON.stringify(contextBible)}` : '',
    ].filter(Boolean).join('\n\n');

    const result = await callGeminiAgent({
      systemPrompt,
      userContent,
      jsonMode: true,
      temperature: 0.75,
      maxOutputTokens: 4096,
    });

    const parsed = parseAgentJson<Record<string, unknown>>(result.content);

    return NextResponse.json({
      success: true,
      script: parsed,
      confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.82,
      assumptions: Array.isArray(parsed.assumptions) ? parsed.assumptions : [],
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Script writing failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
