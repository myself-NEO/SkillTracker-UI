import { describe, expect, it } from 'vitest';
import {
  EMPTY_INTERVIEWS,
  INTERVIEWS_KEY,
  interviewUpdates as update,
  sanitizeInterviews,
} from '@lib/progress/interviews';

// The interviews model (checklist ticks so far), with TheSWEguide's key and field names.

describe('interviews model', () => {
  it("keeps TheSWEguide's storage key", () => {
    expect(INTERVIEWS_KEY).toBe('learning-interviews-v1');
  });

  it('keeps only well-formed parts of stored or imported data', () => {
    expect(sanitizeInterviews('nope')).toBe(EMPTY_INTERVIEWS);
    expect(sanitizeInterviews({ checklists: { 'hld:problem:x': { a: 1 } }, sessions: [] })).toEqual({
      ...EMPTY_INTERVIEWS,
      checklists: { 'hld:problem:x': { a: 1 } },
    });
  });

  it('ticks and unticks checklist items per page', () => {
    let state = update.toggleChecklistItem(EMPTY_INTERVIEWS, 'hld:lesson:caching', 'item-1', true, 5);
    expect(state.checklists).toEqual({ 'hld:lesson:caching': { 'item-1': 5 } });
    expect(update.toggleChecklistItem(state, 'hld:lesson:caching', 'item-1', true, 6)).toBe(state);
    state = update.toggleChecklistItem(state, 'hld:lesson:caching', 'item-1', false, 7);
    expect(state.checklists).toEqual({ 'hld:lesson:caching': {} });
  });

  it('resets one topic and leaves the others alone', () => {
    let state = update.toggleChecklistItem(EMPTY_INTERVIEWS, 'hld:problem:a', 'x', true, 1);
    state = update.toggleChecklistItem(state, 'lld:problem:b', 'y', true, 1);
    expect(Object.keys(update.resetTrack(state, 'hld').checklists)).toEqual(['lld:problem:b']);
  });
});
