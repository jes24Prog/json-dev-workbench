import { useCallback, useRef, useState } from 'react';
import { runWorkerTask } from '../services/worker';
import { useSettingsStore } from '../stores/settingsStore';

interface HeavyTaskState<T> {
  running: boolean;
  error: string | null;
  result: T | null;
}

const WORKER_THRESHOLD_BYTES = 512 * 1024;

/**
 * Runs a CPU-heavy operation. Uses a Web Worker for large inputs so the UI
 * thread never blocks; falls back to an in-thread callback for small inputs
 * and when workers are unavailable.
 */
export function useHeavyTask<T, P>(runSync: (payload: P) => T | { ok: false; error: string }) {
  const workerEnabled = useSettingsStore((s) => s.settings.workerProcessing);
  const [state, setState] = useState<HeavyTaskState<T>>({ running: false, error: null, result: null });
  const syncFn = useRef(runSync);
  syncFn.current = runSync;

  const run = useCallback(
    async (
      payload: P,
      sizeBytes: number,
      workerTask?: { type: 'format' | 'minify' | 'stats' | 'diff'; toWorkerPayload: (p: P) => unknown },
    ) => {
      setState({ running: true, error: null, result: null });
      try {
        let output: T;
        if (workerEnabled && workerTask && sizeBytes > WORKER_THRESHOLD_BYTES) {
          const response = await runWorkerTask(workerTask.type, workerTask.toWorkerPayload(payload));
          if (!response.ok) {
            setState({ running: false, error: response.error ?? 'Processing failed.', result: null });
            return;
          }
          output = response.data as T;
        } else {
          const result = syncFn.current(payload);
          if (result && typeof result === 'object' && 'ok' in result && !(result as { ok: boolean }).ok) {
            setState({
              running: false,
              error: (result as { error: string }).error,
              result: null,
            });
            return;
          }
          output = result as T;
        }
        setState({ running: false, error: null, result: output });
      } catch (err) {
        setState({
          running: false,
          error: err instanceof Error ? err.message : 'Processing failed.',
          result: null,
        });
      }
    },
    [workerEnabled],
  );

  const reset = useCallback(() => {
    setState({ running: false, error: null, result: null });
  }, []);

  return { ...state, run, reset };
}
