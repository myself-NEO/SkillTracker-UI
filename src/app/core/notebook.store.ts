import { Injectable } from '@angular/core';
import type { TrackId } from '@content/shared/types';
import {
  EMPTY_NOTEBOOK,
  newNotebookId,
  type Note,
  NOTEBOOK_KEY,
  type NotebookState,
  notebookUpdates,
  type QuestionProgress,
  sanitizeNotebook,
  type SavedItem,
  type SelfRating,
  type Snippet,
} from '@lib/progress/notebook';
import { UserStorage } from './user-storage';

/**
 * The learner's notebook (bookmarks, flags, notes, code and diagrams), kept in this browser under
 * their account (`st:<userId>:learning-notebook-v1`) and with the account on the server
 * (UserStorage, StateSync).
 */
@Injectable({ providedIn: 'root' })
export class NotebookStore {
  private readonly storage = new UserStorage<NotebookState>({
    key: NOTEBOOK_KEY,
    empty: EMPTY_NOTEBOOK,
    sanitize: sanitizeNotebook,
    sync: 'notebook',
  });

  /** The current notebook; read it in templates and computed signals. */
  readonly notebook = this.storage.value;

  /** Saves or removes a bookmark; `on` undefined flips it. */
  toggleSaved(item: Omit<SavedItem, 'at'>, on?: boolean) {
    this.storage.update((s) => notebookUpdates.toggleSaved(s, item, on, Date.now()));
  }

  toggleDifficult(track: TrackId, lesson: string, on?: boolean) {
    this.storage.update((s) => notebookUpdates.toggleDifficult(s, track, lesson, on, Date.now()));
  }

  /** Flags a question (its id) or a problem (`problem:${slug}`) for revision. */
  toggleRevise(track: TrackId, ref: string, on?: boolean) {
    this.storage.update((s) => notebookUpdates.toggleRevise(s, track, ref, on, Date.now()));
  }

  updateQuestion(track: TrackId, questionId: string, change: Partial<QuestionProgress>) {
    this.storage.update((s) => notebookUpdates.updateQuestion(s, track, questionId, change));
  }

  rateQuestion(track: TrackId, questionId: string, rating: SelfRating) {
    this.storage.update((s) => notebookUpdates.rateQuestion(s, track, questionId, rating, Date.now()));
  }

  /** Creates a note, or updates the one with `id`; returns its id. */
  saveNote(entry: Omit<Note, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): string {
    const id = entry.id ?? newNotebookId();
    this.storage.update((s) => notebookUpdates.saveNote(s, { ...entry, id }, Date.now()));
    return id;
  }

  deleteNote(id: string) {
    this.storage.update((s) => notebookUpdates.deleteNote(s, id));
  }

  /** Keeps a copy of some code (or a Mermaid diagram); returns its id. */
  addSnippet(entry: Omit<Snippet, 'id' | 'createdAt'>): string {
    const id = newNotebookId();
    this.storage.update((s) => notebookUpdates.addSnippet(s, { ...entry, id }, Date.now()));
    return id;
  }

  updateSnippet(id: string, change: Partial<Pick<Snippet, 'title' | 'code' | 'topic'>>) {
    this.storage.update((s) => notebookUpdates.updateSnippet(s, id, change));
  }

  deleteSnippet(id: string) {
    this.storage.update((s) => notebookUpdates.deleteSnippet(s, id));
  }

  /** Marks a revision-list item reviewed now, or due again. */
  markReviewed(key: string, on = true) {
    this.storage.update((s) => notebookUpdates.markReviewed(s, key, on, Date.now()));
  }

  resetTrack(track: TrackId) {
    this.storage.update((s) => notebookUpdates.resetTrack(s, track));
  }

  /** Replaces the notebook, e.g. with an imported backup merged in (already sanitized). */
  replace(next: NotebookState) {
    this.storage.update(() => next);
  }
}
