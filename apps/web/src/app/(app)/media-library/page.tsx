'use client';

import { useMemo, useState } from 'react';
import { toast } from 'sonner';

type TabId = 'images' | 'videos';

type MediaSource = {
  id: string;
  name: string;
  description: string;
  url: string;
  license: string;
  licenseUrl: string;
  attribution: string;
  gradient: string;
};

const imageSources: MediaSource[] = [
  {
    id: 'unsplash',
    name: 'Unsplash',
    description: 'Beautiful, free images and photos from the world\'s most generous community of photographers',
    url: 'https://unsplash.com',
    license: 'Unsplash License (Free commercial use)',
    licenseUrl: 'https://unsplash.com/license',
    attribution: 'Credit: "Photo by [Photographer] on Unsplash" (appreciated but not required)',
    gradient: 'from-gray-500/15 to-slate-500/15',
  },
  {
    id: 'pexels',
    name: 'Pexels',
    description: 'Free stock photos, royalty-free images & videos shared by creators worldwide',
    url: 'https://pexels.com',
    license: 'Pexels License (Free commercial use)',
    licenseUrl: 'https://pexels.com/license/',
    attribution: 'Credit: "Photo by [Photographer] from Pexels" (appreciated but not required)',
    gradient: 'from-green-500/15 to-emerald-500/15',
  },
  {
    id: 'pixabay-images',
    name: 'Pixabay',
    description: 'Over 4 million high-quality stock images, videos, and music shared by the community',
    url: 'https://pixabay.com',
    license: 'Pixabay Content License (Free)',
    licenseUrl: 'https://pixabay.com/service/license-summary/',
    attribution: 'No attribution required. Credit is appreciated.',
    gradient: 'from-lime-500/15 to-green-500/15',
  },
  {
    id: 'stocksnap',
    name: 'StockSnap',
    description: 'Beautiful free stock photos with no watermarks. Hundreds of high-resolution images added weekly.',
    url: 'https://stocksnap.io',
    license: 'CC0 (Public Domain)',
    licenseUrl: 'https://stocksnap.io/license',
    attribution: 'No attribution required (CC0 public domain)',
    gradient: 'from-blue-500/15 to-indigo-500/15',
  },
  {
    id: 'burst',
    name: 'Burst by Shopify',
    description: 'Free stock photos for websites and commercial use. High-resolution, business-focused imagery.',
    url: 'https://burst.shopify.com',
    license: 'CC0 / Shopify Licensed (Free commercial)',
    licenseUrl: 'https://burst.shopify.com/legal/terms',
    attribution: 'No attribution required. Shopify\'s free stock photo platform.',
    gradient: 'from-teal-500/15 to-cyan-500/15',
  },
];

const videoSources: MediaSource[] = [
  {
    id: 'pexels-videos',
    name: 'Pexels Videos',
    description: 'Free stock videos from Pexels — cinematic footage for any creative project',
    url: 'https://pexels.com/videos',
    license: 'Pexels License (Free commercial use)',
    licenseUrl: 'https://pexels.com/license/',
    attribution: 'Credit: "Video by [Creator] from Pexels" (appreciated but not required)',
    gradient: 'from-green-500/15 to-emerald-500/15',
  },
  {
    id: 'pixabay-videos',
    name: 'Pixabay Videos',
    description: 'Free stock footage from Pixabay — nature, technology, abstract, and more',
    url: 'https://pixabay.com/videos',
    license: 'Pixabay Content License (Free)',
    licenseUrl: 'https://pixabay.com/service/license-summary/',
    attribution: 'No attribution required. Credit is appreciated.',
    gradient: 'from-lime-500/15 to-green-500/15',
  },
  {
    id: 'coverr',
    name: 'Coverr',
    description: 'Beautiful free stock video footage for your homepage, product pages, and social media',
    url: 'https://coverr.co',
    license: 'Coverr License (Free commercial)',
    licenseUrl: 'https://coverr.co/license',
    attribution: 'No attribution required. Free for personal and commercial use.',
    gradient: 'from-purple-500/15 to-violet-500/15',
  },
  {
    id: 'mixkit',
    name: 'Mixkit',
    description: 'High-quality stock videos, music, and templates — free for commercial use',
    url: 'https://mixkit.co',
    license: 'Mixkit License (Free commercial)',
    licenseUrl: 'https://mixkit.co/license/',
    attribution: 'No attribution required. Completely free for commercial projects.',
    gradient: 'from-rose-500/15 to-pink-500/15',
  },
  {
    id: 'videvo',
    name: 'Videvo',
    description: 'Free and premium stock footage, motion graphics, and sound effects',
    url: 'https://videvo.net',
    license: 'Videvo Attribution License / Royalty-Free (varies)',
    licenseUrl: 'https://www.videvo.net/license-agreement/',
    attribution: 'Some clips require credit: "Video by [Creator] from Videvo". Check per clip.',
    gradient: 'from-amber-500/15 to-orange-500/15',
  },
];

function MediaSourceCard({ source }: { source: MediaSource }) {
  return (
    <div className="vv-card-hover glass-strong border-white/5 space-y-3">
      <div className="flex items-center gap-3">
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${source.gradient} text-sm font-bold ring-1 ring-white/10`}>
          {source.name.charAt(0)}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-sm">{source.name}</p>
        </div>
      </div>
      <p className="text-xs text-vv-secondary leading-relaxed">{source.description}</p>

      {/* License & Attribution */}
      <div className="space-y-2 border-t border-white/5 pt-3">
        <div className="flex items-start justify-between gap-2 text-xs">
          <span className="text-vv-muted shrink-0">License:</span>
          <a href={source.licenseUrl} target="_blank" rel="noopener noreferrer" className="text-right text-cyan-400 hover:text-cyan-300 underline underline-offset-2 transition-colors">
            {source.license}
          </a>
        </div>
        <div className="rounded-lg bg-white/[0.02] px-3 py-2 text-[11px] text-vv-muted ring-1 ring-white/5">
          <span className="text-amber-300/80 font-semibold">Credit: </span>{source.attribution}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 pt-1">
        <a
          href={source.url}
          target="_blank"
          rel="noopener noreferrer"
          className="vv-btn-secondary flex-1 justify-center text-xs py-2"
        >
          Browse ↗
        </a>
        <button
          onClick={() => toast.success(`Open your file picker to import from ${source.name}.`)}
          className="vv-btn-primary flex-1 justify-center text-xs py-2"
        >
          Import
        </button>
      </div>
    </div>
  );
}

export default function MediaLibraryPage() {
  const [activeTab, setActiveTab] = useState<TabId>('images');

  const activeSources = useMemo(
    () => (activeTab === 'images' ? imageSources : videoSources),
    [activeTab]
  );

  const tabs: { id: TabId; label: string; count: number; icon: React.ReactNode }[] = [
    {
      id: 'images',
      label: 'Stock Images',
      count: imageSources.length,
      icon: (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5a2.25 2.25 0 002.25-2.25V5.25a2.25 2.25 0 00-2.25-2.25H3.75a2.25 2.25 0 00-2.25 2.25v13.5a2.25 2.25 0 002.25 2.25z" />
        </svg>
      ),
    },
    {
      id: 'videos',
      label: 'Stock Videos',
      count: videoSources.length,
      icon: (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="animate-fade-in-up space-y-6">
      {/* Header */}
      <div>
        <div className="vv-badge bg-pink-500/10 text-pink-300 mb-3 font-mono tracking-widest">Studio</div>
        <h1 className="text-3xl font-bold tracking-tight">Media Library</h1>
        <p className="text-vv-secondary mt-2 text-sm leading-relaxed">
          Browse and import royalty-free images and videos from trusted open-source libraries. All sources include license details and attribution requirements.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 rounded-xl bg-white/[0.03] p-1 ring-1 ring-white/10">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-accent/10 text-accent shadow-sm ring-1 ring-accent/20'
                : 'text-vv-secondary hover:text-vv-primary hover:bg-white/[0.03]'
            }`}
          >
            {tab.icon}
            {tab.label}
            <span className="ml-1 rounded-md bg-white/10 px-1.5 py-0.5 text-[10px] font-mono">{tab.count}</span>
          </button>
        ))}
      </div>

      {/* Source Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {activeSources.map((source) => (
          <MediaSourceCard key={source.id} source={source} />
        ))}
      </div>

      {/* Credits & Legal Reference */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-vv-muted">Credits & Legal References</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <p className="text-xs font-semibold text-white">Image Sources</p>
            {imageSources.map((s) => (
              <div key={s.id} className="flex items-center justify-between text-xs">
                <span className="text-vv-secondary">{s.name}</span>
                <a href={s.licenseUrl} target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:text-cyan-300 underline underline-offset-2">{s.license}</a>
              </div>
            ))}
          </div>
          <div className="space-y-2">
            <p className="text-xs font-semibold text-white">Video Sources</p>
            {videoSources.map((s) => (
              <div key={s.id} className="flex items-center justify-between text-xs">
                <span className="text-vv-secondary">{s.name}</span>
                <a href={s.licenseUrl} target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:text-cyan-300 underline underline-offset-2">{s.license}</a>
              </div>
            ))}
          </div>
        </div>
        <div className="border-t border-white/5 pt-3">
          <p className="text-xs text-vv-muted leading-relaxed">
            <strong className="text-amber-300/80">Disclaimer:</strong> Always verify the license terms for each individual asset before using it in a commercial production.
            Some assets may require attribution even on platforms that generally do not. VideoViber does not claim ownership of third-party media
            and provides these links as a convenience. Users are responsible for compliance with each platform&apos;s terms of service.
          </p>
        </div>
      </div>
    </div>
  );
}
