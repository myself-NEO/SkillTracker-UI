import { inject } from '@angular/core';
import type { Note, NotebookState } from '@lib/progress/notebook';
import { NotebookStore } from '../core/notebook.store';
import { DebouncedSave } from './debounced-save';

/** Typing pauses this long before a note is saved. */
export const SAVE_DELAY_MS = 600;

/** What a notes box writes into its note, besides the text. */
export type NoteTarget = Omit<Note, 'id' | 'body' | 'kind' | 'createdAt' | 'updatedAt'>;

/**
 * Saves a note as the learner types, for the notes boxes of lessons, problems and coding questions:
 * once typing pauses, and at once when the box moves to another page or goes away, or the page
 * closes (DebouncedSave). Create it in a component's constructor.
 */
export class NoteAutosave {
  private readonly store = inject(NotebookStore);
  private readonly debounced = new DebouncedSave(SAVE_DELAY_MS);

  /** The key of the note waiting to be saved, if any. */
  get pendingKey(): string | undefined {
    return this.debounced.pendingKey;
  }

  /**
   * After the pause, saves `body` into the note `find` locates (keeping its kind), or creates it
   * from `target`; a blank `body` removes the note. `key` names the note, so a box that moves to
   * another page can save the previous page's note first. `saved` runs after the pause.
   */
  queue(key: string, body: string, target: NoteTarget, find: (notebook: NotebookState) => Note | undefined, saved?: () => void) {
    this.debounced.queue(
      key,
      () => {
        const existing = find(this.store.notebook());
        if (body.trim() === '') {
          if (existing) this.store.deleteNote(existing.id);
        } else {
          this.store.saveNote({ ...target, ...(existing?.kind && { kind: existing.kind }), id: existing?.id, body });
        }
      },
      saved,
    );
  }

  /** Saves what is waiting now. */
  flush() {
    this.debounced.flush();
  }
}
