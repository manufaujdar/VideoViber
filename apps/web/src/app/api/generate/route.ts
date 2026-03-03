import { ProviderId } from '@videoviber/types';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const providerIds = [
  ProviderId.GEMINI,
  ProviderId.RUNWAY,
  ProviderId.VEO,
  ProviderId.LUMA,
] as const;

const requestSchema = z.object({
  prompt: z.string().trim().min(10).max(2000),
  provider: z.enum(providerIds).default(ProviderId.GEMINI),
  duration: z.number().int().min(2).max(30).default(5),
  aspectRatio: z.enum(['16:9', '9:16', '1:1', '4:5', '21:9']).default('16:9'),
  shotCount: z.number().int().min(1).max(12).default(6),
  negativePrompt: z.string().trim().max(500).optional(),
});

type GenerateRequest = z.infer<typeof requestSchema>;

function providerHealth() {
  return [
    {
      id: ProviderId.GEMINI,
      configured: Boolean(process.env.GEMINI_API_KEY),
      serverImplemented: true,
    },
    {
      id: ProviderId.RUNWAY,
      configured: Boolean(process.env.RUNWAY_API_KEY),
      serverImplemented: false,
    },
    {
      id: ProviderId.VEO,
      configured: Boolean(process.env.VEO_API_KEY) && Boolean(process.env.GOOGLE_CLOUD_PROJECT),
      serverImplemented: false,
    },
    {
      id: ProviderId.LUMA,
      configured: Boolean(process.env.LUMA_API_KEY),
      serverImplemented: false,
    },
  ];
}

async function generateWithGemini(input: GenerateRequest) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      {
        error: 'Gemini provider is not configured on the server.',
        provider: ProviderId.GEMINI,
      },
      { status: 503 }
    );
  }

  const endpoint = 'https://generativelanguage.googleapis.com/v1beta';
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 25_000);

  try {
    const response = await fetch(
      `${endpoint}/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: [
                    'You are a senior video planner for a professional AI video editor.',
                    `Create exactly ${input.shotCount} numbered shots for this brief.`,
                    'Return output as one shot per line in this format:',
                    '1. <Short Title>: <Prompt sentence with camera, lighting, motion, and style details>',
                    '',
                    `Creative Brief: ${input.prompt}`,
                    `Shot Duration Target: ${input.duration} seconds`,
                    `Aspect Ratio: ${input.aspectRatio}`,
                    input.negativePrompt ? `Avoid: ${input.negativePrompt}` : '',
                  ]
                    .filter(Boolean)
                    .join('\n'),
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.7,
            topP: 0.95,
            maxOutputTokens: 2500,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        {
          error: `Gemini API request failed (${response.status}).`,
          provider: ProviderId.GEMINI,
          details: process.env.NODE_ENV === 'development' ? errorText.slice(0, 1200) : undefined,
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    const generatedContent = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    const jobId = `gemini_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    return NextResponse.json({
      success: true,
      provider: ProviderId.GEMINI,
      model: 'gemini-2.0-flash',
      jobId,
      status: 'completed',
      result: {
        content: generatedContent,
        prompt: input.prompt,
        shotCount: input.shotCount,
        duration: input.duration,
        aspectRatio: input.aspectRatio,
      },
      metadata: {
        finishReason: data?.candidates?.[0]?.finishReason,
        usage: data?.usageMetadata,
      },
    });
  } catch (error) {
    const isAbort = error instanceof Error && error.name === 'AbortError';
    return NextResponse.json(
      {
        error: isAbort
          ? 'Provider request timed out. Try reducing prompt complexity and retry.'
          : 'Internal error while planning shots.',
        provider: ProviderId.GEMINI,
        details:
          process.env.NODE_ENV === 'development' && error instanceof Error
            ? error.message
            : undefined,
      },
      { status: isAbort ? 504 : 500 }
    );
  } finally {
    clearTimeout(timeout);
  }
}

export async function POST(request: NextRequest) {
  try {
    const json = await request.json();
    const parsed = requestSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: 'Invalid request payload.',
          issues: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const input = parsed.data;

    if (input.provider !== ProviderId.GEMINI) {
      return NextResponse.json(
        {
          error: `${input.provider} server adapter is not implemented yet.`,
          provider: input.provider,
          supportedProviders: [ProviderId.GEMINI],
        },
        { status: 501 }
      );
    }

    return generateWithGemini(input);
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Failed to process generation request.',
        details:
          process.env.NODE_ENV === 'development' && error instanceof Error
            ? error.message
            : undefined,
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  const providers = providerHealth();

  return NextResponse.json({
    status: 'ok',
    defaultProvider: ProviderId.GEMINI,
    providers,
    configuredProviders: providers.filter((p) => p.configured).map((p) => p.id),
  });
}
