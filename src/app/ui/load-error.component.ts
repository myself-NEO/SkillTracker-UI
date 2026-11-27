import { ChangeDetectionStrategy, Component } from '@angular/core';

/** Shown in place of a page whose content file didn't download (offline, or a deploy in between). */
@Component({
  selector: 'app-load-error',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main id="main-content" class="mx-auto w-full max-w-3xl px-4 py-16 sm:px-6 lg:py-24">
      <h1 class="font-display text-3xl font-bold tracking-tight sm:text-4xl">This page couldn’t load</h1>
      <p class="mt-4 text-lg leading-8 text-muted">Check your connection, then try again.</p>
      <button
        type="button"
        (click)="reload()"
        class="mt-8 inline-flex h-11 items-center rounded-lg bg-fg px-5 text-sm font-semibold text-bg transition-opacity hover:opacity-90"
      >
        Try again
      </button>
    </main>
  `,
})
export class LoadErrorComponent {
  protected reload() {
    location.reload();
  }
}
