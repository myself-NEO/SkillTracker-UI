import type { LessonFormat } from '../shared/types';

// The content contract for DSA lessons. A lesson with a `format` has the `##` sections of that
// format, in this order; other sections may appear between them. `npm run validate` warns when a
// body deviates. Every lesson ends with "Key takeaways" and a "Knowledge check" quiz.

export type DsaLessonFormat = Extract<LessonFormat, 'technique' | 'structure' | 'recap' | 'method'>;

export const LESSON_SECTIONS: Record<DsaLessonFormat, string[]> = {
  // A way of solving problems: two pointers, sliding window, Kadane's algorithm…
  technique: [
    'The idea',
    'When to use it',
    'How it works',
    'Java template',
    'Worked examples',
    'Complexity',
    'Variations',
    'Common mistakes',
    'Practice',
    'Key takeaways',
    'Knowledge check',
  ],
  // A data structure: arrays and strings, linked lists, heaps, tries…
  structure: [
    'What it is',
    'How it works',
    'Build it from scratch',
    'Java API',
    'Operations and complexity',
    'Patterns',
    'Common mistakes',
    'Key takeaways',
    'Knowledge check',
  ],
  // The last lesson of a module: telling its techniques apart and practising them together.
  recap: [
    'Recognizing the pattern',
    'Decision procedure',
    'Edge cases to test',
    'Common mistakes',
    'Practice ladder',
    'Key takeaways',
    'Knowledge check',
  ],
  // A way of approaching problems: the problem-solving framework, the recursion design steps,
  // choosing a range-query structure, the five-step DP framework.
  method: ['The steps', 'Reading the signals', 'Worked example', 'Common mistakes', 'Key takeaways', 'Knowledge check'],
};
