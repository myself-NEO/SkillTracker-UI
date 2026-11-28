import { INTERVIEW_TOPICS, type InterviewTopic, QUESTION_KINDS } from '@content/java/interview';
import type { Level } from '@content/shared/types';
import { itemKey, type NotebookState, type SelfRating } from '@lib/progress/notebook';

// The Java interview question bank (/java/interview): its topics, the labels of its questions, and
// how much of it the learner has practised. Ported from TheSWEguide's components/interview.
// Practice (draft, hints shown, answer revealed, rating) is kept in the notebook, under
// `java:<question id>`.

/** The bank's extra topic: the tricky questions of every topic. */
export const TRICKY: InterviewTopic = {
  id: 'tricky',
  title: 'Tricky questions',
  description: 'The questions with a twist, from every topic: output puzzles, edge cases and common misconceptions.',
};

/** The bank's topics, then "Tricky questions". */
export const BANK_TOPICS: InterviewTopic[] = [...INTERVIEW_TOPICS, TRICKY];

export const bankTopic = (id: string) => BANK_TOPICS.find((topic) => topic.id === id);

/** How a question's level reads in the bank. */
export const LEVEL_TEXT: Record<Level, string> = { beginner: 'Basic', intermediate: 'Intermediate', advanced: 'Advanced' };

export const kindLabel = (kind: string) => QUESTION_KINDS.find((option) => option.id === kind)?.label ?? kind;

export const RATING_LABEL: Record<SelfRating, string> = { 'got-it': 'Got it', partial: 'Partially', missed: 'Missed' };

/** Whether a question was practised: an answer drafted, or the model answer revealed. */
export const practised = (notebook: NotebookState, id: string) => {
  const state = notebook.questions[itemKey('java', id)];
  return Boolean(state?.revealedAt || state?.draft?.trim());
};

/** How much of a set of questions the learner has practised, and how it went. */
export const bankProgress = (notebook: NotebookState, ids: readonly string[]) => {
  const states = ids.map((id) => notebook.questions[itemKey('java', id)]);
  const count = (rating: SelfRating) => states.filter((state) => state?.rating === rating).length;
  return {
    practised: ids.filter((id) => practised(notebook, id)).length,
    gotIt: count('got-it'),
    partial: count('partial'),
    missed: count('missed'),
  };
};
