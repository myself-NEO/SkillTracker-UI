import { describe, expect, it } from 'vitest';
import {
  elapsedMs,
  EMPTY_INTERVIEWS,
  INTERVIEWS_KEY,
  interviewUpdates as update,
  phaseElapsedMs,
  rubricScore,
  sanitizeInterviews,
  sessionKey,
} from '@lib/progress/interviews';

// The interviews model (checklist ticks and mock-interview attempts), with TheSWEguide's key and
// field names.

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

describe('mock interview sessions', () => {
  const started = update.start(EMPTY_INTERVIEWS, 'hld', 'url-shortener', 45, 1_000);
  const session = (state: typeof started) => state.sessions['hld:url-shortener'];

  it('starts an attempt in the first phase with the clock running', () => {
    expect(sessionKey('hld', 'url-shortener')).toBe('hld:url-shortener');
    expect(session(started)).toMatchObject({ startedAt: 1_000, minutes: 45, phase: 'clarify', runningSince: 1_000, asked: [] });
  });

  it('counts time per phase while the clock runs, and none while it is paused', () => {
    let state = update.setPhase(started, 'hld', 'url-shortener', 'requirements', 61_000);
    expect(session(state).timeInPhase).toEqual({ clarify: 60_000 });
    expect(elapsedMs(session(state), 91_000)).toBe(90_000);
    expect(phaseElapsedMs(session(state), 'requirements', 91_000)).toBe(30_000);

    state = update.setTimerRunning(state, 'hld', 'url-shortener', false, 91_000);
    expect(session(state).runningSince).toBeUndefined();
    expect(elapsedMs(session(state), 500_000)).toBe(90_000);
    expect(update.setTimerRunning(state, 'hld', 'url-shortener', false, 600_000)).toBe(state);

    state = update.setTimerRunning(state, 'hld', 'url-shortener', true, 700_000);
    expect(elapsedMs(session(state), 710_000)).toBe(100_000);
    expect(update.setPhase(state, 'hld', 'url-shortener', 'requirements', 720_000)).toBe(state);
  });

  it('records questions, drafts, hints, references, ticks, the estimate, the diagram, choices and ratings', () => {
    let state = update.ask(started, 'hld', 'url-shortener', 'How many links?', 0, 2_000);
    state = update.ask(state, 'hld', 'url-shortener', 'Which database?', null, 3_000);
    state = update.setDraft(state, 'hld', 'url-shortener', 'api', 'POST /urls', 4_000);
    expect(update.setDraft(state, 'hld', 'url-shortener', 'api', 'POST /urls', 5_000)).toBe(state);
    state = update.showHint(update.showHint(state, 'hld', 'url-shortener', 'api', 6_000), 'hld', 'url-shortener', 'api', 7_000);
    state = update.reveal(state, 'hld', 'url-shortener', 'api', 8_000);
    expect(update.reveal(state, 'hld', 'url-shortener', 'api', 9_000)).toBe(state);
    state = update.setCheck(state, 'hld', 'url-shortener', 'fr:0', true, 10_000);
    state = update.setEstimate(state, 'hld', 'url-shortener', { readsPerWrite: '50' }, 11_000);
    state = update.setDiagram(state, 'hld', 'url-shortener', 'flowchart LR', 12_000);
    state = update.setDeepDives(state, 'hld', 'url-shortener', [0, 2], 13_000);
    state = update.rate(state, 'hld', 'url-shortener', 'requirements', 'got-it', 14_000);
    expect(session(state)).toMatchObject({
      updatedAt: 14_000,
      asked: [
        { text: 'How many links?', matched: 0, at: 2_000 },
        { text: 'Which database?', matched: null, at: 3_000 },
      ],
      drafts: { api: 'POST /urls' },
      hints: { api: 2 },
      revealed: { api: 8_000 },
      checks: { 'fr:0': true },
      estimate: { readsPerWrite: '50' },
      diagram: 'flowchart LR',
      deepDives: [0, 2],
      ratings: { requirements: 'got-it' },
    });
    expect(session(update.setCheck(state, 'hld', 'url-shortener', 'fr:0', false, 15_000)).checks).toEqual({});
  });

  it('scores the rubric: strong 1, partly half, missed 0, over every dimension', () => {
    expect(rubricScore({ requirements: 'got-it', api: 'partial', 'data-model': 'missed' }, 4)).toBe(38);
    expect(rubricScore({}, 0)).toBe(0);
  });

  it('moves a finished attempt into the history, and a discarded one nowhere', () => {
    let state = update.rate(started, 'hld', 'url-shortener', 'requirements', 'missed', 2_000);
    state = update.finish(state, 'hld', 'url-shortener', { score: 0, clarifyCoverage: 0.5, hintsUsed: 1 }, 31_000);
    expect(state.sessions).toEqual({});
    expect(state.history['hld:url-shortener']).toEqual([
      { score: 0, clarifyCoverage: 0.5, hintsUsed: 1, completedAt: 31_000, minutes: 45, elapsedMs: 30_000, ratings: { requirements: 'missed' } },
    ]);
    expect(update.discard(started, 'hld', 'url-shortener').sessions).toEqual({});
    // Without an attempt in progress, nothing changes.
    expect(update.ask(state, 'hld', 'url-shortener', 'Hello?', null, 40_000)).toBe(state);
    expect(update.finish(state, 'hld', 'url-shortener', { score: 1, clarifyCoverage: 1, hintsUsed: 0 }, 41_000)).toBe(state);
  });

  it('resets one topic’s attempts and leaves the others alone', () => {
    let state = update.finish(started, 'hld', 'url-shortener', { score: 50, clarifyCoverage: 1, hintsUsed: 0 }, 2_000);
    state = update.start(state, 'lld', 'elevator', 60, 3_000);
    const reset = update.resetTrack(state, 'hld');
    expect(reset.history).toEqual({});
    expect(Object.keys(reset.sessions)).toEqual(['lld:elevator']);
  });

  it('reads stored sessions entry by entry', () => {
    const stored = {
      sessions: {
        'hld:a': {
          startedAt: 1,
          minutes: 90,
          phase: 'warp',
          timeInPhase: { clarify: 5, api: 'x' },
          asked: [
            { text: 'Matched', matched: 2, at: 3 },
            // The account's copy leaves out null members: no `matched` means no match.
            { text: 'Unmatched', at: 4 },
            { text: 7, at: 5 },
          ],
          drafts: { api: 'GET', bad: 1 },
          ratings: { requirements: 'got-it', api: 'brilliant' },
          deepDives: [1, 'two', 3],
        },
        'hld:b': { minutes: 45 },
      },
      history: { 'hld:a': [{ completedAt: 9, score: 80, minutes: 60 }, { score: 1 }] },
    };
    expect(sanitizeInterviews(stored)).toEqual({
      sessions: {
        'hld:a': {
          startedAt: 1,
          updatedAt: 1,
          minutes: 45,
          phase: 'clarify',
          timeInPhase: { clarify: 5 },
          asked: [
            { text: 'Matched', matched: 2, at: 3 },
            { text: 'Unmatched', matched: null, at: 4 },
          ],
          drafts: { api: 'GET' },
          hints: {},
          revealed: {},
          checks: {},
          deepDives: [1, 3],
          ratings: { requirements: 'got-it' },
        },
      },
      history: {
        'hld:a': [{ completedAt: 9, minutes: 60, elapsedMs: 0, score: 80, ratings: {}, clarifyCoverage: 0, hintsUsed: 0 }],
      },
      checklists: {},
    });
  });
});
