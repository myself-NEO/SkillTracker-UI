import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { findLesson } from '@content/shared/curriculum';
import { DEFAULT_PROBLEM_STATUSES, type LessonMeta } from '@content/shared/types';
import { practiceCopy, problemNotePlaceholder } from '@lib/content/practice';
import { LEVEL_NAME } from '@lib/format';
import { lessonPath, problemPath } from '@lib/markdown/links';
import { TOPICS } from '@lib/topics';
import type { PageResult, ProblemData } from '../../core/content.resolvers';
import { ProgressStore } from '../../core/progress.store';
import { NotesBoxComponent } from '../../notebook/notes-box.component';
import { RevisitToggleComponent } from '../../notebook/revision-tools';
import { LevelBadgeComponent } from '../../ui/level-badge.component';
import { LoadErrorComponent } from '../../ui/load-error.component';
import { lessonState, StatusIconComponent } from '../../ui/status-icon.component';
import { ArticleLayoutComponent } from '../article/article-layout.component';
import {
  BreadcrumbComponent,
  ClockGlyphComponent,
  MetaPillComponent,
  PrevNextComponent,
  ProblemStatusPickerComponent,
} from '../article/article-parts';
import { type BodyPage, LessonBodyComponent } from '../article/lesson-body.component';
import { ProblemSidebarComponent, problemsInOrder } from '../article/sidebars.component';
import { NotFoundComponent } from '../not-found/not-found-page.component';

/**
 * A practice problem (/:topic/problems/:problem, Java, LLD and HLD): how to practise it, the
 * learner's status, the lessons to review first, and the step-by-step breakdown. Ported from
 * TheSWEguide's problems/[problem]/page.tsx, with the notebook's "Revisit later" flag and notes.
 */
@Component({
  selector: 'app-problem-page',
  imports: [
    RouterLink,
    ArticleLayoutComponent,
    ProblemSidebarComponent,
    BreadcrumbComponent,
    MetaPillComponent,
    ClockGlyphComponent,
    LevelBadgeComponent,
    StatusIconComponent,
    ProblemStatusPickerComponent,
    LessonBodyComponent,
    PrevNextComponent,
    NotFoundComponent,
    LoadErrorComponent,
    RevisitToggleComponent,
    NotesBoxComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @switch (page().status) {
      @case ('missing') {
        <app-not-found />
      }
      @case ('error') {
        <app-load-error />
      }
      @default {
        @let view = data()!;
        <app-article-layout [track]="view.track.id" [headings]="view.doc?.toc ?? []" [sidebarLabel]="copy().groupTitle">
          <app-problem-sidebar sidebar [track]="view.track" [title]="info().title" [currentSlug]="view.problem.slug" />

          <header>
            <app-breadcrumb [items]="breadcrumb()" />
            <h1 class="mt-4 font-display text-3xl leading-tight font-bold tracking-tight sm:text-4xl">
              {{ copy().titlePrefix }}{{ view.problem.title }}
            </h1>
            <p class="mt-3 text-lg leading-8 text-muted">{{ view.problem.summary }}</p>
            <div class="mt-5 flex flex-wrap items-center gap-2">
              <app-level-badge [level]="view.problem.difficulty" />
              <app-meta-pill><svg appClockGlyph></svg>{{ view.problem.minutes }} min</app-meta-pill>
              @for (pattern of view.problem.patterns; track pattern) {
                <app-meta-pill>{{ pattern }}</app-meta-pill>
              }
            </div>
          </header>

          <section aria-label="How to practise" class="mt-8 rounded-xl border border-border bg-surface p-5 sm:p-6">
            <div class="grid gap-6 sm:grid-cols-2">
              <div>
                <p class="text-xs font-semibold tracking-[0.14em] text-muted uppercase">How to practise</p>
                <ol class="mt-3 list-decimal space-y-2 pl-5 text-sm leading-6 text-fg-soft marker:text-muted">
                  @for (step of copy().steps; track step) {
                    <li>{{ step }}</li>
                  }
                </ol>
              </div>
              <div>
                <p class="text-xs font-semibold tracking-[0.14em] text-muted uppercase">Review first</p>
                @if (concepts().length > 0) {
                  <ul class="mt-3 space-y-2 text-sm leading-6">
                    @for (lesson of concepts(); track lesson.slug) {
                      <li>
                        <a [routerLink]="lessonLink(lesson.slug)" class="flex items-start gap-2.5 text-fg-soft hover:text-accent">
                          <app-status-icon [state]="lessonState(lesson.slug)" iconClass="mt-1 size-4" />
                          {{ lesson.title }}
                        </a>
                      </li>
                    }
                  </ul>
                } @else {
                  <p class="mt-3 text-sm leading-6 text-muted">No particular lesson; dive straight in.</p>
                }
              </div>
            </div>
            <div class="mt-6 flex flex-wrap items-center gap-3 border-t border-border pt-5">
              <span class="text-sm font-medium text-fg-soft">Your status</span>
              <app-problem-status-picker [track]="view.track.id" [slug]="view.problem.slug" [statuses]="statuses()" />
              @if (view.track.notebook) {
                <app-revisit-toggle [track]="view.track.id" [slug]="view.problem.slug" />
              }
            </div>
          </section>

          <div class="mt-10">
            @if (view.doc; as doc) {
              <app-lesson-body [doc]="doc" [page]="bodyPage()" />
            } @else {
              <div class="rounded-xl border border-dashed border-border-strong p-6">
                <p class="font-semibold">{{ copy().comingSoon?.title ?? 'This breakdown hasn’t been written yet' }}</p>
                @if (copy().comingSoon?.body; as body) {
                  <p class="mt-2 text-muted">{{ body }}</p>
                }
              </div>
            }
          </div>

          @if (view.track.notebook) {
            <app-notes-box
              [track]="view.track.id"
              kind="problem"
              [slug]="view.problem.slug"
              [title]="view.problem.title"
              topic="problems"
              [placeholder]="notePlaceholder()"
              [notebookHref]="view.track.basePath + '/notebook'"
            />
          }

          <footer class="mt-10">
            <app-prev-next [previous]="neighbour(-1)" [next]="neighbour(1)" />
          </footer>
        </app-article-layout>
      }
    }
  `,
})
export class ProblemPageComponent {
  private readonly store = inject(ProgressStore);

  /** Resolved by the route (problemResolver). */
  readonly page = input.required<PageResult<ProblemData>>();

  protected readonly data = computed(() => {
    const page = this.page();
    return page.status === 'ok' ? page.value : null;
  });
  protected readonly info = computed(() => TOPICS.find((topic) => topic.id === this.data()!.track.id)!);
  protected readonly copy = computed(() => practiceCopy(this.data()!.track));
  protected readonly statuses = computed(() => this.data()!.track.problemStatuses ?? DEFAULT_PROBLEM_STATUSES);
  protected readonly notePlaceholder = computed(() => problemNotePlaceholder(this.data()!.track));

  /** The page the body's widgets and notebook tools record against. */
  protected readonly bodyPage = computed((): BodyPage => {
    const { track, problem } = this.data()!;
    return {
      track: track.id,
      kind: 'problem',
      slug: problem.slug,
      notebook: track.notebook
        ? { title: problem.title, topic: 'problems', href: problemPath(track.basePath, problem.slug) }
        : undefined,
    };
  });
  protected readonly breadcrumb = computed(() => {
    const { track, problem } = this.data()!;
    return [
      { title: this.info().shortTitle, href: track.basePath },
      { title: this.copy().groupTitle, href: `${track.basePath}/problems` },
      { title: LEVEL_NAME[problem.difficulty] },
    ];
  });
  protected readonly concepts = computed(() => {
    const { track, problem } = this.data()!;
    return problem.concepts
      .map((slug) => findLesson(track, slug)?.lesson)
      .filter((lesson): lesson is LessonMeta => Boolean(lesson));
  });
  private readonly ordered = computed(() => problemsInOrder(this.data()!.track));

  protected neighbour(offset: number) {
    const { track, problem } = this.data()!;
    const position = this.ordered().findIndex((candidate) => candidate.slug === problem.slug);
    const other = this.ordered()[position + offset];
    return other && { href: problemPath(track.basePath, other.slug), title: other.title };
  }

  protected lessonLink(slug: string) {
    return lessonPath(this.data()!.track.basePath, slug);
  }

  protected lessonState(slug: string) {
    return lessonState(this.store.progress(), this.data()!.track.id, slug);
  }
}
