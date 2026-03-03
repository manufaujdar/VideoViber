import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/generate
 * 
 * Server-side API route for video generation via Gemini.
 * Uses the GEMINI_API_KEY from environment variables.
 */
export async function POST(request: NextRequest) {
    try {
        const apiKey = process.env.GEMINI_API_KEY;

        if (!apiKey) {
            return NextResponse.json(
                { error: 'Gemini API key not configured. Set GEMINI_API_KEY in environment variables.' },
                { status: 500 }
            );
        }

        const body = await request.json();
        const { prompt, provider = 'gemini', duration = 5, aspectRatio = '16:9' } = body;

        if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
            return NextResponse.json(
                { error: 'A prompt is required for video generation.' },
                { status: 400 }
            );
        }

        // Call Gemini API
        const endpoint = 'https://generativelanguage.googleapis.com/v1beta';
        const response = await fetch(
            `${endpoint}/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [
                        {
                            parts: [
                                {
                                    text: `You are a professional video production director. Create a detailed video production plan for the following creative brief. Include specific scene descriptions, camera angles, lighting setups, transitions, and timing for each shot.\n\nCreative Brief: ${prompt}\n\nDuration: ${duration} seconds\nAspect Ratio: ${aspectRatio}\nProvider: ${provider}\n\nProvide the response in a structured format with numbered shots.`,
                                },
                            ],
                        },
                    ],
                    generationConfig: {
                        temperature: 0.8,
                        maxOutputTokens: 2048,
                        topP: 0.95,
                    },
                }),
            }
        );

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`Gemini API error (${response.status}):`, errorText);
            return NextResponse.json(
                {
                    error: `Gemini API error: ${response.status}`,
                    details: errorText,
                },
                { status: response.status }
            );
        }

        const data = await response.json();

        // Extract the generated content
        const generatedContent =
            data?.candidates?.[0]?.content?.parts?.[0]?.text ?? null;

        const jobId = `gemini_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

        return NextResponse.json({
            success: true,
            jobId,
            provider: 'gemini',
            model: 'gemini-2.0-flash',
            status: 'completed',
            result: {
                content: generatedContent,
                prompt,
                duration,
                aspectRatio,
            },
            metadata: {
                finishReason: data?.candidates?.[0]?.finishReason,
                usage: data?.usageMetadata,
            },
        });
    } catch (error) {
        console.error('Generation API error:', error);
        return NextResponse.json(
            {
                error: 'Internal server error during generation.',
                details: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        );
    }
}

/**
 * GET /api/generate
 * Health check endpoint for the generation API.
 */
export async function GET() {
    const hasKey = !!process.env.GEMINI_API_KEY;
    return NextResponse.json({
        status: 'ok',
        provider: 'gemini',
        configured: hasKey,
        model: 'gemini-2.0-flash',
    });
}
