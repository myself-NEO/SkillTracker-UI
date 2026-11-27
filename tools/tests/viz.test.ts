import { describe, expect, it } from 'vitest';
import { BUILDERS } from '@lib/viz/builders';
import { splitScrolly } from '@lib/viz/fence';
import { SCENES } from '@lib/viz/registry';
import { hasSchema, parseSceneParams } from '@lib/viz/schemas';
import {
  buildConsistentHashing,
  CONSISTENT_HASHING_DEFAULTS,
  ownerPoint,
  sharesOf,
} from '@lib/viz/scenes/consistent-hashing/logic';
import { buildGcGenerations } from '@lib/viz/scenes/gc-generations/logic';
import { buildHashmapPut, spread, stringHashCode } from '@lib/viz/scenes/hashmap-put/logic';
import { buildLoadBalancer } from '@lib/viz/scenes/load-balancer/logic';
import { buildObserver, OBSERVER_DEFAULTS } from '@lib/viz/scenes/observer/logic';
import { buildRequestJourney } from '@lib/viz/scenes/request-journey/logic';
import { buildSlidingWindow, SLIDING_WINDOW_CODE } from '@lib/viz/scenes/sliding-window/logic';
import { checkAnimation } from '../content/checks';

const defaultsOf = (id: string) => {
  const parsed = parseSceneParams(id, '{}');
  if ('error' in parsed) throw new Error(parsed.error);
  return parsed.params;
};
const last = <T>(items: T[]) => items[items.length - 1];

describe('the scene registry', () => {
  it('gives every scene a schema, a frame builder and a player', () => {
    for (const scene of SCENES) {
      expect(hasSchema(scene.id), scene.id).toBe(true);
      expect(BUILDERS[scene.id], scene.id).toBeTypeOf('function');
      expect(scene.modes.length, scene.id).toBeGreaterThan(0);
    }
    expect(Object.keys(BUILDERS).sort()).toEqual(SCENES.map((scene) => scene.id).sort());
  });

  it.each(SCENES.map((scene) => scene.id))('%s builds captioned frames from its defaults', (id) => {
    const frames = BUILDERS[id](defaultsOf(id));
    expect(frames.length).toBeGreaterThan(1);
    for (const frame of frames) {
      expect(frame.caption.trim().length).toBeGreaterThan(0);
      expect(frame.state).toBeTruthy();
    }
    // Deterministic: the same parameters give the same frames.
    expect(BUILDERS[id](defaultsOf(id))).toEqual(frames);
  });
});

describe('scene parameters', () => {
  it('fills in defaults and rejects what a scene cannot show', () => {
    expect(parseSceneParams('sliding-window', '{ "k": 2 }')).toEqual({ params: { array: [2, 1, 5, 1, 3, 2], k: 2 } });
    expect(parseSceneParams('sliding-window', '{ "k": 9 }')).toEqual({
      error: 'k (9) is larger than the array (6 elements)',
    });
    expect(parseSceneParams('hashmap-put', '{ "capacity": 6 }')).toMatchObject({
      error: expect.stringContaining('power of two'),
    });
    expect(parseSceneParams('load-balancer', '{ "servers": 2, "failing": 2 }')).toMatchObject({
      error: expect.any(String),
    });
    expect(parseSceneParams('observer', '{ "colour": "red" }')).toMatchObject({ error: expect.any(String) });
    expect(parseSceneParams('gc-generations', '{ not json }')).toMatchObject({
      error: expect.stringContaining('not valid JSON'),
    });
    expect(parseSceneParams('consistent-hashing', '{ "leaving": "Z" }')).toMatchObject({
      error: expect.stringContaining('must be one of the nodes'),
    });
    expect(parseSceneParams('consistent-hashing', '{ "joining": { "M": 16 } }')).toEqual({
      error: 'two nodes share a ring position',
    });
    expect(parseSceneParams('nope', '{}')).toEqual({ error: 'unknown scene "nope"' });
  });
});

describe('hashmap-put', () => {
  it("matches Java's String.hashCode and HashMap's spreading", () => {
    expect(stringHashCode('cat')).toBe(98262);
    expect(stringHashCode('polygenelubricants')).toBe(-2147483648);
    expect(spread(0x12345678)).toBe(0x12345678 ^ 0x1234);
  });

  it('resizes once size passes capacity × load factor, keeping every key', () => {
    const frames = buildHashmapPut({ capacity: 4, loadFactor: 0.75, keys: ['cat', 'dog', 1, 5] });
    const end = last(frames).state;
    expect(end.capacity).toBe(8);
    expect(end.size).toBe(4);
    expect(
      end.buckets
        .flat()
        .map((node) => node.label)
        .sort(),
    ).toEqual(['"cat"', '"dog"', '1', '5']);
    // Every node sits in the bucket its hash selects.
    end.buckets.forEach((chain, index) => chain.forEach((node) => expect(node.hash & (end.capacity - 1)).toBe(index)));
  });

  it('replaces a key put twice instead of adding it', () => {
    const end = last(buildHashmapPut({ capacity: 16, loadFactor: 0.75, keys: ['a', 'a'] })).state;
    expect(end.size).toBe(1);
  });
});

describe('sliding-window', () => {
  it('finds the largest sum of k consecutive elements', () => {
    const end = last(buildSlidingWindow({ array: [2, 1, 5, 1, 3, 2], k: 3 })).state;
    expect(end).toMatchObject({ best: 9, bestRange: [2, 4], done: true });
    expect(last(buildSlidingWindow({ array: [-3, -1, -2], k: 1 })).state.best).toBe(-1);
  });

  it('points only at lines of its code', () => {
    const lines = SLIDING_WINDOW_CODE.split('\n').length;
    const pointed = buildSlidingWindow({ array: [4, 2, 7, 1], k: 2 }).flatMap((frame) => frame.line ?? []);
    expect(pointed.length).toBeGreaterThan(0);
    for (const line of pointed) {
      expect(line).toBeGreaterThanOrEqual(1);
      expect(line).toBeLessThanOrEqual(lines);
    }
  });
});

describe('load-balancer', () => {
  it('sends no requests to a server while it is out of the pool', () => {
    const frames = buildLoadBalancer({ servers: 3, failing: 1 });
    const down = frames.findIndex((frame) => frame.state.servers[1].healthy === false);
    const back = frames.findIndex((frame, index) => index > down && frame.state.servers[1].healthy);
    expect(down).toBeGreaterThan(0);
    for (const frame of frames.slice(down, back)) expect(frame.state.routed?.to).not.toBe(1);
    const served = last(frames).state.servers.map((server) => server.served);
    expect(served.reduce((sum, n) => sum + n, 0)).toBe(3 + 1 + 3 + 3);
  });
});

describe('observer', () => {
  it('notifies only the subscribers present when an event is published', () => {
    const frames = buildObserver(OBSERVER_DEFAULTS);
    const notified = (event: string) =>
      new Set(frames.filter((frame) => frame.state.event === event).flatMap((frame) => frame.state.notified));
    const [placed, shipped, delivered] = OBSERVER_DEFAULTS.events;
    expect(notified(placed)).toEqual(new Set(['EmailListener', 'LoyaltyListener', 'AuditListener']));
    expect(notified(shipped)).toEqual(new Set(['EmailListener', 'AuditListener']));
    expect(notified(delivered)).toEqual(new Set(['EmailListener', 'AuditListener', 'SmsListener']));
  });
});

describe('gc-generations', () => {
  it('copies survivors with one more year of age and promotes at the tenuring threshold', () => {
    const frames = buildGcGenerations({ tenuringThreshold: 4 });
    expect(frames).toHaveLength(6);
    const copied = frames[2].state;
    expect(copied.eden).toEqual([]);
    expect(copied.s1.map((o) => [o.id, o.age])).toEqual([
      ['a', 1],
      ['d', 1],
      ['g', 4],
    ]);
    expect(frames[3].state.s1.find((o) => o.id === 'g')?.promote).toBe(true);
    const promoted = frames[4].state;
    expect(promoted.old.map((o) => o.id)).toContain('g');
    expect([...promoted.s0, ...promoted.s1].map((o) => o.id)).not.toContain('g');
    expect(promoted.s0.map((o) => [o.id, o.age])).toEqual([
      ['h', 1],
      ['d', 2],
    ]);
    expect(last(frames).state.collecting).toBe('major');
  });
});

describe('request-journey', () => {
  const total = (frames: ReturnType<typeof buildRequestJourney>) =>
    last(frames).state.spent.reduce((sum, part) => sum + part.ms, 0);

  it('costs three round trips plus DNS and the servers on a cold connection', () => {
    expect(total(buildRequestJourney({ rttMs: 30, cacheHit: false }))).toBe(20 + 3 * 30 + 1 + 1 + 10);
    expect(total(buildRequestJourney({ rttMs: 100, cacheHit: false }))).toBe(20 + 3 * 100 + 12);
  });

  it('skips the database on a cache hit, with the same number of frames', () => {
    const hit = buildRequestJourney({ rttMs: 30, cacheHit: true });
    expect(hit).toHaveLength(buildRequestJourney({ rttMs: 30, cacheHit: false }).length);
    expect(last(hit).state.spent.map((part) => part.label)).not.toContain('Database');
    expect(total(hit)).toBe(20 + 90 + 2);
  });
});

describe('consistent-hashing', () => {
  const frames = buildConsistentHashing(CONSISTENT_HASHING_DEFAULTS);
  const owners = (index: number) => Object.fromEntries(frames[index].state.keys.map((key) => [key.name, key.owner]));

  it('gives each key to the first node clockwise, wrapping past 0xFF', () => {
    const points = [
      { node: 'A', at: 0x10, replica: 0 },
      { node: 'B', at: 0x70, replica: 0 },
    ];
    expect(ownerPoint(0x3a, points).node).toBe('B');
    expect(ownerPoint(0x10, points).node).toBe('A');
    expect(ownerPoint(0xf0, points).node).toBe('A');
    expect(owners(3)['user:42']).toBe('B');
  });

  it('moves only the arc a joining node takes, and only a leaving node’s keys', () => {
    const [before, joined, left] = [owners(3), owners(4), owners(5)];
    const movedOnJoin = Object.keys(joined).filter((key) => joined[key] !== before[key]);
    expect(movedOnJoin.sort()).toEqual(['cart:7', 'img:3']);
    for (const key of movedOnJoin) expect([before[key], joined[key]]).toEqual(['B', 'N']);
    const movedOnLeave = Object.keys(left).filter((key) => left[key] !== joined[key]);
    expect(movedOnLeave.sort()).toEqual(['sess:88', 'video:5']);
    for (const key of movedOnLeave) expect([joined[key], left[key]]).toEqual(['D', 'A']);
  });

  it('shares the whole ring, and virtual nodes even the shares out', () => {
    for (const frame of frames.filter((f) => f.state.shares))
      expect(Object.values(frame.state.shares!).reduce((sum, share) => sum + share, 0)).toBeCloseTo(1);
    const busiest = (index: number) => Math.max(...Object.values(sharesOf(frames[index].state.points)));
    expect(busiest(6)).toBeLessThan(busiest(3));
    expect(frames[6].state.points).toHaveLength(4 * CONSISTENT_HASHING_DEFAULTS.vnodes);
    expect(frames[7].caption).toMatch(/its arcs go to A, B and C/);
  });

  it('says so when too few virtual nodes leave the ring uneven', () => {
    const few = buildConsistentHashing({ ...CONSISTENT_HASHING_DEFAULTS, vnodes: 2 });
    expect(few[6].caption).toMatch(/still uneven|falls from/);
  });
});

describe('checkAnimation', () => {
  const fence = (lang: string, value: string, meta: string) => ({ lang, value, meta, line: 1 });
  const steps = (n: number) => Array.from({ length: n }, (_, i) => `---\nStep ${i + 1}`).join('\n');

  it('accepts the blocks the lessons use', () => {
    expect(checkAnimation(fence('viz', '{ "k": 2 }', 'name="sliding-window"'))).toEqual([]);
    expect(checkAnimation(fence('viz', '{}', 'name="load-balancer" mode="loop"'))).toEqual([]);
    expect(checkAnimation(fence('scrolly', `{}\n${steps(6)}`, 'name="gc-generations"'))).toEqual([]);
  });

  it('reports unknown scenes, bad parameters and modes, and step counts that miss the frames', () => {
    expect(checkAnimation(fence('viz', '{}', 'name="tetris"'))[0]).toMatch(/no animation called "tetris"/);
    expect(checkAnimation(fence('viz', '{ "k": 0 }', 'name="sliding-window"'))[0]).toMatch(/^sliding-window: k/);
    expect(checkAnimation(fence('viz', '{}', 'name="hashmap-put" mode="loop"'))).toEqual([
      'hashmap-put: mode="loop" is not one of stepper',
    ]);
    expect(checkAnimation(fence('scrolly', `{}\n${steps(5)}`, 'name="gc-generations"'))).toEqual([
      'gc-generations: the scrolly block has 5 step(s) but the scene has 6 frame(s)',
    ]);
    expect(checkAnimation(fence('scrolly', `{}\n${steps(9)}`, 'name="hashmap-put"'))[0]).toMatch(
      /can't be scroll-driven/,
    );
  });

  it('splits a scrolly block into parameters and steps', () => {
    expect(splitScrolly('{ "a": 1 }\n---\nOne\n---  \nTwo\r\n')).toEqual({ json: '{ "a": 1 }', steps: ['One', 'Two'] });
  });
});
