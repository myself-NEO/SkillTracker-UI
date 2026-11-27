import {
  afterNextRender,
  afterRenderEffect,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  Injector,
  input,
  linkedSignal,
  NgZone,
  signal,
  viewChild,
  viewChildren,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { DomSanitizer } from '@angular/platform-browser';
import type { VizWidget } from '@lib/content/doc';
import { BUILDERS } from '@lib/viz/builders';
import type { SlidingWindowParams } from '@lib/viz/scenes/sliding-window/logic';
import { CodePanelComponent } from './code-panel.component';
import { MotionPreference } from './motion';
import { SceneFrameComponent } from './scene-frame.component';
import { SlidingWindowEditorComponent } from './scenes/sliding-window.view';

/** An animation to play: a scene, its parameters (already checked), and how to play it. */
export type VizSpec = Omit<VizWidget, 'type'>;

/** How long each frame stays up while playing, at 1× speed. */
const DELAY_MS = 1600;

/**
 * Plays a scene (ported from TheSWEguide's ScenePlayer) in one of three modes:
 * - stepper: controls to play, pause and step, a slider, a speed, the scene's code beside it, and,
 *   where the scene has one, an editor for the learner's own input;
 * - loop: plays while it is on screen (unless the visitor prefers reduced motion);
 * - scrolly: a scroll-driven explainer, whose frames follow the step of the text being read.
 * Each change of frame is animated (motion.ts); with reduced motion, frames change without it.
 */
@Component({
  selector: 'app-scene-player',
  imports: [NgTemplateOutlet, SceneFrameComponent, CodePanelComponent, SlidingWindowEditorComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  templateUrl: './scene-player.component.html',
})
export class ScenePlayerComponent {
  private readonly injector = inject(Injector);
  private readonly motion = inject(MotionPreference);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly frameView = viewChild(SceneFrameComponent);
  private readonly loopFigure = viewChild<ElementRef<HTMLElement>>('loopFigure');
  private readonly scrollyScene = viewChild<ElementRef<HTMLElement>>('scrollyScene');
  private readonly stepCards = viewChildren<ElementRef<HTMLElement>>('stepCard');

  readonly viz = input.required<VizSpec>();

  /** The parameters being played: the block's, or the learner's own (stepper editor). */
  protected readonly params = linkedSignal(() => this.viz().params);
  protected readonly frames = computed(() => BUILDERS[this.viz().scene]?.(this.params()) ?? []);
  /** Back to the first frame whenever the frames change. */
  protected readonly index = linkedSignal({ source: this.frames, computation: () => 0 });
  protected readonly last = computed(() => this.frames().length - 1);
  protected readonly at = computed(() =>
    this.viz().mode === 'loop' ? this.index() % Math.max(this.frames().length, 1) : Math.min(this.index(), this.last()),
  );
  protected readonly frame = computed(() => this.frames()[this.at()]);

  // Stepper
  protected readonly playing = signal(false);
  protected readonly speed = signal(1);
  protected readonly speeds = [0.5, 1, 2];

  // Loop: null follows the defaults (play while visible, unless the visitor prefers reduced motion).
  private readonly visible = signal(false);
  private readonly choice = signal<boolean | null>(null);
  protected readonly loopPlaying = computed(() => (this.choice() ?? !this.motion.reduced()) && this.visible());

  // Scrolly: each step's HTML (this app's build output, trusted like lesson bodies).
  protected readonly steps = computed(() =>
    (this.viz().steps ?? []).map((html) => this.sanitizer.bypassSecurityTrustHtml(html)),
  );

  protected readonly icons = {
    restart: 'M4 10a6 6 0 1 0 1.8-4.3M4 4v3.5h3.5',
    prev: 'M12.5 5l-5 5 5 5',
    next: 'M7.5 5l5 5-5 5',
  };

  constructor() {
    // Stepper: the next frame after a delay, stopping at the end.
    effect((onCleanup) => {
      if (this.viz().mode !== 'stepper' || !this.playing()) return;
      const at = this.at();
      const last = this.last();
      const timer = setTimeout(() => {
        if (at >= last) this.playing.set(false);
        else this.show(at + 1);
      }, DELAY_MS / this.speed());
      onCleanup(() => clearTimeout(timer));
    });

    // Loop: round and round while playing.
    effect((onCleanup) => {
      if (this.viz().mode !== 'loop' || !this.loopPlaying()) return;
      const next = (this.at() + 1) % Math.max(this.frames().length, 1);
      const timer = setTimeout(() => this.show(next), DELAY_MS);
      onCleanup(() => clearTimeout(timer));
    });

    this.watchLoopVisibility();
    this.followScrolledSteps();
  }

  /** Shows another frame, animating the change. */
  private show(next: number) {
    this.frameView()?.capture();
    this.index.set(next);
    afterNextRender(() => this.frameView()?.play(), { injector: this.injector });
  }

  protected go(next: number) {
    this.playing.set(false);
    this.show(Math.max(0, Math.min(this.last(), next)));
  }

  protected toggle() {
    if (this.at() >= this.last()) this.show(0);
    this.playing.set(!this.playing());
  }

  protected toggleLoop() {
    this.choice.set(!this.loopPlaying());
  }

  /** Space or Enter plays and pauses; the arrow keys step (when the animation itself has focus). */
  protected onKeys(event: KeyboardEvent) {
    if (event.target !== event.currentTarget) return;
    if (event.key === ' ' || event.key === 'Enter') {
      event.preventDefault();
      this.toggle();
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      this.go(this.at() + 1);
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      this.go(this.at() - 1);
    }
  }

  protected onSlider(event: Event) {
    this.go(Number((event.target as HTMLInputElement).value));
  }

  protected onSpeed(event: Event) {
    this.speed.set(Number((event.target as HTMLSelectElement).value));
  }

  /** The learner's own input (sliding window): play it from the start. */
  protected applyParams(params: SlidingWindowParams) {
    this.playing.set(false);
    this.params.set(params);
  }

  private watchLoopVisibility() {
    const destroyRef = inject(DestroyRef);
    let observed: HTMLElement | null = null;
    let observer: IntersectionObserver | null = null;
    afterRenderEffect(() => {
      const figure = this.loopFigure()?.nativeElement ?? null;
      if (figure === observed) return;
      observer?.disconnect();
      observed = figure;
      if (!figure) return;
      if (typeof IntersectionObserver === 'undefined') {
        this.visible.set(true);
        return;
      }
      observer = new IntersectionObserver(([entry]) => this.visible.set(entry.isIntersecting), { threshold: 0.35 });
      observer.observe(figure);
    });
    destroyRef.onDestroy(() => observer?.disconnect());
  }

  /**
   * Scrolly: the step being read is the last one whose card has crossed the reading line: the
   * middle of the screen when the scene is pinned beside the text, and the middle of the space left
   * below it when the scene is pinned on top (narrow screens), so the text is never under the scene.
   */
  private followScrolledSteps() {
    const zone = inject(NgZone);
    const destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      if (this.viz().mode !== 'scrolly') return;
      const wide = matchMedia('(min-width: 64rem)');
      let frame = 0;
      const update = () => {
        frame = 0;
        const sceneBottom = this.scrollyScene()?.nativeElement.getBoundingClientRect().bottom ?? 0;
        const line = wide.matches ? innerHeight / 2 : Math.min((sceneBottom + innerHeight) / 2, innerHeight * 0.85);
        let next = 0;
        this.stepCards().forEach((card, index) => {
          if (card.nativeElement.getBoundingClientRect().top < line) next = index;
        });
        if (next !== this.index()) zone.run(() => this.show(next));
      };
      const schedule = () => {
        if (!frame) frame = requestAnimationFrame(update);
      };
      zone.runOutsideAngular(() => {
        addEventListener('scroll', schedule, { passive: true });
        addEventListener('resize', schedule);
      });
      update();
      destroyRef.onDestroy(() => {
        cancelAnimationFrame(frame);
        removeEventListener('scroll', schedule);
        removeEventListener('resize', schedule);
      });
    });
  }
}
