import { NextResponse, type NextRequest } from 'next/server';
import { callGeminiAgent, parseAgentJson } from '../_shared/gemini';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { rawIdea, targetPlatform, roughAudience, videoGoal, preferredStyle, referenceLinks } = body;

    if (!rawIdea || typeof rawIdea !== 'string' || rawIdea.trim().length < 5) {
      return NextResponse.json({ error: 'Please provide a video idea (at least 5 characters).' }, { status: 400 });
    }

    const systemPrompt = `You are a senior video production requirement analyst. Your job is to convert a raw user idea into a comprehensive, structured project requirement report.

Analyze the user's idea and generate a detailed report in JSON format with this exact structure:
{
  "projectObjective": "Clear objective of the video project",
  "audienceUnderstanding": "Analysis of the target audience, their preferences, pain points, and expectations",
  "contentFormat": "Recommended content format (e.g., short-form reel, long-form explainer, etc.)",
  "recommendedDuration": "Recommended video duration with reasoning",
  "visualStyleDirections": "2-3 visual style suggestions that match the concept",
  "scriptStructure": "Recommended script structure (hook, body, CTA, etc.)",
  "assetRequirements": "What assets will likely be needed (footage, graphics, music, VO, etc.)",
  "missingInformation": "What information is missing that would improve the project",
  "musicEffectDirection": "Suggested music style, sound effects, overall audio direction",
  "productionRisks": "Potential risks in production (e.g., technical limitations, content compliance, scope creep)",
  "platformRecommendations": "Platform-specific recommendations for the target platform",
  "suggestedWorkflow": "Step-by-step recommended workflow for this project type",
  "confidence": 0.85,
  "assumptions": ["assumption 1", "assumption 2"]
}

Be specific, actionable, and professional. Infer what you can from the input, and clearly list all assumptions you are making.`;

    const userContent = [
      `**Raw Idea:** ${rawIdea.trim()}`,
      targetPlatform ? `**Target Platform:** ${targetPlatform}` : '',
      roughAudience ? `**Target Audience:** ${roughAudience}` : '',
      videoGoal ? `**Video Goal:** ${videoGoal}` : '',
      preferredStyle ? `**Preferred Style:** ${preferredStyle}` : '',
      referenceLinks?.length > 0 ? `**Reference Links:** ${referenceLinks.join(', ')}` : '',
    ]
      .filter(Boolean)
      .join('\n');

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
      report: parsed,
      confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.8,
      assumptions: Array.isArray(parsed.assumptions) ? parsed.assumptions : [],
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Requirement analysis failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
