import { ProviderId } from '@videoviber/types';
import type {
    VideoProvider,
    ProviderConfig,
    TextToVideoInput,
    ImageToVideoInput,
    ExtendVideoInput,
    EditVideoInput,
    UpscaleVideoInput,
    ProviderJobResult,
    ProviderJobStatus,
} from '../provider';

/**
 * Gemini (Google AI) adapter.
 *
 * Uses the Gemini API for video generation capabilities.
 * See: https://ai.google.dev/docs
 */
export class GeminiAdapter implements VideoProvider {
    readonly id = ProviderId.GEMINI;
    readonly name = 'Gemini';

    constructor(private config: ProviderConfig) { }

    async isAvailable(): Promise<boolean> {
        return !!this.config.apiKey;
    }

    async generateTextToVideo(input: TextToVideoInput): Promise<ProviderJobResult> {
        const endpoint = this.config.baseUrl ??
            'https://generativelanguage.googleapis.com/v1beta';

        const response = await fetch(
            `${endpoint}/models/gemini-2.0-flash:generateContent?key=${this.config.apiKey}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [
                        {
                            parts: [
                                {
                                    text: `Generate a detailed video production plan for the following prompt. Include scene descriptions, camera angles, lighting, and timing:\n\n${input.prompt}${input.negative_prompt ? `\n\nAvoid: ${input.negative_prompt}` : ''}`,
                                },
                            ],
                        },
                    ],
                    generationConfig: {
                        temperature: 0.7,
                        maxOutputTokens: 2048,
                    },
                }),
            }
        );

        if (!response.ok) {
            const error = await response.text();
            return {
                provider_job_id: `gemini_err_${Date.now()}`,
                status: 'failed',
                error_message: `Gemini API error (${response.status}): ${error}`,
            };
        }

        const data = await response.json();
        const jobId = `gemini_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

        return {
            provider_job_id: jobId,
            status: 'completed',
            metadata: {
                model: 'gemini-2.0-flash',
                response: data,
                prompt: input.prompt,
                duration_seconds: input.duration_seconds ?? 5,
                aspect_ratio: input.aspect_ratio ?? '16:9',
            },
        };
    }

    async generateImageToVideo(_input: ImageToVideoInput): Promise<ProviderJobResult> {
        throw new Error('Gemini adapter: generateImageToVideo not yet implemented');
    }

    async extendVideo(_input: ExtendVideoInput): Promise<ProviderJobResult> {
        throw new Error('Gemini adapter: extendVideo not yet implemented');
    }

    async editVideo(_input: EditVideoInput): Promise<ProviderJobResult> {
        throw new Error('Gemini adapter: editVideo not yet implemented');
    }

    async upscaleVideo(_input: UpscaleVideoInput): Promise<ProviderJobResult> {
        throw new Error('Gemini adapter: upscaleVideo not yet implemented');
    }

    async getJobStatus(providerJobId: string): Promise<ProviderJobStatus> {
        // Gemini responses are synchronous, so completed jobs stay completed
        return {
            provider_job_id: providerJobId,
            status: 'completed',
            progress: 100,
        };
    }

    async cancelJob(_providerJobId: string): Promise<void> {
        // Gemini requests are synchronous — nothing to cancel
    }
}
