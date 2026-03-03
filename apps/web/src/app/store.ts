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
  sourceType?: 'ai' | 'import';
  assetId?: string | null;
  sourceMimeType?: string | null;
  sourceSizeBytes?: number | null;
  importedAt?: string | null;
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
  mimeType?: string;
  duration?: number; // seconds for video/audio
  storageMode?: 'data-url' | 'object-url' | 'remote-url';
  projectId?: string | null;
  volatile?: boolean;
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
  addShot: (projectId: string, shot: Omit<Shot, 'id' | 'createdAt'>) => string;
  updateShot: (projectId: string, shotId: string, updates: Partial<Shot>) => void;
  deleteShot: (projectId: string, shotId: string) => void;

  // Assets
  assets: Asset[];
  addAsset: (a: Omit<Asset, 'id' | 'createdAt'>) => string;
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
        return newShot.id;
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
        return asset.id;
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
        defaultProvider: 'gemini',
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

/* ─── Shot Planning Scaffold ─────────────────────── */

const SHOT_PHASES = [
  'Establishing Context',
  'Character Focus',
  'Action Progression',
  'Tension Escalation',
  'Emotional Pivot',
  'Transition Bridge',
  'Climax Detail',
  'Resolution Frame',
];

function normalizeBrief(brief: string) {
  return brief.replace(/\s+/g, ' ').trim();
}

export function generateShotsForProject(brief: string, provider: string, count = 5): Shot[] {
  const normalizedBrief = normalizeBrief(brief);
  return Array.from({ length: count }).map((_, i) => ({
    id: uid(),
    projectId: '',
    title: SHOT_PHASES[i % SHOT_PHASES.length] ?? `Shot ${i + 1}`,
    prompt: `${normalizedBrief} Focus this shot on sequence beat ${i + 1} of ${count}.`,
    status: 'draft' as const,
    provider,
    thumbnailUrl: null,
    videoUrl: null,
    duration: 6,
    order: i,
    createdAt: now(),
  }));
}
