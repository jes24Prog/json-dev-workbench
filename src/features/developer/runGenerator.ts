import { parseJson } from '../../core/json/parse';
import type { RunResult } from '../../components/common/ToolRunner';

/** Parse the input text and run a generator, mapping errors to RunResult. */
export function runGenerator(input: string, generate: (value: never) => { ok: boolean; output?: string; error?: string }): RunResult {
  const parsed = parseJson(input);
  if (!parsed.ok) return { ok: false, error: parsed.error };
  const result = generate(parsed.value as never);
  if (!result.ok) return { ok: false, error: result.error ?? 'Generation failed.' };
  return { ok: true, output: result.output ?? '' };
}
