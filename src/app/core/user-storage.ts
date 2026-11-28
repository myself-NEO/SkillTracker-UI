import { effect, inject, signal, type Signal, untracked, type WritableSignal } from '@angular/core';
import { applyMergePatch, mergePatchDiff } from '@lib/progress/merge-patch';
import { AuthService } from '../services/auth.service';
import { type StateKind, StateSync, type SyncedDocument } from './state-sync.service';

export interface UserStorageOptions<T> {
  /** TheSWEguide's localStorage key for the same data, e.g. "learning-progress-v1". */
  key: string;
  empty: T;
  /** Accepts anything JSON-parsed and keeps only well-formed parts. */
  sanitize: (parsed: unknown) => T;
  /** Also kept with the account on the server, as this kind of state document (StateSync). */
  sync?: StateKind;
}

/**
 * State kept in this browser under the signed-in account, `st:<userId>:<key>`, so two accounts on
 * one browser don't mix. Signed out, it is empty and nothing is kept. Other tabs see changes via
 * `storage` events.
 *
 * With `sync`, the account's copy on the server follows it (StateSync): this browser also keeps the
 * document as the server last had it (`…:synced`), and what differs from that is what is sent. So
 * changes made offline, or before the backend wakes up, are never lost: they go out on the next save.
 *
 * Create it in a service's field initializer (it needs an injection context).
 */
export class UserStorage<T> implements SyncedDocument {
  private readonly auth = inject(AuthService);
  private readonly state: WritableSignal<T>;
  private readonly sync: StateSync | null = null;
  private storageKey: string | null = null;
  /** The server's copy as last seen; null when this browser has never synced it. */
  private base: T | null = null;

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
        if (!event.key || !this.storageKey) return;
        if (event.key === this.storageKey) this.state.set(this.read(this.storageKey) ?? this.options.empty);
        if (event.key === this.baseKey()) this.base = this.read(this.baseKey()!);
      });
    }
    if (options.sync) {
      this.sync = inject(StateSync);
      this.sync.register(options.sync, this);
    }
  }

  /** Applies a change; returning the same state is a no-op. */
  update(change: (state: T) => T): void {
    const current = this.state();
    const next = change(current);
    if (next === current) return;
    this.set(next);
    this.sync?.changed();
  }

  // --- SyncedDocument (StateSync) --------------------------------------------------------------

  pendingPatch() {
    return this.storageKey ? mergePatchDiff(this.base ?? this.options.empty, this.state()) : null;
  }

  snapshot(): unknown {
    return this.state();
  }

  adopt(document: unknown) {
    if (!this.storageKey) return;
    const server = this.options.sanitize(document ?? {});
    const pending = this.pendingPatch();
    this.setBase(server);
    this.set(pending ? this.options.sanitize(applyMergePatch(server, pending)) : server);
  }

  confirm(sent: unknown, document: unknown) {
    if (!this.storageKey) return;
    const server = this.options.sanitize(document ?? {});
    // Changes made while the save was on its way stay, and go out next time.
    const later = mergePatchDiff(sent, this.state());
    this.setBase(server);
    this.set(later ? this.options.sanitize(applyMergePatch(server, later)) : server);
  }

  // --- Storage ---------------------------------------------------------------------------------

  private baseKey() {
    return this.storageKey && `${this.storageKey}:synced`;
  }

  private load(userId: string | null) {
    this.storageKey = userId ? `st:${userId}:${this.options.key}` : null;
    this.state.set((this.storageKey && this.read(this.storageKey)) || this.options.empty);
    this.base = this.storageKey ? this.read(this.baseKey()!) : null;
  }

  private read(key: string): T | null {
    try {
      const raw = localStorage.getItem(key);
      return raw ? this.options.sanitize(JSON.parse(raw)) : null;
    } catch {
      return null; // unreadable or unavailable storage: start empty
    }
  }

  private set(next: T) {
    this.state.set(next);
    this.write(this.storageKey, next);
  }

  private setBase(next: T) {
    this.base = next;
    this.write(this.baseKey(), next);
  }

  private write(key: string | null, value: T) {
    if (!key) return; // signed out: nothing to keep
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Storage unavailable or full: keep the state for this visit only.
    }
  }
}
