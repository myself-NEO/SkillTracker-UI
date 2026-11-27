import { ViewportScroller } from '@angular/common';
import { EnvironmentProviders, inject, provideEnvironmentInitializer } from '@angular/core';
import { Router, Scroll } from '@angular/router';
import { filter } from 'rxjs';

/** Room above an #anchor scrolled into view: the sticky header plus a little space (scroll-mt-20). */
export const ANCHOR_OFFSET = 80;

/**
 * Scroll handling for page changes, used with `withInMemoryScrolling({ anchorScrolling: 'enabled' })`.
 * The router scrolls to #anchors (smoothly, as the stylesheet asks), and this does the rest
 * instantly: a new page opens at the top, and Back/Forward return to where the page was left.
 * The router's own restoration would also scroll smoothly, so the old page's position would
 * visibly glide up over the new page.
 */
export function provideAppScrolling(): EnvironmentProviders {
  return provideEnvironmentInitializer(() => {
    const scroller = inject(ViewportScroller);
    scroller.setOffset([0, ANCHOR_OFFSET]);
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
        } else if (!event.anchor) {
          scroller.scrollToPosition([0, 0], { behavior: 'instant' });
        }
      });
  });
}
