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

const workflowIds = ['plan', 'video', 'video_status'] as const;

const requestSchema = z.object({
  prompt: z.string().trim().min(10).max(2000),
  provider: z.enum(providerIds).default(ProviderId.GEMINI),
  workflow: z.enum(workflowIds).default('plan'),
  duration: z.number().int().min(2).max(30).default(5),
  aspectRatio: z.enum(['16:9', '9:16', '1:1', '4:5', '21:9']).default('16:9'),
  shotCount: z.number().int().min(1).max(12).default(6),
  negativePrompt: z.string().trim().max(500).optional(),
  operationName: z.string().trim().min(6).max(240).optional(),
  waitForCompletion: z.boolean().default(true),
});

type GenerateRequest = z.infer<typeof requestSchema>;

type VeoStatusPayload = {
  operationName: string;
  status: 'processing' | 'completed' | 'failed';
  details?: string;
  videoUri?: string;
  raw?: unknown;
};

const geminiEndpoint = 'https://generativelanguage.googleapis.com/v1beta';
const defaultVeoModel = 'veo-3.1-generate-preview';
const veoSupportedDurations = [4, 6, 8] as const;
const veoSupportedAspectRatios = ['16:9', '9:16'] as const;

function resolveGeminiApiKey() {
  return (
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    process.env.GOOGLE_GENAI_API_KEY ||
    process.env.VEO_API_KEY ||
    ''
  );
}

function resolveVeoModel() {
  return process.env.GEMINI_VEO_MODEL || process.env.VEO_MODEL || defaultVeoModel;
}

function normalizeVeoDurationSeconds(duration: number) {
  return veoSupportedDurations.reduce((closest, value) =>
    Math.abs(value - duration) < Math.abs(closest - duration) ? value : closest
  );
}

function normalizeVeoAspectRatio(aspectRatio: GenerateRequest['aspectRatio']) {
  return (veoSupportedAspectRatios as readonly string[]).includes(aspectRatio)
    ? aspectRatio
    : '16:9';
}

function buildVeoParameters(input: GenerateRequest) {
  return {
    aspectRatio: normalizeVeoAspectRatio(input.aspectRatio),
    durationSeconds: normalizeVeoDurationSeconds(input.duration),
    ...(input.negativePrompt ? { negativePrompt: input.negativePrompt } : {}),
  };
}

function providerHealth() {
  const geminiApiKey = resolveGeminiApiKey();

  return [
    {
      id: ProviderId.GEMINI,
      configured: Boolean(geminiApiKey),
      serverImplemented: true,
    },
    {
      id: ProviderId.RUNWAY,
      configured: Boolean(process.env.RUNWAY_API_KEY),
      serverImplemented: false,
    },
    {
      id: ProviderId.VEO,
      configured: Boolean(geminiApiKey),
      serverImplemented: true,
    },
    {
      id: ProviderId.LUMA,
      configured: Boolean(process.env.LUMA_API_KEY),
      serverImplemented: false,
    },
  ];
}

async function fetchWithTimeout(input: string, init: RequestInit, timeoutMs: number) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(input, {
      ...init,
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(timeout);
  }
}

function isAbortError(error: unknown) {
  return error instanceof Error && error.name === 'AbortError';
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error && error.message.trim().length > 0 ? error.message : fallback;
}

function parseVeoVideoUri(operation: unknown): string | undefined {
  const op = operation as Record<string, any>;

  const candidates = [
    op?.response?.generateVideoResponse?.generatedSamples?.[0]?.video?.uri,
    op?.response?.generatedVideos?.[0]?.video?.uri,
    op?.response?.videos?.[0]?.uri,
    op?.response?.video?.uri,
    op?.response?.output?.video?.uri,
  ];

  return candidates.find((value): value is string => typeof value === 'string' && value.length > 0);
}

async function generateShotPlanWithGemini(input: GenerateRequest) {
  const apiKey = resolveGeminiApiKey();

  if (!apiKey) {
    return NextResponse.json(
      {
        error:
          'Gemini provider is not configured on the server. Set GEMINI_API_KEY or GOOGLE_API_KEY (or GOOGLE_GENAI_API_KEY) in production.',
        provider: ProviderId.GEMINI,
      },
      { status: 503 }
    );
  }

  let response: Response;
  try {
    response = await fetchWithTimeout(
      `${geminiEndpoint}/models/gemini-2.0-flash:generateContent`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey,
        },
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
      },
      25_000
    );
  } catch (error) {
    return NextResponse.json(
      {
        error: isAbortError(error)
          ? 'Gemini planning request timed out.'
          : 'Gemini planning request failed before a response was returned.',
        provider: ProviderId.GEMINI,
        details: process.env.NODE_ENV === 'development' ? getErrorMessage(error, 'Unknown error') : undefined,
      },
      { status: isAbortError(error) ? 504 : 502 }
    );
  }

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

  let data: any;
  try {
    data = await response.json();
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Gemini planning response was not valid JSON.',
        provider: ProviderId.GEMINI,
        details: process.env.NODE_ENV === 'development' ? getErrorMessage(error, 'Invalid JSON') : undefined,
      },
      { status: 502 }
    );
  }
  const generatedContent = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
  const jobId = `gemini_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  return NextResponse.json({
    success: true,
    provider: ProviderId.GEMINI,
    workflow: 'plan',
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
}

async function startVeoGenerationWithGemini(input: GenerateRequest) {
  const apiKey = resolveGeminiApiKey();

  if (!apiKey) {
    return NextResponse.json(
      {
        error:
          'Veo generation requires GEMINI_API_KEY or GOOGLE_API_KEY (or GOOGLE_GENAI_API_KEY) on the server. No compatible key was found.',
        provider: ProviderId.VEO,
      },
      { status: 503 }
    );
  }

  const model = resolveVeoModel();
  const parameters = buildVeoParameters(input);

  let response: Response;
  try {
    response = await fetchWithTimeout(
      `${geminiEndpoint}/models/${model}:predictLongRunning`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey,
        },
        body: JSON.stringify({
          instances: [
            {
              prompt: input.prompt,
            },
          ],
          parameters,
        }),
      },
      30_000
    );
  } catch (error) {
    return NextResponse.json(
      {
        error: isAbortError(error)
          ? 'Veo generation request timed out while starting the operation.'
          : 'Veo generation request failed before a response was returned.',
        provider: ProviderId.VEO,
        model,
        details: process.env.NODE_ENV === 'development' ? getErrorMessage(error, 'Unknown error') : undefined,
      },
      { status: isAbortError(error) ? 504 : 502 }
    );
  }

  if (!response.ok) {
    const errorText = await response.text();
    return NextResponse.json(
      {
        error: `Veo request failed (${response.status}).`,
        provider: ProviderId.VEO,
        model,
        details: process.env.NODE_ENV === 'development' ? errorText.slice(0, 1800) : undefined,
      },
      { status: response.status }
    );
  }

  let operation: any;
  try {
    operation = await response.json();
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Veo start response was not valid JSON.',
        provider: ProviderId.VEO,
        model,
        details: process.env.NODE_ENV === 'development' ? getErrorMessage(error, 'Invalid JSON') : undefined,
      },
      { status: 502 }
    );
  }
  const operationName = operation?.name;

  if (typeof operationName !== 'string' || operationName.length === 0) {
    return NextResponse.json(
      {
        error: 'Veo operation did not return a valid operation name.',
        provider: ProviderId.VEO,
        model,
        details: process.env.NODE_ENV === 'development' ? operation : undefined,
      },
      { status: 502 }
    );
  }

  return { operationName, model, parameters };
}

async function getVeoOperationStatus(operationName: string): Promise<VeoStatusPayload> {
  const apiKey = resolveGeminiApiKey();

  if (!apiKey) {
    return {
      operationName,
      status: 'failed',
      details:
        'Gemini API key missing on server. Set GEMINI_API_KEY or GOOGLE_API_KEY (or GOOGLE_GENAI_API_KEY) in production.',
    };
  }

  const safeName = operationName.replace(/^\/+/, '');
  let response: Response;
  try {
    response = await fetchWithTimeout(
      `${geminiEndpoint}/${safeName}`,
      {
        method: 'GET',
        headers: {
          'x-goog-api-key': apiKey,
        },
      },
      20_000
    );
  } catch (error) {
    return {
      operationName: safeName,
      status: 'failed',
      details: isAbortError(error)
        ? 'Operation status request timed out.'
        : `Operation status request failed before a response was returned. ${
            process.env.NODE_ENV === 'development' ? getErrorMessage(error, 'Unknown error') : ''
          }`.trim(),
    };
  }

  if (!response.ok) {
    const details = await response.text();
    return {
      operationName: safeName,
      status: 'failed',
      details: `Operation status request failed (${response.status}). ${
        process.env.NODE_ENV === 'development' ? details.slice(0, 1200) : ''
      }`.trim(),
    };
  }

  let operation: any;
  try {
    operation = await response.json();
  } catch (error) {
    return {
      operationName: safeName,
      status: 'failed',
      details: `Operation status response was not valid JSON. ${
        process.env.NODE_ENV === 'development' ? getErrorMessage(error, 'Invalid JSON') : ''
      }`.trim(),
    };
  }
  const isDone = Boolean(operation?.done);
  const operationError = operation?.error;

  if (!isDone) {
    return {
      operationName: safeName,
      status: 'processing',
      raw: process.env.NODE_ENV === 'development' ? operation : undefined,
    };
  }

  if (operationError) {
    const details =
      operationError?.message ||
      operationError?.status ||
      'The Veo operation finished with an error response.';

    return {
      operationName: safeName,
      status: 'failed',
      details,
      raw: process.env.NODE_ENV === 'development' ? operation : undefined,
    };
  }

  const videoUri = parseVeoVideoUri(operation);
  if (!videoUri) {
    return {
      operationName: safeName,
      status: 'failed',
      details:
        'Veo completed the operation but no video URI was present in the response payload.',
      raw: process.env.NODE_ENV === 'development' ? operation : undefined,
    };
  }

  return {
    operationName: safeName,
    status: 'completed',
    videoUri,
    raw: process.env.NODE_ENV === 'development' ? operation : undefined,
  };
}

async function pollVeoOperation(operationName: string, maxWaitMs = 45_000): Promise<VeoStatusPayload> {
  const start = Date.now();
  let attempts = 0;

  while (Date.now() - start < maxWaitMs) {
    const status = await getVeoOperationStatus(operationName);

    if (status.status === 'completed' || status.status === 'failed') {
      return status;
    }

    attempts += 1;

    // Back off slightly between polls.
    const delayMs = Math.min(2000 + attempts * 350, 4500);
    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }

  return {
    operationName,
    status: 'processing',
    details: 'Operation is still processing. Poll operation status to continue tracking progress.',
  };
}

function buildVideoResult(status: VeoStatusPayload) {
  const proxyUrl =
    status.videoUri &&
    `/api/generate?videoUri=${encodeURIComponent(status.videoUri)}&operationName=${encodeURIComponent(
      status.operationName
    )}`;

  return {
    operationName: status.operationName,
    status: status.status,
    details: status.details,
    video: status.videoUri
      ? {
          uri: status.videoUri,
          proxyUrl,
        }
      : null,
    raw: status.raw,
  };
}

function isAllowedGoogleVideoUri(videoUri: string) {
  try {
    const parsed = new URL(videoUri);
    if (parsed.protocol !== 'https:') {
      return false;
    }

    return (
      parsed.hostname === 'generativelanguage.googleapis.com' ||
      parsed.hostname.endsWith('.googleapis.com')
    );
  } catch {
    return false;
  }
}

async function proxyGeneratedVideo(videoUri: string) {
  const apiKey = resolveGeminiApiKey();

  if (!apiKey) {
    return NextResponse.json(
      {
        error:
          'Video proxy is unavailable because Gemini API key is missing on the server.',
      },
      { status: 503 }
    );
  }

  if (!isAllowedGoogleVideoUri(videoUri)) {
    return NextResponse.json(
      {
        error: 'Invalid video URI. Only Google-hosted generated video URIs are supported.',
      },
      { status: 400 }
    );
  }

  let response: Response;
  try {
    response = await fetchWithTimeout(
      videoUri,
      {
        method: 'GET',
        headers: {
          'x-goog-api-key': apiKey,
        },
      },
      25_000
    );
  } catch (error) {
    return NextResponse.json(
      {
        error: isAbortError(error)
          ? 'Generated video fetch timed out.'
          : 'Generated video fetch failed before a response was returned.',
        details: process.env.NODE_ENV === 'development' ? getErrorMessage(error, 'Unknown error') : undefined,
      },
      { status: isAbortError(error) ? 504 : 502 }
    );
  }

  if (!response.ok) {
    const details = await response.text();
    return NextResponse.json(
      {
        error: `Failed to fetch generated video (${response.status}).`,
        details: process.env.NODE_ENV === 'development' ? details.slice(0, 1200) : undefined,
      },
      { status: response.status }
    );
  }

  const contentType = response.headers.get('content-type') || 'video/mp4';
  const contentLength = response.headers.get('content-length');

  const headers = new Headers({
    'Content-Type': contentType,
    'Cache-Control': 'private, max-age=300',
  });

  if (contentLength) {
    headers.set('Content-Length', contentLength);
  }

  return new Response(response.body, {
    status: 200,
    headers,
  });
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

    if (input.workflow === 'video_status') {
      if (!input.operationName) {
        return NextResponse.json(
          {
            error: 'operationName is required for workflow "video_status".',
          },
          { status: 400 }
        );
      }

      const status = await getVeoOperationStatus(input.operationName);
      const statusCode =
        status.status === 'completed' ? 200 : status.status === 'processing' ? 202 : 502;

      return NextResponse.json(
        {
          success: status.status !== 'failed',
          provider: ProviderId.VEO,
          workflow: 'video_status',
          ...buildVideoResult(status),
        },
        { status: statusCode }
      );
    }

    if (input.workflow === 'plan') {
      if (input.provider === ProviderId.RUNWAY || input.provider === ProviderId.LUMA) {
        return NextResponse.json(
          {
            error: `${input.provider} planning adapter is not implemented yet.`,
            provider: input.provider,
            supportedProviders: [ProviderId.GEMINI, ProviderId.VEO],
          },
          { status: 501 }
        );
      }

      return generateShotPlanWithGemini(input);
    }

    if (input.workflow === 'video') {
      if (
        input.provider !== ProviderId.GEMINI &&
        input.provider !== ProviderId.VEO
      ) {
        return NextResponse.json(
          {
            error: `${input.provider} video adapter is not implemented yet.`,
            provider: input.provider,
            supportedProviders: [ProviderId.GEMINI, ProviderId.VEO],
          },
          { status: 501 }
        );
      }

      const started = await startVeoGenerationWithGemini(input);
      if (started instanceof NextResponse) {
        return started;
      }

      if (!input.waitForCompletion) {
        return NextResponse.json(
          {
            success: true,
            provider: ProviderId.VEO,
            workflow: 'video',
            model: started.model,
            parameters: started.parameters,
            operationName: started.operationName,
            status: 'processing',
            result: buildVideoResult({
              operationName: started.operationName,
              status: 'processing',
            }),
          },
          { status: 202 }
        );
      }

      const status = await pollVeoOperation(started.operationName);
      const statusCode =
        status.status === 'completed' ? 200 : status.status === 'processing' ? 202 : 502;

      return NextResponse.json(
        {
          success: status.status !== 'failed',
          provider: ProviderId.VEO,
          workflow: 'video',
          model: started.model,
          parameters: started.parameters,
          status: status.status,
          result: buildVideoResult(status),
        },
        { status: statusCode }
      );
    }

    return NextResponse.json(
      {
        error: 'Unsupported workflow.',
      },
      { status: 400 }
    );
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

export async function GET(request: NextRequest) {
  try {
    const operationName = request.nextUrl.searchParams.get('operationName');
    const videoUri = request.nextUrl.searchParams.get('videoUri');

    if (videoUri) {
      return proxyGeneratedVideo(videoUri);
    }

    if (operationName) {
      const status = await getVeoOperationStatus(operationName);
      const statusCode =
        status.status === 'completed' ? 200 : status.status === 'processing' ? 202 : 502;

      return NextResponse.json(
        {
          success: status.status !== 'failed',
          provider: ProviderId.VEO,
          workflow: 'video_status',
          ...buildVideoResult(status),
        },
        { status: statusCode }
      );
    }

    const providers = providerHealth();

    return NextResponse.json({
      status: 'ok',
      defaultProvider: ProviderId.GEMINI,
      providers,
      configuredProviders: providers.filter((p) => p.configured).map((p) => p.id),
      keyHints: {
        gemini: ['GEMINI_API_KEY', 'GOOGLE_API_KEY', 'GOOGLE_GENAI_API_KEY', 'VEO_API_KEY'],
        veoModel: resolveVeoModel(),
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Failed to process diagnostics request.',
        details:
          process.env.NODE_ENV === 'development' ? getErrorMessage(error, 'Unknown error') : undefined,
      },
      { status: 500 }
    );
  }
}
