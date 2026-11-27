import { Directive, ElementRef, inject, Injectable, input, OnDestroy, OnInit, signal } from '@angular/core';

// Motion for the animations, without a motion library. TheSWEguide's scenes used Motion's layoutId:
// an element that is drawn somewhere else in the next frame (even in another container) glides
// there. Here that is FLIP (First, Last, Invert, Play) with the Web Animations API:
//
//   <div appFlipScope>  … <span [appFlip]="'request-' + id">r{{ id }}</span> …  </div>
//
// The player calls scope.capture() just before it changes frames and scope.play() once the new
// frame is drawn: every element whose id was on screen before starts where it was and moves to its
// new place. Elements appearing or leaving use Angular's animate.enter / animate.leave with the
// .viz-* classes in styles.css. With reduced motion, frames change without animating.

/** The visitor's "reduce motion" setting, followed live. */
@Injectable({ providedIn: 'root' })
export class MotionPreference {
  private readonly media =
    typeof matchMedia === 'function' ? matchMedia('(prefers-reduced-motion: reduce)') : null;
  readonly reduced = signal(this.media?.matches ?? false);

  constructor() {
    this.media?.addEventListener('change', (event) => this.reduced.set(event.matches));
  }
}

const DURATION_MS = 500;
const EASING = 'cubic-bezier(0.22, 1, 0.36, 1)';

/** The elements of one drawn frame that can move between frames, by id. */
@Directive({ selector: '[appFlipScope]', exportAs: 'flipScope' })
export class FlipScopeDirective {
  private readonly host: HTMLElement = inject(ElementRef).nativeElement;
  private readonly motion = inject(MotionPreference);
  private readonly elements = new Map<string, HTMLElement>();
  private before: { origin: DOMRect; rects: Map<string, DOMRect> } | null = null;

  register(id: string, element: HTMLElement) {
    this.elements.set(id, element);
  }

  unregister(id: string, element: HTMLElement) {
    if (this.elements.get(id) === element) this.elements.delete(id);
  }

  /** Records where every element is. Call just before the frame changes. */
  capture() {
    if (this.motion.reduced() || this.elements.size === 0) {
      this.before = null;
      return;
    }
    const rects = new Map<string, DOMRect>();
    for (const [id, element] of this.elements) rects.set(id, element.getBoundingClientRect());
    this.before = { origin: this.host.getBoundingClientRect(), rects };
  }

  /** Once the new frame is drawn: each element that was on screen moves from where it was. */
  play() {
    const before = this.before;
    this.before = null;
    if (!before) return;
    // Positions relative to the frame, so scrolling in between doesn't count as a move.
    const origin = this.host.getBoundingClientRect();
    for (const [id, element] of this.elements) {
      const was = before.rects.get(id);
      if (!was || typeof element.animate !== 'function') continue;
      const now = element.getBoundingClientRect();
      const dx = was.left - before.origin.left - (now.left - origin.left);
      const dy = was.top - before.origin.top - (now.top - origin.top);
      if (Math.abs(dx) < 1 && Math.abs(dy) < 1) continue;
      element.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'translate(0, 0)' }], {
        duration: DURATION_MS,
        easing: EASING,
      });
    }
  }
}

/** Marks an element that keeps its identity between frames (Motion's layoutId). */
@Directive({ selector: '[appFlip]' })
export class FlipDirective implements OnInit, OnDestroy {
  readonly id = input.required<string>({ alias: 'appFlip' });
  private readonly scope = inject(FlipScopeDirective, { optional: true });
  private readonly element: HTMLElement = inject(ElementRef).nativeElement;
  private registered: string | null = null;

  ngOnInit() {
    this.registered = this.id();
    this.scope?.register(this.registered, this.element);
  }

  ngOnDestroy() {
    if (this.registered) this.scope?.unregister(this.registered, this.element);
  }
}
