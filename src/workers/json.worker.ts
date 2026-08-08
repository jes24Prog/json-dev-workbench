import type { WorkerTask, WorkerResponse } from '../services/worker';
import { formatJsonText, minifyJsonText } from '../core/json/format';
import { parseJson } from '../core/json/parse';
import { analyzeJson } from '../core/json/stats';
import { diffJson } from '../core/diff';
import type { FormatOptions } from '../core/json/format';

self.onmessage = (event: MessageEvent<WorkerTask>) => {
  const { id, type, payload } = event.data;
  const respond = (data: unknown): void => {
    const response: WorkerResponse = { id, ok: true, data };
    self.postMessage(response);
  };
  const fail = (error: unknown): void => {
    const response: WorkerResponse = {
      id,
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    };
    self.postMessage(response);
  };

  try {
    switch (type) {
      case 'format': {
        const p = payload as { text: string; options: FormatOptions };
        const result = formatJsonText(p.text, p.options);
        if (!result.ok) return fail(result.error);
        respond({ output: result.output });
        return;
      }
      case 'minify': {
        const p = payload as { text: string; escapeUnicode: boolean };
        const result = minifyJsonText(p.text, { escapeUnicode: p.escapeUnicode });
        if (!result.ok) return fail(result.error);
        respond({ output: result.output });
        return;
      }
      case 'stats': {
        const p = payload as { text: string };
        const parsed = parseJson(p.text);
        if (!parsed.ok) return fail(parsed.error);
        respond({ stats: analyzeJson(parsed.value) });
        return;
      }
      case 'diff': {
        const p = payload as { left: string; right: string };
        const l = parseJson(p.left);
        if (!l.ok) return fail(l.error);
        const r = parseJson(p.right);
        if (!r.ok) return fail(r.error);
        respond({ result: diffJson(l.value, r.value) });
        return;
      }
      default:
        fail(`Unknown worker task: ${String(type)}`);
    }
  } catch (err) {
    fail(err);
  }
};

export {};
