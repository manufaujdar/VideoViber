'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/* ─── Types ──────────────────────────────────────── */

export interface Shot {
  id: string;
  projectId: string;
  title: string;
  prompt: string;
  status: 'draft' | 'queued' | 'processing' | 'completed' | 'failed';
  provider: string;
  thumbnailUrl: string | null;
  videoUrl: string | null;
  duration: number; // seconds
  order: number;
  createdAt: string;
}

export interface Project {
  id: string;
  title: string;
  brief: string;
  provider: string;
  status: 'draft' | 'generating' | 'ready' | 'exported';
  shots: Shot[];
  createdAt: string;
  updatedAt: string;
}

export interface Asset {
  id: string;
  name: string;
  type: 'image' | 'video' | 'reference';
  url: string; // data URL or blob URL
  size: number; // bytes
  width?: number;
  height?: number;
  createdAt: string;
}

export interface Generation {
  id: string;
  projectId: string;
  projectTitle: string;
  shotId: string;
  shotTitle: string;
  provider: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress: number; // 0-100
  startedAt: string;
  completedAt: string | null;
  error: string | null;
}

export interface ApiKeyEntry {
  provider: string;
  maskedKey: string;
  connected: boolean;
  savedAt: string;
}

export interface UserSettings {
  displayName: string;
  defaultProvider: string;
  defaultResolution: string;
  autoSave: boolean;
}

/* ─── Store Interface ────────────────────────────── */

interface AppState {
  // Projects
  projects: Project[];
  addProject: (p: Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'status' | 'shots'> & { shots?: Shot[] }) => string;
  updateProject: (id: string, updates: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  getProject: (id: string) => Project | undefined;

  // Shots
  addShot: (projectId: string, shot: Omit<Shot, 'id' | 'createdAt'>) => void;
  updateShot: (projectId: string, shotId: string, updates: Partial<Shot>) => void;
  deleteShot: (projectId: string, shotId: string) => void;

  // Assets
  assets: Asset[];
  addAsset: (a: Omit<Asset, 'id' | 'createdAt'>) => void;
  deleteAsset: (id: string) => void;
  updateAsset: (id: string, updates: Partial<Asset>) => void;

  // Generations
  generations: Generation[];
  addGeneration: (g: Omit<Generation, 'id' | 'startedAt' | 'completedAt' | 'error'>) => string;
  updateGeneration: (id: string, updates: Partial<Generation>) => void;
  clearGenerations: () => void;

  // API Keys
  apiKeys: ApiKeyEntry[];
  saveApiKey: (provider: string, key: string) => void;
  removeApiKey: (provider: string) => void;

  // Settings
  settings: UserSettings;
  updateSettings: (updates: Partial<UserSettings>) => void;

  // Bulk
  deleteAllProjects: () => void;
}

/* ─── Helpers ────────────────────────────────────── */

const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
const now = () => new Date().toISOString();

/* ─── Store ──────────────────────────────────────── */

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      /* ── Projects ───────────────────────────── */
      projects: [],

      addProject: (p) => {
        const id = uid();
        const project: Project = {
          id,
          title: p.title,
          brief: p.brief,
          provider: p.provider,
          status: 'draft',
          shots: p.shots ?? [],
          createdAt: now(),
          updatedAt: now(),
        };
        set((s) => ({ projects: [project, ...s.projects] }));
        return id;
      },

      updateProject: (id, updates) =>
        set((s) => ({
          projects: s.projects.map((p) =>
            p.id === id ? { ...p, ...updates, updatedAt: now() } : p
          ),
        })),

      deleteProject: (id) =>
        set((s) => ({
          projects: s.projects.filter((p) => p.id !== id),
          generations: s.generations.filter((g) => g.projectId !== id),
        })),

      getProject: (id) => get().projects.find((p) => p.id === id),

      /* ── Shots ──────────────────────────────── */
      addShot: (projectId, shot) => {
        const newShot: Shot = { ...shot, id: uid(), createdAt: now() };
        set((s) => ({
          projects: s.projects.map((p) =>
            p.id === projectId ? { ...p, shots: [...p.shots, newShot], updatedAt: now() } : p
          ),
        }));
      },

      updateShot: (projectId, shotId, updates) =>
        set((s) => ({
          projects: s.projects.map((p) =>
            p.id === projectId
              ? {
                  ...p,
                  shots: p.shots.map((sh) => (sh.id === shotId ? { ...sh, ...updates } : sh)),
                  updatedAt: now(),
                }
              : p
          ),
        })),

      deleteShot: (projectId, shotId) =>
        set((s) => ({
          projects: s.projects.map((p) =>
            p.id === projectId
              ? { ...p, shots: p.shots.filter((sh) => sh.id !== shotId), updatedAt: now() }
              : p
          ),
        })),

      /* ── Assets ─────────────────────────────── */
      assets: [],

      addAsset: (a) => {
        const asset: Asset = { ...a, id: uid(), createdAt: now() };
        set((s) => ({ assets: [asset, ...s.assets] }));
      },

      deleteAsset: (id) => set((s) => ({ assets: s.assets.filter((a) => a.id !== id) })),

      updateAsset: (id, updates) =>
        set((s) => ({
          assets: s.assets.map((a) => (a.id === id ? { ...a, ...updates } : a)),
        })),

      /* ── Generations ────────────────────────── */
      generations: [],

      addGeneration: (g) => {
        const id = uid();
        const gen: Generation = {
          ...g,
          id,
          startedAt: now(),
          completedAt: null,
          error: null,
        };
        set((s) => ({ generations: [gen, ...s.generations] }));
        return id;
      },

      updateGeneration: (id, updates) =>
        set((s) => ({
          generations: s.generations.map((g) => (g.id === id ? { ...g, ...updates } : g)),
        })),

      clearGenerations: () => set({ generations: [] }),

      /* ── API Keys ───────────────────────────── */
      apiKeys: [],

      saveApiKey: (provider, key) => {
        const masked = '•'.repeat(key.length - 4) + key.slice(-4);
        set((s) => ({
          apiKeys: [
            ...s.apiKeys.filter((k) => k.provider !== provider),
            { provider, maskedKey: masked, connected: true, savedAt: now() },
          ],
        }));
      },

      removeApiKey: (provider) =>
        set((s) => ({ apiKeys: s.apiKeys.filter((k) => k.provider !== provider) })),

      /* ── Settings ───────────────────────────── */
      settings: {
        displayName: '',
        defaultProvider: 'runway',
        defaultResolution: '1080p',
        autoSave: true,
      },

      updateSettings: (updates) =>
        set((s) => ({ settings: { ...s.settings, ...updates } })),

      /* ── Bulk ───────────────────────────────── */
      deleteAllProjects: () => set({ projects: [], generations: [] }),
    }),
    {
      name: 'videoviber-store',
      version: 1,
    }
  )
);

/* ─── Shot Generation Simulator ──────────────────── */

const SAMPLE_THUMBNAILS = [
  'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360" fill="#1a1a2e"><rect width="640" height="360"/><circle cx="320" cy="180" r="60" fill="#7c3aed" opacity="0.6"/><circle cx="200" cy="120" r="30" fill="#a855f7" opacity="0.4"/><rect x="400" y="200" width="120" height="80" rx="10" fill="#6d28d9" opacity="0.3"/></svg>'),
  'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360" fill="#0f172a"><rect width="640" height="360"/><ellipse cx="320" cy="180" rx="200" ry="80" fill="#1e40af" opacity="0.4"/><circle cx="500" cy="100" r="40" fill="#3b82f6" opacity="0.5"/><rect x="50" y="250" width="200" height="60" rx="8" fill="#1d4ed8" opacity="0.3"/></svg>'),
  'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360" fill="#1a1a1a"><rect width="640" height="360"/><polygon points="320,80 480,280 160,280" fill="#059669" opacity="0.4"/><circle cx="480" cy="100" r="35" fill="#10b981" opacity="0.5"/><rect x="80" y="300" width="480" height="20" rx="4" fill="#065f46" opacity="0.3"/></svg>'),
  'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360" fill="#1c1917"><rect width="640" height="360"/><rect x="100" y="60" width="200" height="240" rx="12" fill="#c2410c" opacity="0.3"/><circle cx="450" cy="180" r="80" fill="#ea580c" opacity="0.4"/><rect x="350" y="300" width="200" height="30" rx="6" fill="#f97316" opacity="0.2"/></svg>'),
  'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360" fill="#18181b"><rect width="640" height="360"/><circle cx="160" cy="180" r="100" fill="#7c3aed" opacity="0.3"/><circle cx="460" cy="180" r="100" fill="#ec4899" opacity="0.3"/><circle cx="310" cy="180" r="60" fill="#a855f7" opacity="0.5"/></svg>'),
  'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360" fill="#0c0a09"><rect width="640" height="360"/><rect x="40" y="40" width="560" height="280" rx="16" fill="#292524" opacity="0.8"/><circle cx="320" cy="180" r="50" fill="#f59e0b" opacity="0.6"/><rect x="100" y="260" width="440" height="8" rx="4" fill="#78716c" opacity="0.3"/></svg>'),
];

const SHOT_TEMPLATES = [
  { title: 'Establishing Wide', prompt: 'Wide establishing shot showing the full scene with atmospheric lighting and subtle camera drift' },
  { title: 'Character Intro', prompt: 'Medium close-up introducing the main subject with shallow depth of field and warm tones' },
  { title: 'Detail Insert', prompt: 'Extreme close-up on a key detail with rack focus transition, cinematic color grading' },
  { title: 'Dynamic Action', prompt: 'Tracking shot following motion with smooth camera movement and dramatic lighting contrast' },
  { title: 'Atmospheric Mood', prompt: 'Slow pan across the environment with volumetric lighting, particles, and ambient atmosphere' },
  { title: 'Transition Bridge', prompt: 'Creative transition shot bridging two scenes with geometric wipes or matched movement' },
  { title: 'Closing Shot', prompt: 'Pull-back wide shot revealing the full context with fading light and resolution' },
  { title: 'Aerial Sweep', prompt: 'Drone-style aerial shot sweeping across the landscape with epic scale and golden hour lighting' },
];

export function generateShotsForProject(brief: string, provider: string, count = 5): Shot[] {
  const templates = [...SHOT_TEMPLATES].sort(() => Math.random() - 0.5).slice(0, count);
  return templates.map((t, i) => ({
    id: uid(),
    projectId: '',
    title: t.title,
    prompt: `${t.prompt}. Context: ${brief.slice(0, 80)}`,
    status: 'draft' as const,
    provider,
    thumbnailUrl: SAMPLE_THUMBNAILS[i % SAMPLE_THUMBNAILS.length] ?? null,
    videoUrl: null,
    duration: 3 + Math.floor(Math.random() * 5),
    order: i,
    createdAt: now(),
  }));
}

export async function simulateGeneration(
  store: AppState,
  projectId: string,
  shotId: string,
  genId: string
) {
  // Update shot status
  store.updateShot(projectId, shotId, { status: 'processing' });
  store.updateGeneration(genId, { status: 'processing', progress: 0 });

  // Simulate progress
  const steps = 8 + Math.floor(Math.random() * 6);
  for (let i = 1; i <= steps; i++) {
    await new Promise((r) => setTimeout(r, 300 + Math.random() * 400));
    store.updateGeneration(genId, { progress: Math.round((i / steps) * 100) });
  }

  // 90% success rate
  const success = Math.random() > 0.1;
  if (success) {
    const thumb = SAMPLE_THUMBNAILS[Math.floor(Math.random() * SAMPLE_THUMBNAILS.length)];
    store.updateShot(projectId, shotId, {
      status: 'completed',
      thumbnailUrl: thumb,
      videoUrl: thumb, // use same SVG as placeholder video
    });
    store.updateGeneration(genId, {
      status: 'completed',
      progress: 100,
      completedAt: now(),
    });
  } else {
    store.updateShot(projectId, shotId, { status: 'failed' });
    store.updateGeneration(genId, {
      status: 'failed',
      progress: 0,
      error: 'Generation failed — provider timeout. Try again.',
      completedAt: now(),
    });
  }

  // Update project status
  const project = store.getProject(projectId);
  if (project) {
    const allDone = project.shots.every((s) => s.status === 'completed' || s.status === 'failed');
    if (allDone) {
      store.updateProject(projectId, { status: 'ready' });
    }
  }
}
