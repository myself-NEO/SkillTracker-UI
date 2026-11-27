import type { Frame } from '@lib/viz/types';

// hashmap-put: HashMap.put step by step. The key's hashCode, the spread h ^ (h >>> 16), the
// bucket index (n - 1) & hash, chaining on a collision, and the resize that doubles the table
// and splits each chain into a "lo" and a "hi" bucket, as in the JDK 8+ implementation.

export interface HashmapPutParams {
  /** Table capacity, a power of two. */
  capacity: number;
  loadFactor: number;
  /** Keys put in order: strings use String.hashCode, numbers Integer.hashCode. */
  keys: (string | number)[];
}

export const HASHMAP_PUT_DEFAULTS: HashmapPutParams = { capacity: 4, loadFactor: 0.75, keys: ['cat', 'dog', 1, 5] };

export interface HashNode {
  /** Unique per key, so the view can animate a node from one bucket to another. */
  id: string;
  label: string;
  hash: number;
  /** During a resize: whether the node stays at j ("lo") or moves to j + oldCap ("hi"). */
  half?: 'lo' | 'hi';
}

export interface HashmapState {
  capacity: number;
  buckets: HashNode[][];
  size: number;
  threshold: number;
  /** The key being put and how far its hash has been worked out. */
  current?: { label: string; hashCode: number; spread?: number; index?: number };
  /** The bucket the current step is about. */
  bucket?: number;
}

/** Java's String.hashCode: s[0]*31^(n-1) + … + s[n-1], in 32-bit int arithmetic. */
export const stringHashCode = (value: string) => {
  let hash = 0;
  for (let i = 0; i < value.length; i++) hash = (Math.imul(31, hash) + value.charCodeAt(i)) | 0;
  return hash;
};

export const hashCodeOf = (key: string | number) => (typeof key === 'string' ? stringHashCode(key) : key | 0);
export const spread = (hashCode: number) => hashCode ^ (hashCode >>> 16);
export const labelOf = (key: string | number) => (typeof key === 'string' ? `"${key}"` : String(key));

const copy = (buckets: HashNode[][]) => buckets.map((chain) => chain.map((node) => ({ ...node })));

export const buildHashmapPut = ({ capacity, loadFactor, keys }: HashmapPutParams): Frame<HashmapState>[] => {
  const frames: Frame<HashmapState>[] = [];
  let buckets: HashNode[][] = Array.from({ length: capacity }, () => []);
  let cap = capacity;
  let size = 0;
  const threshold = () => Math.floor(cap * loadFactor);
  const push = (caption: string, extra: Partial<HashmapState> = {}) =>
    frames.push({ caption, state: { capacity: cap, buckets: copy(buckets), size, threshold: threshold(), ...extra } });

  push(
    `An empty HashMap with ${cap} buckets. It resizes when size passes ${threshold()} (capacity × load factor ${loadFactor}).`,
  );

  keys.forEach((key, position) => {
    const label = labelOf(key);
    const hashCode = hashCodeOf(key);
    const hash = spread(hashCode);
    const index = (cap - 1) & hash;
    push(`put(${label}, …): first, ${typeof key === 'string' ? 'String' : 'Integer'}.hashCode() gives ${hashCode}.`, {
      current: { label, hashCode },
    });
    push(`Spread the hash: h ^ (h >>> 16) = ${hash}, so the high bits also affect the bucket.`, {
      current: { label, hashCode, spread: hash },
    });
    push(`Bucket index: (n − 1) & hash = ${cap - 1} & ${hash} = ${index}.`, {
      current: { label, hashCode, spread: hash, index },
      bucket: index,
    });

    const chain = buckets[index];
    const existing = chain.findIndex((node) => node.label === label);
    if (existing >= 0) {
      push(
        `Bucket ${index} already holds ${label} (same hash, equals() is true): the value is replaced, size stays ${size}.`,
        {
          current: { label, hashCode, spread: hash, index },
          bucket: index,
        },
      );
      return;
    }
    const node: HashNode = { id: `${position}:${label}`, label, hash };
    const collision = chain.length > 0;
    buckets[index] = [...chain, node];
    size += 1;
    push(
      collision
        ? `Bucket ${index} already holds ${chain.map((n) => n.label).join(', ')}: a collision. The new node goes at the end of the chain. size = ${size}.`
        : `Bucket ${index} is empty: the node goes straight in. size = ${size}.`,
      { current: { label, hashCode, spread: hash, index }, bucket: index },
    );

    if (size > threshold()) {
      const oldCap = cap;
      push(`size ${size} > threshold ${threshold()}: resize() doubles the table to ${oldCap * 2} buckets.`);
      // Mark each node lo or hi by the one new bit of its hash, then move the hi ones.
      buckets = buckets.map((list) =>
        list.map((n) => ({ ...n, half: (n.hash & oldCap) === 0 ? 'lo' : 'hi' }) as HashNode),
      );
      push(
        `Each node checks one bit, hash & ${oldCap}: 0 stays in bucket j ("lo"), otherwise it moves to j + ${oldCap} ("hi"). No hashCode() calls: the hash is cached in the node.`,
      );
      cap = oldCap * 2;
      const next: HashNode[][] = Array.from({ length: cap }, () => []);
      buckets.forEach((list, j) => {
        for (const n of list) next[n.half === 'hi' ? j + oldCap : j].push(n);
      });
      buckets = next;
      push(`Done: chains split in their original order, so lookups stay O(1) on average with ${cap} buckets.`);
      buckets = buckets.map((list) => list.map(({ half: _half, ...n }) => n));
    }
  });

  push(`All ${keys.length} keys are in: ${size} entries in ${cap} buckets.`);
  return frames;
};
