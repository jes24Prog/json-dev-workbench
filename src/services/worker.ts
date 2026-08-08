export type WorkerTaskType = 'format' | 'minify' | 'stats' | 'diff';

export interface WorkerTask<T = unknown> {
  id: number;
  type: WorkerTaskType;
  payload: T;
}

export interface WorkerResponse<T = unknown> {
  id: number;
  ok: boolean;
  data?: T;
  error?: string;
}

let worker: Worker | null = null;
let nextId = 1;
const pending = new Map<number, { resolve: (r: WorkerResponse) => void; reject: (e: Error) => void }>();

function getWorker(): Worker | null {
  if (typeof Worker === 'undefined') return null;
  if (!worker) {
    try {
      worker = new Worker(new URL('../workers/json.worker.ts', import.meta.url), {
        type: 'module',
      });
      worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
        const entry = pending.get(event.data.id);
        if (!entry) return;
        pending.delete(event.data.id);
        entry.resolve(event.data);
      };
      worker.onerror = (event) => {
        for (const entry of pending.values()) entry.reject(new Error(event.message || 'Worker error'));
        pending.clear();
      };
    } catch {
      return null;
    }
  }
  return worker;
}

export function runWorkerTask<T = unknown>(type: WorkerTaskType, payload: T): Promise<WorkerResponse> {
  return new Promise((resolve, reject) => {
    const w = getWorker();
    if (!w) {
      reject(new Error('Web Worker unavailable.'));
      return;
    }
    const id = nextId++;
    pending.set(id, { resolve, reject });
    w.postMessage({ id, type, payload } as WorkerTask);
  });
}

export function terminateWorker(): void {
  if (worker) {
    worker.terminate();
    worker = null;
    pending.clear();
  }
}
