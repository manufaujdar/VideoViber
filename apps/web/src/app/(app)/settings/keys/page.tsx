'use client';

import { useState } from 'react';
import { useAppStore } from '@/app/store';
import { toast } from 'sonner';

const providers = [
  {
    id: 'gemini',
    name: 'Gemini',
    description: 'Google AI — Fast, powerful multimodal video generation',
    docsUrl: 'https://ai.google.dev/docs',
    gradient: 'from-blue-500/15 to-indigo-500/15',
    letter: 'G',
  },
  {
    id: 'runway',
    name: 'Runway',
    description: 'Gen-3 Alpha — High quality cinematic video generation',
    docsUrl: 'https://docs.runwayml.com/',
    gradient: 'from-violet-500/15 to-purple-500/15',
    letter: 'R',
  },
  {
    id: 'veo',
    name: 'Veo (Vertex AI)',
    description: "Google's video generation model via Vertex AI",
    docsUrl: 'https://cloud.google.com/vertex-ai/docs/generative-ai/video/overview',
    gradient: 'from-blue-500/15 to-cyan-500/15',
    letter: 'V',
  },
  {
    id: 'luma',
    name: 'Luma',
    description: 'Dream Machine — Fast, creative video generation',
    docsUrl: 'https://docs.lumalabs.ai/',
    gradient: 'from-emerald-500/15 to-green-500/15',
    letter: 'L',
  },
];

export default function ApiKeysPage() {
  const apiKeys = useAppStore((s) => s.apiKeys);
  const saveApiKey = useAppStore((s) => s.saveApiKey);
  const removeApiKey = useAppStore((s) => s.removeApiKey);

  const [inputKeys, setInputKeys] = useState<Record<string, string>>({});

  const handleSave = (providerId: string) => {
    const key = inputKeys[providerId]?.trim();
    if (!key || key.length < 8) {
      toast.error('API key must be at least 8 characters');
      return;
    }
    saveApiKey(providerId, key);
    setInputKeys((prev) => ({ ...prev, [providerId]: '' }));
    toast.success(`${providerId} API key saved`);
  };

  const handleRemove = (providerId: string) => {
    removeApiKey(providerId);
    toast.success(`${providerId} API key removed`);
  };

  return (
    <div className="animate-fade-in-up mx-auto max-w-2xl space-y-8">
      <div>
        <div className="vv-badge bg-accent/10 text-accent mb-3">Integrations</div>
        <h1 className="text-2xl font-bold tracking-tight">API Keys & Providers</h1>
        <p className="text-vv-secondary mt-2 text-sm leading-relaxed">
          Bring your own API keys to generate video. This build currently stores keys in your local
          app state only.
        </p>
      </div>

      {/* Info Banner */}
      <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-5 backdrop-blur-sm">
        <div className="flex gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400">
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
              />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-blue-400">BYOK — Bring Your Own Key</p>
            <p className="text-vv-secondary mt-1 text-sm leading-relaxed">
              Use your own provider credentials for generation. Server-side encrypted storage is
              planned when Supabase key management is fully wired.
            </p>
          </div>
        </div>
      </div>

      {/* Provider Cards */}
      <div className="space-y-4">
        {providers.map((provider) => {
          const keyEntry = apiKeys.find((k) => k.provider === provider.id);
          const isConnected = keyEntry?.connected ?? false;
          return (
            <div key={provider.id} className="vv-card-hover">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${provider.gradient} text-accent ring-accent/10 text-lg font-bold ring-1`}
                  >
                    {provider.letter}
                  </div>
                  <div>
                    <h3 className="font-bold">{provider.name}</h3>
                    <p className="text-vv-secondary mt-0.5 text-sm">{provider.description}</p>
                    <a
                      href={provider.docsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-accent hover:text-accent-hover mt-2 inline-flex items-center gap-1 text-xs font-medium transition-colors"
                    >
                      View API Docs
                      <svg
                        className="h-3 w-3"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25"
                        />
                      </svg>
                    </a>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {isConnected ? (
                    <>
                      <span className="vv-badge bg-success/10 text-success">
                        <span className="bg-success h-1.5 w-1.5 rounded-full" />
                        Connected
                      </span>
                      <span className="text-vv-muted font-mono text-xs">{keyEntry?.maskedKey}</span>
                      <button
                        onClick={() => handleRemove(provider.id)}
                        className="vv-btn-ghost px-3 py-1.5 text-xs text-red-400 hover:text-red-300"
                      >
                        Remove
                      </button>
                    </>
                  ) : (
                    <span className="vv-badge text-vv-muted bg-white/5">Not connected</span>
                  )}
                </div>
              </div>

              {/* Key Input */}
              {!isConnected && (
                <div className="mt-5 flex gap-3 border-t border-white/5 pt-5">
                  <input
                    type="password"
                    value={inputKeys[provider.id] || ''}
                    onChange={(e) =>
                      setInputKeys((prev) => ({ ...prev, [provider.id]: e.target.value }))
                    }
                    onKeyDown={(e) => e.key === 'Enter' && handleSave(provider.id)}
                    placeholder={`Enter your ${provider.name} API key`}
                    className="vv-input flex-1"
                  />
                  <button onClick={() => handleSave(provider.id)} className="vv-btn-primary">
                    Save Key
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Security Note */}
      <div className="bg-vv-surface/50 rounded-xl border border-white/5 p-5 backdrop-blur-sm">
        <div className="mb-3 flex items-center gap-2">
          <svg
            className="text-accent h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
            />
          </svg>
          <h3 className="text-vv-secondary text-sm font-bold">Security</h3>
        </div>
        <ul className="text-vv-muted space-y-2 text-sm">
          {[
            'Keys are masked in the UI after save',
            'Current demo mode keeps keys in local state only',
            'Only the last 4 characters are shown for verification',
            'You can revoke keys at any time',
          ].map((item) => (
            <li key={item} className="flex items-center gap-2">
              <svg
                className="text-success h-3.5 w-3.5 shrink-0"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
              {item}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
