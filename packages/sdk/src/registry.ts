import type { ProviderId } from '@videoviber/types';
import type { VideoProvider, ProviderConfig } from './provider';
import { RunwayAdapter } from './adapters/runway';
import { VeoAdapter } from './adapters/veo';
import { LumaAdapter } from './adapters/luma';
import { GeminiAdapter } from './adapters/gemini';

/**
 * Factory function type for creating provider adapters.
 */
type ProviderFactory = (config: ProviderConfig) => VideoProvider;

/**
 * Provider Registry
 *
 * Central registry for all video provider adapters.
 * Uses a factory pattern so new providers can be registered
 * without changing any product logic.
 *
 * @example
 * ```ts
 * const registry = new ProviderRegistry();
 * const runway = registry.create('runway', { apiKey: 'sk-...' });
 * const result = await runway.generateTextToVideo({ prompt: '...' });
 * ```
 */
export class ProviderRegistry {
    private factories = new Map<string, ProviderFactory>();

    constructor() {
        // Register built-in adapters
        this.register('runway', (config) => new RunwayAdapter(config));
        this.register('veo', (config) => new VeoAdapter(config));
        this.register('luma', (config) => new LumaAdapter(config));
        this.register('gemini', (config) => new GeminiAdapter(config));
    }

    /**
     * Register a new provider adapter factory.
     * Call this to add custom or third-party providers.
     */
    register(providerId: string, factory: ProviderFactory): void {
        this.factories.set(providerId, factory);
    }

    /**
     * Create a provider adapter instance.
     */
    create(providerId: ProviderId | string, config: ProviderConfig): VideoProvider {
        const factory = this.factories.get(providerId);
        if (!factory) {
            throw new Error(
                `Unknown provider: ${providerId}. ` +
                `Available: ${Array.from(this.factories.keys()).join(', ')}`
            );
        }
        return factory(config);
    }

    /**
     * List all registered provider IDs.
     */
    listProviders(): string[] {
        return Array.from(this.factories.keys());
    }

    /**
     * Check if a provider is registered.
     */
    has(providerId: string): boolean {
        return this.factories.has(providerId);
    }
}

/** Singleton registry instance */
export const providerRegistry = new ProviderRegistry();
