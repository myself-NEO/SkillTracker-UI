import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { StateSync, type SyncStatus } from '../core/state-sync.service';

const TEXT: Record<SyncStatus, string> = {
  idle: '',
  pending: 'Saving…',
  saving: 'Saving…',
  saved: 'Saved',
  offline: 'Offline',
  error: 'Not saved',
};

const TITLE: Partial<Record<SyncStatus, string>> = {
  saved: 'Your progress is saved to your account.',
  offline: 'Your changes are kept in this browser and saved to your account once the server can be reached.',
  error: 'The server refused to save your changes. They are kept in this browser.',
};

/**
 * Whether the learner's progress has reached their account: "Saving…", then "Saved" for a moment,
 * or "Offline" / "Not saved" for as long as that lasts. On phones only the last two show (as icons),
 * to keep the header short; the account menu says the rest.
 */
@Component({
  selector: 'app-sync-status',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'contents' },
  template: `
    @if (shown(); as status) {
      <span
        class="items-center gap-1.5 text-xs font-medium whitespace-nowrap"
        [class]="status === 'offline' ? 'flex text-warning' : status === 'error' ? 'flex text-danger' : 'hidden text-muted sm:flex'"
        [attr.title]="title[status] ?? null"
      >
        @switch (status) {
          @case ('saved') {
            <svg class="size-4" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 10.5l3.5 3.5 7.5-8" />
            </svg>
          }
          @case ('offline') {
            <svg class="size-4" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 15.5h8.5a3.5 3.5 0 00.6-6.95A5 5 0 005.4 7.6 4 4 0 006 15.5zM3 3l14 14" />
            </svg>
          }
          @case ('error') {
            <svg class="size-4" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
              <circle cx="10" cy="10" r="7.25" />
              <path stroke-linecap="round" d="M10 6.5v4.25M10 13.5v.01" />
            </svg>
          }
          @default {
            <svg class="size-4 animate-spin" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
              <path stroke-linecap="round" d="M10 3a7 7 0 107 7" />
            </svg>
          }
        }
        <span class="max-sm:sr-only">{{ text[status] }}</span>
      </span>
    }
    <span class="sr-only" role="status">{{ announcement() }}</span>
  `,
})
export class SyncStatusComponent {
  private readonly sync = inject(StateSync);
  protected readonly text = TEXT;
  protected readonly title = TITLE;
  /** "Saved" shows for a moment, then the indicator goes away. */
  private readonly savedRecently = signal(false);

  protected readonly shown = computed<SyncStatus | null>(() => {
    const status = this.sync.status();
    if (status === 'idle') return null;
    if (status === 'saved') return this.savedRecently() ? 'saved' : null;
    return status;
  });

  /** Only problems are announced; saving happens all the time. */
  protected readonly announcement = computed(() => {
    const status = this.sync.status();
    return status === 'offline' || status === 'error' ? (TITLE[status] ?? '') : '';
  });

  constructor() {
    effect((onCleanup) => {
      if (this.sync.status() !== 'saved') return;
      this.savedRecently.set(true);
      const timer = setTimeout(() => this.savedRecently.set(false), 2500);
      onCleanup(() => clearTimeout(timer));
    });
  }
}
