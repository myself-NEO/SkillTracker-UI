import type { NoteKind } from '@lib/progress/notebook';
import type { TopicId } from '@lib/topics';

// What differs between the Java, LLD and HLD notebooks. Ported from TheSWEguide's
// components/notebook/settings.ts; the notebook is now saved to the learner's account, not the browser.

export interface NoteKindOption {
  id: NoteKind;
  label: string;
  /** Starting text for a new note of this kind. */
  template?: string;
}

export interface NotebookSettings {
  intro: string;
  noteKinds: NoteKindOption[];
  noteTitlePlaceholder: string;
  noteBodyLabel: string;
  /** Whether the notebook has a diagrams tab (Mermaid diagrams saved from lessons, or drawn there). */
  diagrams: boolean;
}

const TRADEOFF: NoteKindOption = {
  id: 'tradeoff',
  label: 'Trade-off',
  template:
    '**Decision:** …\n\n**Option A:** … — choose it when …\n\n**Option B:** … — choose it when …\n\n**What I’d say in the interview:** …',
};

const MISTAKE: NoteKindOption = {
  id: 'mistake',
  label: 'Common mistake',
  template: '**What I did:** …\n\n**Why it’s wrong:** …\n\n**Do this instead:** …',
};

export const NOTEBOOK_SETTINGS: Partial<Record<TopicId, NotebookSettings>> = {
  java: {
    intro:
      'Your own revision material. Bookmark lessons and section headings, mark lessons as difficult, save code from any example, flag interview questions and write notes; missed quiz questions are collected automatically. Everything is saved to your account.',
    noteKinds: [{ id: 'note', label: 'Note' }],
    noteTitlePlaceholder: 'e.g. equals and hashCode must agree',
    noteBodyLabel: 'Note (Markdown supported, including ```java code)',
    diagrams: false,
  },
  lld: {
    intro:
      'Bookmarked lessons and sections, saved code and interview questions, your notes, trade-offs, patterns and mistakes, and the problems you want to revisit. Difficult lessons, missed quiz answers and weak mock-interview areas are collected automatically. Everything is saved to your account.',
    noteKinds: [
      { id: 'note', label: 'Note' },
      TRADEOFF,
      {
        id: 'pattern',
        label: 'Pattern',
        template: '**Pattern:** …\n\n**Problem it solves:** …\n\n**Cue in the prompt:** …\n\n**Simpler alternative:** …',
      },
      MISTAKE,
    ],
    noteTitlePlaceholder: 'e.g. Strategy vs State',
    noteBodyLabel: 'Note (Markdown supported, including ```java code)',
    diagrams: false,
  },
  hld: {
    intro:
      'Bookmarked lessons and sections, saved diagrams, code and interview questions, your notes, trade-offs, formulas and mistakes, and the problems you want to revisit. Difficult lessons, missed quiz answers and weak mock-interview areas are collected automatically. Everything is saved to your account.',
    noteKinds: [
      { id: 'note', label: 'Note' },
      TRADEOFF,
      {
        id: 'formula',
        label: 'Formula',
        template:
          '**Formula:** `requests per day ÷ 86,400 ≈ requests per second`\n\n**Worked example:** …\n\n**Watch out for:** …',
      },
      MISTAKE,
    ],
    noteTitlePlaceholder: 'e.g. Fan-out on write vs read',
    noteBodyLabel: 'Note (Markdown supported, including ```mermaid diagrams)',
    diagrams: true,
  },
};
