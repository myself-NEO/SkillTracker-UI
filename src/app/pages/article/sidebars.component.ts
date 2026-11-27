import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { flattenLessons } from '@content/shared/curriculum';
import type { Stage, Track } from '@content/shared/types';
import { LEVELS, practiceCopy } from '@lib/content/practice';
import { LEVEL_NAME, pad2 } from '@lib/format';
import { lessonPath, problemPath } from '@lib/markdown/links';
import { problemStatus } from '@lib/progress/progress';
import { ProgressStore } from '../../core/progress.store';
import { LessonsProgressComponent } from '../../ui/lessons-progress.component';
import { lessonState, StatusIconComponent } from '../../ui/status-icon.component';
import { TopicGlyphComponent } from '../../ui/topic-glyph.component';
import { ProblemsProgressComponent } from './article-parts';

// The sidebars of the article pages (ported from TheSWEguide's CurriculumSidebar and
// ProblemSidebar): the topic with the learner's progress, then its lessons or problems.

/** The topic the sidebar belongs to, with the learner's progress through it (projected content replaces the lessons bar). */
@Component({
  selector: 'app-sidebar-topic-link',
  imports: [RouterLink, TopicGlyphComponent, LessonsProgressComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'mb-5 block px-2' },
  template: `
    <a [routerLink]="track().basePath" class="group flex items-center gap-3">
      <span class="grid size-9 shrink-0 place-items-center rounded-lg bg-accent-soft text-accent">
        <svg [appTopicGlyph]="track().id" class="size-5"></svg>
      </span>
      <span class="min-w-0">
        <span class="block text-xs text-muted">Topic</span>
        <span class="block leading-5 font-semibold text-fg group-hover:text-accent">{{ title() }}</span>
      </span>
    </a>
    <div class="mt-4">
      @if (problemsNoun(); as noun) {
        <ng-content />
      } @else {
        <app-lessons-progress [track]="track().id" [slugs]="lessonSlugs()" />
      }
    </div>
  `,
})
export class SidebarTopicLinkComponent {
  readonly track = input.required<Track>();
  readonly title = input.required<string>();
  /** Set when the sidebar lists problems: the projected progress bar replaces the lessons one. */
  readonly problemsNoun = input<string>();
  protected readonly lessonSlugs = computed(() => flattenLessons(this.track()).map(({ lesson }) => lesson.slug));
}

const CHEVRON_PATH =
  'M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z';

/** A topic's curriculum: one collapsible group per stage, the stage holding the current lesson open. */
@Component({
  selector: 'app-curriculum-sidebar',
  imports: [RouterLink, SidebarTopicLinkComponent, LessonsProgressComponent, StatusIconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-sidebar-topic-link [track]="track()" [title]="title()" />
    <nav [attr.aria-label]="track().shortTitle + ' lessons'" class="text-sm">
      @for (stage of track().stages; track stage.id) {
        <details class="group/stage border-t border-border" [open]="holdsCurrent(stage)">
          <summary
            class="flex cursor-pointer list-none items-center gap-2.5 rounded-md px-2 py-2.5 hover:bg-surface-2 [&::-webkit-details-marker]:hidden"
          >
            <span class="font-mono text-[11px] text-faint tabular-nums">{{ pad2(stage.number) }}</span>
            <span class="min-w-0 flex-1 leading-5 font-semibold text-fg">{{ stage.title }}</span>
            <app-lessons-progress [track]="track().id" [slugs]="stageSlugs(stage)" [compact]="true" />
            <svg
              class="size-4 shrink-0 text-faint transition-transform group-open/stage:rotate-180"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path [attr.d]="chevron" />
            </svg>
          </summary>
          <div class="pb-3">
            @for (module of stage.modules; track module.id) {
              <div class="mt-1.5">
                <p class="px-2 py-1 text-[11px] font-semibold tracking-[0.1em] text-muted uppercase">{{ module.title }}</p>
                <ul>
                  @for (lesson of module.lessons; track lesson.slug) {
                    <li>
                      <a
                        [routerLink]="lessonLink(lesson.slug)"
                        [attr.aria-current]="lesson.slug === currentSlug() ? 'page' : null"
                        class="flex items-start gap-2.5 rounded-md px-2 py-1.5 leading-5 transition-colors"
                        [class]="
                          lesson.slug === currentSlug()
                            ? 'bg-accent-soft font-medium text-fg'
                            : 'text-fg-soft hover:bg-surface-2 hover:text-fg'
                        "
                      >
                        <app-status-icon
                          [state]="lessonState(lesson.slug, lesson.comingSoon)"
                          iconClass="mt-0.5 size-3.5"
                        />
                        <span class="min-w-0">{{ lesson.title }}</span>
                      </a>
                    </li>
                  }
                </ul>
              </div>
            }
          </div>
        </details>
      }
    </nav>
  `,
})
export class CurriculumSidebarComponent {
  private readonly store = inject(ProgressStore);
  readonly track = input.required<Track>();
  readonly title = input.required<string>();
  readonly currentSlug = input.required<string>();

  protected readonly pad2 = pad2;
  protected readonly chevron = CHEVRON_PATH;

  protected holdsCurrent(stage: Stage) {
    return stage.modules.some((module) => module.lessons.some((lesson) => lesson.slug === this.currentSlug()));
  }

  protected stageSlugs(stage: Stage) {
    return stage.modules.flatMap((module) => module.lessons.map((lesson) => lesson.slug));
  }

  protected lessonLink(slug: string) {
    return lessonPath(this.track().basePath, slug);
  }

  protected lessonState(slug: string, comingSoon?: boolean) {
    return lessonState(this.store.progress(), this.track().id, slug, comingSoon);
  }
}

/** A topic's practice problems in the order the sidebar lists them: by level, then as authored. */
export const problemsInOrder = (track: Track) =>
  LEVELS.flatMap((level) => track.problems.filter((problem) => problem.difficulty === level));

@Component({
  selector: 'app-problem-sidebar',
  imports: [RouterLink, SidebarTopicLinkComponent, ProblemsProgressComponent, StatusIconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-sidebar-topic-link [track]="track()" [title]="title()" [problemsNoun]="copy().noun">
      <app-problems-progress [track]="track().id" [slugs]="problemSlugs()" [noun]="copy().noun" />
    </app-sidebar-topic-link>
    <a
      [routerLink]="track().basePath + '/problems'"
      class="mb-3 flex items-center justify-between rounded-md px-2 py-1.5 text-sm font-medium text-accent hover:bg-surface-2"
    >
      {{ copy().groupTitle }}: search and filter
      <span aria-hidden="true">→</span>
    </a>
    <nav [attr.aria-label]="copy().groupTitle" class="text-sm">
      @for (group of groups(); track group.level) {
        <div class="border-t border-border py-2">
          <p class="px-2 py-1.5 text-[11px] font-semibold tracking-[0.1em] text-muted uppercase">{{ levelName[group.level] }}</p>
          <ul>
            @for (problem of group.problems; track problem.slug) {
              <li>
                <a
                  [routerLink]="problemLink(problem.slug)"
                  [attr.aria-current]="problem.slug === currentSlug() ? 'page' : null"
                  class="flex items-start gap-2.5 rounded-md px-2 py-1.5 leading-5 transition-colors"
                  [class]="
                    problem.slug === currentSlug()
                      ? 'bg-accent-soft font-medium text-fg'
                      : 'text-fg-soft hover:bg-surface-2 hover:text-fg'
                  "
                >
                  @let status = problemState(problem.slug);
                  <app-status-icon [state]="status.state" [label]="status.label" iconClass="mt-0.5 size-3.5" />
                  <span class="min-w-0">{{ problem.title }}</span>
                </a>
              </li>
            }
          </ul>
        </div>
      }
    </nav>
  `,
})
export class ProblemSidebarComponent {
  private readonly store = inject(ProgressStore);
  readonly track = input.required<Track>();
  readonly title = input.required<string>();
  readonly currentSlug = input.required<string>();

  protected readonly levelName = LEVEL_NAME;
  protected readonly copy = computed(() => practiceCopy(this.track()));
  protected readonly problemSlugs = computed(() => this.track().problems.map((problem) => problem.slug));
  protected readonly groups = computed(() =>
    LEVELS.map((level) => ({
      level,
      problems: this.track().problems.filter((problem) => problem.difficulty === level),
    })).filter((group) => group.problems.length > 0),
  );

  protected problemLink(slug: string) {
    return problemPath(this.track().basePath, slug);
  }

  protected problemState(slug: string) {
    const status = problemStatus(this.store.progress(), this.track().id, slug);
    return {
      state: status === 'completed' ? ('done' as const) : status === 'not-started' ? ('todo' as const) : ('started' as const),
      label: status.replace('-', ' '),
    };
  }
}
