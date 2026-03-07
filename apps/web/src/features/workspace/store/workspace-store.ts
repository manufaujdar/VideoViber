'use client';

import { create } from 'zustand';
import { getSupabaseBrowserClient, isSupabaseConfigured } from '@/lib/supabase-browser';
import { createSerializedMutationQueue } from './mutation-queue';
import {
  appendShotToProject,
  createGenerationRecord,
  createProjectRecord,
  patchGenerationCollection,
  patchProjectCollection,
  patchShotInProject,
  removeShotFromProject,
} from './workspace-state-service';

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
  starred: boolean;
  archivedAt: string | null;
  status: 'draft' | 'generating' | 'ready' | 'exported';
  shots: Shot[];
  createdAt: string;
  updatedAt: string;
}

export interface Asset {
  id: string;
  name: string;
  type: 'image' | 'video' | 'reference';
  url: string;
  size: number;
  mimeType?: string;
  duration?: number;
  storageMode?: 'data-url' | 'object-url' | 'remote-url';
  storagePath?: string;
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
  progress: number;
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

export interface AppState {
  initialized: boolean;
  initializing: boolean;
  backendReady: boolean;
  lastSyncError: string | null;
  initializeWorkspace: () => Promise<void>;
  refreshWorkspace: () => Promise<void>;

  // Projects
  projects: Project[];
  addProject: (p: { title: string; brief: string; provider: string; shots?: Shot[] }) => string;
  updateProject: (id: string, updates: Partial<Project>) => void;
  renameProject: (id: string, title: string) => void;
  toggleProjectStar: (id: string) => void;
  archiveProject: (id: string) => void;
  restoreProject: (id: string) => void;
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

  // API Keys (local-only display state)
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

const DEFAULT_SETTINGS: UserSettings = {
  displayName: '',
  defaultProvider: 'gemini',
  defaultResolution: '1080p',
  autoSave: true,
};

const now = () => new Date().toISOString();
const uid = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
};

const projectSceneById = new Map<string, string>();

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error && error.message.trim().length > 0 ? error.message : fallback;
}

function isLikelyDirectAssetUrl(value: string) {
  return value.startsWith('http://') || value.startsWith('https://') || value.startsWith('data:');
}

function isStorageObjectPath(value: string) {
  return value.length > 0 && !value.startsWith('http://') && !value.startsWith('https://') && !value.startsWith('data:') && !value.startsWith('blob:');
}

function toProjectStatus(dbStatus: string | null | undefined): Project['status'] {
  switch (dbStatus) {
    case 'generating':
    case 'planning':
    case 'exporting':
      return 'generating';
    case 'editing':
      return 'ready';
    case 'exported':
      return 'exported';
    default:
      return 'draft';
  }
}

function toDbProjectStatus(status: Project['status']) {
  switch (status) {
    case 'generating':
      return 'generating';
    case 'ready':
      return 'editing';
    case 'exported':
      return 'exported';
    default:
      return 'draft';
  }
}

function toShotStatus(dbStatus: string | null | undefined): Shot['status'] {
  switch (dbStatus) {
    case 'queued':
      return 'queued';
    case 'processing':
      return 'processing';
    case 'completed':
      return 'completed';
    case 'failed':
      return 'failed';
    default:
      return 'draft';
  }
}

function toGenerationStatus(dbStatus: string | null | undefined): Generation['status'] {
  switch (dbStatus) {
    case 'processing':
      return 'processing';
    case 'completed':
      return 'completed';
    case 'failed':
    case 'canceled':
    case 'expired':
      return 'failed';
    default:
      return 'queued';
  }
}

function toDbGenerationStatus(status: Generation['status']) {
  switch (status) {
    case 'processing':
      return 'processing';
    case 'completed':
      return 'completed';
    case 'failed':
      return 'failed';
    default:
      return 'queued';
  }
}

function toDbAssetType(type: Asset['type']) {
  if (type === 'image') return 'image';
  if (type === 'video') return 'video';
  return 'document';
}

function toAssetType(dbType: string | null | undefined): Asset['type'] {
  if (dbType === 'image') return 'image';
  if (dbType === 'video') return 'video';
  return 'reference';
}

function trimProjectUpdateInput(updates: Partial<Project>) {
  const payload: Record<string, unknown> = {};

  if (typeof updates.title === 'string') payload.title = updates.title.trim();
  if (typeof updates.brief === 'string') payload.vibe_brief = updates.brief;
  if (typeof updates.provider === 'string') payload.provider = updates.provider;
  if (typeof updates.starred === 'boolean') payload.starred = updates.starred;
  if (typeof updates.archivedAt === 'string' || updates.archivedAt === null) {
    payload.archived_at = updates.archivedAt;
  }
  if (updates.status) payload.status = toDbProjectStatus(updates.status);

  return payload;
}

function trimShotUpdateInput(updates: Partial<Shot>) {
  const payload: Record<string, unknown> = {};

  if (typeof updates.title === 'string') {
    payload.title = updates.title;
    payload.purpose = updates.title;
  }
  if (typeof updates.prompt === 'string') payload.prompt = updates.prompt;
  if (updates.status) payload.status = updates.status;
  if (typeof updates.provider === 'string') payload.provider_choice = updates.provider;
  if (typeof updates.thumbnailUrl === 'string' || updates.thumbnailUrl === null) {
    payload.thumbnail_url = updates.thumbnailUrl;
  }
  if (typeof updates.videoUrl === 'string' || updates.videoUrl === null) {
    payload.video_url = updates.videoUrl;
  }
  if (typeof updates.duration === 'number' && Number.isFinite(updates.duration)) {
    payload.duration_target = updates.duration;
  }
  if (typeof updates.order === 'number' && Number.isFinite(updates.order)) {
    payload.order_index = updates.order;
  }
  if (typeof updates.sourceType === 'string') payload.source_type = updates.sourceType;
  if (typeof updates.assetId === 'string' || updates.assetId === null) payload.asset_id = updates.assetId;
  if (typeof updates.sourceMimeType === 'string' || updates.sourceMimeType === null) {
    payload.source_mime_type = updates.sourceMimeType;
  }
  if (typeof updates.sourceSizeBytes === 'number' || updates.sourceSizeBytes === null) {
    payload.source_size_bytes = updates.sourceSizeBytes ?? null;
  }
  if (typeof updates.importedAt === 'string' || updates.importedAt === null) {
    payload.imported_at = updates.importedAt;
  }

  return payload;
}

function trimAssetUpdateInput(updates: Partial<Asset>) {
  const payload: Record<string, unknown> = {};

  if (typeof updates.name === 'string') payload.original_filename = updates.name;
  if (typeof updates.url === 'string') payload.public_url = updates.url;
  if (typeof updates.storagePath === 'string') payload.storage_path = updates.storagePath;
  if (typeof updates.size === 'number' && Number.isFinite(updates.size)) payload.size_bytes = updates.size;
  if (typeof updates.mimeType === 'string') payload.mime_type = updates.mimeType;
  if (typeof updates.duration === 'number') payload.duration_ms = Math.round(updates.duration * 1000);
  if (typeof updates.width === 'number' || updates.width === null) payload.width = updates.width ?? null;
  if (typeof updates.height === 'number' || updates.height === null) payload.height = updates.height ?? null;
  if (typeof updates.projectId === 'string' || updates.projectId === null) payload.project_id = updates.projectId;

  return payload;
}

function getProjectFallbackProvider(projects: Project[], projectId: string) {
  return projects.find((project) => project.id === projectId)?.provider || 'gemini';
}

async function resolveAssetUrl(supabase: ReturnType<typeof getSupabaseBrowserClient>, storagePath: string, publicUrl: string | null) {
  if (publicUrl && publicUrl.length > 0) {
    return publicUrl;
  }

  if (isLikelyDirectAssetUrl(storagePath)) {
    return storagePath;
  }

  if (!supabase || !isStorageObjectPath(storagePath)) {
    return storagePath;
  }

  const signed = await supabase.storage.from('assets').createSignedUrl(storagePath, 60 * 60 * 24 * 7);
  if (!signed.error && signed.data?.signedUrl) {
    return signed.data.signedUrl;
  }

  const publicInfo = supabase.storage.from('assets').getPublicUrl(storagePath);
  return publicInfo.data.publicUrl || storagePath;
}

/* ─── Store ──────────────────────────────────────── */

let initializationPromise: Promise<void> | null = null;
const backendMutationQueue = createSerializedMutationQueue();

export const useAppStore = create<AppState>()((set, get) => {
  async function getBackendContext() {
    if (typeof document !== 'undefined' && document.cookie.includes('admin_bypass=true')) {
      return { bypass: true, supabase: null, user: { id: 'admin-mock-id' } };
    }

    if (!isSupabaseConfigured) {
      return null;
    }

    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      return null;
    }

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error) {
      throw new Error(error.message);
    }

    if (!user) {
      return null;
    }

    return { bypass: false, supabase, user };
  }

  function runBackendMutation(operation: string, task: () => Promise<void>) {
    void backendMutationQueue.enqueue(async () => {
      try {
        const ctx = await getBackendContext();
        if (ctx?.bypass) {
          // [ADMIN BYPASS] Skip actual backend execution but resolve the task optimistically
          set({ lastSyncError: null });
          return;
        }
        await task();
        set({ lastSyncError: null });
      } catch (error) {
        set({ lastSyncError: getErrorMessage(error, `${operation} failed`) });
      }
    });
  }

  async function ensureProjectScene(projectId: string) {
    const cachedSceneId = projectSceneById.get(projectId);
    if (cachedSceneId) {
      return cachedSceneId;
    }

    const ctx = await getBackendContext();
    if (!ctx) {
      return null;
    }
    
    if (ctx.bypass) {
      // [ADMIN BYPASS] Generate local scene ID
      const sceneId = uid();
      projectSceneById.set(projectId, sceneId);
      return sceneId;
    }

    const existing = await ctx.supabase!
      .from('scenes')
      .select('id, project_id, order_index')
      .eq('project_id', projectId)
      .order('order_index', { ascending: true })
      .limit(1)
      .maybeSingle();

    if (existing.error && existing.error.code !== 'PGRST116') {
      throw new Error(existing.error.message);
    }

    if (existing.data?.id) {
      projectSceneById.set(projectId, existing.data.id as string);
      return existing.data.id as string;
    }

    const sceneId = uid();
    const insert = await ctx.supabase!.from('scenes').insert({
      id: sceneId,
      project_id: projectId,
      title: 'Main Scene',
      description: '',
      purpose: 'Primary production sequence',
      order_index: 0,
    });

    if (insert.error) {
      throw new Error(insert.error.message);
    }

    projectSceneById.set(projectId, sceneId);
    return sceneId;
  }

  async function hydrateFromBackend() {
    const ctx = await getBackendContext();

    if (!ctx) {
      set({
        initialized: true,
        initializing: false,
        backendReady: false,
        projects: [],
        assets: [],
        generations: [],
        settings: DEFAULT_SETTINGS,
      });
      return;
    }

    if (ctx.bypass) {
      // [ADMIN BYPASS] Keep existing front-end state, just mark as initialized/ready
      set((state) => ({
        initialized: true,
        initializing: false,
        backendReady: true,
        projects: state.projects.length > 0 ? state.projects : [],
        assets: state.assets.length > 0 ? state.assets : [],
        generations: state.generations.length > 0 ? state.generations : [],
        settings: state.settings || DEFAULT_SETTINGS,
      }));
      return;
    }

    const { supabase } = ctx;

    if (!supabase) {
      throw new Error('Supabase client must be initialized for non-bypassed backend sync');
    }

    const [
      projectResult,
      sceneResult,
      shotResult,
      assetResult,
      generationResult,
      settingsResult,
    ] = await Promise.all([
      supabase.from('projects').select('*').order('updated_at', { ascending: false }),
      supabase
        .from('scenes')
        .select('id, project_id, order_index')
        .order('order_index', { ascending: true }),
      supabase.from('shots').select('*').order('order_index', { ascending: true }),
      supabase.from('assets').select('*').order('created_at', { ascending: false }),
      supabase.from('generations').select('*').order('created_at', { ascending: false }),
      supabase.from('user_settings').select('*').eq('user_id', ctx.user.id).maybeSingle(),
    ]);

    if (projectResult.error) throw new Error(projectResult.error.message);
    if (sceneResult.error) throw new Error(sceneResult.error.message);
    if (shotResult.error) throw new Error(shotResult.error.message);
    if (assetResult.error) throw new Error(assetResult.error.message);
    if (generationResult.error) throw new Error(generationResult.error.message);

    const settingsErrorCode = settingsResult.error?.code;
    if (settingsResult.error && settingsErrorCode !== 'PGRST116') {
      throw new Error(settingsResult.error.message);
    }

    const sceneRows = Array.isArray(sceneResult.data) ? sceneResult.data : [];
    projectSceneById.clear();
    sceneRows.forEach((scene) => {
      const projectId = (scene as { project_id?: string }).project_id;
      const sceneId = (scene as { id?: string }).id;
      if (projectId && sceneId && !projectSceneById.has(projectId)) {
        projectSceneById.set(projectId, sceneId);
      }
    });

    const shotRows = Array.isArray(shotResult.data) ? shotResult.data : [];
    const shotsByProject = new Map<string, Shot[]>();

    shotRows.forEach((raw, index) => {
      const row = raw as Record<string, any>;
      const projectId = String(row.project_id || '');
      if (!projectId) return;

      const item: Shot = {
        id: String(row.id),
        projectId,
        title: (row.title as string) || (row.purpose as string) || `Shot ${index + 1}`,
        prompt: (row.prompt as string) || '',
        status: toShotStatus(row.status as string | null | undefined),
        provider: (row.provider_choice as string) || 'gemini',
        thumbnailUrl: (row.thumbnail_url as string | null) || null,
        videoUrl: (row.video_url as string | null) || null,
        duration: Number(row.duration_target) || 6,
        order: Number.isFinite(Number(row.order_index)) ? Number(row.order_index) : index,
        sourceType: row.source_type === 'import' ? 'import' : row.source_type === 'ai' ? 'ai' : undefined,
        assetId: (row.asset_id as string | null) || null,
        sourceMimeType: (row.source_mime_type as string | null) || null,
        sourceSizeBytes: row.source_size_bytes == null ? null : Number(row.source_size_bytes),
        importedAt: (row.imported_at as string | null) || null,
        createdAt: (row.created_at as string) || now(),
      };

      const list = shotsByProject.get(projectId) ?? [];
      list.push(item);
      shotsByProject.set(projectId, list);
    });

    shotsByProject.forEach((list, projectId) => {
      const project = (projectResult.data || []).find(
        (candidate) => (candidate as Record<string, any>).id === projectId
      ) as Record<string, any> | undefined;
      const fallbackProvider = (project?.provider as string) || 'gemini';
      list.forEach((shot) => {
        if (!shot.provider) {
          shot.provider = fallbackProvider;
        }
      });
      list.sort((a, b) => a.order - b.order || a.createdAt.localeCompare(b.createdAt));
    });

    const projectRows = Array.isArray(projectResult.data) ? projectResult.data : [];
    const projects: Project[] = projectRows.map((rawProject) => {
      const row = rawProject as Record<string, any>;
      const projectId = String(row.id);
      const projectShots = shotsByProject.get(projectId) ?? [];

      return {
        id: projectId,
        title: (row.title as string) || 'Untitled Project',
        brief: (row.vibe_brief as string) || '',
        provider: (row.provider as string) || 'gemini',
        starred: Boolean(row.starred),
        archivedAt: (row.archived_at as string | null) || null,
        status: toProjectStatus((row.status as string) || null),
        shots: projectShots,
        createdAt: (row.created_at as string) || now(),
        updatedAt: (row.updated_at as string) || now(),
      };
    });

    const shotLookup = new Map<string, Shot>();
    const projectLookup = new Map<string, Project>();

    projects.forEach((project) => {
      projectLookup.set(project.id, project);
      project.shots.forEach((shot) => {
        shotLookup.set(shot.id, shot);
      });
    });

    const assetRows = Array.isArray(assetResult.data) ? assetResult.data : [];
    const assets = await Promise.all(
      assetRows.map(async (rawAsset) => {
        const row = rawAsset as Record<string, any>;
        const storagePath = String(row.storage_path || '');
        const publicUrl = (row.public_url as string | null) || null;
        const resolvedUrl = await resolveAssetUrl(supabase, storagePath, publicUrl);

        return {
          id: String(row.id),
          name: (row.original_filename as string) || 'asset',
          type: toAssetType((row.type as string) || null),
          url: resolvedUrl,
          storagePath,
          size: Number(row.size_bytes) || 0,
          mimeType: (row.mime_type as string) || undefined,
          duration:
            typeof row.duration_ms === 'number' ? Number(row.duration_ms) / 1000 : undefined,
          storageMode: isStorageObjectPath(storagePath)
            ? ('remote-url' as const)
            : storagePath.startsWith('data:')
              ? ('data-url' as const)
              : ('object-url' as const),
          projectId: (row.project_id as string | null) || null,
          volatile: Boolean((row.metadata as Record<string, any> | null)?.volatile),
          width: typeof row.width === 'number' ? Number(row.width) : undefined,
          height: typeof row.height === 'number' ? Number(row.height) : undefined,
          createdAt: (row.created_at as string) || now(),
        } satisfies Asset;
      })
    );

    const generationRows = Array.isArray(generationResult.data) ? generationResult.data : [];
    const generations: Generation[] = generationRows.map((rawGeneration) => {
      const row = rawGeneration as Record<string, any>;
      const projectId = String(row.project_id || '');
      const shotId = String(row.shot_id || '');
      const shot = shotLookup.get(shotId);
      const project = projectLookup.get(projectId);
      const params = (row.params as Record<string, any> | null) ?? null;

      return {
        id: String(row.id),
        projectId,
        projectTitle: project?.title || (params?.project_title as string) || 'Untitled Project',
        shotId,
        shotTitle: shot?.title || (params?.shot_title as string) || 'Shot',
        provider: String(row.provider || shot?.provider || project?.provider || 'gemini'),
        status: toGenerationStatus((row.status as string) || null),
        progress:
          typeof row.progress === 'number'
            ? Number(row.progress)
            : typeof params?.progress === 'number'
              ? Number(params.progress)
              : 0,
        startedAt: (row.started_at as string) || (row.created_at as string) || now(),
        completedAt: (row.completed_at as string | null) || null,
        error: (row.error_message as string | null) || null,
      };
    });

    const settingsRow = settingsResult.data as Record<string, any> | null;

    set({
      projects,
      assets,
      generations,
      settings: settingsRow
        ? {
            displayName: (settingsRow.display_name as string) || '',
            defaultProvider: (settingsRow.default_provider as string) || DEFAULT_SETTINGS.defaultProvider,
            defaultResolution:
              (settingsRow.default_resolution as string) || DEFAULT_SETTINGS.defaultResolution,
            autoSave:
              typeof settingsRow.auto_save === 'boolean'
                ? settingsRow.auto_save
                : DEFAULT_SETTINGS.autoSave,
          }
        : DEFAULT_SETTINGS,
      initialized: true,
      initializing: false,
      backendReady: true,
      lastSyncError: null,
    });

    if (!settingsRow) {
      runBackendMutation('create-default-settings', async () => {
        const latest = await getBackendContext();
        if (!latest || latest.bypass || !latest.supabase) return;
        const response = await latest.supabase.from('user_settings').upsert({
          user_id: latest.user.id,
          display_name: DEFAULT_SETTINGS.displayName,
          default_provider: DEFAULT_SETTINGS.defaultProvider,
          default_resolution: DEFAULT_SETTINGS.defaultResolution,
          auto_save: DEFAULT_SETTINGS.autoSave,
        });
        if (response.error) {
          throw new Error(response.error.message);
        }
      });
    }
  }

  return {
    initialized: false,
    initializing: false,
    backendReady: false,
    lastSyncError: null,

    initializeWorkspace: async () => {
      if (initializationPromise) {
        return initializationPromise;
      }

      set({ initializing: true, lastSyncError: null });

      initializationPromise = (async () => {
        try {
          await hydrateFromBackend();
        } catch (error) {
          set({
            initialized: true,
            initializing: false,
            backendReady: false,
            lastSyncError: getErrorMessage(error, 'Failed to load workspace from backend.'),
          });
        } finally {
          initializationPromise = null;
        }
      })();

      return initializationPromise;
    },

    refreshWorkspace: async () => {
      set({ initializing: true, lastSyncError: null });
      try {
        await hydrateFromBackend();
      } catch (error) {
        set({
          initializing: false,
          backendReady: false,
          lastSyncError: getErrorMessage(error, 'Failed to refresh workspace state.'),
        });
      }
    },

    /* ── Projects ───────────────────────────── */
    projects: [],

    addProject: (p) => {
      const id = uid();
      const createdAt = now();
      const project = createProjectRecord({
        id,
        title: p.title,
        brief: p.brief,
        provider: p.provider,
        shots: p.shots,
        createdAtIso: createdAt,
      });

      set((state) => ({ projects: [project, ...state.projects] }));

      runBackendMutation('add-project', async () => {
        const ctx = await getBackendContext();
        if (!ctx) {
          throw new Error('Sign in required to create a project.');
        }
        if (ctx.bypass) return;

        const insertedProject = await ctx.supabase!.from('projects').insert({
          id,
          user_id: ctx.user.id,
          title: project.title,
          vibe_brief: project.brief,
          status: toDbProjectStatus(project.status),
          provider: project.provider,
          starred: project.starred,
          archived_at: project.archivedAt,
        });

        if (insertedProject.error) {
          throw new Error(insertedProject.error.message);
        }

        const sceneId = await ensureProjectScene(id);

        if (sceneId && project.shots.length > 0) {
          const shotRows = project.shots.map((shot, index) => ({
            id: shot.id,
            project_id: id,
            scene_id: sceneId,
            order_index: Number.isFinite(shot.order) ? shot.order : index,
            title: shot.title,
            purpose: shot.title,
            duration_target: shot.duration,
            prompt: shot.prompt,
            provider_choice: shot.provider,
            status: shot.status,
            thumbnail_url: shot.thumbnailUrl,
            video_url: shot.videoUrl,
            source_type: shot.sourceType || null,
            asset_id: shot.assetId || null,
            source_mime_type: shot.sourceMimeType || null,
            source_size_bytes: shot.sourceSizeBytes ?? null,
            imported_at: shot.importedAt || null,
          }));

          const insertedShots = await ctx.supabase!.from('shots').upsert(shotRows, { onConflict: 'id' });
          if (insertedShots.error) {
            throw new Error(insertedShots.error.message);
          }
        }
      });

      return id;
    },

    updateProject: (id, updates) => {
      const trimmed = trimProjectUpdateInput(updates);
      const updatedAt = now();

      set((state) => ({
        projects: patchProjectCollection(state.projects, id, updates, updatedAt),
      }));

      runBackendMutation('update-project', async () => {
        const ctx = await getBackendContext();
        if (!ctx || ctx.bypass) return;

        if (Object.keys(trimmed).length > 0) {
          const response = await ctx.supabase!.from('projects').update(trimmed).eq('id', id);
          if (response.error) {
            throw new Error(response.error.message);
          }
        }

        if (Array.isArray(updates.shots) && updates.shots.length > 0) {
          const sceneId = await ensureProjectScene(id);
          if (!sceneId) return;

          const projectProvider = getProjectFallbackProvider(get().projects, id);
          const rows = updates.shots.map((shot, index) => ({
            id: shot.id,
            project_id: id,
            scene_id: sceneId,
            order_index: Number.isFinite(shot.order) ? shot.order : index,
            title: shot.title,
            purpose: shot.title,
            duration_target: shot.duration,
            prompt: shot.prompt,
            provider_choice: shot.provider || projectProvider,
            status: shot.status,
            thumbnail_url: shot.thumbnailUrl,
            video_url: shot.videoUrl,
            source_type: shot.sourceType || null,
            asset_id: shot.assetId || null,
            source_mime_type: shot.sourceMimeType || null,
            source_size_bytes: shot.sourceSizeBytes ?? null,
            imported_at: shot.importedAt || null,
          }));

          const upsert = await ctx.supabase!.from('shots').upsert(rows, { onConflict: 'id' });
          if (upsert.error) {
            throw new Error(upsert.error.message);
          }
        }
      });
    },

    renameProject: (id, title) => {
      const normalized = title.trim();
      if (!normalized) return;

      set((state) => ({
        projects: state.projects.map((project) =>
          project.id === id ? { ...project, title: normalized, updatedAt: now() } : project
        ),
      }));

      runBackendMutation('rename-project', async () => {
        const ctx = await getBackendContext();
        if (!ctx || ctx.bypass) return;
        const response = await ctx.supabase!.from('projects').update({ title: normalized }).eq('id', id);
        if (response.error) throw new Error(response.error.message);
      });
    },

    toggleProjectStar: (id) => {
      const current = get().projects.find((project) => project.id === id);
      if (!current) return;
      const nextStarred = !current.starred;

      set((state) => ({
        projects: state.projects.map((project) =>
          project.id === id ? { ...project, starred: nextStarred, updatedAt: now() } : project
        ),
      }));

      runBackendMutation('toggle-project-star', async () => {
        const ctx = await getBackendContext();
        if (!ctx || ctx.bypass) return;
        const response = await ctx.supabase!
          .from('projects')
          .update({ starred: nextStarred })
          .eq('id', id);
        if (response.error) throw new Error(response.error.message);
      });
    },

    archiveProject: (id) => {
      const archivedAt = now();
      set((state) => ({
        projects: state.projects.map((project) =>
          project.id === id && !project.archivedAt
            ? { ...project, archivedAt, updatedAt: now() }
            : project
        ),
      }));

      runBackendMutation('archive-project', async () => {
        const ctx = await getBackendContext();
        if (!ctx || ctx.bypass) return;
        const response = await ctx.supabase!
          .from('projects')
          .update({ archived_at: archivedAt })
          .eq('id', id);
        if (response.error) throw new Error(response.error.message);
      });
    },

    restoreProject: (id) => {
      set((state) => ({
        projects: state.projects.map((project) =>
          project.id === id && project.archivedAt
            ? { ...project, archivedAt: null, updatedAt: now() }
            : project
        ),
      }));

      runBackendMutation('restore-project', async () => {
        const ctx = await getBackendContext();
        if (!ctx || ctx.bypass) return;
        const response = await ctx.supabase!
          .from('projects')
          .update({ archived_at: null })
          .eq('id', id);
        if (response.error) throw new Error(response.error.message);
      });
    },

    deleteProject: (id) => {
      set((state) => ({
        projects: state.projects.filter((project) => project.id !== id),
        generations: state.generations.filter((generation) => generation.projectId !== id),
      }));

      runBackendMutation('delete-project', async () => {
        const ctx = await getBackendContext();
        if (!ctx || ctx.bypass) return;
        const response = await ctx.supabase!.from('projects').delete().eq('id', id);
        if (response.error) throw new Error(response.error.message);
      });
    },

    getProject: (id) => get().projects.find((project) => project.id === id),

    /* ── Shots ──────────────────────────────── */
    addShot: (projectId, shot) => {
      const createdAt = now();
      const newShot: Shot = { ...shot, id: uid(), createdAt };
      const updatedAt = now();

      set((state) => ({
        projects: appendShotToProject(state.projects, projectId, newShot, updatedAt),
      }));

      runBackendMutation('add-shot', async () => {
        const ctx = await getBackendContext();
        if (!ctx || ctx.bypass) return;

        const sceneId = await ensureProjectScene(projectId);
        if (!sceneId) throw new Error('No scene found for project.');

        const response = await ctx.supabase!.from('shots').insert({
          id: newShot.id,
          project_id: projectId,
          scene_id: sceneId,
          order_index: newShot.order,
          title: newShot.title,
          purpose: newShot.title,
          duration_target: newShot.duration,
          prompt: newShot.prompt,
          status: newShot.status,
          provider_choice: newShot.provider,
          thumbnail_url: newShot.thumbnailUrl,
          video_url: newShot.videoUrl,
          source_type: newShot.sourceType || null,
          asset_id: newShot.assetId || null,
          source_mime_type: newShot.sourceMimeType || null,
          source_size_bytes: newShot.sourceSizeBytes ?? null,
          imported_at: newShot.importedAt || null,
        });

        if (response.error) {
          throw new Error(response.error.message);
        }
      });

      return newShot.id;
    },

    updateShot: (projectId, shotId, updates) => {
      const payload = trimShotUpdateInput(updates);
      const updatedAt = now();

      set((state) => ({
        projects: patchShotInProject(state.projects, projectId, shotId, updates, updatedAt),
      }));

      runBackendMutation('update-shot', async () => {
        const ctx = await getBackendContext();
        if (!ctx || ctx.bypass) return;
        if (Object.keys(payload).length === 0) return;

        const response = await ctx.supabase!.from('shots').update(payload).eq('id', shotId);
        if (response.error) throw new Error(response.error.message);
      });
    },

    deleteShot: (projectId, shotId) => {
      const updatedAt = now();
      set((state) => ({
        projects: removeShotFromProject(state.projects, projectId, shotId, updatedAt),
      }));

      runBackendMutation('delete-shot', async () => {
        const ctx = await getBackendContext();
        if (!ctx || ctx.bypass) return;
        const response = await ctx.supabase!.from('shots').delete().eq('id', shotId);
        if (response.error) throw new Error(response.error.message);
      });
    },

    /* ── Assets ─────────────────────────────── */
    assets: [],

    addAsset: (assetInput) => {
      const asset: Asset = { ...assetInput, id: uid(), createdAt: now() };

      set((state) => ({ assets: [asset, ...state.assets] }));

      runBackendMutation('add-asset', async () => {
        const ctx = await getBackendContext();
        if (!ctx || ctx.bypass) return;

        const response = await ctx.supabase!.from('assets').insert({
          id: asset.id,
          user_id: ctx.user.id,
          project_id: asset.projectId || null,
          type: toDbAssetType(asset.type),
          storage_path: asset.storagePath || asset.url,
          public_url: asset.url,
          original_filename: asset.name,
          mime_type: asset.mimeType || '',
          size_bytes: asset.size,
          duration_ms: typeof asset.duration === 'number' ? Math.round(asset.duration * 1000) : null,
          width: asset.width ?? null,
          height: asset.height ?? null,
          metadata: {
            storageMode: asset.storageMode || null,
            volatile: Boolean(asset.volatile),
          },
        });

        if (response.error) {
          throw new Error(response.error.message);
        }
      });

      return asset.id;
    },

    deleteAsset: (id) => {
      const existing = get().assets.find((asset) => asset.id === id);

      set((state) => ({ assets: state.assets.filter((asset) => asset.id !== id) }));

      runBackendMutation('delete-asset', async () => {
        const ctx = await getBackendContext();
        if (!ctx || ctx.bypass) return;

        if (existing?.storagePath && isStorageObjectPath(existing.storagePath)) {
          const storageDelete = await ctx.supabase!.storage.from('assets').remove([existing.storagePath]);
          if (storageDelete.error) {
            throw new Error(storageDelete.error.message);
          }
        }

        const response = await ctx.supabase!.from('assets').delete().eq('id', id);
        if (response.error) {
          throw new Error(response.error.message);
        }
      });
    },

    updateAsset: (id, updates) => {
      const payload = trimAssetUpdateInput(updates);

      set((state) => ({
        assets: state.assets.map((asset) => (asset.id === id ? { ...asset, ...updates } : asset)),
      }));

      runBackendMutation('update-asset', async () => {
        const ctx = await getBackendContext();
        if (!ctx || ctx.bypass) return;
        if (Object.keys(payload).length === 0) return;

        const response = await ctx.supabase!.from('assets').update(payload).eq('id', id);
        if (response.error) {
          throw new Error(response.error.message);
        }
      });
    },

    /* ── Generations ────────────────────────── */
    generations: [],

    addGeneration: (generationInput) => {
      const id = uid();
      const startedAt = now();
      const generation = createGenerationRecord({
        id,
        generation: generationInput,
        startedAtIso: startedAt,
      });

      set((state) => ({ generations: [generation, ...state.generations] }));

      runBackendMutation('add-generation', async () => {
        const ctx = await getBackendContext();
        if (!ctx || ctx.bypass) return;

        const shot = get()
          .projects.find((project) => project.id === generation.projectId)
          ?.shots.find((candidate) => candidate.id === generation.shotId);

        const response = await ctx.supabase!.from('generations').insert({
          id: generation.id,
          shot_id: generation.shotId,
          project_id: generation.projectId,
          user_id: ctx.user.id,
          provider: generation.provider,
          operation: 'text_to_video',
          status: toDbGenerationStatus(generation.status),
          prompt: shot?.prompt || generation.shotTitle,
          negative_prompt: '',
          params: {
            project_title: generation.projectTitle,
            shot_title: generation.shotTitle,
          },
          progress: generation.progress,
          started_at: generation.startedAt,
        });

        if (response.error) {
          throw new Error(response.error.message);
        }
      });

      return id;
    },

    updateGeneration: (id, updates) => {
      set((state) => ({
        generations: patchGenerationCollection(state.generations, id, updates),
      }));

      runBackendMutation('update-generation', async () => {
        const ctx = await getBackendContext();
        if (!ctx) throw new Error('Sign in required to update generations.');

        const payload: Record<string, unknown> = {};
        if (updates.status) payload.status = toDbGenerationStatus(updates.status);
        if (typeof updates.progress === 'number') payload.progress = updates.progress;
        if (typeof updates.error === 'string' || updates.error === null) {
          payload.error_message = updates.error;
        }
        if (typeof updates.startedAt === 'string') payload.started_at = updates.startedAt;
        if (typeof updates.completedAt === 'string' || updates.completedAt === null) {
          payload.completed_at = updates.completedAt;
        }

        if (Object.keys(payload).length === 0) return;

        const response = await ctx.supabase!.from('generations').update(payload).eq('id', id);
        if (response.error) {
          throw new Error(response.error.message);
        }
      });
    },

    clearGenerations: () => {
      set({ generations: [] });

      runBackendMutation('clear-generations', async () => {
        const ctx = await getBackendContext();
        if (!ctx || ctx.bypass) return;
        const response = await ctx.supabase!.from('generations').delete().eq('user_id', ctx.user.id);
        if (response.error) {
          throw new Error(response.error.message);
        }
      });
    },

    /* ── API Keys ───────────────────────────── */
    apiKeys: [],

    saveApiKey: (provider, key) => {
      const visible = key.slice(-4);
      const hiddenCount = Math.max(0, key.length - visible.length);
      const masked = `${'•'.repeat(hiddenCount)}${visible}`;

      set((state) => ({
        apiKeys: [
          ...state.apiKeys.filter((entry) => entry.provider !== provider),
          { provider, maskedKey: masked, connected: true, savedAt: now() },
        ],
      }));
    },

    removeApiKey: (provider) =>
      set((state) => ({ apiKeys: state.apiKeys.filter((entry) => entry.provider !== provider) })),

    /* ── Settings ───────────────────────────── */
    settings: DEFAULT_SETTINGS,

    updateSettings: (updates) => {
      const merged = { ...get().settings, ...updates };
      set({ settings: merged });

      runBackendMutation('update-settings', async () => {
        const ctx = await getBackendContext();
        if (!ctx || ctx.bypass) return;

        const response = await ctx.supabase!.from('user_settings').upsert({
          user_id: ctx.user.id,
          display_name: merged.displayName,
          default_provider: merged.defaultProvider,
          default_resolution: merged.defaultResolution,
          auto_save: merged.autoSave,
        });

        if (response.error) {
          throw new Error(response.error.message);
        }
      });
    },

    /* ── Bulk ───────────────────────────────── */
    deleteAllProjects: () => {
      set({ projects: [], generations: [] });

      runBackendMutation('delete-all-projects', async () => {
        const ctx = await getBackendContext();
        if (!ctx || ctx.bypass) return;

        const response = await ctx.supabase!.from('projects').delete().eq('user_id', ctx.user.id);
        if (response.error) {
          throw new Error(response.error.message);
        }
      });
    },
  };
});
