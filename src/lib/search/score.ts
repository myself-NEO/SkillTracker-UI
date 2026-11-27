import type { TopicId } from '@lib/topics';

// The ⌘K search: an index built at build time (/search-index.json) and the scoring that runs
// in the browser. Every word of the query must appear somewhere in an entry; words in the
// title count most, then words in a section heading, then the rest.

export type SearchKind = 'page' | 'lesson' | 'section' | 'animation' | 'problem' | 'coding' | 'question' | 'cheatsheet';

export interface SearchEntry {
  kind: Exclude<SearchKind, 'section'>;
  topic: TopicId;
  title: string;
  /** Shown under the title: the module of a lesson, the topic of a question… */
  context: string;
  href: string;
  /** Searched but not shown: summary, tags, patterns. */
  text?: string;
  /** A lesson's or cheat sheet's h2 and h3 sections, as [id, title]. */
  headings?: [string, string][];
}

export interface SearchResult {
  kind: SearchKind;
  topic: TopicId;
  title: string;
  context: string;
  href: string;
  score: number;
}

const KIND_ORDER: Record<SearchKind, number> = {
  page: 0,
  lesson: 1,
  cheatsheet: 2,
  animation: 3,
  problem: 4,
  question: 5,
  coding: 6,
  section: 7,
};

export const tokenize = (query: string) => query.toLowerCase().split(/\s+/).filter(Boolean);

/** Points for each query word found in a title: more when a word starts the title or one of its words. */
const titlePoints = (title: string, words: string[]) =>
  words.reduce((points, word) => {
    if (!title.includes(word)) return points;
    const startsWord = title.startsWith(word) || title.includes(` ${word}`);
    return points + 3 + (startsWord ? 2 : 0);
  }, 0);

export const searchIndex = (entries: SearchEntry[], query: string, limit = 30): SearchResult[] => {
  const words = tokenize(query);
  if (words.length === 0) return [];
  const phrase = words.join(' ');
  const results: SearchResult[] = [];

  for (const entry of entries) {
    const title = entry.title.toLowerCase();
    const headings = entry.headings ?? [];
    const haystack = [title, entry.context, entry.text ?? '', ...headings.map(([, text]) => text)]
      .join(' ')
      .toLowerCase();
    if (!words.every((word) => haystack.includes(word))) continue;

    const exact = title === phrase ? 10 : title.includes(phrase) ? 5 : 0;
    results.push({
      kind: entry.kind,
      topic: entry.topic,
      title: entry.title,
      context: entry.context,
      href: entry.href,
      score: titlePoints(title, words) + exact,
    });

    // A section matches when its heading holds at least one word and the heading with its
    // lesson's title holds them all, e.g. "hashmap resize" → HashMap Internals › Resizing.
    for (const [id, text] of headings) {
      const heading = text.toLowerCase();
      if (!words.some((word) => heading.includes(word))) continue;
      if (!words.every((word) => heading.includes(word) || title.includes(word))) continue;
      results.push({
        kind: 'section',
        topic: entry.topic,
        title: text,
        context: entry.title,
        href: `${entry.href}#${id}`,
        score: titlePoints(heading, words) + (heading.includes(phrase) ? 3 : 0) - 1,
      });
    }
  }

  return results
    .sort((a, b) => b.score - a.score || KIND_ORDER[a.kind] - KIND_ORDER[b.kind] || a.title.length - b.title.length)
    .slice(0, limit);
};
