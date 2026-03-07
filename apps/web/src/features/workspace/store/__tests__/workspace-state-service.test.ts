import { describe, expect, it } from 'vitest';
import type { Generation, Project, Shot } from '../workspace-store';
import {
  appendShotToProject,
  createGenerationRecord,
  createProjectRecord,
  patchGenerationCollection,
  patchProjectCollection,
  patchShotInProject,
  removeShotFromProject,
} from '../workspace-state-service';

function makeShot(overrides?: Partial<Shot>): Shot {
  return {
    id: overrides?.id ?? 'shot-1',
    projectId: overrides?.projectId ?? 'project-1',
    title: overrides?.title ?? 'Shot One',
    prompt: overrides?.prompt ?? 'Prompt',
    status: overrides?.status ?? 'draft',
    provider: overrides?.provider ?? 'gemini',
    thumbnailUrl: overrides?.thumbnailUrl ?? null,
    videoUrl: overrides?.videoUrl ?? null,
    duration: overrides?.duration ?? 6,
    order: overrides?.order ?? 0,
    sourceType: overrides?.sourceType,
    assetId: overrides?.assetId ?? null,
    sourceMimeType: overrides?.sourceMimeType ?? null,
    sourceSizeBytes: overrides?.sourceSizeBytes ?? null,
    importedAt: overrides?.importedAt ?? null,
    createdAt: overrides?.createdAt ?? '2026-03-07T10:00:00.000Z',
  };
}

function makeProject(overrides?: Partial<Project>): Project {
  return {
    id: overrides?.id ?? 'project-1',
    title: overrides?.title ?? 'Project One',
    brief: overrides?.brief ?? 'Brief',
    provider: overrides?.provider ?? 'gemini',
    starred: overrides?.starred ?? false,
    archivedAt: overrides?.archivedAt ?? null,
    status: overrides?.status ?? 'draft',
    shots: overrides?.shots ?? [],
    createdAt: overrides?.createdAt ?? '2026-03-07T09:00:00.000Z',
    updatedAt: overrides?.updatedAt ?? '2026-03-07T09:00:00.000Z',
  };
}

function makeGeneration(overrides?: Partial<Generation>): Generation {
  return {
    id: overrides?.id ?? 'gen-1',
    projectId: overrides?.projectId ?? 'project-1',
    projectTitle: overrides?.projectTitle ?? 'Project One',
    shotId: overrides?.shotId ?? 'shot-1',
    shotTitle: overrides?.shotTitle ?? 'Shot One',
    provider: overrides?.provider ?? 'gemini',
    status: overrides?.status ?? 'queued',
    progress: overrides?.progress ?? 0,
    startedAt: overrides?.startedAt ?? '2026-03-07T10:00:00.000Z',
    completedAt: overrides?.completedAt ?? null,
    error: overrides?.error ?? null,
  };
}

describe('workspace-state-service', () => {
  it('creates project record with normalized shot ownership and ordering', () => {
    const shotA = makeShot({ id: 'a', projectId: '', order: Number.NaN });
    const shotB = makeShot({ id: 'b', projectId: '', order: 4 });

    const project = createProjectRecord({
      id: 'project-42',
      title: 'Cinematic Build',
      brief: 'A rich brief',
      provider: 'veo',
      shots: [shotA, shotB],
      createdAtIso: '2026-03-07T11:00:00.000Z',
    });

    expect(project.id).toBe('project-42');
    expect(project.status).toBe('generating');
    expect(project.shots[0]?.projectId).toBe('project-42');
    expect(project.shots[0]?.order).toBe(0);
    expect(project.shots[1]?.order).toBe(4);
  });

  it('patches only target project and refreshes updatedAt', () => {
    const source = [
      makeProject({ id: 'project-1', title: 'One' }),
      makeProject({ id: 'project-2', title: 'Two' }),
    ];

    const next = patchProjectCollection(
      source,
      'project-2',
      { title: 'Two Updated', starred: true },
      '2026-03-07T12:00:00.000Z'
    );

    expect(next[0]?.title).toBe('One');
    expect(next[1]?.title).toBe('Two Updated');
    expect(next[1]?.starred).toBe(true);
    expect(next[1]?.updatedAt).toBe('2026-03-07T12:00:00.000Z');
  });

  it('appends, updates, and removes shot records from a project', () => {
    const original = [makeProject({ id: 'project-1', shots: [makeShot({ id: 'shot-1' })] })];

    const appended = appendShotToProject(
      original,
      'project-1',
      makeShot({ id: 'shot-2', title: 'Second' }),
      '2026-03-07T12:10:00.000Z'
    );
    expect(appended[0]?.shots.map((shot) => shot.id)).toEqual(['shot-1', 'shot-2']);

    const updated = patchShotInProject(
      appended,
      'project-1',
      'shot-2',
      { status: 'processing', title: 'Second Updated' },
      '2026-03-07T12:11:00.000Z'
    );
    expect(updated[0]?.shots.find((shot) => shot.id === 'shot-2')?.status).toBe('processing');
    expect(updated[0]?.shots.find((shot) => shot.id === 'shot-2')?.title).toBe('Second Updated');

    const removed = removeShotFromProject(
      updated,
      'project-1',
      'shot-1',
      '2026-03-07T12:12:00.000Z'
    );
    expect(removed[0]?.shots.map((shot) => shot.id)).toEqual(['shot-2']);
  });

  it('creates and patches generation records', () => {
    const created = createGenerationRecord({
      id: 'gen-42',
      startedAtIso: '2026-03-07T12:15:00.000Z',
      generation: {
        projectId: 'project-1',
        projectTitle: 'Project One',
        shotId: 'shot-1',
        shotTitle: 'Shot One',
        provider: 'gemini',
        status: 'queued',
        progress: 0,
      },
    });

    expect(created.completedAt).toBeNull();
    expect(created.error).toBeNull();

    const patched = patchGenerationCollection([created, makeGeneration({ id: 'gen-2' })], 'gen-42', {
      status: 'processing',
      progress: 45,
    });

    expect(patched[0]?.status).toBe('processing');
    expect(patched[0]?.progress).toBe(45);
    expect(patched[1]?.status).toBe('queued');
  });
});
