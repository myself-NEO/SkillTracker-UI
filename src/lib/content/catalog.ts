import type { Cheatsheet } from '@content/dsa/cheatsheets';
import type { LeetCodeProblem } from '@content/dsa/problems';
import type { PracticeTopic } from '@content/dsa/practiceTopics';
import type { Topic } from '@lib/topics';
import type { topicStats } from './stats';

// Shapes of the catalog files the content build writes (tools/content/build.ts) and the app reads.
// Type-only imports: the curriculum modules themselves never ship to the browser.

export type TopicStats = ReturnType<typeof topicStats>;

/** A topic in index.json: enough for the hub without loading every curriculum. */
export interface IndexTopic extends Topic {
  /** Route prefix, e.g. "/java". */
  basePath: string;
  stats: TopicStats;
  /** Every lesson's slug in curriculum order, for progress bars ("12 of 118 lessons complete"). */
  lessonSlugs: string[];
}

/** public/content/index.json */
export interface ContentIndex {
  /** Changes whenever any generated file changes. */
  version: string;
  topics: IndexTopic[];
}

/** public/content/dsa/practice.json */
export interface DsaPractice {
  topics: PracticeTopic[];
  problems: LeetCodeProblem[];
  cheatsheets: Cheatsheet[];
}
