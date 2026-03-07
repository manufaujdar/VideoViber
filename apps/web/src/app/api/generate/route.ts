import { ProviderId } from '@videoviber/types';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { guardApiRequest, parseJsonBodyWithLimit } from '@/app/api/_shared/request-guard';
import { redactSensitiveText, toPublicErrorMessage } from '@/lib/redaction';

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
  hint?: string;
  providerStatus?: string;
  httpStatus?: number;
  videoUri?: string;
  raw?: unknown;
};

const geminiEndpoint = 'https://generativelanguage.googleapis.com/v1beta';
const plannerModel = 'gemini-2.0-flash';
const defaultVeoModel = 'veo-3.1-generate-preview';
const veoSupportedDurations = [4, 6, 8] as const;
const veoSupportedAspectRatios = ['16:9', '9:16'] as const;
const MAX_JSON_BODY_BYTES = 64 * 1024;
const MAX_PROXY_VIDEO_BYTES = 250 * 1024 * 1024;
const OPERATION_NAME_PATTERN = /^(?:operations|projects\/[a-zA-Z0-9._-]+\/locations\/[a-zA-Z0-9._-]+\/operations)\/[a-zA-Z0-9._:-]+$/;
const ALLOWED_VIDEO_URI_HOSTS = new Set([
  'generativelanguage.googleapis.com',
  'storage.googleapis.com',
]);

type GeminiKeySource =
  | 'GEMINI_API_KEY'
  | 'GOOGLE_API_KEY'
  | 'GOOGLE_GENAI_API_KEY'
  | 'VEO_API_KEY';

type GeminiApiError = {
  httpStatus: number;
  status?: string;
  message?: string;
  rawText: string;
};

type GeminiDiagnostics = {
  checkedAt: string;
  keyConfigured: boolean;
  keySource?: GeminiKeySource;
  veoModel: string;
  plannerModel: string;
  keyValid: boolean;
  veoModelAvailable: boolean;
  veoLongRunningSupported: boolean;
  healthy: boolean;
  hint?: string;
  error?: string;
  providerStatus?: string;
};

const diagnosticsCacheTtlMs = 60_000;
let geminiDiagnosticsCache:
  | {
      keySignature: string;
      veoModel: string;
      expiresAt: number;
      value: GeminiDiagnostics;
    }
  | null = null;

function resolveGeminiApiKeyInfo(): { apiKey: string; source?: GeminiKeySource } {
  if (process.env.GEMINI_API_KEY) {
    return { apiKey: process.env.GEMINI_API_KEY, source: 'GEMINI_API_KEY' };
  }
  if (process.env.GOOGLE_API_KEY) {
    return { apiKey: process.env.GOOGLE_API_KEY, source: 'GOOGLE_API_KEY' };
  }
  if (process.env.GOOGLE_GENAI_API_KEY) {
    return { apiKey: process.env.GOOGLE_GENAI_API_KEY, source: 'GOOGLE_GENAI_API_KEY' };
  }
  if (process.env.VEO_API_KEY) {
    return { apiKey: process.env.VEO_API_KEY, source: 'VEO_API_KEY' };
  }

  return { apiKey: '' };
}

function resolveGeminiApiKey() {
  return resolveGeminiApiKeyInfo().apiKey;
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
  };
}

function buildVeoPrompt(input: GenerateRequest) {
  if (!input.negativePrompt) {
    return input.prompt;
  }

  return `${input.prompt}\n\nAvoid: ${input.negativePrompt}`;
}

function providerHealth() {
  const { apiKey: geminiApiKey } = resolveGeminiApiKeyInfo();

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
      model: resolveVeoModel(),
    },
    {
      id: ProviderId.LUMA,
      configured: Boolean(process.env.LUMA_API_KEY),
      serverImplemented: false,
    },
  ];
}

async function runGeminiDiagnostics(): Promise<GeminiDiagnostics> {
  const checkedAt = new Date().toISOString();
  const veoModel = resolveVeoModel();
  const { apiKey, source } = resolveGeminiApiKeyInfo();

  if (!apiKey) {
    return {
      checkedAt,
      keyConfigured: false,
      veoModel,
      plannerModel,
      keyValid: false,
      veoModelAvailable: false,
      veoLongRunningSupported: false,
      healthy: false,
      hint: 'Set GEMINI_API_KEY (or GOOGLE_API_KEY / GOOGLE_GENAI_API_KEY) and restart the server.',
    };
  }

  const signature = keySignature(apiKey);
  if (
    geminiDiagnosticsCache &&
    geminiDiagnosticsCache.keySignature === signature &&
    geminiDiagnosticsCache.veoModel === veoModel &&
    geminiDiagnosticsCache.expiresAt > Date.now()
  ) {
    return geminiDiagnosticsCache.value;
  }

  const base: GeminiDiagnostics = {
    checkedAt,
    keyConfigured: true,
    keySource: source,
    veoModel,
    plannerModel,
    keyValid: false,
    veoModelAvailable: false,
    veoLongRunningSupported: false,
    healthy: false,
  };

  try {
    const response = await fetchWithTimeout(
      `${geminiEndpoint}/models`,
      {
        method: 'GET',
        headers: {
          'x-goog-api-key': apiKey,
        },
      },
      12_000
    );

    if (!response.ok) {
      const error = await parseGeminiApiError(response);
      const result: GeminiDiagnostics = {
        ...base,
        error: error.message || `Gemini model-list request failed (${error.httpStatus}).`,
        providerStatus: error.status,
        hint: buildGeminiHint(error, ProviderId.GEMINI, veoModel),
      };

      geminiDiagnosticsCache = {
        keySignature: signature,
        veoModel,
        expiresAt: Date.now() + diagnosticsCacheTtlMs,
        value: result,
      };

      return result;
    }

    const payload = (await response.json()) as {
      models?: Array<{ name?: string; supportedGenerationMethods?: string[] }>;
    };
    const models = Array.isArray(payload?.models) ? payload.models : [];
    const modelName = `models/${veoModel}`;
    const veoModelMeta = models.find((model) => model?.name === modelName);
    const methods = Array.isArray(veoModelMeta?.supportedGenerationMethods)
      ? veoModelMeta.supportedGenerationMethods
      : [];
    const veoLongRunningSupported = methods.includes('predictLongRunning');

    const result: GeminiDiagnostics = {
      ...base,
      keyValid: true,
      veoModelAvailable: Boolean(veoModelMeta),
      veoLongRunningSupported,
      healthy: Boolean(veoModelMeta) && veoLongRunningSupported,
      hint:
        !veoModelMeta
          ? `Configured model "${veoModel}" was not found for this key.`
          : !veoLongRunningSupported
            ? `Model "${veoModel}" is visible but does not support predictLongRunning.`
            : undefined,
    };

    geminiDiagnosticsCache = {
      keySignature: signature,
      veoModel,
      expiresAt: Date.now() + diagnosticsCacheTtlMs,
      value: result,
    };

    return result;
  } catch (error) {
    const result: GeminiDiagnostics = {
      ...base,
      error: isAbortError(error)
        ? 'Gemini diagnostics request timed out.'
        : getErrorMessage(error, 'Gemini diagnostics request failed.'),
      hint: 'Verify outbound network access from the server and retry diagnostics.',
    };

    geminiDiagnosticsCache = {
      keySignature: signature,
      veoModel,
      expiresAt: Date.now() + diagnosticsCacheTtlMs,
      value: result,
    };

    return result;
  }
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
  return toPublicErrorMessage(error, fallback, 420);
}

function trimMessage(value: string | undefined, maxLength = 600) {
  if (!value) {
    return undefined;
  }
  const clean = redactSensitiveText(value, maxLength);
  if (clean.length <= maxLength) {
    return clean;
  }
  return `${clean.slice(0, maxLength - 1)}...`;
}

function buildGeminiHint(error: GeminiApiError, provider: ProviderId, model?: string) {
  const status = error.status?.toUpperCase();

  if (error.httpStatus === 401 || status === 'UNAUTHENTICATED') {
    return 'Gemini rejected the API key. Verify the key value and API restrictions, then restart the server.';
  }

  if (error.httpStatus === 403 || status === 'PERMISSION_DENIED') {
    return model
      ? `This key is not permitted to use model "${model}". Use a key with Veo access or switch GEMINI_VEO_MODEL.`
      : `This key is not permitted to access the ${provider} endpoint. Check account permissions and key restrictions.`;
  }

  if (error.httpStatus === 429 || status === 'RESOURCE_EXHAUSTED') {
    return 'Quota is exhausted for this key. Upgrade billing/limits or wait for quota reset, then retry.';
  }

  if (error.httpStatus === 400 || status === 'INVALID_ARGUMENT') {
    return model
      ? `The ${provider} request payload or model configuration was rejected. Validate prompt, aspect ratio, and GEMINI_VEO_MODEL (${model}).`
      : `The ${provider} request payload was rejected. Validate prompt/content format before retrying.`;
  }

  if (error.httpStatus >= 500) {
    return 'Gemini service returned a server error. Retry shortly.';
  }

  return undefined;
}

async function parseGeminiApiError(response: Response): Promise<GeminiApiError> {
  const rawText = await response.text();
  let parsedStatus: string | undefined;
  let parsedMessage: string | undefined;

  if (rawText) {
    try {
      const parsed = JSON.parse(rawText) as {
        error?: { status?: string; message?: string };
      };
      parsedStatus = parsed?.error?.status;
      parsedMessage = parsed?.error?.message;
    } catch {
      // Keep raw text fallback.
    }
  }

  return {
    httpStatus: response.status,
    status: parsedStatus,
    message: trimMessage(parsedMessage || rawText, 700),
    rawText: redactSensitiveText(rawText, 1800),
  };
}

function keySignature(apiKey: string) {
  if (apiKey.length <= 8) {
    return apiKey;
  }
  return apiKey.slice(-8);
}

function normalizeOperationName(value: string) {
  return value.replace(/^\/+/, '').trim();
}

function isValidOperationName(value: string) {
  const normalized = normalizeOperationName(value);
  return normalized.length <= 240 && OPERATION_NAME_PATTERN.test(normalized);
}

function redactGeminiDiagnostics(diagnostics: GeminiDiagnostics) {
  const { keySource: _keySource, ...rest } = diagnostics;
  return rest;
}

function parseVeoVideoUri(operation: unknown): string | undefined {
  const op = operation as Record<string, any>;

  const candidates = [
    op?.response?.generateVideoResponse?.generatedSamples?.[0]?.video?.uri,
    op?.response?.generateVideoResponse?.generatedSamples?.[0]?.video?.downloadUri,
    op?.response?.generateVideoResponse?.generatedSamples?.[0]?.video?.fileUri,
    op?.response?.generatedVideos?.[0]?.video?.uri,
    op?.response?.generatedVideos?.[0]?.video?.downloadUri,
    op?.response?.generatedVideos?.[0]?.video?.fileUri,
    op?.response?.videos?.[0]?.uri,
    op?.response?.videos?.[0]?.downloadUri,
    op?.response?.videos?.[0]?.fileUri,
    op?.response?.video?.uri,
    op?.response?.video?.downloadUri,
    op?.response?.video?.fileUri,
    op?.response?.output?.video?.uri,
    op?.response?.output?.video?.downloadUri,
    op?.response?.output?.video?.fileUri,
  ];

  return candidates.find((value): value is string => typeof value === 'string' && value.length > 0);
}

async function generateShotPlanWithGemini(input: GenerateRequest) {
  const { apiKey } = resolveGeminiApiKeyInfo();

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
      `${geminiEndpoint}/models/${plannerModel}:generateContent`,
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
    const apiError = await parseGeminiApiError(response);
    return NextResponse.json(
      {
        error: apiError.message || `Gemini API request failed (${response.status}).`,
        provider: ProviderId.GEMINI,
        model: plannerModel,
        providerStatus: apiError.status,
        hint: buildGeminiHint(apiError, ProviderId.GEMINI, plannerModel),
        details:
          process.env.NODE_ENV === 'development' ? trimMessage(apiError.rawText, 1200) : undefined,
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
    model: plannerModel,
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
  const { apiKey } = resolveGeminiApiKeyInfo();

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
  const diagnostics = await runGeminiDiagnostics();

  if (!diagnostics.keyValid) {
    return NextResponse.json(
      {
        error:
          diagnostics.error ||
          'Gemini key validation failed. Unable to confirm API access for Veo generation.',
        provider: ProviderId.VEO,
        model,
        providerStatus: diagnostics.providerStatus,
        hint: diagnostics.hint,
      },
      { status: 502 }
    );
  }

  if (!diagnostics.veoModelAvailable || !diagnostics.veoLongRunningSupported) {
    return NextResponse.json(
      {
        error: `Configured Veo model "${model}" is unavailable for the active API key.`,
        provider: ProviderId.VEO,
        model,
        hint:
          diagnostics.hint ||
          `Set GEMINI_VEO_MODEL to a model that supports predictLongRunning, then restart the server.`,
      },
      { status: 400 }
    );
  }

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
              prompt: buildVeoPrompt(input),
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
    const apiError = await parseGeminiApiError(response);
    return NextResponse.json(
      {
        error: apiError.message || `Veo request failed (${response.status}).`,
        provider: ProviderId.VEO,
        model,
        providerStatus: apiError.status,
        hint: buildGeminiHint(apiError, ProviderId.VEO, model),
        details:
          process.env.NODE_ENV === 'development' ? trimMessage(apiError.rawText, 1800) : undefined,
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
  const model = resolveVeoModel();
  const safeName = normalizeOperationName(operationName);

  if (!isValidOperationName(safeName)) {
    return {
      operationName: safeName || operationName,
      status: 'failed',
      details: 'Invalid operation name format.',
      httpStatus: 400,
    };
  }

  if (!apiKey) {
    return {
      operationName: safeName,
      status: 'failed',
      details:
        'Gemini API key missing on server. Set GEMINI_API_KEY or GOOGLE_API_KEY (or GOOGLE_GENAI_API_KEY) in production.',
      hint: 'Add a valid Gemini API key and restart the server before polling operation status.',
    };
  }
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
    const apiError = await parseGeminiApiError(response);
    return {
      operationName: safeName,
      status: 'failed',
      details: apiError.message || `Operation status request failed (${response.status}).`,
      providerStatus: apiError.status,
      httpStatus: response.status,
      hint: buildGeminiHint(apiError, ProviderId.VEO, model),
      raw:
        process.env.NODE_ENV === 'development'
          ? {
              error: trimMessage(apiError.rawText, 1200),
            }
          : undefined,
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
    const mappedHint =
      typeof operationError?.status === 'string'
        ? buildGeminiHint(
            {
              httpStatus: typeof operationError?.code === 'number' ? operationError.code : 502,
              status: operationError.status,
              message: details,
              rawText: JSON.stringify(operationError),
            },
            ProviderId.VEO,
            model
          )
        : undefined;

    return {
      operationName: safeName,
      status: 'failed',
      details,
      hint: mappedHint,
      providerStatus:
        typeof operationError?.status === 'string' ? operationError.status : undefined,
      httpStatus:
        typeof operationError?.code === 'number' ? operationError.code : undefined,
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
    hint: status.hint,
    providerStatus: status.providerStatus,
    httpStatus: status.httpStatus,
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

    if (parsed.username || parsed.password || parsed.port) {
      return false;
    }

    if (videoUri.length > 2000) {
      return false;
    }

    if (parsed.searchParams.has('key') || parsed.searchParams.has('x-goog-api-key')) {
      return false;
    }

    const host = parsed.hostname.toLowerCase();
    if (ALLOWED_VIDEO_URI_HOSTS.has(host)) {
      return parsed.pathname.startsWith('/v1beta/') || parsed.pathname.includes('/download/');
    }

    if (host.endsWith('.googleusercontent.com')) {
      return parsed.pathname.toLowerCase().includes('.mp4') || parsed.pathname.includes('/download/');
    }

    return false;
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
    const apiError = await parseGeminiApiError(response);
    return NextResponse.json(
      {
        error: apiError.message || `Failed to fetch generated video (${response.status}).`,
        providerStatus: apiError.status,
        hint: buildGeminiHint(apiError, ProviderId.VEO, resolveVeoModel()),
        details:
          process.env.NODE_ENV === 'development' ? trimMessage(apiError.rawText, 1200) : undefined,
      },
      { status: response.status }
    );
  }

  const contentType = response.headers.get('content-type') || 'video/mp4';
  const contentLength = response.headers.get('content-length');
  const normalizedType = contentType.toLowerCase();

  if (!normalizedType.startsWith('video/') && !normalizedType.includes('application/octet-stream')) {
    return NextResponse.json(
      {
        error: 'Unexpected response type from provider while fetching generated video.',
      },
      { status: 502 }
    );
  }

  if (contentLength) {
    const length = Number(contentLength);
    if (Number.isFinite(length) && length > MAX_PROXY_VIDEO_BYTES) {
      return NextResponse.json(
        {
          error: 'Generated video is too large to proxy safely.',
        },
        { status: 413 }
      );
    }
  }

  const headers = new Headers({
    'Content-Type': contentType,
    'Cache-Control': 'private, max-age=300',
    'X-Content-Type-Options': 'nosniff',
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
  const guard = guardApiRequest(request, {
    requireSameOrigin: true,
    requireSessionInProduction: true,
    rateLimit: {
      scope: 'api:generate:post',
      limit: 15,
      windowMs: 60_000,
    },
  });

  if (!guard.ok) {
    return guard.response;
  }

  try {
    const parsedBody = await parseJsonBodyWithLimit<Record<string, unknown>>(
      request,
      MAX_JSON_BODY_BYTES
    );
    if (!parsedBody.ok) {
      return parsedBody.response;
    }

    const parsed = requestSchema.safeParse(parsedBody.data);

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

      if (!isValidOperationName(input.operationName)) {
        return NextResponse.json(
          {
            error: 'operationName format is invalid.',
          },
          { status: 400 }
        );
      }

      const status = await getVeoOperationStatus(input.operationName);
      const statusCode =
        status.status === 'completed'
          ? 200
          : status.status === 'processing'
            ? 202
            : status.httpStatus && status.httpStatus >= 400 && status.httpStatus < 600
              ? status.httpStatus
              : 502;

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
            ? toPublicErrorMessage(error, 'Unknown error', 600)
            : undefined,
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const guard = guardApiRequest(request, {
    requireSameOrigin: true,
    requireSessionInProduction: true,
    rateLimit: {
      scope: 'api:generate:get',
      limit: 60,
      windowMs: 60_000,
    },
  });

  if (!guard.ok) {
    return guard.response;
  }

  try {
    const operationName = request.nextUrl.searchParams.get('operationName');
    const videoUri = request.nextUrl.searchParams.get('videoUri');
    const diagnosticsMode = request.nextUrl.searchParams.get('diagnostics');

    if (videoUri) {
      if (videoUri.length > 2000) {
        return NextResponse.json(
          {
            error: 'videoUri is too long.',
          },
          { status: 400 }
        );
      }
      return proxyGeneratedVideo(videoUri);
    }

    if (operationName) {
      if (!isValidOperationName(operationName)) {
        return NextResponse.json(
          {
            error: 'operationName format is invalid.',
          },
          { status: 400 }
        );
      }

      const status = await getVeoOperationStatus(operationName);
      const statusCode =
        status.status === 'completed'
          ? 200
          : status.status === 'processing'
            ? 202
            : status.httpStatus && status.httpStatus >= 400 && status.httpStatus < 600
              ? status.httpStatus
              : 502;

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
    const includeDeepDiagnostics = diagnosticsMode === 'deep' || diagnosticsMode === 'full';
    const geminiDiagnostics = includeDeepDiagnostics ? await runGeminiDiagnostics() : undefined;

    return NextResponse.json({
      status: 'ok',
      defaultProvider: ProviderId.GEMINI,
      providers,
      configuredProviders: providers.filter((p) => p.configured).map((p) => p.id),
      diagnostics: geminiDiagnostics
        ? {
            gemini: redactGeminiDiagnostics(geminiDiagnostics),
          }
        : undefined,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Failed to process diagnostics request.',
        details:
          process.env.NODE_ENV === 'development'
            ? toPublicErrorMessage(error, 'Unknown error', 600)
            : undefined,
      },
      { status: 500 }
    );
  }
}
