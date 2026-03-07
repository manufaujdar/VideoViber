'use client';

import { create } from 'zustand';
import {
  type IdeaIntakeData,
  type RequirementReport,
  type ResearchSummary,
  type GapChecklist,
  type ProjectCreationData,
  type StrategyBrief,
  type ContextBible,
  type AssetIntakeData,
  type ConceptVariations,
  type ScriptDraft,
  type CritiqueReport,
  type SceneBreakdown,
  type ShotPlan,
  type AudioPlan,
  type TimelineReview,
  type ReadinessReport,
  type DocumentWithState,
  type DocumentStatus,
  emptyDocument,
  emptyIdeaIntake,
  emptyAssetIntake,
} from './wizard-types';

/* ─── State Shape ──────────────────────────────────────── */

export interface WizardState {
  currentPage: number;
  completedPages: number[];
  skippedPages: number[];
  quickMode: boolean;
  projectId: string | null;

  // Session metadata
  startedAt: string | null;
  savedAt: string | null;
  wizardStatus: 'active' | 'saved' | 'completed';

  // Pre-project data (sessionStorage)
  ideaIntake: IdeaIntakeData;
  requirementReport: DocumentWithState<RequirementReport>;
  researchSummary: DocumentWithState<ResearchSummary>;
  gapChecklist: DocumentWithState<GapChecklist>;
  projectCreation: ProjectCreationData;

  // Post-project data
  strategyBrief: DocumentWithState<StrategyBrief>;
  contextBible: DocumentWithState<ContextBible>;

  // Phase B: Creative Planning
  assetIntake: AssetIntakeData;
  conceptVariations: DocumentWithState<ConceptVariations>;
  scriptDraft: DocumentWithState<ScriptDraft>;
  critiqueReport: DocumentWithState<CritiqueReport>;

  // Phase C: Production Pipeline
  sceneBreakdown: DocumentWithState<SceneBreakdown>;
  shotPlan: DocumentWithState<ShotPlan>;
  audioPlan: DocumentWithState<AudioPlan>;
  timelineReview: DocumentWithState<TimelineReview>;

  // Phase D: Launch
  readinessReport: DocumentWithState<ReadinessReport>;

  // Actions
  setCurrentPage: (page: number) => void;
  markCompleted: (page: number) => void;
  markSkipped: (page: number) => void;
  setQuickMode: (enabled: boolean) => void;
  setProjectId: (id: string) => void;

  setIdeaIntake: (data: Partial<IdeaIntakeData>) => void;
  setRequirementReport: (data: RequirementReport, confidence?: number, assumptions?: string[]) => void;
  setResearchSummary: (data: ResearchSummary, confidence?: number, assumptions?: string[]) => void;
  setGapChecklist: (data: GapChecklist, confidence?: number, assumptions?: string[]) => void;
  setProjectCreation: (data: Partial<ProjectCreationData>) => void;
  setStrategyBrief: (data: StrategyBrief, confidence?: number, assumptions?: string[]) => void;
  setContextBible: (data: ContextBible, confidence?: number, assumptions?: string[]) => void;
  setAssetIntake: (data: Partial<AssetIntakeData>) => void;
  setConceptVariations: (data: ConceptVariations, confidence?: number, assumptions?: string[]) => void;
  setScriptDraft: (data: ScriptDraft, confidence?: number, assumptions?: string[]) => void;
  setCritiqueReport: (data: CritiqueReport, confidence?: number, assumptions?: string[]) => void;
  setSceneBreakdown: (data: SceneBreakdown, confidence?: number, assumptions?: string[]) => void;
  setShotPlan: (data: ShotPlan, confidence?: number, assumptions?: string[]) => void;
  setAudioPlan: (data: AudioPlan, confidence?: number, assumptions?: string[]) => void;
  setTimelineReview: (data: TimelineReview, confidence?: number, assumptions?: string[]) => void;
  setReadinessReport: (data: ReadinessReport, confidence?: number, assumptions?: string[]) => void;

  updateDocumentStatus: (
    key: 'requirementReport' | 'researchSummary' | 'gapChecklist' | 'strategyBrief' | 'contextBible' | 'conceptVariations' | 'scriptDraft' | 'critiqueReport' | 'sceneBreakdown' | 'shotPlan' | 'audioPlan' | 'timelineReview' | 'readinessReport',
    status: DocumentStatus
  ) => void;
  addUserNote: (
    key: 'requirementReport' | 'researchSummary' | 'gapChecklist' | 'strategyBrief' | 'contextBible' | 'conceptVariations' | 'scriptDraft' | 'critiqueReport' | 'sceneBreakdown' | 'shotPlan' | 'audioPlan' | 'timelineReview' | 'readinessReport',
    note: string
  ) => void;
  lockSection: (
    key: 'requirementReport' | 'researchSummary' | 'gapChecklist' | 'strategyBrief' | 'contextBible' | 'conceptVariations' | 'scriptDraft' | 'critiqueReport' | 'sceneBreakdown' | 'shotPlan' | 'audioPlan' | 'timelineReview' | 'readinessReport',
    sectionId: string
  ) => void;
  unlockSection: (
    key: 'requirementReport' | 'researchSummary' | 'gapChecklist' | 'strategyBrief' | 'contextBible' | 'conceptVariations' | 'scriptDraft' | 'critiqueReport' | 'sceneBreakdown' | 'shotPlan' | 'audioPlan' | 'timelineReview' | 'readinessReport',
    sectionId: string
  ) => void;

  resetWizard: () => void;
  hydrateFromStorage: () => boolean; // returns true if session was restored
  invalidateDownstream: (fromPage: number) => void;
  completeWizard: () => void;
}

/* ─── Persistence ──────────────────────────────────────── */

const STORAGE_KEY = 'vv-wizard-state';

const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

function saveToStorage(state: WizardState) {
  try {
    const serializable = {
      currentPage: state.currentPage,
      completedPages: state.completedPages,
      skippedPages: state.skippedPages,
      quickMode: state.quickMode,
      projectId: state.projectId,
      startedAt: state.startedAt,
      savedAt: new Date().toISOString(),
      wizardStatus: state.wizardStatus,
      ideaIntake: state.ideaIntake,
      requirementReport: state.requirementReport,
      researchSummary: state.researchSummary,
      gapChecklist: state.gapChecklist,
      projectCreation: state.projectCreation,
      strategyBrief: state.strategyBrief,
      contextBible: state.contextBible,
      assetIntake: state.assetIntake,
      conceptVariations: state.conceptVariations,
      scriptDraft: state.scriptDraft,
      critiqueReport: state.critiqueReport,
      sceneBreakdown: state.sceneBreakdown,
      shotPlan: state.shotPlan,
      audioPlan: state.audioPlan,
      timelineReview: state.timelineReview,
      readinessReport: state.readinessReport,
    };
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(serializable));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(serializable));
  } catch {
    // Storage full / unavailable — silently ignore
  }
}

function loadFromStorage(): Partial<WizardState> | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY) || localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<WizardState> & { savedAt?: string };
    // Check TTL — discard sessions older than 7 days
    if (parsed.savedAt) {
      const age = Date.now() - new Date(parsed.savedAt).getTime();
      if (age > SESSION_TTL_MS) {
        try {
          sessionStorage.removeItem(STORAGE_KEY);
          localStorage.removeItem(STORAGE_KEY);
        } catch { /* ignore */ }
        return null;
      }
    }
    return parsed;
  } catch {
    return null;
  }
}

/**
 * Static check: does the user have an in-progress wizard session?
 * Can be called outside React components.
 */
export function hasInProgressSession(): {
  exists: boolean;
  currentPage?: number;
  savedAt?: string;
  ideaSnippet?: string;
  projectName?: string;
} {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY) || localStorage.getItem(STORAGE_KEY);
    if (!raw) return { exists: false };
    const data = JSON.parse(raw) as Partial<WizardState> & { savedAt?: string };
    // Expired?
    if (data.savedAt) {
      const age = Date.now() - new Date(data.savedAt).getTime();
      if (age > SESSION_TTL_MS) return { exists: false };
    }
    // Only consider it "in progress" if the user has actually entered something
    const hasContent = !!(data.ideaIntake?.rawIdea && data.ideaIntake.rawIdea.trim().length > 0);
    if (!hasContent && (data.wizardStatus !== 'saved')) return { exists: false };
    return {
      exists: true,
      currentPage: data.currentPage,
      savedAt: data.savedAt ?? undefined,
      ideaSnippet: data.ideaIntake?.rawIdea?.slice(0, 80) ?? undefined,
      projectName: data.projectCreation?.name ?? undefined,
    };
  } catch {
    return { exists: false };
  }
}

// Maps page numbers to their downstream dependents
const DOWNSTREAM_MAP: Record<number, Array<keyof WizardState>> = {
  1: ['requirementReport', 'researchSummary', 'gapChecklist', 'strategyBrief', 'conceptVariations', 'scriptDraft', 'critiqueReport', 'sceneBreakdown', 'shotPlan', 'audioPlan', 'timelineReview'],
  2: ['researchSummary', 'gapChecklist', 'strategyBrief', 'conceptVariations', 'scriptDraft', 'critiqueReport', 'sceneBreakdown', 'shotPlan', 'audioPlan', 'timelineReview'],
  3: ['strategyBrief', 'conceptVariations', 'scriptDraft', 'critiqueReport', 'sceneBreakdown', 'shotPlan', 'audioPlan', 'timelineReview'],
  4: ['strategyBrief'],
  6: ['conceptVariations', 'scriptDraft', 'critiqueReport', 'sceneBreakdown', 'shotPlan', 'audioPlan', 'timelineReview'],
  7: ['conceptVariations', 'scriptDraft', 'critiqueReport', 'sceneBreakdown', 'shotPlan', 'audioPlan', 'timelineReview'],
  9: ['scriptDraft', 'critiqueReport', 'sceneBreakdown', 'shotPlan', 'audioPlan', 'timelineReview'],
  10: ['critiqueReport', 'sceneBreakdown', 'shotPlan', 'audioPlan', 'timelineReview'],
  11: ['shotPlan', 'audioPlan', 'timelineReview', 'readinessReport'],
  12: ['timelineReview', 'readinessReport'],
  13: ['timelineReview', 'readinessReport'],
  14: ['readinessReport'],
};

/* ─── Defaults ─────────────────────────────────────────── */

const defaultProjectCreation: ProjectCreationData = {
  suggestedName: '',
  name: '',
  summary: '',
  category: '',
  tags: [],
  provider: 'gemini',
};

/* ─── Store ────────────────────────────────────────────── */

export const useWizardStore = create<WizardState>()((set, get) => {
  function persist() {
    // Defer to next tick to avoid reading stale state
    setTimeout(() => saveToStorage(get()), 0);
  }

  function setDocument<T>(
    key: keyof WizardState,
    data: T,
    confidence = 0.8,
    assumptions: string[] = []
  ) {
    set((s) => ({
      ...s,
      [key]: {
        data,
        status: 'draft' as DocumentStatus,
        confidence,
        assumptions,
        userNotes: (s[key] as DocumentWithState<unknown>)?.userNotes ?? [],
        lockedSections: (s[key] as DocumentWithState<unknown>)?.lockedSections ?? [],
        lastUpdated: new Date().toISOString(),
      },
    }));
    persist();
  }

  return {
    currentPage: 1,
    completedPages: [],
    skippedPages: [],
    quickMode: false,
    projectId: null,
    startedAt: null,
    savedAt: null,
    wizardStatus: 'active' as const,

    ideaIntake: { ...emptyIdeaIntake },
    requirementReport: emptyDocument<RequirementReport>(),
    researchSummary: emptyDocument<ResearchSummary>(),
    gapChecklist: emptyDocument<GapChecklist>(),
    projectCreation: { ...defaultProjectCreation },
    strategyBrief: emptyDocument<StrategyBrief>(),
    contextBible: emptyDocument<ContextBible>(),
    assetIntake: { ...emptyAssetIntake },
    conceptVariations: emptyDocument<ConceptVariations>(),
    scriptDraft: emptyDocument<ScriptDraft>(),
    critiqueReport: emptyDocument<CritiqueReport>(),
    sceneBreakdown: emptyDocument<SceneBreakdown>(),
    shotPlan: emptyDocument<ShotPlan>(),
    audioPlan: emptyDocument<AudioPlan>(),
    timelineReview: emptyDocument<TimelineReview>(),
    readinessReport: emptyDocument<ReadinessReport>(),

    /* ── Navigation ────────────────────────── */

    setCurrentPage: (page) => {
      set((s) => ({
        currentPage: page,
        startedAt: s.startedAt || new Date().toISOString(),
        wizardStatus: 'active' as const,
      }));
      persist();
    },

    markCompleted: (page) => {
      set((s) => ({
        completedPages: s.completedPages.includes(page)
          ? s.completedPages
          : [...s.completedPages, page],
      }));
      persist();
    },

    markSkipped: (page) => {
      set((s) => ({
        skippedPages: s.skippedPages.includes(page)
          ? s.skippedPages
          : [...s.skippedPages, page],
      }));
      persist();
    },

    setQuickMode: (enabled) => {
      set({ quickMode: enabled });
      persist();
    },

    setProjectId: (id) => {
      set({ projectId: id });
      persist();
    },

    /* ── Data Setters ──────────────────────── */

    setIdeaIntake: (data) => {
      set((s) => ({ ideaIntake: { ...s.ideaIntake, ...data } }));
      persist();
    },

    setRequirementReport: (data, confidence, assumptions) => {
      setDocument('requirementReport', data, confidence, assumptions);
    },

    setResearchSummary: (data, confidence, assumptions) => {
      setDocument('researchSummary', data, confidence, assumptions);
    },

    setGapChecklist: (data, confidence, assumptions) => {
      setDocument('gapChecklist', data, confidence, assumptions);
    },

    setProjectCreation: (data) => {
      set((s) => ({ projectCreation: { ...s.projectCreation, ...data } }));
      persist();
    },

    setStrategyBrief: (data, confidence, assumptions) => {
      setDocument('strategyBrief', data, confidence, assumptions);
    },

    setContextBible: (data, confidence, assumptions) => {
      setDocument('contextBible', data, confidence, assumptions);
    },

    setAssetIntake: (data) => {
      set((s) => ({ assetIntake: { ...s.assetIntake, ...data } }));
      persist();
    },

    setConceptVariations: (data, confidence, assumptions) => {
      setDocument('conceptVariations', data, confidence, assumptions);
    },

    setScriptDraft: (data, confidence, assumptions) => {
      setDocument('scriptDraft', data, confidence, assumptions);
    },

    setCritiqueReport: (data, confidence, assumptions) => {
      setDocument('critiqueReport', data, confidence, assumptions);
    },

    setSceneBreakdown: (data, confidence, assumptions) => {
      setDocument('sceneBreakdown', data, confidence, assumptions);
    },

    setShotPlan: (data, confidence, assumptions) => {
      setDocument('shotPlan', data, confidence, assumptions);
    },

    setAudioPlan: (data, confidence, assumptions) => {
      setDocument('audioPlan', data, confidence, assumptions);
    },

    setTimelineReview: (data, confidence, assumptions) => {
      setDocument('timelineReview', data, confidence, assumptions);
    },

    setReadinessReport: (data, confidence, assumptions) => {
      setDocument('readinessReport', data, confidence, assumptions);
    },

    /* ── Document State Management ─────────── */

    updateDocumentStatus: (key, status) => {
      set((s) => ({
        [key]: { ...(s[key] as DocumentWithState<unknown>), status, lastUpdated: new Date().toISOString() },
      }));
      persist();
    },

    addUserNote: (key, note) => {
      set((s) => {
        const doc = s[key] as DocumentWithState<unknown>;
        return {
          [key]: {
            ...doc,
            userNotes: [...doc.userNotes, note],
            status: 'user_edited' as DocumentStatus,
            lastUpdated: new Date().toISOString(),
          },
        };
      });
      persist();
    },

    lockSection: (key, sectionId) => {
      set((s) => {
        const doc = s[key] as DocumentWithState<unknown>;
        if (doc.lockedSections.includes(sectionId)) return {};
        return {
          [key]: {
            ...doc,
            lockedSections: [...doc.lockedSections, sectionId],
            lastUpdated: new Date().toISOString(),
          },
        };
      });
      persist();
    },

    unlockSection: (key, sectionId) => {
      set((s) => {
        const doc = s[key] as DocumentWithState<unknown>;
        return {
          [key]: {
            ...doc,
            lockedSections: doc.lockedSections.filter((id) => id !== sectionId),
            lastUpdated: new Date().toISOString(),
          },
        };
      });
      persist();
    },

    /* ── Lifecycle ─────────────────────────── */

    resetWizard: () => {
      try {
        sessionStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(STORAGE_KEY);
      } catch { /* ignore */ }

      set({
        currentPage: 1,
        completedPages: [],
        skippedPages: [],
        quickMode: false,
        projectId: null,
        startedAt: null,
        savedAt: null,
        wizardStatus: 'active' as const,
        ideaIntake: { ...emptyIdeaIntake },
        requirementReport: emptyDocument<RequirementReport>(),
        researchSummary: emptyDocument<ResearchSummary>(),
        gapChecklist: emptyDocument<GapChecklist>(),
        projectCreation: { ...defaultProjectCreation },
        strategyBrief: emptyDocument<StrategyBrief>(),
        contextBible: emptyDocument<ContextBible>(),
        assetIntake: { ...emptyAssetIntake },
        conceptVariations: emptyDocument<ConceptVariations>(),
        scriptDraft: emptyDocument<ScriptDraft>(),
        critiqueReport: emptyDocument<CritiqueReport>(),
        sceneBreakdown: emptyDocument<SceneBreakdown>(),
        shotPlan: emptyDocument<ShotPlan>(),
        audioPlan: emptyDocument<AudioPlan>(),
        timelineReview: emptyDocument<TimelineReview>(),
        readinessReport: emptyDocument<ReadinessReport>(),
      });
    },

    hydrateFromStorage: () => {
      const saved = loadFromStorage();
      if (!saved) return false;
      set((s) => ({
        ...s,
        currentPage: saved.currentPage ?? s.currentPage,
        completedPages: saved.completedPages ?? s.completedPages,
        skippedPages: saved.skippedPages ?? s.skippedPages,
        quickMode: saved.quickMode ?? s.quickMode,
        projectId: saved.projectId ?? s.projectId,
        startedAt: saved.startedAt ?? s.startedAt,
        savedAt: saved.savedAt ?? s.savedAt,
        wizardStatus: saved.wizardStatus ?? s.wizardStatus,
        ideaIntake: saved.ideaIntake ?? s.ideaIntake,
        requirementReport: saved.requirementReport ?? s.requirementReport,
        researchSummary: saved.researchSummary ?? s.researchSummary,
        gapChecklist: saved.gapChecklist ?? s.gapChecklist,
        projectCreation: saved.projectCreation ?? s.projectCreation,
        strategyBrief: saved.strategyBrief ?? s.strategyBrief,
        contextBible: saved.contextBible ?? s.contextBible,
        assetIntake: saved.assetIntake ?? s.assetIntake,
        conceptVariations: saved.conceptVariations ?? s.conceptVariations,
        scriptDraft: saved.scriptDraft ?? s.scriptDraft,
        critiqueReport: saved.critiqueReport ?? s.critiqueReport,
        sceneBreakdown: saved.sceneBreakdown ?? s.sceneBreakdown,
        shotPlan: saved.shotPlan ?? s.shotPlan,
        audioPlan: saved.audioPlan ?? s.audioPlan,
        timelineReview: saved.timelineReview ?? s.timelineReview,
        readinessReport: saved.readinessReport ?? s.readinessReport,
      }));
      return true;
    },

    invalidateDownstream: (fromPage: number) => {
      const keys = DOWNSTREAM_MAP[fromPage];
      if (!keys || keys.length === 0) return;
      set((s) => {
        const updates: Partial<WizardState> = {};
        for (const key of keys) {
          const doc = s[key] as DocumentWithState<unknown> | undefined;
          if (doc && doc.status === 'approved') {
            (updates as Record<string, unknown>)[key] = {
              ...doc,
              status: 'needs_review',
              lastUpdated: new Date().toISOString(),
            };
          }
        }
        return updates;
      });
      persist();
    },

    completeWizard: () => {
      set({ wizardStatus: 'completed' as const });
      persist();
      // Clear sessionStorage but keep localStorage for reference
      try {
        sessionStorage.removeItem(STORAGE_KEY);
      } catch { /* ignore */ }
    },
  };
});
