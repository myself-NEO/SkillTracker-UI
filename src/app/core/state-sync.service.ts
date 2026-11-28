import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { DestroyRef, effect, inject, Injectable, signal, untracked } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { API_BASE_URL } from '../config/api-base-url';
import { AuthService } from '../services/auth.service';

/** The learner's state documents the backend keeps (GET/PATCH /api/state). */
export type StateKind = 'progress' | 'notebook' | 'interviews';

/** What the sync needs from a stored document (UserStorage). */
export interface SyncedDocument {
  /** Local changes the server doesn't have yet, as a merge patch; null when there are none. */
  pendingPatch(): Record<string, unknown> | null;
  /** The document now, to confirm a save against. */
  snapshot(): unknown;
  /** The server's copy arrived: it becomes the base, with local changes kept on top. */
  adopt(document: unknown): void;
  /** A save went through: `sent` is what the patch was made from, `document` what the server has now. */
  confirm(sent: unknown, document: unknown): void;
}

/** idle: nothing to do yet · pending: changes wait to be sent · saving · saved · offline: retrying · error: refused */
export type SyncStatus = 'idle' | 'pending' | 'saving' | 'saved' | 'offline' | 'error';

interface StateResponse {
  documents: Partial<Record<StateKind, { data: unknown; updatedAt: string }>>;
}

const MERGE_PATCH = { 'Content-Type': 'application/merge-patch+json' };
/** Changes made in a burst go out together. */
const DEBOUNCE_MS = 3000;
const FIRST_RETRY_MS = 3000;
const MAX_RETRY_MS = 60_000;
/** Coming back to the tab after this long reads the server's copy again (another device may have saved). */
const REFRESH_AFTER_MS = 60_000;
/** Browsers cap the body of a request sent while the page closes at 64 KB. */
const KEEPALIVE_LIMIT = 60_000;

/**
 * Keeps the learner's progress, notebook and interviews with their account (docs/plan.md, Phase 5).
 *
 * The browser's copy is used at once, so pages never wait for the backend (which sleeps when idle
 * and takes about a minute to wake). After signing in, the server's copy is read and local changes
 * are kept on top of it; then every change is sent as a JSON Merge Patch a few seconds later, and
 * once more as the page closes. While the backend can't be reached, saves are retried with a
 * growing delay; nothing is lost, since what to send is worked out from what the server last had.
 */
@Injectable({ providedIn: 'root' })
export class StateSync {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);
  private readonly documents = new Map<StateKind, SyncedDocument>();
  private readonly exitHooks = new Set<() => void>();

  readonly status = signal<SyncStatus>('idle');

  private user: string | null = null;
  /** The server's documents as last read; null until they have been read for this user. */
  private server: Partial<Record<StateKind, unknown>> | null = null;
  private readAt = 0;
  private needsRead = true;
  private timer: ReturnType<typeof setTimeout> | undefined;
  private retryMs = 0;
  private running: Promise<void> | null = null;
  private runAgain = false;

  constructor() {
    effect(() => {
      const userId = this.auth.userId();
      untracked(() => this.switchUser(userId));
    });
    if (typeof window !== 'undefined') {
      const onPageHide = () => this.sendOnExit();
      const onVisibilityChange = () => {
        if (document.visibilityState === 'hidden') this.sendOnExit();
        else if (this.user && Date.now() - this.readAt > REFRESH_AFTER_MS) this.refresh();
      };
      window.addEventListener('pagehide', onPageHide);
      document.addEventListener('visibilitychange', onVisibilityChange);
      inject(DestroyRef).onDestroy(() => {
        window.removeEventListener('pagehide', onPageHide);
        document.removeEventListener('visibilitychange', onVisibilityChange);
        clearTimeout(this.timer);
      });
    }
  }

  register(kind: StateKind, document: SyncedDocument) {
    this.documents.set(kind, document);
    // A store created after the server's copy was read catches up with it (once it has loaded).
    if (this.server) this.refresh();
  }

  /** A document changed: send it after a pause. */
  changed() {
    if (!this.user) return;
    if (this.status() !== 'offline' && this.status() !== 'error') this.status.set('pending');
    this.schedule(DEBOUNCE_MS);
  }

  /**
   * Runs `flush` just before the last save as the page closes or is hidden, e.g. to store a note
   * still waiting for a pause in typing, so it goes out too. Returns a function that removes it.
   */
  beforeExit(flush: () => void): () => void {
    this.exitHooks.add(flush);
    return () => this.exitHooks.delete(flush);
  }

  /** Reads the server's copy again (another device may have saved). */
  refresh() {
    this.needsRead = true;
    this.schedule(0);
  }

  /**
   * Sends what is pending now and waits, at most `timeoutMs`. True when everything is saved (used
   * before signing out).
   */
  async settle(timeoutMs = 4000): Promise<boolean> {
    if (!this.user || !this.hasPending()) return true;
    clearTimeout(this.timer);
    const timeout = new Promise<void>((resolve) => setTimeout(resolve, timeoutMs));
    await Promise.race([this.run(), timeout]);
    return !this.hasPending();
  }

  hasPending() {
    return [...this.documents.values()].some((document) => document.pendingPatch() !== null);
  }

  private switchUser(userId: string | null) {
    clearTimeout(this.timer);
    this.user = userId;
    this.server = null;
    this.needsRead = true;
    this.retryMs = 0;
    this.status.set('idle');
    if (userId) this.schedule(0);
  }

  private schedule(delayMs: number) {
    clearTimeout(this.timer);
    this.timer = setTimeout(() => void this.run(), delayMs);
  }

  /** One round of reading and saving at a time; a request for another one runs after it. */
  private run(): Promise<void> {
    if (this.running) {
      this.runAgain = true;
      return this.running;
    }
    this.running = this.round().finally(() => {
      this.running = null;
      if (this.runAgain) {
        this.runAgain = false;
        void this.run();
      }
    });
    return this.running;
  }

  private async round() {
    const user = this.user;
    if (!user) return;
    try {
      if (this.needsRead) await this.read(user);
      await this.save(user);
      this.retryMs = 0;
    } catch (error) {
      if (user !== this.user) return; // signed out meanwhile
      if (isRefused(error)) {
        this.status.set('error');
        return;
      }
      // Unreachable, waking up, or busy: try again later.
      this.status.set('offline');
      this.retryMs = Math.min(this.retryMs ? this.retryMs * 2 : FIRST_RETRY_MS, MAX_RETRY_MS);
      this.schedule(this.retryMs);
    }
  }

  private async read(user: string) {
    const response = await firstValueFrom(this.http.get<StateResponse>('/api/state'));
    if (user !== this.user) return;
    const server: Partial<Record<StateKind, unknown>> = {};
    for (const [kind, document] of Object.entries(response.documents ?? {})) {
      server[kind as StateKind] = document?.data;
    }
    for (const [kind, document] of this.documents) document.adopt(server[kind]);
    this.server = server;
    this.readAt = Date.now();
    this.needsRead = false;
  }

  private async save(user: string) {
    for (const [kind, document] of this.documents) {
      const patch = document.pendingPatch();
      if (!patch) continue;
      this.status.set('saving');
      const sent = document.snapshot();
      const saved = await firstValueFrom(
        this.http.patch<{ data: unknown }>(`/api/state/${kind}`, patch, { headers: MERGE_PATCH }),
      );
      if (user !== this.user) return;
      document.confirm(sent, saved.data);
      if (this.server) this.server[kind] = saved.data;
    }
    if (this.hasPending()) {
      // Changed again while saving.
      this.status.set('pending');
      this.schedule(DEBOUNCE_MS);
    } else if (this.status() !== 'idle') {
      this.status.set('saved');
    }
  }

  /**
   * The page is closing or hidden: send what is pending without waiting for the answer. If it
   * doesn't arrive, it is sent again next time (from the difference with the server's copy).
   */
  private sendOnExit() {
    for (const flush of [...this.exitHooks]) flush();
    const token = this.auth.getToken();
    if (!this.user || !token || this.needsRead || typeof fetch !== 'function') return;
    for (const [kind, document] of this.documents) {
      const patch = document.pendingPatch();
      if (!patch) continue;
      const body = JSON.stringify(patch);
      if (body.length > KEEPALIVE_LIMIT) continue;
      void fetch(`${API_BASE_URL}/api/state/${kind}`, {
        method: 'PATCH',
        keepalive: true,
        headers: { ...MERGE_PATCH, Authorization: `Bearer ${token}` },
        body,
      }).catch(() => {});
    }
  }
}

/** The server refused the save (bad patch, too large): retrying the same won't help. */
const isRefused = (error: unknown) =>
  error instanceof HttpErrorResponse && [400, 404, 411, 413].includes(error.status);
