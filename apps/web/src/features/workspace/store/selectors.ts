import type { AppState, Project } from './workspace-store';

export const workspaceSelectors = {
  initialized: (state: AppState) => state.initialized,
  initializing: (state: AppState) => state.initializing,
  backendReady: (state: AppState) => state.backendReady,
  lastSyncError: (state: AppState) => state.lastSyncError,
  projects: (state: AppState) => state.projects,
  assets: (state: AppState) => state.assets,
  generations: (state: AppState) => state.generations,
  settings: (state: AppState) => state.settings,
  activeProjects: (state: AppState) =>
    state.projects.filter((project) => project.archivedAt === null),
  archivedProjects: (state: AppState) =>
    state.projects.filter((project) => project.archivedAt !== null),
  activeGenerations: (state: AppState) =>
    state.generations.filter(
      (generation) => generation.status === 'queued' || generation.status === 'processing'
    ),
  projectById:
    (projectId: string) =>
    (state: AppState): Project | undefined =>
      state.projects.find((project) => project.id === projectId),
};

export function selectProjectStats(state: AppState) {
  const active = state.projects.filter((project) => !project.archivedAt).length;
  const archived = state.projects.filter((project) => Boolean(project.archivedAt)).length;
  const starred = state.projects.filter((project) => project.starred && !project.archivedAt).length;

  return {
    total: state.projects.length,
    active,
    archived,
    starred,
  };
}
