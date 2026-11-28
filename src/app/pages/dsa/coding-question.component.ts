import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import type { LeetCodeProblem } from '@content/dsa/problems';
import type { ProblemStatus } from '@content/shared/types';
import {
  DIFFICULTY_LEVEL,
  DSA,
  DSA_NOTES,
  isRevisit,
  leetCodeUrl,
  noteOf,
  PRACTICE_STATUS_LABEL,
  PRACTICE_STATUSES,
  problemRef,
  statusOf,
} from '@lib/dsa/practice';
import { NotebookStore } from '../../core/notebook.store';
import { ProgressStore } from '../../core/progress.store';
import { NoteAutosave } from '../../notebook/note-autosave';
import { ExternalLinkIconComponent, FlagIconComponent, NoteIconComponent } from '../../ui/icons';
import { LevelBadgeComponent } from '../../ui/level-badge.component';

// One of DSA's coding questions (TheSWEguide's ProblemList row and ProblemNotes): a link to it on
// LeetCode, the learner's status, the revisit flag, and notes.

const CHIP = 'inline-flex items-center rounded-md border bg-surface-2 px-2 py-0.5 text-xs font-medium';
const TOGGLE =
  'inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-colors focus:outline-hidden focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg';
const TOGGLE_OFF = 'border-border text-fg-soft hover:border-border-strong hover:text-fg';

const STATUS_SELECT: Record<ProblemStatus, string> = {
  'not-started': 'border-border bg-bg text-fg-soft',
  'in-progress': 'border-warning/50 bg-warning-soft text-warning',
  attempted: 'border-insight/50 bg-insight-soft text-insight',
  completed: 'border-success/50 bg-success-soft text-success',
};

/** The learner's note on one coding question, saved as they type and collected on /dsa/notes. */
@Component({
  selector: 'app-coding-question-notes',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'mt-3 block border-t border-border pt-3', '[id]': 'notesId()' },
  template: `
    <div class="mb-1.5 flex flex-wrap items-center justify-between gap-2">
      <label [for]="notesId() + '-text'" class="text-xs font-semibold text-muted">My notes · approach, complexity, the bug that got you</label>
      <span class="text-xs text-muted" aria-live="polite">{{ statusText() }}</span>
    </div>
    <textarea
      [id]="notesId() + '-text'"
      [value]="text()"
      (input)="onInput($any($event.target).value)"
      rows="4"
      placeholder="e.g. Sort + two pointers, skip duplicates on both pointers. O(n²) time, O(1) extra space."
      class="w-full rounded-lg border border-border bg-bg px-3 py-2 font-mono text-sm text-fg placeholder:text-faint focus:ring-2 focus:ring-accent focus:outline-hidden"
    ></textarea>
    <p class="mt-1 text-xs text-muted">
      Saved to your account and collected in your <a [routerLink]="notesHref" class="text-accent hover:underline">interview notes</a>.
      Markdown is supported.
    </p>
  `,
})
export class CodingQuestionNotesComponent {
  private readonly store = inject(NotebookStore);
  private readonly autosave = new NoteAutosave();

  readonly problem = input.required<LeetCodeProblem>();
  readonly notesId = input.required<string>();

  protected readonly notesHref = DSA_NOTES;
  private readonly existing = computed(() => noteOf(this.store.notebook(), this.problem()));
  /** What the learner typed; until they type, the box shows the saved note. */
  private readonly draft = signal<string | null>(null);
  private readonly status = signal<'idle' | 'pending' | 'saved'>('idle');
  protected readonly text = computed(() => this.draft() ?? this.existing()?.body ?? '');
  protected readonly statusText = computed(() => {
    switch (this.status()) {
      case 'pending':
        return 'Saving…';
      case 'saved':
        return this.text().trim() ? 'Saved' : 'Note removed';
      default: {
        const note = this.existing();
        return note ? `Last edited ${new Date(note.updatedAt).toLocaleDateString()}` : '';
      }
    }
  });

  protected onInput(value: string) {
    this.draft.set(value);
    this.status.set('pending');
    const problem = this.problem();
    const ref = problemRef(problem);
    this.autosave.queue(
      ref,
      value,
      { track: DSA, title: `${problem.id}. ${problem.title}`, topic: problem.topic, problem: ref },
      (notebook) => noteOf(notebook, problem),
      () => this.status.set('saved'),
    );
  }
}

/** A coding question's row in the list: `<li appCodingQuestion [problem]="problem">`. */
@Component({
  selector: 'li[appCodingQuestion]',
  imports: [LevelBadgeComponent, ExternalLinkIconComponent, FlagIconComponent, NoteIconComponent, CodingQuestionNotesComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block rounded-xl border border-border bg-surface p-3 sm:p-4', '[id]': 'ref()', '[attr.data-problem]': 'problem().id' },
  template: `
    <div class="flex flex-wrap items-start justify-between gap-x-4 gap-y-3">
      <div class="min-w-0 flex-1 basis-64">
        <a
          [href]="url()"
          target="_blank"
          rel="noopener noreferrer"
          class="group inline-flex items-baseline gap-1.5 rounded font-semibold text-fg hover:text-accent focus:outline-hidden focus-visible:ring-2 focus-visible:ring-accent"
        >
          <span><span class="text-muted tabular-nums">{{ problem().id }}.</span> {{ problem().title }}</span>
          <svg appExternalLinkIcon class="size-3.5 shrink-0 text-muted group-hover:text-accent"></svg>
          <span class="sr-only">(opens LeetCode in a new tab)</span>
        </a>
        <div class="mt-2 flex flex-wrap items-center gap-1.5">
          <app-level-badge [level]="level()" [label]="problem().difficulty" />
          @if (problem().premium) {
            <span [class]="chip + ' border-warning/40 text-warning'">Premium</span>
          }
          @for (pattern of problem().patterns; track pattern) {
            <span [class]="chip + ' border-border text-fg-soft'">{{ pattern }}</span>
          }
        </div>
      </div>
      <div class="flex flex-wrap items-center gap-2">
        <label class="sr-only" [for]="'status-' + ref()">Status of {{ name() }}</label>
        <select
          [id]="'status-' + ref()"
          (change)="setStatus($any($event.target).value)"
          class="rounded-lg border px-2.5 py-1.5 text-xs font-semibold focus:ring-2 focus:ring-accent focus:outline-hidden"
          [class]="statusClasses()"
        >
          @for (option of statuses; track option) {
            <option [value]="option" [selected]="option === status()">{{ labels[option] }}</option>
          }
        </select>
        <button
          type="button"
          (click)="notebook.toggleRevise(dsa, ref())"
          [attr.aria-pressed]="revisit()"
          [class]="toggle + ' ' + (revisit() ? 'border-warning/50 bg-warning-soft text-warning' : toggleOff)"
        >
          <svg appFlagIcon [filled]="revisit()" class="size-3.5"></svg>
          Revisit<span class="sr-only"> {{ name() }}</span>
        </button>
        <button
          type="button"
          (click)="notesOpen.set(!notesOpen())"
          [attr.aria-expanded]="notesOpen()"
          [attr.aria-controls]="notesId()"
          [class]="toggle + ' ' + (notesOpen() || hasNote() ? 'border-accent/50 bg-accent-soft text-accent' : toggleOff)"
        >
          <svg appNoteIcon class="size-3.5"></svg>
          {{ hasNote() ? 'Notes ✓' : 'Notes' }}<span class="sr-only"> for {{ name() }}</span>
        </button>
      </div>
    </div>
    @if (notesOpen()) {
      <app-coding-question-notes [problem]="problem()" [notesId]="notesId()" />
    }
  `,
})
export class CodingQuestionComponent {
  private readonly progress = inject(ProgressStore);
  protected readonly notebook = inject(NotebookStore);

  readonly problem = input.required<LeetCodeProblem>();

  protected readonly dsa = DSA;
  protected readonly statuses = PRACTICE_STATUSES;
  protected readonly labels = PRACTICE_STATUS_LABEL;
  protected readonly chip = CHIP;
  protected readonly toggle = TOGGLE;
  protected readonly toggleOff = TOGGLE_OFF;
  protected readonly notesOpen = signal(false);

  protected readonly ref = computed(() => problemRef(this.problem()));
  protected readonly name = computed(() => `${this.problem().id}. ${this.problem().title}`);
  protected readonly url = computed(() => leetCodeUrl(this.problem()));
  protected readonly level = computed(() => DIFFICULTY_LEVEL[this.problem().difficulty]);
  protected readonly notesId = computed(() => `notes-${this.ref()}`);
  protected readonly status = computed(() => statusOf(this.progress.progress(), this.problem()));
  protected readonly statusClasses = computed(() => STATUS_SELECT[this.status()]);
  protected readonly revisit = computed(() => isRevisit(this.notebook.notebook(), this.problem()));
  protected readonly hasNote = computed(() => Boolean(noteOf(this.notebook.notebook(), this.problem())));

  protected setStatus(status: ProblemStatus) {
    this.progress.setProblemStatus(DSA, this.ref(), status);
  }
}
