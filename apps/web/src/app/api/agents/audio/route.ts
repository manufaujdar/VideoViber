import { NextResponse, type NextRequest } from 'next/server';
import { callGeminiAgent, parseAgentJson } from '../_shared/gemini';
import { parseGuardedAgentBody } from '../_shared/request';
import { toAgentErrorMessage } from '../_shared/errors';

export async function POST(request: NextRequest) {
  try {
    const parsedRequest = await parseGuardedAgentBody(request, 'audio');
    if (!parsedRequest.ok) {
      return parsedRequest.response;
    }

    const body = parsedRequest.body;
    const { sceneBreakdown, scriptDraft, contextBible } = body;

    const systemPrompt = `You are an audio director for video production. Plan all audio layers for the video: background music, sound effects, voiceover timings, and ambient sounds.

Return as JSON:
{
  "tracks": [
    {
      "id": "audio-1",
      "type": "music | sfx | voiceover | ambient",
      "label": "Short name for this track",
      "description": "What this track sounds like / its purpose",
      "startTime": 0,
      "duration": 5,
      "sceneId": "scene-1",
      "volume": 0.8,
      "source": "Description or suggestion (e.g., 'Upbeat electronic, 120 BPM')"
    }
  ],
  "voiceoverScript": "Full voiceover text with timing markers [0:00] ...",
  "musicMood": "Overall music mood and genre recommendation",
  "overallNotes": "General audio mixing notes, ducking instructions, etc.",
  "confidence": 0.8,
  "assumptions": []
}

Rules:
- Include at least one music track that spans the full video
- Add SFX for transitions and key moments
- Voiceover timing should align with scene changes
- Volume levels: music 0.5-0.7 (behind VO), VO 1.0, SFX 0.6-0.9
- Flag any scenes that need ambient sound`;

    const userContent = [
      sceneBreakdown ? `**Scenes:**\n${JSON.stringify(sceneBreakdown)}` : '',
      scriptDraft ? `**Script:**\n${JSON.stringify(scriptDraft)}` : '',
      contextBible ? `**Context:**\n${JSON.stringify(contextBible)}` : '',
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
      audioPlan: parsed,
      confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.8,
      assumptions: Array.isArray(parsed.assumptions) ? parsed.assumptions : [],
    });
  } catch (error) {
    const message = toAgentErrorMessage(error, 'Agent request failed');
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
