import { afterNextRender, DestroyRef, inject, NgZone, signal, type Signal } from '@angular/core';

/** Distance from the top of the viewport at which a section counts as the one being read (below the sticky header). */
export const SPY_OFFSET = 128;

/**
 * The id of the section being read: the last of `ids` (in page order) whose element has scrolled up
 * past SPY_OFFSET, or undefined above the first one. Call in a component's constructor. Scrolling
 * is watched outside Angular's zone; the page updates only when the answer changes.
 */
export function scrollSpy(ids: () => readonly string[]): Signal<string | undefined> {
  const active = signal<string | undefined>(undefined);
  const zone = inject(NgZone);
  const destroyRef = inject(DestroyRef);

  afterNextRender(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      let current: string | undefined;
      for (const id of ids()) {
        const element = document.getElementById(id);
        if (!element) continue;
        if (element.getBoundingClientRect().top > SPY_OFFSET) break;
        current = id;
      }
      if (current !== active()) active.set(current);
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    zone.runOutsideAngular(() => {
      window.addEventListener('scroll', schedule, { passive: true });
      window.addEventListener('resize', schedule);
    });
    schedule();
    destroyRef.onDestroy(() => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
    });
  });

  return active.asReadonly();
}
