import { z } from 'zod';
import { CONSISTENT_HASHING_DEFAULTS, type ConsistentHashingParams } from './scenes/consistent-hashing/logic';
import { GC_DEFAULTS } from './scenes/gc-generations/logic';
import { HASHMAP_PUT_DEFAULTS } from './scenes/hashmap-put/logic';
import { LOAD_BALANCER_DEFAULTS } from './scenes/load-balancer/logic';
import { OBSERVER_DEFAULTS } from './scenes/observer/logic';
import { REQUEST_JOURNEY_DEFAULTS } from './scenes/request-journey/logic';
import { SLIDING_WINDOW_DEFAULTS } from './scenes/sliding-window/logic';

// The parameters each scene accepts in a ```viz or ````scrolly block (JSON), checked on the
// server when a page is built and by the content validator. Missing fields take the scene's
// defaults. Zod stays on the server: players receive parameters already checked.

const isPowerOfTwo = (n: number) => n > 0 && (n & (n - 1)) === 0;
const ringPosition = z.number().int().min(0).max(255);
const sized = (min: number, max: number) => (record: object) =>
  Object.keys(record).length >= min && Object.keys(record).length <= max;

const SCHEMAS: Record<string, { schema: z.ZodType; defaults: object }> = {
  'hashmap-put': {
    schema: z
      .object({
        capacity: z.number().int().min(2).max(64).refine(isPowerOfTwo, 'capacity must be a power of two'),
        loadFactor: z.number().gt(0).max(4),
        keys: z
          .array(z.union([z.string().min(1).max(12), z.number().int()]))
          .min(1)
          .max(12),
      })
      .partial()
      .strict(),
    defaults: HASHMAP_PUT_DEFAULTS,
  },
  'sliding-window': {
    schema: z
      .object({
        array: z.array(z.number().int().min(-999).max(999)).min(2).max(12),
        k: z.number().int().min(1),
      })
      .partial()
      .strict(),
    defaults: SLIDING_WINDOW_DEFAULTS,
  },
  'consistent-hashing': {
    schema: z
      .object({
        nodes: z.record(z.string().min(1).max(8), ringPosition).refine(sized(2, 5), 'between 2 and 5 nodes'),
        keys: z.record(z.string().min(1).max(12), ringPosition).refine(sized(1, 10), 'between 1 and 10 keys'),
        joining: z.record(z.string().min(1).max(8), ringPosition).refine(sized(1, 1), 'exactly one joining node'),
        leaving: z.string().min(1),
        vnodes: z.number().int().min(2).max(32),
      })
      .partial()
      .strict(),
    defaults: CONSISTENT_HASHING_DEFAULTS,
  },
  'load-balancer': {
    schema: z
      .object({ servers: z.number().int().min(2).max(5), failing: z.number().int().min(0).max(4) })
      .partial()
      .strict(),
    defaults: LOAD_BALANCER_DEFAULTS,
  },
  observer: {
    schema: z
      .object({
        subject: z.string().min(1).max(24),
        subscribers: z.array(z.string().min(1).max(24)).min(2).max(4),
        joining: z.string().min(1).max(24),
        events: z.array(z.string().min(1).max(32)).min(1).max(3),
      })
      .partial()
      .strict(),
    defaults: OBSERVER_DEFAULTS,
  },
  'gc-generations': {
    schema: z
      .object({ tenuringThreshold: z.number().int().min(2).max(15) })
      .partial()
      .strict(),
    defaults: GC_DEFAULTS,
  },
  'request-journey': {
    schema: z
      .object({ rttMs: z.number().min(1).max(500), cacheHit: z.boolean() })
      .partial()
      .strict(),
    defaults: REQUEST_JOURNEY_DEFAULTS,
  },
};

export const hasSchema = (id: string) => id in SCHEMAS;

/**
 * A block's parameters, merged over the scene's defaults. Returns an error message instead when
 * the JSON doesn't parse or doesn't fit the scene.
 */
export const parseSceneParams = (id: string, json: string): { params: object } | { error: string } => {
  const entry = SCHEMAS[id];
  if (!entry) return { error: `unknown scene "${id}"` };
  let raw: unknown;
  try {
    raw = json.trim() ? JSON.parse(json) : {};
  } catch (error) {
    return { error: `parameters are not valid JSON (${(error as Error).message})` };
  }
  const result = entry.schema.safeParse(raw);
  if (!result.success)
    return {
      error: result.error.issues.map((issue) => `${issue.path.join('.') || 'params'}: ${issue.message}`).join('; '),
    };
  const params = { ...entry.defaults, ...(result.data as object) };
  // Cross-field rules.
  if (id === 'load-balancer') {
    const { servers, failing } = params as { servers: number; failing: number };
    if (failing >= servers) return { error: `failing (${failing}) must be a server index below ${servers}` };
  }
  if (id === 'consistent-hashing') {
    const { nodes, joining, leaving } = params as ConsistentHashingParams;
    const [joinName, joinAt] = Object.entries(joining)[0];
    if (!(leaving in nodes))
      return { error: `leaving ("${leaving}") must be one of the nodes (${Object.keys(nodes).join(', ')})` };
    if (joinName in nodes) return { error: `the joining node "${joinName}" is already on the ring` };
    const positions = [...Object.values(nodes), joinAt];
    if (new Set(positions).size !== positions.length) return { error: 'two nodes share a ring position' };
  }
  if (id === 'sliding-window') {
    const { array, k } = params as { array: number[]; k: number };
    if (k > array.length) return { error: `k (${k}) is larger than the array (${array.length} elements)` };
  }
  return { params };
};
