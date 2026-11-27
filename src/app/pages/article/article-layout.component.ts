import { NgTemplateOutlet } from '@angular/common';
import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  Injector,
  input,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import type { TrackId } from '@content/shared/types';
import type { TocHeading } from '@lib/markdown/toc';
import { filter } from 'rxjs';
import { ProgressStore } from '../../core/progress.store';
import { scrollSpy } from '../../ui/scroll-spy';

/** Below this width the sidebar is a drawer (Tailwind's lg). */
const WIDE = '(min-width: 64rem)';

/**
 * The three-column page of a lesson, problem or cheat sheet (ported from TheSWEguide's
 * ArticleLayout, LessonShell and LessonNav): the sidebar (a drawer on small screens), the article,
 * and the "On this page" rail on wide screens. The article is about 72 characters wide.
 *
 *   <app-article-layout [track]="…" [headings]="…" sidebarLabel="Lessons">
 *     <div sidebar>…</div>   the article…   <div rail>…</div>
 *   </app-article-layout>
 *
 * On lesson pages (`resume` set), opening the page and reading through it moves the topic's
 * resume point: the lesson is marked visited, and the section being read is saved after a pause.
 */
@Component({
  selector: 'app-article-layout',
  imports: [NgTemplateOutlet, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'block',
    '(document:keydown.escape)': 'onEscape()',
    '(document:pointerdown)': 'onPointerDown($event)',
  },
  templateUrl: './article-layout.component.html',
})
export class ArticleLayoutComponent {
  private readonly store = inject(ProgressStore);
  private readonly injector = inject(Injector);
  private readonly aside = viewChild.required<ElementRef<HTMLElement>>('aside');
  private readonly scroller = viewChild.required<ElementRef<HTMLElement>>('scroller');
  private readonly closeButton = viewChild<ElementRef<HTMLButtonElement>>('closeButton');
  private readonly openButton = viewChild<ElementRef<HTMLButtonElement>>('openButton');
  private readonly sectionMenu = viewChild<ElementRef<HTMLElement>>('sectionMenu');

  readonly track = input.required<TrackId>();
  readonly headings = input<readonly TocHeading[]>([]);
  /** Names the sidebar and the button that opens it on small screens, e.g. "Lessons". */
  readonly sidebarLabel = input.required<string>();
  /** Set on lesson pages, so reading the page moves the topic's resume point. */
  readonly resume = input<{ track: TrackId; slug: string } | null>(null);

  protected readonly drawerOpen = signal(false);
  protected readonly menuOpen = signal(false);
  /** id of the section being read */
  protected readonly active = scrollSpy(() => this.headings().map((heading) => heading.id));
  protected readonly activeHeading = () => this.headings().find((heading) => heading.id === this.active());

  constructor() {
    const destroyRef = inject(DestroyRef);

    // A new page closes the drawer and the section menu, and shows its own place in the sidebar.
    const navigations = inject(Router)
      .events.pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe(() => {
        this.drawerOpen.set(false);
        this.menuOpen.set(false);
        afterNextRender(() => this.showCurrentLink(), { injector: this.injector });
      });
    destroyRef.onDestroy(() => navigations.unsubscribe());
    afterNextRender(() => this.showCurrentLink());

    this.whileDrawerOpen();
    this.trackResumePoint();
  }

  protected openDrawer() {
    this.drawerOpen.set(true);
  }

  protected closeDrawer() {
    this.drawerOpen.set(false);
  }

  protected onEscape() {
    if (this.drawerOpen()) this.drawerOpen.set(false);
    if (this.menuOpen()) this.menuOpen.set(false);
  }

  protected onPointerDown(event: Event) {
    if (this.menuOpen() && !this.sectionMenu()?.nativeElement.contains(event.target as Node)) this.menuOpen.set(false);
  }

  /** While the drawer is open over the page, Tab cycles through its own links and buttons. */
  protected keepFocusInside(event: KeyboardEvent) {
    if (!this.drawerOpen() || event.key !== 'Tab') return;
    const focusable = Array.from(
      this.aside().nativeElement.querySelectorAll<HTMLElement>('a[href], button, summary, [tabindex]:not([tabindex="-1"])'),
    ).filter((element) => element.getClientRects().length > 0);
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last?.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first?.focus();
    }
  }

  /**
   * Long curricula put the current page's link far down the list: scroll it into view. On small
   * screens this waits until the drawer opens (measuring the hidden list would lay all of it out).
   */
  private showCurrentLink() {
    if (!this.drawerOpen() && !matchMedia(WIDE).matches) return;
    const list = this.scroller().nativeElement;
    const current = list.querySelector<HTMLElement>('[aria-current="page"]');
    if (current) list.scrollTop = Math.max(0, current.offsetTop - list.clientHeight / 3);
  }

  /**
   * While the drawer is open: the page behind doesn't scroll, widening the window to the sidebar
   * layout closes it, focus moves into it, and back to the button that opened it when it closes.
   */
  private whileDrawerOpen() {
    let wasOpen = false;
    effect((onCleanup) => {
      if (!this.drawerOpen()) {
        if (wasOpen) {
          wasOpen = false;
          untracked(() => this.openButton()?.nativeElement.focus());
        }
        return;
      }
      wasOpen = true;
      const wide = matchMedia(WIDE);
      const onWide = () => wide.matches && this.drawerOpen.set(false);
      const overflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      wide.addEventListener('change', onWide);
      afterNextRender(
        () => {
          this.closeButton()?.nativeElement.focus();
          this.showCurrentLink();
        },
        { injector: this.injector },
      );
      onCleanup(() => {
        document.body.style.overflow = overflow;
        wide.removeEventListener('change', onWide);
      });
    });
  }

  /** Records the lesson as visited, then saves the section being read (after a pause) as where to continue. */
  private trackResumePoint() {
    // The section in view when the page opened isn't one the learner has read to; null = none seen yet.
    let seen: string | undefined | null = null;
    effect(() => {
      const lesson = this.resume();
      seen = null;
      if (lesson) untracked(() => this.store.markLessonVisited(lesson.track, lesson.slug));
    });
    effect((onCleanup) => {
      const active = this.active();
      const lesson = untracked(() => this.resume());
      if (!lesson) return;
      if (seen === null || seen === active) {
        seen = active;
        return;
      }
      seen = active;
      const timer = setTimeout(() => this.store.setResumeHeading(lesson.track, lesson.slug, active), 600);
      onCleanup(() => clearTimeout(timer));
    });
  }
}
