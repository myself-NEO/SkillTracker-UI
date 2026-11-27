import type { TrackId } from '@content/shared/types';

/**
 * The page a rendered body belongs to. Widgets record progress against it: quiz and drill answers
 * count for lessons, opening a hint marks a problem started, and checklist ticks are kept per page.
 */
export interface BodyPage {
  track: TrackId;
  kind: 'lesson' | 'problem' | 'cheatsheet';
  slug: string;
}

/** Key under which a page's checklist ticks are kept, e.g. "hld:problem:url-shortener"; cheat sheets keep none. */
export const pageKey = (page: BodyPage) => (page.kind === 'cheatsheet' ? undefined : `${page.track}:${page.kind}:${page.slug}`);

let counter = 0;

/** An id unique on the page, for labels and radio groups of widgets that can appear more than once. */
export const uniqueId = (prefix: string) => `${prefix}-${++counter}`;
