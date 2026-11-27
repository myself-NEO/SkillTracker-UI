import type { Cheatsheet } from '@content/dsa/cheatsheets';
import type { LeetCodeProblem } from '@content/dsa/problems';
import type { PracticeTopic } from '@content/dsa/practiceTopics';
import type { Track } from '@content/shared/types';
import type { Topic, TopicId } from '@lib/topics';
import type { SceneCode, VizMode } from '@lib/viz/types';
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

/** public/content/<topic>/track.json: the curriculum, and which problems have a written breakdown. */
export interface TrackFile extends Track {
  /** Slugs of the problems whose breakdown is written (the others are "coming soon"). */
  writtenProblems: string[];
}

/** public/content/dsa/practice.json */
export interface DsaPractice {
  topics: PracticeTopic[];
  problems: LeetCodeProblem[];
  cheatsheets: Cheatsheet[];
}

/** An animation in the gallery (public/content/visualize.json), ready to play on its own. */
export interface VisualizeScene {
  id: string;
  title: string;
  summary: string;
  topic: TopicId;
  /** Ways it can be played; the first is how its lesson plays it. */
  modes: VizMode[];
  /** The lesson it is embedded in. */
  lesson?: { title: string; href: string };
  /** The scene's default parameters (checked at build time). */
  params: object;
  /** Code shown beside it in step-through mode, highlighted at build time. */
  code?: SceneCode;
}

/** public/content/visualize.json */
export interface VisualizeIndex {
  scenes: VisualizeScene[];
}
