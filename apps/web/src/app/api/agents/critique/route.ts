import { NextResponse, type NextRequest } from 'next/server';
import { callGeminiAgent, parseAgentJson } from '../_shared/gemini';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { scriptDraft, requirementReport, strategyBrief, contextBible } = body;

    const systemPrompt = `You are a senior script critic and content quality reviewer. Analyze the provided script draft and generate a detailed critique report.

Score each dimension 1-10 and flag specific issues.

Return as JSON with this exact structure:
{
  "clarityScore": 8,
  "retentionScore": 7,
  "persuasionScore": 6,
  "flaggedLines": [
    {
      "line": "Exact text from the script that has an issue",
      "issue": "What's wrong with this line",
      "suggestion": "Specific improvement suggestion"
    }
  ],
  "overallFeedback": "2-3 paragraphs of overall critique covering strengths, weaknesses, and improvement priorities",
  "confidence": 0.85,
  "assumptions": []
}

Critique dimensions:
- **Clarity** (1-10): Is the message clear? No ambiguity?
- **Retention** (1-10): Will viewers stay engaged? Is the hook strong? Is pacing good?
- **Persuasion** (1-10): Will this achieve the stated goal? Is the CTA effective?

Be constructive but honest. Flag 3-6 specific lines with actionable improvements.`;

    const userContent = [
      scriptDraft ? `**Script to Critique:**\n${JSON.stringify(scriptDraft)}` : '',
      requirementReport ? `**Project Requirements:** ${JSON.stringify(requirementReport)}` : '',
      strategyBrief ? `**Strategy Brief:** ${JSON.stringify(strategyBrief)}` : '',
      contextBible ? `**Context Rules:** ${JSON.stringify(contextBible)}` : '',
    ].filter(Boolean).join('\n\n');

    const result = await callGeminiAgent({
      systemPrompt,
      userContent,
      jsonMode: true,
      temperature: 0.6,
      maxOutputTokens: 3072,
    });

    const parsed = parseAgentJson<Record<string, unknown>>(result.content);

    return NextResponse.json({
      success: true,
      critique: parsed,
      confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.85,
      assumptions: Array.isArray(parsed.assumptions) ? parsed.assumptions : [],
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Script critique failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
