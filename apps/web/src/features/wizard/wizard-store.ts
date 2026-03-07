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
  type DocumentWithState,
  type DocumentStatus,
  emptyDocument,
  emptyIdeaIntake,
} from './wizard-types';

/* ─── State Shape ──────────────────────────────────────── */

export interface WizardState {
  currentPage: number;
  completedPages: number[];
  skippedPages: number[];
  quickMode: boolean;
  projectId: string | null;

  // Pre-project data (sessionStorage)
  ideaIntake: IdeaIntakeData;
  requirementReport: DocumentWithState<RequirementReport>;
  researchSummary: DocumentWithState<ResearchSummary>;
  gapChecklist: DocumentWithState<GapChecklist>;
  projectCreation: ProjectCreationData;

  // Post-project data
  strategyBrief: DocumentWithState<StrategyBrief>;
  contextBible: DocumentWithState<ContextBible>;

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

  updateDocumentStatus: (
    key: 'requirementReport' | 'researchSummary' | 'gapChecklist' | 'strategyBrief' | 'contextBible',
    status: DocumentStatus
  ) => void;
  addUserNote: (
    key: 'requirementReport' | 'researchSummary' | 'gapChecklist' | 'strategyBrief' | 'contextBible',
    note: string
  ) => void;
  lockSection: (
    key: 'requirementReport' | 'researchSummary' | 'gapChecklist' | 'strategyBrief' | 'contextBible',
    sectionId: string
  ) => void;
  unlockSection: (
    key: 'requirementReport' | 'researchSummary' | 'gapChecklist' | 'strategyBrief' | 'contextBible',
    sectionId: string
  ) => void;

  resetWizard: () => void;
  hydrateFromStorage: () => void;
}

/* ─── Persistence ──────────────────────────────────────── */

const STORAGE_KEY = 'vv-wizard-state';

function saveToStorage(state: WizardState) {
  try {
    const serializable = {
      currentPage: state.currentPage,
      completedPages: state.completedPages,
      skippedPages: state.skippedPages,
      quickMode: state.quickMode,
      projectId: state.projectId,
      ideaIntake: state.ideaIntake,
      requirementReport: state.requirementReport,
      researchSummary: state.researchSummary,
      gapChecklist: state.gapChecklist,
      projectCreation: state.projectCreation,
      strategyBrief: state.strategyBrief,
      contextBible: state.contextBible,
    };
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(serializable));
    // Also save to localStorage for recovery
    localStorage.setItem(STORAGE_KEY, JSON.stringify(serializable));
  } catch {
    // Storage full / unavailable — silently ignore
  }
}

function loadFromStorage(): Partial<WizardState> | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY) || localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as Partial<WizardState>;
  } catch {
    return null;
  }
}

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

    ideaIntake: { ...emptyIdeaIntake },
    requirementReport: emptyDocument<RequirementReport>(),
    researchSummary: emptyDocument<ResearchSummary>(),
    gapChecklist: emptyDocument<GapChecklist>(),
    projectCreation: { ...defaultProjectCreation },
    strategyBrief: emptyDocument<StrategyBrief>(),
    contextBible: emptyDocument<ContextBible>(),

    /* ── Navigation ────────────────────────── */

    setCurrentPage: (page) => {
      set({ currentPage: page });
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
        ideaIntake: { ...emptyIdeaIntake },
        requirementReport: emptyDocument<RequirementReport>(),
        researchSummary: emptyDocument<ResearchSummary>(),
        gapChecklist: emptyDocument<GapChecklist>(),
        projectCreation: { ...defaultProjectCreation },
        strategyBrief: emptyDocument<StrategyBrief>(),
        contextBible: emptyDocument<ContextBible>(),
      });
    },

    hydrateFromStorage: () => {
      const saved = loadFromStorage();
      if (!saved) return;
      set((s) => ({
        ...s,
        currentPage: saved.currentPage ?? s.currentPage,
        completedPages: saved.completedPages ?? s.completedPages,
        skippedPages: saved.skippedPages ?? s.skippedPages,
        quickMode: saved.quickMode ?? s.quickMode,
        projectId: saved.projectId ?? s.projectId,
        ideaIntake: saved.ideaIntake ?? s.ideaIntake,
        requirementReport: saved.requirementReport ?? s.requirementReport,
        researchSummary: saved.researchSummary ?? s.researchSummary,
        gapChecklist: saved.gapChecklist ?? s.gapChecklist,
        projectCreation: saved.projectCreation ?? s.projectCreation,
        strategyBrief: saved.strategyBrief ?? s.strategyBrief,
        contextBible: saved.contextBible ?? s.contextBible,
      }));
    },
  };
});
