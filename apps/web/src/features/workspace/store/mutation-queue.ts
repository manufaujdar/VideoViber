export type QueueTask = () => Promise<void>;

export type SerializedMutationQueue = {
  enqueue: (task: QueueTask) => Promise<void>;
  onIdle: () => Promise<void>;
};

export function createSerializedMutationQueue(): SerializedMutationQueue {
  let chain: Promise<void> = Promise.resolve();

  return {
    enqueue(task) {
      const current = chain.then(task);
      chain = current.catch(() => undefined);
      return current;
    },
    onIdle() {
      return chain.catch(() => undefined);
    },
  };
}
