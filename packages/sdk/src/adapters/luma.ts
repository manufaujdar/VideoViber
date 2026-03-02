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
 * Luma adapter stub.
 *
 * TODO: Implement actual Luma API calls.
 * See: https://docs.lumalabs.ai/
 */
export class LumaAdapter implements VideoProvider {
    readonly id = ProviderId.LUMA;
    readonly name = 'Luma';

    constructor(private config: ProviderConfig) { }

    async isAvailable(): Promise<boolean> {
        return !!this.config.apiKey;
    }

    async generateTextToVideo(_input: TextToVideoInput): Promise<ProviderJobResult> {
        throw new Error('Luma adapter: generateTextToVideo not yet implemented');
    }

    async generateImageToVideo(_input: ImageToVideoInput): Promise<ProviderJobResult> {
        throw new Error('Luma adapter: generateImageToVideo not yet implemented');
    }

    async extendVideo(_input: ExtendVideoInput): Promise<ProviderJobResult> {
        throw new Error('Luma adapter: extendVideo not yet implemented');
    }

    async editVideo(_input: EditVideoInput): Promise<ProviderJobResult> {
        throw new Error('Luma adapter: editVideo not yet implemented');
    }

    async upscaleVideo(_input: UpscaleVideoInput): Promise<ProviderJobResult> {
        throw new Error('Luma adapter: upscaleVideo not yet implemented');
    }

    async getJobStatus(_providerJobId: string): Promise<ProviderJobStatus> {
        throw new Error('Luma adapter: getJobStatus not yet implemented');
    }

    async cancelJob(_providerJobId: string): Promise<void> {
        throw new Error('Luma adapter: cancelJob not yet implemented');
    }
}
