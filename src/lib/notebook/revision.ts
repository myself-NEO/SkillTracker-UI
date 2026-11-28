import { RUBRIC as HLD_RUBRIC } from '@content/hld/landing';
import { RUBRIC as LLD_RUBRIC } from '@content/lld/landing';
import type { TrackId } from '@content/shared/types';
import type { InterviewsState } from '@lib/progress/interviews';
import type { NotebookState } from '@lib/progress/notebook';
import type { ProgressState } from '@lib/progress/progress';

// The revision list: everything the learner flagged or got wrong in one topic. Lessons marked
// difficult, problems and interview questions marked for revision, knowledge-check questions
// missed on the first try, and rubric areas rated "Missed" in the latest mock interview of each
// problem. An item is due until it is marked reviewed after it was (last) flagged.
// Ported from TheSWEguide's components/notebook/revision.ts.

export type RevisionKind = 'lesson' | 'problem' | 'question' | 'quiz' | 'mock';

export interface RevisionItem {
  /** Key in notebook.reviewed. */
  key: string;
  kind: RevisionKind;
  title: string;
  context: string;
  /** Stage id, interview topic id or "problems", for the topic filter. */
  topic: string;
  href?: string;
  flaggedAt: number;
  reviewedAt?: number;
  due: boolean;
  /** The notebook flag behind the item, so the list can remove it. */
  flag?: { type: 'difficult' | 'revise'; ref: string };
}

/**
 * What the notebook (and the progress pages) need to know about a topic: lessons and problems by
 * slug and, for Java, the interview questions by id (topicIndex()).
 */
export interface TopicIndex {
  track: TrackId;
  basePath: string;
  lessons: Record<string, { title: string; stage: string; stageTitle: string; module: string }>;
  problems: Record<string, string>;
  questions: Record<string, { title: string; topic: string; topicTitle: string }>;
}

export const RUBRICS = { hld: HLD_RUBRIC, lld: LLD_RUBRIC } as const;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const formatDay = (at: number) => new Date(at).toLocaleDateString();

export const revisionItems = (
  index: TopicIndex,
  notebook: NotebookState,
  progress: ProgressState,
  interviews: InterviewsState,
): RevisionItem[] => {
  const { track: trackId, basePath, lessons, problems, questions } = index;
  const prefix = `${trackId}:`;
  const items: RevisionItem[] = [];
  const add = (item: Omit<RevisionItem, 'reviewedAt' | 'due'>) => {
    const reviewedAt = notebook.reviewed[item.key];
    items.push({ ...item, reviewedAt, due: !reviewedAt || reviewedAt < item.flaggedAt });
  };

  for (const [k, at] of Object.entries(notebook.difficult)) {
    if (!k.startsWith(prefix)) continue;
    const slug = k.slice(prefix.length);
    const lesson = lessons[slug];
    if (!lesson) continue;
    add({
      key: `difficult:${k}`,
      kind: 'lesson',
      title: lesson.title,
      context: `${lesson.stageTitle} · ${lesson.module}`,
      topic: lesson.stage,
      href: `${basePath}/${slug}`,
      flaggedAt: at,
      flag: { type: 'difficult', ref: slug },
    });
  }

  for (const [k, at] of Object.entries(notebook.revise)) {
    if (!k.startsWith(prefix)) continue;
    const ref = k.slice(prefix.length);
    if (ref.startsWith('problem:')) {
      const slug = ref.slice('problem:'.length);
      if (!problems[slug]) continue;
      add({
        key: `revise:${k}`,
        kind: 'problem',
        title: problems[slug],
        context: 'Problem to revisit',
        topic: 'problems',
        href: `${basePath}/problems/${slug}`,
        flaggedAt: at,
        flag: { type: 'revise', ref },
      });
      continue;
    }
    const question = questions[ref];
    const saved = notebook.saved[`question:${k}`];
    add({
      key: `revise:${k}`,
      kind: 'question',
      title: question?.title ?? saved?.title ?? ref,
      context: question ? `Interview · ${question.topicTitle}` : 'Interview question',
      topic: question?.topic ?? saved?.topic ?? 'general',
      href: question ? `${basePath}/interview/${question.topic}#q-${ref}` : saved?.href,
      flaggedAt: at,
      flag: { type: 'revise', ref },
    });
  }

  for (const [k, answer] of Object.entries(progress.answers)) {
    if (!isRecord(answer) || answer.track !== trackId || answer.firstCorrect) continue;
    const lesson = lessons[answer.lesson];
    add({
      key: `quiz:${k}`,
      kind: 'quiz',
      title: answer.prompt,
      context: lesson ? `Missed in “${lesson.title}”` : 'Knowledge check',
      topic: lesson?.stage ?? 'general',
      href: lesson ? `${basePath}/${answer.lesson}` : undefined,
      flaggedAt: answer.at,
    });
  }

  const rubric = trackId === 'hld' || trackId === 'lld' ? RUBRICS[trackId] : [];
  for (const [k, attempts] of Object.entries(interviews.history)) {
    if (!k.startsWith(prefix) || !Array.isArray(attempts) || attempts.length === 0) continue;
    const slug = k.slice(prefix.length);
    const last = attempts[attempts.length - 1];
    if (!problems[slug] || !isRecord(last) || !isRecord(last.ratings)) continue;
    for (const dimension of rubric) {
      if (last.ratings[dimension.id] !== 'missed') continue;
      add({
        key: `mock:${k}:${dimension.id}`,
        kind: 'mock',
        title: `${dimension.label}: ${problems[slug]}`,
        context: `Rated “Missed” in your mock interview on ${formatDay(last.completedAt)}`,
        topic: 'problems',
        href: `${basePath}/interview/${slug}`,
        flaggedAt: last.completedAt,
      });
    }
  }

  return items.sort((a, b) => Number(b.due) - Number(a.due) || b.flaggedAt - a.flaggedAt);
};
