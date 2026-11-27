import { effect, inject, signal, type Signal, untracked, type WritableSignal } from '@angular/core';
import { AuthService } from '../services/auth.service';

export interface UserStorageOptions<T> {
  /** TheSWEguide's localStorage key for the same data, e.g. "learning-progress-v1". */
  key: string;
  empty: T;
  /** Accepts anything JSON-parsed and keeps only well-formed parts. */
  sanitize: (parsed: unknown) => T;
}

/**
 * State kept in this browser under the signed-in account, `st:<userId>:<key>`, so two accounts on
 * one browser don't mix. Signed out, it is empty and nothing is kept. Other tabs see changes via
 * `storage` events. Syncing to the account on the server comes later (docs/plan.md, Phase 5).
 *
 * Create it in a service's field initializer (it needs an injection context).
 */
export class UserStorage<T> {
  private readonly auth = inject(AuthService);
  private readonly state: WritableSignal<T>;
  private storageKey: string | null = null;

  /** The current state; read it in templates and computed signals. */
  readonly value: Signal<T>;

  constructor(private readonly options: UserStorageOptions<T>) {
    this.state = signal(options.empty);
    this.value = this.state.asReadonly();
    effect(() => {
      const userId = this.auth.userId();
      untracked(() => this.load(userId));
    });
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (event) => {
        if (event.key && event.key === this.storageKey) this.state.set(this.read());
      });
    }
  }

  /** Applies a change; returning the same state is a no-op. */
  update(change: (state: T) => T): void {
    const current = this.state();
    const next = change(current);
    if (next === current) return;
    this.state.set(next);
    if (!this.storageKey) return; // signed out: nothing to keep
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(next));
    } catch {
      // Storage unavailable or full: keep the state for this visit only.
    }
  }

  private load(userId: string | null) {
    this.storageKey = userId ? `st:${userId}:${this.options.key}` : null;
    this.state.set(this.read());
  }

  private read(): T {
    if (!this.storageKey) return this.options.empty;
    try {
      const raw = localStorage.getItem(this.storageKey);
      return raw ? this.options.sanitize(JSON.parse(raw)) : this.options.empty;
    } catch {
      return this.options.empty; // unreadable or unavailable storage: start empty
    }
  }
}
