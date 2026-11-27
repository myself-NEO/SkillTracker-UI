import { afterNextRender, DestroyRef, effect, inject, NgZone, signal, type Signal } from '@angular/core';

/** Distance from the top of the viewport at which a section counts as the one being read (below the sticky bars). */
export const SPY_OFFSET = 128;

/**
 * The id of the section being read: the last of `ids` (in page order) whose element has scrolled up
 * past SPY_OFFSET, or undefined above the first one. Call in a component's constructor; `ids` may
 * read signals (the answer is worked out again when they change). Scrolling is watched outside
 * Angular's zone, and the page updates only when the answer changes.
 */
export function scrollSpy(ids: () => readonly string[]): Signal<string | undefined> {
  const active = signal<string | undefined>(undefined);
  const zone = inject(NgZone);
  const destroyRef = inject(DestroyRef);
  let frame = 0;
  let listening = false;

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
    if (listening && !frame) frame = requestAnimationFrame(update);
  };

  afterNextRender(() => {
    listening = true;
    zone.runOutsideAngular(() => {
      window.addEventListener('scroll', schedule, { passive: true });
      window.addEventListener('resize', schedule);
    });
    schedule();
  });
  // Another page in the same component (e.g. the next lesson): look again once it is drawn.
  effect(() => {
    ids();
    schedule();
  });
  destroyRef.onDestroy(() => {
    listening = false;
    cancelAnimationFrame(frame);
    window.removeEventListener('scroll', schedule);
    window.removeEventListener('resize', schedule);
  });

  return active.asReadonly();
}
