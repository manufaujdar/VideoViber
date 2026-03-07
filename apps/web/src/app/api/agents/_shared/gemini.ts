/* ─── Shared Gemini Agent Caller ─────────────────────────
 * Extracted from /api/generate/route.ts for reuse across
 * all agent API routes. Server-side only.
 * ──────────────────────────────────────────────────────── */

const GEMINI_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta';
const AGENT_MODEL = 'gemini-2.0-flash';

export type GeminiKeySource =
  | 'GEMINI_API_KEY'
  | 'GOOGLE_API_KEY'
  | 'GOOGLE_GENAI_API_KEY'
  | 'VEO_API_KEY';

export function resolveGeminiApiKeyInfo(): { apiKey: string; source?: GeminiKeySource } {
  if (process.env.GEMINI_API_KEY) return { apiKey: process.env.GEMINI_API_KEY, source: 'GEMINI_API_KEY' };
  if (process.env.GOOGLE_API_KEY) return { apiKey: process.env.GOOGLE_API_KEY, source: 'GOOGLE_API_KEY' };
  if (process.env.GOOGLE_GENAI_API_KEY) return { apiKey: process.env.GOOGLE_GENAI_API_KEY, source: 'GOOGLE_GENAI_API_KEY' };
  if (process.env.VEO_API_KEY) return { apiKey: process.env.VEO_API_KEY, source: 'VEO_API_KEY' };
  return { apiKey: '' };
}

export interface AgentCallOptions {
  systemPrompt: string;
  userContent: string;
  temperature?: number;
  maxOutputTokens?: number;
  jsonMode?: boolean;
}

export interface AgentResult {
  content: string;
  finishReason?: string;
  usage?: Record<string, unknown>;
}

async function fetchWithTimeout(url: string, init: RequestInit, timeoutMs: number) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

export async function callGeminiAgent(options: AgentCallOptions): Promise<AgentResult> {
  const { apiKey } = resolveGeminiApiKeyInfo();
  if (!apiKey) {
    throw new Error(
      'Gemini API key is not configured. Set GEMINI_API_KEY (or GOOGLE_API_KEY / GOOGLE_GENAI_API_KEY) and restart the server.'
    );
  }

  const generationConfig: Record<string, unknown> = {
    temperature: options.temperature ?? 0.7,
    topP: 0.95,
    maxOutputTokens: options.maxOutputTokens ?? 4096,
  };

  if (options.jsonMode) {
    generationConfig.responseMimeType = 'application/json';
  }

  const response = await fetchWithTimeout(
    `${GEMINI_ENDPOINT}/models/${AGENT_MODEL}:generateContent`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: options.systemPrompt }],
        },
        contents: [
          {
            parts: [{ text: options.userContent }],
          },
        ],
        generationConfig,
      }),
    },
    60_000
  );

  if (!response.ok) {
    const text = await response.text();
    let message = `Gemini request failed (${response.status})`;
    try {
      const parsed = JSON.parse(text);
      message = parsed?.error?.message || message;
    } catch { /* keep default */ }
    throw new Error(message);
  }

  const data = await response.json();
  const content = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
  const finishReason = data?.candidates?.[0]?.finishReason;

  return {
    content,
    finishReason,
    usage: data?.usageMetadata,
  };
}

/**
 * Parse a Gemini agent response that should be JSON.
 * Falls back to extracting JSON from markdown code fences.
 */
export function parseAgentJson<T>(content: string): T {
  // Try direct parse first
  try {
    return JSON.parse(content) as T;
  } catch { /* try extraction */ }

  // Try extracting from code fences
  const fenceMatch = content.match(/```(?:json)?\s*\n([\s\S]*?)\n```/);
  if (fenceMatch?.[1]) {
    try {
      return JSON.parse(fenceMatch[1]) as T;
    } catch { /* fall through */ }
  }

  // Last resort — find first { or [ and parse from there
  const firstBrace = content.indexOf('{');
  const firstBracket = content.indexOf('[');
  const start = firstBrace >= 0 && (firstBracket < 0 || firstBrace < firstBracket)
    ? firstBrace
    : firstBracket;

  if (start >= 0) {
    const substring = content.slice(start);
    try {
      return JSON.parse(substring) as T;
    } catch { /* fall through */ }
  }

  throw new Error('Failed to parse agent response as JSON.');
}
