import { describe, expect, it } from 'vitest';
import { createSerializedMutationQueue } from '../mutation-queue';

function delay(ms: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });
}

describe('createSerializedMutationQueue', () => {
  it('runs queued tasks in strict FIFO order', async () => {
    const queue = createSerializedMutationQueue();
    const events: string[] = [];

    void queue.enqueue(async () => {
      events.push('task-1-start');
      await delay(20);
      events.push('task-1-end');
    });

    void queue.enqueue(async () => {
      events.push('task-2-start');
      await delay(1);
      events.push('task-2-end');
    });

    await queue.onIdle();

    expect(events).toEqual([
      'task-1-start',
      'task-1-end',
      'task-2-start',
      'task-2-end',
    ]);
  });

  it('continues processing tasks after a rejected mutation', async () => {
    const queue = createSerializedMutationQueue();
    const events: string[] = [];

    const first = queue.enqueue(async () => {
      events.push('task-1-start');
      throw new Error('failed');
    });

    void queue.enqueue(async () => {
      events.push('task-2-start');
      await delay(1);
      events.push('task-2-end');
    });

    await expect(first).rejects.toThrow('failed');
    await queue.onIdle();

    expect(events).toEqual(['task-1-start', 'task-2-start', 'task-2-end']);
  });
});
