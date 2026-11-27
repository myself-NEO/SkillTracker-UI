import { describe, expect, it } from 'vitest';
import { questionHash } from '@lib/progress/hash';
import {
  EMPTY_PROGRESS,
  isLessonComplete,
  isLessonVisited,
  PROGRESS_KEY,
  problemStatus,
  progressUpdates as update,
  sanitizeProgress,
  trackAnswers,
} from '@lib/progress/progress';

// The progress model, ported from TheSWEguide. Its field names and keys are those of TheSWEguide's
// localStorage and backup files, so a backup made there can be imported here (docs/plan.md, Phase 5).

describe('progress model', () => {
  it("keeps TheSWEguide's storage key and key format", () => {
    expect(PROGRESS_KEY).toBe('learning-progress-v1');
    const state = update.setLessonComplete(EMPTY_PROGRESS, 'java', 'generics', true, 1);
    expect(state.lessons).toEqual({ 'java:generics': 1 });
  });

  it('keeps only well-formed parts of stored or imported data', () => {
    expect(sanitizeProgress(null)).toBe(EMPTY_PROGRESS);
    expect(sanitizeProgress([1, 2])).toBe(EMPTY_PROGRESS);
    const state = sanitizeProgress({ lessons: { 'dsa:heaps': 5 }, problems: 'oops', resume: [], extra: true });
    expect(state).toEqual({ ...EMPTY_PROGRESS, lessons: { 'dsa:heaps': 5 } });
  });

  it('completes and un-completes a lesson', () => {
    const done = update.setLessonComplete(EMPTY_PROGRESS, 'lld', 'solid', true, 10);
    expect(isLessonComplete(done, 'lld', 'solid')).toBe(true);
    expect(isLessonComplete(done, 'hld', 'solid')).toBe(false);
    const undone = update.setLessonComplete(done, 'lld', 'solid', false, 11);
    expect(isLessonComplete(undone, 'lld', 'solid')).toBe(false);
    expect(undone.lessons).toEqual({});
  });

  it('makes a visited lesson the resume point, keeping the section when the same lesson is reopened', () => {
    let state = update.markLessonVisited(EMPTY_PROGRESS, 'java', 'streams', 1);
    state = update.setResumeHeading(state, 'java', 'streams', 'collectors', 2);
    expect(isLessonVisited(state, 'java', 'streams')).toBe(true);
    expect(state.resume['java']).toEqual({ slug: 'streams', heading: 'collectors', at: 2 });

    const reopened = update.markLessonVisited(state, 'java', 'streams', 3);
    expect(reopened.resume['java']).toEqual({ slug: 'streams', heading: 'collectors', at: 3 });

    const other = update.markLessonVisited(state, 'java', 'records', 4);
    expect(other.resume['java']).toEqual({ slug: 'records', heading: undefined, at: 4 });
  });

  it('returns the same state when the resume point does not change', () => {
    const state = update.setResumeHeading(EMPTY_PROGRESS, 'hld', 'caching', 'eviction', 1);
    expect(update.setResumeHeading(state, 'hld', 'caching', 'eviction', 2)).toBe(state);
  });

  it('tracks problem statuses; "not started" removes the entry', () => {
    let state = update.markProblemStarted(EMPTY_PROGRESS, 'lld', 'parking-lot', 1);
    expect(problemStatus(state, 'lld', 'parking-lot')).toBe('in-progress');
    state = update.setProblemStatus(state, 'lld', 'parking-lot', 'completed', 2);
    expect(update.markProblemStarted(state, 'lld', 'parking-lot', 3)).toBe(state);
    state = update.setProblemStatus(state, 'lld', 'parking-lot', 'not-started', 4);
    expect(problemStatus(state, 'lld', 'parking-lot')).toBe('not-started');
    expect(state.problems).toEqual({});
    expect(state.problemsAt).toEqual({});
  });

  it('records quiz answers under the question hash, counting attempts', () => {
    const answer = { prompt: 'Which is O(1)?', correct: false, chosen: 'A', correctText: 'B', explanation: 'Because.' };
    let state = update.recordQuizAnswer(EMPTY_PROGRESS, 'dsa', 'hashing', answer, 1);
    state = update.recordQuizAnswer(state, 'dsa', 'hashing', { ...answer, correct: true, chosen: 'B' }, 2);
    const record = state.answers[`dsa:hashing:${questionHash('Which is O(1)?')}`];
    expect(record).toMatchObject({ attempts: 2, firstCorrect: false, solved: true, lastWrong: 'A', at: 2 });
    expect(trackAnswers(state, 'dsa')).toHaveLength(1);
    expect(trackAnswers(state, 'java')).toHaveLength(0);
  });

  it('resets one topic and leaves the others alone', () => {
    let state = update.setLessonComplete(EMPTY_PROGRESS, 'java', 'a', true, 1);
    state = update.setLessonComplete(state, 'dsa', 'b', true, 1);
    state = update.markLessonVisited(state, 'java', 'a', 2);
    state = update.markLessonVisited(state, 'dsa', 'b', 2);
    const reset = update.resetTrack(state, 'java');
    expect(reset.lessons).toEqual({ 'dsa:b': 1 });
    expect(Object.keys(reset.resume)).toEqual(['dsa']);
    expect(Object.keys(reset.visited)).toEqual(['dsa:b']);
  });
});
