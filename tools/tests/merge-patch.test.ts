import { describe, expect, it } from 'vitest';
import { applyMergePatch, mergePatchDiff } from '@lib/progress/merge-patch';

describe('applyMergePatch', () => {
  // RFC 7396, appendix A.
  it.each([
    [{ a: 'b' }, { a: 'c' }, { a: 'c' }],
    [{ a: 'b' }, { b: 'c' }, { a: 'b', b: 'c' }],
    [{ a: 'b' }, { a: null }, {}],
    [{ a: 'b', b: 'c' }, { a: null }, { b: 'c' }],
    [{ a: ['b'] }, { a: 'c' }, { a: 'c' }],
    [{ a: 'c' }, { a: ['b'] }, { a: ['b'] }],
    [{ a: { b: 'c' } }, { a: { b: 'd', c: null } }, { a: { b: 'd' } }],
    [{ a: [{ b: 'c' }] }, { a: [1] }, { a: [1] }],
    [['a', 'b'], ['c', 'd'], ['c', 'd']],
    [{ a: 'b' }, ['c'], ['c']],
    [{ a: 'foo' }, null, null],
    [{ a: 'foo' }, 'bar', 'bar'],
    [{ e: null }, { a: 1 }, { e: null, a: 1 }],
    [[1, 2], { a: 'b', c: null }, { a: 'b' }],
    [{}, { a: { bb: { ccc: null } } }, { a: { bb: {} } }],
  ])('%j + %j = %j', (target, patch, expected) => {
    expect(applyMergePatch(target, patch)).toEqual(expected);
  });

  it('leaves its arguments alone', () => {
    const target = { lessons: { 'java:a': 1 } };
    applyMergePatch(target, { lessons: { 'java:a': null } });
    expect(target).toEqual({ lessons: { 'java:a': 1 } });
  });
});

describe('mergePatchDiff', () => {
  const roundTrip = (from: object, to: object) => {
    const patch = mergePatchDiff(from, to);
    expect(JSON.parse(JSON.stringify(applyMergePatch(from, patch ?? {})))).toEqual(JSON.parse(JSON.stringify(to)));
    return patch;
  };

  it('is null when nothing changed, key order and undefined properties aside', () => {
    expect(mergePatchDiff({ a: { x: 1, y: 2 }, b: undefined }, { a: { y: 2, x: 1 } })).toBeNull();
  });

  it('sends only what changed, field by field and key by key', () => {
    const from = { lessons: { 'java:a': 1, 'java:b': 2 }, visited: { 'java:a': 1 } };
    const to = { lessons: { 'java:a': 1, 'java:c': 3 }, visited: { 'java:a': 1 } };
    expect(roundTrip(from, to)).toEqual({ lessons: { 'java:b': null, 'java:c': 3 } });
  });

  it('removes a property that became undefined inside a value (a resume point losing its section)', () => {
    const from = { resume: { java: { slug: 'streams', heading: 'collectors', at: 1 } } };
    const to = { resume: { java: { slug: 'records', heading: undefined, at: 2 } } };
    expect(roundTrip(from, to)).toEqual({ resume: { java: { slug: 'records', heading: null, at: 2 } } });
  });

  it('replaces arrays and other values whole', () => {
    const from = { history: { 'hld:x': [{ score: 50 }] }, problems: { 'lld:y': 'in-progress' } };
    const to = { history: { 'hld:x': [{ score: 50 }, { score: 80 }] }, problems: { 'lld:y': 'completed' } };
    expect(roundTrip(from, to)).toEqual({
      history: { 'hld:x': [{ score: 50 }, { score: 80 }] },
      problems: { 'lld:y': 'completed' },
    });
  });
});
