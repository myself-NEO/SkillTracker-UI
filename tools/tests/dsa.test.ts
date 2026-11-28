import { describe, expect, it } from 'vitest';
import * as content from '@content/dsa/problems';
import {
  isRevisit,
  LEETCODE_DIFFICULTIES,
  leetCodeUrl,
  noteOf,
  PRACTICE_STATUS_LABEL,
  problemRef,
  statusOf,
} from '@lib/dsa/practice';
import { EMPTY_NOTEBOOK, notebookUpdates } from '@lib/progress/notebook';
import { EMPTY_PROGRESS, progressUpdates } from '@lib/progress/progress';

// DSA's coding questions: the app's helpers, and how a question's status, flag and note are kept.

describe('DSA coding questions', () => {
  it("keeps the same keys and links as the content's own helpers", () => {
    // problemRef is the key of every status, note and flag: it must never drift from the content's.
    for (const problem of content.LEETCODE_PROBLEMS) {
      expect(problemRef(problem)).toBe(content.problemRef(problem));
      expect(leetCodeUrl(problem)).toBe(content.leetCodeUrl(problem));
    }
    expect(LEETCODE_DIFFICULTIES).toEqual(content.LEETCODE_DIFFICULTIES);
  });

  it("reads a question's status, revisit flag and note", () => {
    const twoSum = content.LEETCODE_PROBLEMS.find((problem) => problem.id === 1)!;
    let progress = progressUpdates.setProblemStatus(EMPTY_PROGRESS, 'dsa', 'lc-1', 'completed', 1);
    expect(statusOf(progress, twoSum)).toBe('completed');
    expect(PRACTICE_STATUS_LABEL[statusOf(progress, twoSum)]).toBe('Solved');
    progress = progressUpdates.setProblemStatus(progress, 'dsa', 'lc-1', 'not-started', 2);
    expect(statusOf(progress, twoSum)).toBe('not-started');

    let notebook = notebookUpdates.toggleRevise(EMPTY_NOTEBOOK, 'dsa', 'lc-1', true, 3);
    expect(isRevisit(notebook, twoSum)).toBe(true);
    notebook = notebookUpdates.saveNote(notebook, { id: 'n', track: 'dsa', title: '1. Two Sum', body: 'Hash map', topic: 'arrays-hashing', problem: 'lc-1' }, 4);
    expect(noteOf(notebook, twoSum)?.body).toBe('Hash map');
  });
});
