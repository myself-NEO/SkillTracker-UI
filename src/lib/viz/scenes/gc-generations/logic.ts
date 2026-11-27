import type { Frame } from '@lib/viz/types';

// gc-generations: a generational heap through allocation, two minor (copying) collections, a
// promotion to the old generation and a major collection. Six frames, one per step of the
// scroll-driven explainer in the Garbage Collection lesson.

export interface GcParams {
  /** Collections an object must survive before it is promoted to the old generation. */
  tenuringThreshold: number;
}

export const GC_DEFAULTS: GcParams = { tenuringThreshold: 3 };

export interface GcObject {
  id: string;
  age: number;
  dead?: boolean;
  /** About to be promoted to the old generation. */
  promote?: boolean;
}

export interface GcState {
  eden: GcObject[];
  s0: GcObject[];
  s1: GcObject[];
  old: GcObject[];
  collecting?: 'minor' | 'major';
  threshold: number;
}

const obj = (id: string, age = 0, extra: Partial<GcObject> = {}): GcObject => ({ id, age, ...extra });

export const buildGcGenerations = ({ tenuringThreshold: threshold }: GcParams): Frame<GcState>[] => {
  // HotSpot copies a surviving object while its age is below the threshold and promotes it
  // once its age has reached it. Ages stop counting in the old generation, so none are shown there.
  const old = [obj('config'), obj('cache')];
  const gAge = threshold - 1; // g has survived threshold - 1 collections when the story starts
  return [
    {
      caption: 'New objects are allocated in Eden by bumping a pointer: allocation is almost free.',
      state: {
        eden: ['a', 'b', 'c', 'd', 'e', 'f'].map((id) => obj(id)),
        s0: [obj('g', gAge)],
        s1: [],
        old,
        threshold,
      },
    },
    {
      caption: 'Eden is full: a minor GC marks what is reachable from the roots. Most young objects are already dead.',
      state: {
        eden: ['a', 'b', 'c', 'd', 'e', 'f'].map((id) => obj(id, 0, { dead: !['a', 'd'].includes(id) })),
        s0: [obj('g', gAge)],
        s1: [],
        old,
        collecting: 'minor',
        threshold,
      },
    },
    {
      caption:
        'Survivors are copied to the empty survivor space and their age goes up by one; Eden and S0 are wiped in one go.',
      state: { eden: [], s0: [], s1: [obj('a', 1), obj('d', 1), obj('g', threshold)], old, threshold },
    },
    {
      caption:
        'Eden fills again. The next minor GC copies the live objects into S0: the two survivor spaces take turns.',
      state: {
        eden: [obj('h'), obj('i', 0, { dead: true }), obj('j', 0, { dead: true })],
        s0: [],
        s1: [obj('a', 1, { dead: true }), obj('d', 1), obj('g', threshold, { promote: true })],
        old,
        collecting: 'minor',
        threshold,
      },
    },
    {
      caption: `g had reached the tenuring threshold (age ${threshold}), so this collection copied it to the old generation instead: promotion.`,
      state: { eden: [], s0: [obj('h', 1), obj('d', 2)], s1: [], old: [...old, obj('g')], threshold },
    },
    {
      caption:
        'The old generation fills slowly. When it is full, a major GC marks and compacts the whole heap: rare, but far slower.',
      state: {
        eden: [],
        s0: [obj('h', 1), obj('d', 2)],
        s1: [],
        old: [...old, obj('g'), obj('session', 0, { dead: true }), obj('report', 0, { dead: true })],
        collecting: 'major',
        threshold,
      },
    },
  ];
};
