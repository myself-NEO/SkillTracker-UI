import { ChangeDetectionStrategy, Component, computed, effect, inject, input, linkedSignal, untracked } from '@angular/core';
import { RouterLink } from '@angular/router';
import type { TrackId } from '@content/shared/types';
import { lessonNote, type NotebookState, problemNote } from '@lib/progress/notebook';
import { NotebookStore } from '../core/notebook.store';
import { NoteIconComponent } from '../ui/icons';
import { NoteAutosave } from './note-autosave';

/**
 * A personal note on a lesson or problem, saved to the notebook as the learner types (TheSWEguide's
 * NotesBox). A note still waiting to be saved is saved when the learner moves to another page or
 * closes this one (NoteAutosave).
 */
@Component({
  selector: 'app-notes-box',
  imports: [RouterLink, NoteIconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <section [attr.aria-labelledby]="id() + '-heading'" class="mt-10 rounded-xl border border-border bg-surface p-5 sm:p-6">
      <div class="flex flex-wrap items-center justify-between gap-2">
        <h2 [id]="id() + '-heading'" class="flex items-center gap-2 font-display text-lg font-semibold">
          <svg appNoteIcon class="size-5 text-accent"></svg>
          {{ kind() === 'lesson' ? 'My notes' : 'My notes on this problem' }}
        </h2>
        <span class="text-xs text-muted" aria-live="polite">{{ statusText() }}</span>
      </div>
      <label [for]="id()" class="mt-2 block text-sm leading-6 text-muted">
        {{
          kind() === 'lesson'
            ? 'Write the idea in your own words, or the detail you keep forgetting.'
            : 'What tripped you up, the trade-off to remember, what you would say differently next time.'
        }}
        Notes are saved to your account and collected in your
        <a [routerLink]="notebookHref()" class="text-accent underline decoration-accent/40 underline-offset-2 hover:decoration-accent"
          >revision notebook</a
        >.
      </label>
      <textarea
        [id]="id()"
        [value]="text()"
        (input)="onInput($any($event.target).value)"
        rows="4"
        [placeholder]="placeholder()"
        class="mt-3 w-full rounded-lg border border-border bg-bg px-3 py-2.5 font-mono text-sm text-fg placeholder:text-faint focus:ring-2 focus:ring-accent focus:outline-hidden"
      ></textarea>
    </section>
  `,
})
export class NotesBoxComponent {
  private readonly store = inject(NotebookStore);

  readonly track = input.required<TrackId>();
  readonly kind = input.required<'lesson' | 'problem'>();
  readonly slug = input.required<string>();
  /** The lesson's or problem's title. */
  readonly title = input.required<string>();
  /** The lesson's stage id, or "problems". */
  readonly topic = input.required<string>();
  readonly placeholder = input.required<string>();
  readonly notebookHref = input.required<string>();

  private readonly pageKey = computed(() => `${this.track()}:${this.kind()}:${this.slug()}`);
  protected readonly id = computed(() => `${this.kind()}-note-${this.slug()}`);
  private readonly existing = computed(() => this.find(this.store.notebook(), this.track(), this.kind(), this.slug()));

  /** What the learner typed on this page; until they type, the box shows the saved note. */
  private readonly draft = linkedSignal<string, string | null>({ source: this.pageKey, computation: () => null });
  private readonly status = linkedSignal<string, 'idle' | 'pending' | 'saved'>({ source: this.pageKey, computation: () => 'idle' });
  protected readonly text = computed(() => this.draft() ?? this.existing()?.body ?? '');
  protected readonly statusText = computed(() => {
    switch (this.status()) {
      case 'pending':
        return 'Saving…';
      case 'saved':
        return this.text().trim() ? 'Saved to your notebook' : 'Note removed';
      default: {
        const note = this.existing();
        return note ? `Last edited ${new Date(note.updatedAt).toLocaleDateString()}` : '';
      }
    }
  });

  private readonly autosave = new NoteAutosave();

  constructor() {
    // Moving to another lesson reuses this box: save what was typed on the previous one first.
    effect(() => {
      const key = this.pageKey();
      untracked(() => {
        if (this.autosave.pendingKey && this.autosave.pendingKey !== key) this.autosave.flush();
      });
    });
  }

  private find(notebook: NotebookState, track: TrackId, kind: 'lesson' | 'problem', slug: string) {
    return kind === 'lesson' ? lessonNote(notebook, track, slug) : problemNote(notebook, track, slug);
  }

  protected onInput(value: string) {
    this.draft.set(value);
    this.status.set('pending');
    // Everything about the page now, in case the save happens after leaving it.
    const track = this.track();
    const kind = this.kind();
    const slug = this.slug();
    const key = this.pageKey();
    this.autosave.queue(
      key,
      value,
      {
        track,
        title: kind === 'lesson' ? this.title() : `${this.title()} — my notes`,
        topic: this.topic(),
        ...(kind === 'lesson' ? { lesson: slug } : { problem: slug }),
      },
      (notebook) => this.find(notebook, track, kind, slug),
      () => {
        if (key === this.pageKey()) this.status.set('saved');
      },
    );
  }
}
