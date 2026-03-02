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
 * Runway adapter stub.
 *
 * TODO: Implement actual Runway API calls when API keys are available.
 * See: https://docs.runwayml.com/
 */
export class RunwayAdapter implements VideoProvider {
    readonly id = ProviderId.RUNWAY;
    readonly name = 'Runway';

    constructor(private config: ProviderConfig) { }

    async isAvailable(): Promise<boolean> {
        return !!this.config.apiKey;
    }

    async generateTextToVideo(_input: TextToVideoInput): Promise<ProviderJobResult> {
        throw new Error('Runway adapter: generateTextToVideo not yet implemented');
    }

    async generateImageToVideo(_input: ImageToVideoInput): Promise<ProviderJobResult> {
        throw new Error('Runway adapter: generateImageToVideo not yet implemented');
    }

    async extendVideo(_input: ExtendVideoInput): Promise<ProviderJobResult> {
        throw new Error('Runway adapter: extendVideo not yet implemented');
    }

    async editVideo(_input: EditVideoInput): Promise<ProviderJobResult> {
        throw new Error('Runway adapter: editVideo not yet implemented');
    }

    async upscaleVideo(_input: UpscaleVideoInput): Promise<ProviderJobResult> {
        throw new Error('Runway adapter: upscaleVideo not yet implemented');
    }

    async getJobStatus(_providerJobId: string): Promise<ProviderJobStatus> {
        throw new Error('Runway adapter: getJobStatus not yet implemented');
    }

    async cancelJob(_providerJobId: string): Promise<void> {
        throw new Error('Runway adapter: cancelJob not yet implemented');
    }
}
