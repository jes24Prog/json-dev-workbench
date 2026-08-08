import type { JsonValue } from '../../types/json';

export interface JsonStats {
  rootType: string;
  totalNodes: number;
  objects: number;
  arrays: number;
  strings: number;
  numbers: number;
  booleans: number;
  nulls: number;
  maxDepth: number;
  largestArrays: { path: string; length: number }[];
  largestObjects: { path: string; keys: number }[];
  duplicateKeys: { key: string; occurrences: number; paths: string[] }[];
  memoryEstimate: number;
}

interface DuplicateKeyEntry {
  key: string;
  occurrences: number;
  paths: string[];
}

export function analyzeJson(root: JsonValue): JsonStats {
  const stats: JsonStats = {
    rootType: root === null ? 'null' : Array.isArray(root) ? 'array' : typeof root,
    totalNodes: 0,
    objects: 0,
    arrays: 0,
    strings: 0,
    numbers: 0,
    booleans: 0,
    nulls: 0,
    maxDepth: 0,
    largestArrays: [],
    largestObjects: [],
    duplicateKeys: [],
    memoryEstimate: 0,
  };
  const dupMap = new Map<string, DuplicateKeyEntry>();

  const visit = (node: JsonValue, depth: number, path: string[]): void => {
    stats.totalNodes += 1;
    if (depth > stats.maxDepth) stats.maxDepth = depth;
    if (node === null) {
      stats.nulls += 1;
      return;
    }
    if (Array.isArray(node)) {
      stats.arrays += 1;
      if (stats.largestArrays.length < 8) {
        stats.largestArrays.push({ path: path.join('.') || '$', length: node.length });
        stats.largestArrays.sort((a, b) => b.length - a.length);
      } else if (node.length > stats.largestArrays[stats.largestArrays.length - 1].length) {
        stats.largestArrays[stats.largestArrays.length - 1] = {
          path: path.join('.') || '$',
          length: node.length,
        };
        stats.largestArrays.sort((a, b) => b.length - a.length);
      }
      for (let i = 0; i < node.length; i += 1) {
        visit(node[i], depth + 1, [...path, `[${i}]`]);
      }
      return;
    }
    if (typeof node === 'object') {
      stats.objects += 1;
      const keys = Object.keys(node as Record<string, JsonValue>);
      if (stats.largestObjects.length < 8) {
        stats.largestObjects.push({ path: path.join('.') || '$', keys: keys.length });
        stats.largestObjects.sort((a, b) => b.keys - a.keys);
      } else if (keys.length > stats.largestObjects[stats.largestObjects.length - 1].keys) {
        stats.largestObjects[stats.largestObjects.length - 1] = {
          path: path.join('.') || '$',
          keys: keys.length,
        };
        stats.largestObjects.sort((a, b) => b.keys - a.keys);
      }
      for (const key of keys) {
        const currentPath = [...path, key];
        const seenKey = key + '\u0000' + typeof (node as Record<string, JsonValue>)[key];
        const entry = dupMap.get(seenKey);
        if (entry) {
          entry.occurrences += 1;
          if (entry.paths.length < 10) entry.paths.push(currentPath.join('.'));
        } else {
          dupMap.set(seenKey, { key, occurrences: 1, paths: [currentPath.join('.')] });
        }
        visit((node as Record<string, JsonValue>)[key], depth + 1, currentPath);
      }
      return;
    }
    switch (typeof node) {
      case 'string':
        stats.strings += 1;
        break;
      case 'number':
        stats.numbers += 1;
        break;
      case 'boolean':
        stats.booleans += 1;
        break;
    }
  };

  visit(root, 0, []);
  stats.memoryEstimate = estimateJsonBytes(root);
  stats.duplicateKeys = [...dupMap.values()]
    .filter((e) => e.occurrences > 1)
    .sort((a, b) => b.occurrences - a.occurrences)
    .slice(0, 20);
  return stats;
}

export function estimateJsonBytes(value: JsonValue): number {
  return new TextEncoder().encode(JSON.stringify(value)).length;
}

export function findDeepestNodes(root: JsonValue, limit = 20): { path: string; depth: number }[] {
  const results: { path: string; depth: number }[] = [];
  const visit = (node: JsonValue, depth: number, path: string[]): void => {
    if (node === null || typeof node !== 'object') {
      results.push({ path: path.join('.') || '$', depth });
      return;
    }
    if (Array.isArray(node)) {
      if (node.length === 0) results.push({ path: path.join('.') || '$', depth });
      for (let i = 0; i < node.length; i += 1) {
        visit(node[i], depth + 1, [...path, `[${i}]`]);
      }
      return;
    }
    const keys = Object.keys(node as Record<string, JsonValue>);
    if (keys.length === 0) results.push({ path: path.join('.') || '$', depth });
    for (const key of keys) {
      visit((node as Record<string, JsonValue>)[key], depth + 1, [...path, key]);
    }
  };
  visit(root, 0, []);
  results.sort((a, b) => b.depth - a.depth);
  return results.slice(0, limit);
}
