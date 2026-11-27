import { describe, expect, it } from 'vitest';
import { type SearchEntry, searchIndex } from '@lib/search/score';

const entries: SearchEntry[] = [
  {
    kind: 'lesson',
    topic: 'dsa',
    title: 'Sliding Window',
    context: 'DSA · Foundations · Arrays & strings',
    href: '/dsa/sliding-window',
    text: 'Fixed and variable windows over arrays and strings',
    headings: [
      ['fixed-size-window', 'Fixed-size window'],
      ['variable-size-window', 'Variable-size window'],
    ],
  },
  {
    kind: 'lesson',
    topic: 'java',
    title: 'How HashMap Works Internally',
    context: 'Java · Collections',
    href: '/java/hashmap-internals',
    headings: [['step-6--resizing', 'Step 6 — resizing']],
  },
  {
    kind: 'coding',
    topic: 'dsa',
    title: '3. Longest Substring Without Repeating Characters',
    context: 'Sliding Window',
    href: '/dsa/problems/sliding-window#lc-3',
    text: 'Variable window',
  },
  {
    kind: 'question',
    topic: 'java',
    title: 'Why is HashMap not thread-safe?',
    context: 'Java interview · HashMap Internals',
    href: '/java/interview/hashmap#q-x',
  },
];

describe('searchIndex', () => {
  it('puts the entry whose title is the query first', () => {
    expect(searchIndex(entries, 'sliding window')[0]).toMatchObject({ kind: 'lesson', href: '/dsa/sliding-window' });
  });

  it('needs every word of the query somewhere in an entry', () => {
    expect(searchIndex(entries, 'sliding hashmap')).toEqual([]);
    expect(searchIndex(entries, '   ')).toEqual([]);
  });

  it('finds sections by their heading together with the lesson title', () => {
    const section = searchIndex(entries, 'hashmap resizing').find((result) => result.kind === 'section');
    expect(section).toMatchObject({
      title: 'Step 6 — resizing',
      context: 'How HashMap Works Internally',
      href: '/java/hashmap-internals#step-6--resizing',
    });
  });

  it('matches summaries, patterns and context as well as titles, and ranks title matches higher', () => {
    const results = searchIndex(entries, 'variable window');
    expect(results.map((result) => result.kind)).toContain('coding');
    expect(results[0].title).not.toBe('3. Longest Substring Without Repeating Characters');
  });

  it('is case-insensitive', () => {
    expect(searchIndex(entries, 'HASHMAP thread').map((result) => result.kind)).toEqual(['question']);
  });
});
