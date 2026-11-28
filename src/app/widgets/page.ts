import type { TrackId } from '@content/shared/types';

/**
 * The page a rendered body belongs to. Widgets record progress against it: quiz and drill answers
 * count for lessons, opening a hint marks a problem started, and checklist ticks are kept per page.
 */
export interface BodyPage {
  track: TrackId;
  /** "interview": a part of an interview question (an answer, a hint), outside any page body. */
  kind: 'lesson' | 'problem' | 'cheatsheet' | 'interview';
  slug: string;
  /**
   * Set where the topic has a notebook (Java, LLD, HLD): what its tools (section and question
   * bookmarks, saving code and diagrams) record about the page.
   */
  notebook?: NotebookPage;
}

export interface NotebookPage {
  /** The page's title, e.g. the lesson's. */
  title: string;
  /** Stage id of a lesson, or "problems". */
  topic: string;
  href: string;
}

/** Key under which a page's checklist ticks are kept, e.g. "hld:problem:url-shortener"; only lessons and problems keep them. */
export const pageKey = (page: BodyPage) =>
  page.kind === 'lesson' || page.kind === 'problem' ? `${page.track}:${page.kind}:${page.slug}` : undefined;

let counter = 0;

/** An id unique on the page, for labels and radio groups of widgets that can appear more than once. */
export const uniqueId = (prefix: string) => `${prefix}-${++counter}`;
