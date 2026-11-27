import { ViewportScroller } from '@angular/common';
import { EnvironmentProviders, inject, provideEnvironmentInitializer } from '@angular/core';
import { Router, Scroll } from '@angular/router';
import { filter } from 'rxjs';

/**
 * Scroll handling for page changes, used with `withInMemoryScrolling()` (which only has the router
 * emit `Scroll` events; everything else is done here):
 * - A new page opens at the top, and Back/Forward return to where the page was left, instantly.
 *   (The router's own restoration would scroll smoothly, as the stylesheet asks, so the old page's
 *   position would visibly glide up over the new page.)
 * - A link to a section (#id) scrolls it into view with the browser's own `scrollIntoView`, which
 *   keeps the room each element asks for above it (`scroll-margin-top`, see styles.css).
 */
export function provideAppScrolling(): EnvironmentProviders {
  return provideEnvironmentInitializer(() => {
    const scroller = inject(ViewportScroller);
    try {
      history.scrollRestoration = 'manual';
    } catch {
      // Not allowed here (e.g. a sandboxed frame): the browser restores positions itself.
    }
    inject(Router)
      .events.pipe(filter((event): event is Scroll => event instanceof Scroll))
      .subscribe((event) => {
        if (event.scrollBehavior === 'manual') return;
        if (event.position) {
          scroller.scrollToPosition(event.position, { behavior: 'instant' });
        } else if (event.anchor) {
          jumpToSection(event.anchor);
        } else {
          scroller.scrollToPosition([0, 0], { behavior: 'instant' });
        }
      });
  });
}

let pendingJump: AbortController | undefined;

/**
 * Scrolls to a section (smoothly, where motion is allowed) and, once the scroll ends, puts the
 * section back at the top: diagrams drawn and blocks laid out on the way (.render-when-near) can
 * push it down meanwhile. The reader scrolling, tapping or typing cancels the correction.
 */
export function jumpToSection(id: string): void {
  const section = document.getElementById(id);
  if (!section) return;
  pendingJump?.abort();
  const controller = new AbortController();
  pendingJump = controller;
  const { signal } = controller;
  const done = () => controller.abort();
  window.addEventListener(
    'scrollend',
    () => {
      section.scrollIntoView({ block: 'start', behavior: 'instant' });
      done();
    },
    { signal },
  );
  for (const type of ['wheel', 'touchstart', 'keydown'] as const) {
    window.addEventListener(type, done, { signal, passive: true });
  }
  setTimeout(done, 3000);
  section.scrollIntoView({ block: 'start' });
}
