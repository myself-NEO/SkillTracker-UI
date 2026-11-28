import type { LeetCodeDifficulty, LeetCodeProblem } from '@content/dsa/problems';
import type { Level, ProblemStatus } from '@content/shared/types';
import { itemKey, type NotebookState, problemNote } from '@lib/progress/notebook';
import { problemStatus, type ProgressState } from '@lib/progress/progress';

// DSA's coding questions (the LeetCode list): the learner's status, revisit flag and note on each,
// kept under the question's ref ("lc-1") with the DSA track. Ported from TheSWEguide's
// components/dsa/practice.tsx; the coding-questions, interview-notes and progress pages share it.

export const DSA = 'dsa' as const;

// The app's own copies of content/dsa/problems.ts's helpers: importing that module would bundle its
// whole list of questions, which the app reads from public/content/dsa/practice.json instead.
// tools/tests/dsa.test.ts checks that they agree.

/** Key of a question's status, note and revisit flag in the learner's stores, e.g. "lc-1". */
export const problemRef = (problem: Pick<LeetCodeProblem, 'id'>) => `lc-${problem.id}`;
export const leetCodeUrl = (problem: Pick<LeetCodeProblem, 'slug'>) => `https://leetcode.com/problems/${problem.slug}/`;
export const LEETCODE_DIFFICULTIES: LeetCodeDifficulty[] = ['Easy', 'Medium', 'Hard'];

/** The statuses offered for a coding question. */
export const PRACTICE_STATUSES: ProblemStatus[] = ['not-started', 'in-progress', 'completed'];

export const PRACTICE_STATUS_LABEL: Record<ProblemStatus, string> = {
  'not-started': 'Not started',
  'in-progress': 'Attempted',
  // Not offered for coding questions; here so every status has a label.
  attempted: 'Attempted',
  completed: 'Solved',
};

/** LeetCode's difficulties shown as the curriculum's levels (their colours). */
export const DIFFICULTY_LEVEL: Record<LeetCodeDifficulty, Level> = {
  Easy: 'beginner',
  Medium: 'intermediate',
  Hard: 'advanced',
};

export const statusOf = (progress: ProgressState, problem: LeetCodeProblem) => problemStatus(progress, DSA, problemRef(problem));
export const isRevisit = (notebook: NotebookState, problem: LeetCodeProblem) =>
  Boolean(notebook.revise[itemKey(DSA, problemRef(problem))]);
export const noteOf = (notebook: NotebookState, problem: LeetCodeProblem) => problemNote(notebook, DSA, problemRef(problem));

export const DSA_PROBLEMS = '/dsa/problems';
export const DSA_NOTES = '/dsa/notes';
/** The coding-questions list, or one practice topic of it. */
export const dsaProblemsHref = (topic?: string) => (topic ? `${DSA_PROBLEMS}/${topic}` : DSA_PROBLEMS);
