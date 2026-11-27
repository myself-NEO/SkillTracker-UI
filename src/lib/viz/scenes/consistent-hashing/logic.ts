import type { Frame } from '@lib/viz/types';

// consistent-hashing: nodes and keys on a ring of positions 0x00–0xFF. A key belongs to the
// first node clockwise from it. A node joins (taking one arc from one node), another leaves
// (all its keys go to its successor), then virtual nodes even out the arcs and spread the
// load of a leaving node. Positions are given rather than hashed, so a lesson can match its
// diagrams; virtual-node positions are hashed (FNV-1a), like `server + "#" + i` in the lesson.

export interface ConsistentHashingParams {
  /** Node name → ring position (0–255). */
  nodes: Record<string, number>;
  /** Key → ring position (0–255). The first key is the one followed step by step. */
  keys: Record<string, number>;
  /** The node that joins, as { name: position }. */
  joining: Record<string, number>;
  /** The node that leaves (one of `nodes`). */
  leaving: string;
  /** Points per node once virtual nodes are on. */
  vnodes: number;
}

export const CONSISTENT_HASHING_DEFAULTS: ConsistentHashingParams = {
  nodes: { A: 0x10, B: 0x70, C: 0x80, D: 0xc0 },
  keys: {
    'user:42': 0x3a,
    'feed:2': 0x05,
    'img:3': 0x1c,
    'cart:7': 0x22,
    'order:19': 0x78,
    'sess:88': 0x9e,
    'video:5': 0xb4,
    'post:61': 0xe6,
  },
  joining: { N: 0x30 },
  leaving: 'D',
  vnodes: 10,
};

export const RING = 256;

export interface RingPoint {
  node: string;
  at: number;
  /** 0 is the node's own point; 1… are its virtual nodes. */
  replica: number;
}

export interface RingKey {
  name: string;
  at: number;
  owner?: string;
  /** Owned by a different node than in the previous frame. */
  moved?: boolean;
}

export interface RingState {
  /** Every node that appears in the scene, in order: it fixes each node's colour. */
  nodes: string[];
  /** Points on the ring, by position. */
  points: RingPoint[];
  keys: RingKey[];
  /** Colour each arc by the node that owns it. */
  arcs: boolean;
  /** A key's walk clockwise to its node, drawn along the ring. */
  walk?: { from: number; to: number };
  /** The points of a node that has just left, shown as ghosts. */
  gone?: RingPoint[];
  /** Share of the ring each node owns (0–1), when arcs are shown. */
  shares?: Record<string, number>;
}

export const hex = (at: number) => `0x${at.toString(16).toUpperCase().padStart(2, '0')}`;

/** FNV-1a over the string, mixed with MurmurHash3's finaliser; the top byte is the position. */
export const ringHash = (text: string) => {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  h ^= h >>> 16;
  h = Math.imul(h, 0x85ebca6b);
  h ^= h >>> 13;
  h = Math.imul(h, 0xc2b2ae35);
  h ^= h >>> 16;
  return h >>> 24;
};

const byPosition = (a: RingPoint, b: RingPoint) => a.at - b.at || a.node.localeCompare(b.node);

/** The first point clockwise from `at` (inclusive), wrapping past 0xFF. */
export const ownerPoint = (at: number, points: RingPoint[]) => points.find((p) => p.at >= at) ?? points[0];

/** Each point owns the arc after the previous point, up to and including itself. */
export const arcLength = (index: number, points: RingPoint[]) => {
  if (points.length === 1) return RING;
  const previous = points[(index - 1 + points.length) % points.length];
  return (points[index].at - previous.at + RING) % RING || RING;
};

export const sharesOf = (points: RingPoint[]) => {
  const shares: Record<string, number> = {};
  points.forEach((point, index) => {
    shares[point.node] = (shares[point.node] ?? 0) + arcLength(index, points) / RING;
  });
  return shares;
};

const pct = (share: number) => `${Math.round(share * 100)}%`;
/** The largest share as a multiple of a fair share (1 / number of nodes). */
const busiest = (shares: Record<string, number>) => Math.max(...Object.values(shares)) * Object.keys(shares).length;
const list = (names: string[]) =>
  names.length <= 1 ? (names[0] ?? '') : `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;

export const buildConsistentHashing = (params: ConsistentHashingParams): Frame<RingState>[] => {
  const [joinName, joinAt] = Object.entries(params.joining)[0];
  const names = Object.keys(params.nodes);
  const nodes = [...names, joinName];
  const keyList = Object.entries(params.keys).map(([name, at]) => ({ name, at }));
  const total = keyList.length;
  const single = (of: string[]) =>
    of.map((node) => ({ node, at: node === joinName ? joinAt : params.nodes[node], replica: 0 })).sort(byPosition);
  const assign = (points: RingPoint[], previous?: RingKey[]): RingKey[] =>
    keyList.map((key) => {
      const owner = ownerPoint(key.at, points).node;
      const before = previous?.find((k) => k.name === key.name)?.owner;
      return { ...key, owner, ...(before && before !== owner ? { moved: true } : {}) };
    });
  const state = (points: RingPoint[], keys: RingKey[], extra: Partial<RingState> = {}): RingState => ({
    nodes,
    points,
    keys,
    arcs: false,
    ...extra,
  });
  const frames: Frame<RingState>[] = [];

  // The ring and its nodes.
  const ring = single(names);
  frames.push({
    caption: 'Each node is hashed to a position on a ring: 0x00 to 0xFF here, 64-bit numbers in real systems.',
    state: state(ring, []),
  });

  // Keys on the same ring.
  const [first] = keyList;
  frames.push({
    caption: `Keys are hashed onto the same ring: ${first.name} lands at ${hex(first.at)}.`,
    state: state(
      ring,
      keyList.map((key) => ({ ...key })),
    ),
  });

  // One key's walk to its node.
  const firstOwner = ownerPoint(first.at, ring);
  frames.push({
    caption: `A key belongs to the first node clockwise: ${first.name} walks from ${hex(first.at)} to ${firstOwner.node} at ${hex(firstOwner.at)}.`,
    state: state(
      ring,
      keyList.map((key) => (key.name === first.name ? { ...key, owner: firstOwner.node } : { ...key })),
      { walk: { from: first.at, to: firstOwner.at } },
    ),
  });

  // Every key, and the arc each node owns.
  const owned = assign(ring);
  const shares = sharesOf(ring);
  const ranked = Object.entries(shares).sort((a, b) => b[1] - a[1]);
  const [big, small] = [ranked[0], ranked[ranked.length - 1]];
  frames.push({
    caption: `So each node owns the arc that ends at it. With one point per node the arcs are uneven: ${big[0]} owns ${pct(big[1])} of the ring, ${small[0]} only ${pct(small[1])}.`,
    state: state(ring, owned, { arcs: true, shares }),
  });

  // A node joins.
  const joined = single(nodes);
  const afterJoin = assign(joined, owned);
  const joinIndex = joined.findIndex((p) => p.node === joinName);
  const predecessor = joined[(joinIndex - 1 + joined.length) % joined.length];
  const successor = joined[(joinIndex + 1) % joined.length];
  const movedOnJoin = afterJoin.filter((k) => k.moved).length;
  const n = names.length;
  frames.push({
    caption: `${joinName} joins at ${hex(joinAt)}. It takes only the arc from ${predecessor.node} to itself, all from ${successor.node}: ${movedOnJoin} of ${total} keys move. With hash mod n, going from ${n} to ${n + 1} nodes would move about ${Math.round((100 * n) / (n + 1))}%.`,
    state: state(joined, afterJoin, { arcs: true, shares: sharesOf(joined) }),
  });

  // A node leaves.
  const left = joined.filter((p) => p.node !== params.leaving);
  const afterLeave = assign(left, afterJoin);
  const heir = ownerPoint((params.nodes[params.leaving] + 1) % RING, left).node;
  const heirKeys = afterLeave.filter((k) => k.owner === heir).length;
  frames.push({
    caption: `${params.leaving} leaves. Only its keys move, all to its successor ${heir}, which now holds ${heirKeys} of ${total} keys.`,
    state: state(left, afterLeave, {
      arcs: true,
      shares: sharesOf(left),
      gone: joined.filter((p) => p.node === params.leaving),
    }),
  });

  // Virtual nodes: every node at several points.
  const taken = new Set<number>([...ring.map((p) => p.at), ...keyList.map((k) => k.at)]);
  const virtual: RingPoint[] = [...ring];
  for (const node of names) {
    for (let replica = 1; replica < params.vnodes; replica++) {
      let at = ringHash(`${node}#${replica}`);
      while (taken.has(at)) at = (at + 1) % RING;
      taken.add(at);
      virtual.push({ node, at, replica });
    }
  }
  virtual.sort(byPosition);
  const virtualOwned = assign(virtual);
  const virtualShares = sharesOf(virtual);
  const [before, after] = [busiest(shares), busiest(virtualShares)];
  frames.push({
    caption:
      after < before - 0.05
        ? `Start again with ${params.vnodes} points per node: virtual nodes (real systems use 100 or more). Each node owns many small arcs, and the busiest node falls from ${before.toFixed(1)}× to ${after.toFixed(1)}× its fair share.`
        : `Start again with ${params.vnodes} points per node: virtual nodes. With this few points the arcs are still uneven (the busiest node holds ${after.toFixed(1)}× its fair share); real systems use 100 or more.`,
    state: state(virtual, virtualOwned, { arcs: true, shares: virtualShares }),
  });

  // The same node leaves again.
  const virtualLeft = virtual.filter((p) => p.node !== params.leaving);
  const heirs = [
    ...new Set(
      virtual.filter((p) => p.node === params.leaving).map((p) => ownerPoint((p.at + 1) % RING, virtualLeft).node),
    ),
  ].sort();
  frames.push({
    caption:
      heirs.length > 1
        ? `Now when ${params.leaving} leaves, its arcs go to ${list(heirs)}: the load spreads instead of landing on one node.`
        : `When ${params.leaving} leaves, its arcs all go to ${heirs[0]}; with more virtual nodes they would spread over several nodes.`,
    state: state(virtualLeft, assign(virtualLeft, virtualOwned), {
      arcs: true,
      shares: sharesOf(virtualLeft),
      gone: virtual.filter((p) => p.node === params.leaving),
    }),
  });

  return frames;
};
