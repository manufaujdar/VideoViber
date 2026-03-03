import { ProviderId } from '@videoviber/types';

export type ProviderCatalogItem = {
  id: ProviderId;
  name: string;
  shortName: string;
  description: string;
  docsUrl: string;
  gradient: string;
  letter: string;
  envVars: string[];
};

export type ProviderRuntimeHealth = {
  id: ProviderId;
  configured: boolean;
  serverImplemented: boolean;
};

export const providerCatalog: ProviderCatalogItem[] = [
  {
    id: ProviderId.GEMINI,
    name: 'Gemini',
    shortName: 'Gemini',
    description: 'Google AI planner/generation endpoint',
    docsUrl: 'https://ai.google.dev/docs',
    gradient: 'from-blue-500/15 to-indigo-500/15',
    letter: 'G',
    envVars: ['GEMINI_API_KEY'],
  },
  {
    id: ProviderId.RUNWAY,
    name: 'Runway',
    shortName: 'Runway',
    description: 'Gen-3 Alpha cinematic generation',
    docsUrl: 'https://docs.runwayml.com/',
    gradient: 'from-violet-500/15 to-purple-500/15',
    letter: 'R',
    envVars: ['RUNWAY_API_KEY'],
  },
  {
    id: ProviderId.VEO,
    name: 'Veo (Vertex AI)',
    shortName: 'Veo',
    description: "Google's Veo through Vertex AI",
    docsUrl: 'https://cloud.google.com/vertex-ai/docs/generative-ai/video/overview',
    gradient: 'from-blue-500/15 to-cyan-500/15',
    letter: 'V',
    envVars: ['VEO_API_KEY', 'GOOGLE_CLOUD_PROJECT'],
  },
  {
    id: ProviderId.LUMA,
    name: 'Luma',
    shortName: 'Luma',
    description: 'Dream Machine video generation',
    docsUrl: 'https://docs.lumalabs.ai/',
    gradient: 'from-emerald-500/15 to-green-500/15',
    letter: 'L',
    envVars: ['LUMA_API_KEY'],
  },
];

export const defaultProviderRuntimeHealth: ProviderRuntimeHealth[] = providerCatalog.map(
  (provider) => ({
    id: provider.id,
    configured: false,
    serverImplemented: provider.id === ProviderId.GEMINI,
  })
);
