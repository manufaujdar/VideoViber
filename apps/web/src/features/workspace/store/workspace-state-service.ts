import type { Generation, Project, Shot } from './workspace-store';

export type CreateProjectInput = {
  id: string;
  title: string;
  brief: string;
  provider: string;
  shots?: Shot[];
  createdAtIso: string;
};

export type CreateGenerationInput = {
  id: string;
  generation: Omit<Generation, 'id' | 'startedAt' | 'completedAt' | 'error'>;
  startedAtIso: string;
};

export function createProjectRecord(input: CreateProjectInput): Project {
  const normalizedShots = (input.shots ?? []).map((shot, index) => ({
    ...shot,
    projectId: input.id,
    order: Number.isFinite(shot.order) ? shot.order : index,
  }));

  return {
    id: input.id,
    title: input.title,
    brief: input.brief,
    provider: input.provider,
    starred: false,
    archivedAt: null,
    status: normalizedShots.length > 0 ? 'generating' : 'draft',
    shots: normalizedShots,
    createdAt: input.createdAtIso,
    updatedAt: input.createdAtIso,
  };
}

export function patchProjectCollection(
  projects: Project[],
  projectId: string,
  updates: Partial<Project>,
  updatedAtIso: string
): Project[] {
  return projects.map((project) =>
    project.id === projectId
      ? {
          ...project,
          ...updates,
          updatedAt: updatedAtIso,
        }
      : project
  );
}

export function appendShotToProject(
  projects: Project[],
  projectId: string,
  shot: Shot,
  updatedAtIso: string
): Project[] {
  return projects.map((project) =>
    project.id === projectId
      ? {
          ...project,
          shots: [...project.shots, shot],
          updatedAt: updatedAtIso,
        }
      : project
  );
}

export function patchShotInProject(
  projects: Project[],
  projectId: string,
  shotId: string,
  updates: Partial<Shot>,
  updatedAtIso: string
): Project[] {
  return projects.map((project) =>
    project.id === projectId
      ? {
          ...project,
          shots: project.shots.map((shot) => (shot.id === shotId ? { ...shot, ...updates } : shot)),
          updatedAt: updatedAtIso,
        }
      : project
  );
}

export function removeShotFromProject(
  projects: Project[],
  projectId: string,
  shotId: string,
  updatedAtIso: string
): Project[] {
  return projects.map((project) =>
    project.id === projectId
      ? {
          ...project,
          shots: project.shots.filter((shot) => shot.id !== shotId),
          updatedAt: updatedAtIso,
        }
      : project
  );
}

export function createGenerationRecord(input: CreateGenerationInput): Generation {
  return {
    ...input.generation,
    id: input.id,
    startedAt: input.startedAtIso,
    completedAt: null,
    error: null,
  };
}

export function patchGenerationCollection(
  generations: Generation[],
  generationId: string,
  updates: Partial<Generation>
): Generation[] {
  return generations.map((generation) =>
    generation.id === generationId ? { ...generation, ...updates } : generation
  );
}
