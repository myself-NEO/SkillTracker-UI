import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ThemeService } from '../core/theme.service';
import { SiteFooterComponent } from './site-footer.component';
import { SiteHeaderComponent } from './site-header.component';

/** The signed-in app: header with the topics, the page, and the footer, in the light or dark theme. */
@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, SiteHeaderComponent, SiteFooterComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'flex min-h-screen flex-col bg-bg font-sans text-fg' },
  template: `
    <a
      href="#main-content"
      (click)="skipToContent($event)"
      class="sr-only z-50 rounded-lg bg-fg px-4 py-2 text-sm font-semibold text-bg focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
      >Skip to content</a
    >
    <app-site-header />
    <div class="flex flex-1 flex-col">
      <router-outlet />
    </div>
    <app-site-footer />
  `,
})
export class ShellComponent {
  constructor() {
    inject(ThemeService).forceDark(false);
  }

  /**
   * Moves focus to the page's main content. A plain "#main-content" link would resolve against
   * <base href="/"> and leave the page.
   */
  protected skipToContent(event: Event) {
    const main = document.getElementById('main-content');
    if (!main) return;
    event.preventDefault();
    main.setAttribute('tabindex', '-1');
    main.focus({ preventScroll: true });
  }
}
