import type { Level, PracticeCopy, Track } from '@content/shared/types';

// Wording of a track's practice library. LLD defines none of its own and uses the original
// design-problem wording (ported from the portfolio's components/learn/practice.ts).

const DESIGN_PRACTICE: PracticeCopy = {
  groupTitle: 'Practice Problems',
  noun: 'problems',
  libraryTitle: 'practice problems',
  libraryIntro: '',
  levelBlurbs: {
    beginner: 'One main entity lifecycle, a handful of classes. Focus on clean modelling and encapsulation.',
    intermediate: 'Several interacting entities, a state machine or two, and at least one extensibility follow-up.',
    advanced: 'Concurrency, scarce resources, delivery guarantees or pluggable engines. Expect deep follow-ups.',
  },
  titlePrefix: 'Design a ',
  steps: ['Read the statement, then write your own clarifying questions.', 'Sketch entities and classes before opening any hint.'],
  searchPlaceholder: 'Search by name, pattern or topic (e.g. “state”, “concurrency”)',
};

export const practiceCopy = (track: Track): PracticeCopy =>
  track.practice ?? { ...DESIGN_PRACTICE, libraryTitle: `${track.shortTitle} practice problems` };

export const LEVELS: readonly Level[] = ['beginner', 'intermediate', 'advanced'];

/** Example text in the "My notes" box of a problem page (from the portfolio's track settings). */
export const problemNotePlaceholder = (track: Track) =>
  ({
    hld: 'e.g. Forgot to ask about custom aliases; 301 vs 302 matters for analytics…',
    lld: 'e.g. Forgot to ask about concurrency; the plate claim must be undone when the lot is full…',
  })[track.id as 'hld' | 'lld'] ?? 'e.g. Missed the empty-input case; writing the test first would have caught it…';

/** Example text in the "My notes" box of a lesson page. */
export const lessonNotePlaceholder = (track: Track) =>
  track.notePlaceholder ?? 'e.g. HashMap treeifies a bucket at 8 entries only when the table has at least 64 buckets…';
