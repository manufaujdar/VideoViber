import { NextResponse, type NextRequest } from 'next/server';
import { callGeminiAgent, parseAgentJson } from '../_shared/gemini';
import { parseGuardedAgentBody } from '../_shared/request';
import { toAgentErrorMessage } from '../_shared/errors';

export async function POST(request: NextRequest) {
  try {
    const parsedRequest = await parseGuardedAgentBody(request, 'qa');
    if (!parsedRequest.ok) {
      return parsedRequest.response;
    }

    const body = parsedRequest.body;
    const {
      strategyBrief,
      contextBible,
      scriptDraft,
      sceneBreakdown,
      shotPlan,
      audioPlan,
      skippedPages,
    } = body;

    const systemPrompt = `You are a QA production readiness auditor for AI video production.

Review the entire production pipeline and check for issues that could affect final video quality. Audit strategy alignment, missing assets, continuity gaps, weak prompts, and platform fit.

Return as JSON:
{
  "overallStatus": "ready | warnings | not_ready",
  "checks": [
    {
      "id": "check-1",
      "check": "Short name of what was checked",
      "status": "pass | warn | fail",
      "detail": "Explanation of the result and any recommendations"
    }
  ],
  "summary": "Overall readiness summary with key action items"
}

Run these checks:
1. Strategy Alignment — does the script follow the strategy brief goals?
2. Scene Coverage — does every scene have at least one shot?
3. Prompt Quality — are shot prompts specific enough (>100 chars with style/mood)?
4. Continuity Tags — are there consistent tags across related shots?
5. Audio Coverage — does every scene have at least background audio?
6. Duration Consistency — do shot durations sum to scene durations within 10%?
7. Missing Data — were any important steps skipped?
8. Platform Fit — does content duration match the target platform?
9. CTA Presence — does the script include a clear call-to-action?
10. Visual Diversity — are camera angles varied or repetitive?

Be strict but fair. Mark "fail" only for critical issues.`;

    const userContent = [
      strategyBrief ? `**Strategy:**\n${JSON.stringify(strategyBrief)}` : '',
      contextBible ? `**Context:**\n${JSON.stringify(contextBible)}` : '',
      scriptDraft ? `**Script:**\n${JSON.stringify(scriptDraft)}` : '',
      sceneBreakdown ? `**Scenes:**\n${JSON.stringify(sceneBreakdown)}` : '',
      shotPlan ? `**Shots:**\n${JSON.stringify(shotPlan)}` : '',
      audioPlan ? `**Audio:**\n${JSON.stringify(audioPlan)}` : '',
      skippedPages?.length ? `**Skipped Steps:** ${skippedPages.join(', ')}` : '',
    ].filter(Boolean).join('\n\n');

    const result = await callGeminiAgent({
      systemPrompt,
      userContent,
      jsonMode: true,
      temperature: 0.5,
      maxOutputTokens: 4096,
    });

    const parsed = parseAgentJson<Record<string, unknown>>(result.content);

    return NextResponse.json({
      success: true,
      readinessReport: parsed,
      confidence: 0.9,
      assumptions: [],
    });
  } catch (error) {
    const message = toAgentErrorMessage(error, 'Agent request failed');
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
