import { DestroyRef, inject } from '@angular/core';
import { StateSync } from '../core/state-sync.service';

/**
 * Saves what the learner types (a note, an interview answer) once typing pauses, and at once when
 * the component goes away or the page closes, just before StateSync's last save, so it goes out
 * with it. Nothing typed is lost. Create it in a component's constructor.
 */
export class DebouncedSave {
  private pending: { key: string; save: () => void } | null = null;
  private timer: ReturnType<typeof setTimeout> | undefined;

  constructor(private readonly delayMs: number) {
    const removeExitHook = inject(StateSync).beforeExit(() => this.flush());
    inject(DestroyRef).onDestroy(() => {
      removeExitHook();
      this.flush();
    });
  }

  /** The key of what is waiting to be saved, if anything. */
  get pendingKey(): string | undefined {
    return this.pending?.key;
  }

  /**
   * Runs `save` after the pause, replacing whatever was waiting. `key` names what is saved, so a
   * component that moves on to something else can save the previous one first; `saved` runs after
   * the pause.
   */
  queue(key: string, save: () => void, saved?: () => void) {
    this.pending = { key, save };
    clearTimeout(this.timer);
    this.timer = setTimeout(() => {
      this.flush();
      saved?.();
    }, this.delayMs);
  }

  /** Saves what is waiting now. */
  flush() {
    clearTimeout(this.timer);
    const pending = this.pending;
    this.pending = null;
    pending?.save();
  }

  /** Drops what is waiting, without saving it. */
  cancel() {
    clearTimeout(this.timer);
    this.pending = null;
  }
}
