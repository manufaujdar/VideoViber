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
 * Veo (Google Vertex AI) adapter stub.
 *
 * TODO: Implement actual Vertex AI Veo API calls.
 * See: https://cloud.google.com/vertex-ai/docs/generative-ai/video/overview
 */
export class VeoAdapter implements VideoProvider {
    readonly id = ProviderId.VEO;
    readonly name = 'Veo (Vertex AI)';

    constructor(private config: ProviderConfig) { }

    async isAvailable(): Promise<boolean> {
        return !!this.config.apiKey && !!this.config.projectId;
    }

    async generateTextToVideo(_input: TextToVideoInput): Promise<ProviderJobResult> {
        throw new Error('Veo adapter: generateTextToVideo not yet implemented');
    }

    async generateImageToVideo(_input: ImageToVideoInput): Promise<ProviderJobResult> {
        throw new Error('Veo adapter: generateImageToVideo not yet implemented');
    }

    async extendVideo(_input: ExtendVideoInput): Promise<ProviderJobResult> {
        throw new Error('Veo adapter: extendVideo not yet implemented');
    }

    async editVideo(_input: EditVideoInput): Promise<ProviderJobResult> {
        throw new Error('Veo adapter: editVideo not yet implemented');
    }

    async upscaleVideo(_input: UpscaleVideoInput): Promise<ProviderJobResult> {
        throw new Error('Veo adapter: upscaleVideo not yet implemented');
    }

    async getJobStatus(_providerJobId: string): Promise<ProviderJobStatus> {
        throw new Error('Veo adapter: getJobStatus not yet implemented');
    }

    async cancelJob(_providerJobId: string): Promise<void> {
        throw new Error('Veo adapter: cancelJob not yet implemented');
    }
}
