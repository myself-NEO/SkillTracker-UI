import { describe, expect, it } from 'vitest';
import { revisionItems, type TopicIndex } from '@lib/notebook/revision';
import { EMPTY_INTERVIEWS, type InterviewsState } from '@lib/progress/interviews';
import { EMPTY_NOTEBOOK } from '@lib/progress/notebook';
import { EMPTY_PROGRESS, type ProgressState } from '@lib/progress/progress';

// The notebook's revision list: what the learner flagged or got wrong in a topic (ported from TheSWEguide).

const index: TopicIndex = {
  track: 'hld',
  basePath: '/hld',
  lessons: { caching: { title: 'Caching', stage: 'storage', stageTitle: 'Storage', module: 'Caches' } },
  problems: { 'url-shortener': 'URL Shortener' },
  questions: { q1: { title: 'Why cache?', topic: 'caching', topicTitle: 'Caching' } },
};

describe('revision list', () => {
  it('collects difficult lessons, flagged problems and questions, missed quiz questions and mock-interview gaps', () => {
    const notebook = {
      ...EMPTY_NOTEBOOK,
      difficult: { 'hld:caching': 10, 'hld:unknown-lesson': 11, 'java:oop': 12 },
      revise: { 'hld:problem:url-shortener': 20, 'hld:q1': 21 },
    };
    const progress: ProgressState = {
      ...EMPTY_PROGRESS,
      answers: {
        'hld:caching:abc': {
          track: 'hld', lesson: 'caching', prompt: 'TTL?', correct: '', explanation: '', attempts: 2,
          firstCorrect: false, solved: true, at: 30,
        },
        'hld:caching:def': {
          track: 'hld', lesson: 'caching', prompt: 'Easy', correct: '', explanation: '', attempts: 1,
          firstCorrect: true, solved: true, at: 31,
        },
      },
    };
    const interviews: InterviewsState = {
      ...EMPTY_INTERVIEWS,
      history: {
        'hld:url-shortener': [
          { completedAt: 40, minutes: 45, elapsedMs: 1, score: 0, ratings: { requirements: 'missed', api: 'got-it' }, clarifyCoverage: 0, hintsUsed: 0 },
        ],
      },
    };
    const items = revisionItems(index, notebook, progress, interviews);
    expect(items.map((item) => [item.kind, item.title, item.href])).toEqual([
      ['mock', expect.stringContaining('URL Shortener'), '/hld/interview/url-shortener'],
      ['quiz', 'TTL?', '/hld/caching'],
      ['question', 'Why cache?', '/hld/interview/caching#q-q1'],
      ['problem', 'URL Shortener', '/hld/problems/url-shortener'],
      ['lesson', 'Caching', '/hld/caching'],
    ]);
    expect(items.every((item) => item.due)).toBe(true);
  });

  it('is due until reviewed after the latest flag', () => {
    const notebook = { ...EMPTY_NOTEBOOK, difficult: { 'hld:caching': 10 }, reviewed: { 'difficult:hld:caching': 15 } };
    expect(revisionItems(index, notebook, EMPTY_PROGRESS, EMPTY_INTERVIEWS)[0]).toMatchObject({ due: false, reviewedAt: 15 });
    const flaggedAgain = { ...notebook, difficult: { 'hld:caching': 20 } };
    expect(revisionItems(index, flaggedAgain, EMPTY_PROGRESS, EMPTY_INTERVIEWS)[0].due).toBe(true);
  });

  it('names a question the topic index doesn’t know from its bookmark', () => {
    const notebook = {
      ...EMPTY_NOTEBOOK,
      revise: { 'hld:lesson:caching#q-x': 5 },
      saved: {
        'question:hld:lesson:caching#q-x': {
          kind: 'question' as const, track: 'hld' as const, ref: 'lesson:caching#q-x', title: 'Saved title',
          context: 'Caching', topic: 'storage', href: '/hld/caching', at: 5,
        },
      },
    };
    expect(revisionItems(index, notebook, EMPTY_PROGRESS, EMPTY_INTERVIEWS)[0]).toMatchObject({
      title: 'Saved title',
      topic: 'storage',
      href: '/hld/caching',
    });
  });

  it('skips malformed answers and interview history instead of failing', () => {
    const progress = { ...EMPTY_PROGRESS, answers: { a: null, b: 'oops' } } as unknown as ProgressState;
    const interviews = { ...EMPTY_INTERVIEWS, history: { 'hld:url-shortener': 'oops', 'hld:x': [null] } } as unknown as InterviewsState;
    expect(revisionItems(index, EMPTY_NOTEBOOK, progress, interviews)).toEqual([]);
  });
});
