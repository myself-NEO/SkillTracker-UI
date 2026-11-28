import type { Cheatsheet } from '@content/dsa/cheatsheets';
import type { LeetCodeProblem } from '@content/dsa/problems';
import type { PracticeTopic } from '@content/dsa/practiceTopics';
import type { InterviewTopic, QuestionKind } from '@content/java/interview';
import type { Level, Track } from '@content/shared/types';
import type { Topic, TopicId } from '@lib/topics';
import type { SceneCode, VizMode } from '@lib/viz/types';
import type { ContentFragment } from './doc';
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

/**
 * public/content/java/interview-questions.json: the Java question bank by question id, so the
 * notebook can name and link questions flagged for revision, and the bank's index count them,
 * without loading the bank.
 */
export type JavaQuestionIndex = Record<string, { title: string; topic: string; tricky?: true }>;

/** One question of the Java bank, its Markdown rendered (public/content/java/interview/<topic>.json). */
export interface JavaBankQuestion {
  id: string;
  /** The bank topic it belongs to, e.g. "collections". */
  topic: string;
  /** May hold `inline code`. */
  title: string;
  level: Level;
  kind: QuestionKind;
  tricky: boolean;
  /** The lessons that teach it. */
  lessons: { slug: string; title: string }[];
  /** Extra detail of the question, often code to read. */
  body?: ContentFragment;
  hints: ContentFragment[];
  answer: ContentFragment;
  whyNot?: ContentFragment;
  followUp?: ContentFragment;
}

/**
 * public/content/java/interview/<topic>.json: one topic of the Java question bank;
 * `tricky.json` has the tricky questions of every topic.
 */
export interface JavaBankFile {
  topic: InterviewTopic;
  questions: JavaBankQuestion[];
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
