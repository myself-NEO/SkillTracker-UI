import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import type { CurriculumModule, Stage, TrackId } from '@content/shared/types';
import { formatDuration, pad2 } from '@lib/format';
import { lessonPath } from '@lib/markdown/links';
import { ProgressStore } from '../../core/progress.store';
import { LessonsProgressComponent } from '../../ui/lessons-progress.component';
import { lessonState, StatusIconComponent } from '../../ui/status-icon.component';

// One stage of a topic's roadmap: its modules, each a card listing its lessons with the learner's
// progress (ported from TheSWEguide's StageSection).

export const stageAnchor = (stage: Pick<Stage, 'id'>) => `stage-${stage.id}`;

const minutesOf = (lessons: readonly { minutes: number }[]) => lessons.reduce((n, lesson) => n + lesson.minutes, 0);

@Component({
  selector: 'app-stage-section',
  imports: [RouterLink, LessonsProgressComponent, StatusIconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <section [id]="anchor()" [attr.aria-labelledby]="anchor() + '-title'">
      <div class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div class="flex items-center gap-4">
          <span
            class="grid size-11 shrink-0 place-items-center rounded-xl border border-border bg-surface font-mono text-sm font-semibold text-accent tabular-nums"
          >
            {{ number() }}
          </span>
          <div>
            <p class="text-xs font-semibold tracking-[0.14em] text-muted uppercase">
              {{ stage().levelLabel }} · {{ duration() }}
            </p>
            <h2 [id]="anchor() + '-title'" class="font-display text-2xl font-semibold tracking-tight">
              {{ stage().title }}
            </h2>
          </div>
        </div>
        <div class="sm:w-64">
          <app-lessons-progress [track]="track()" [slugs]="slugs()" />
        </div>
      </div>
      <p class="mt-4 max-w-3xl text-fg-soft">{{ stage().description }}</p>
      <div class="mt-6 space-y-4">
        @for (module of stage().modules; track module.id) {
          <article class="overflow-hidden rounded-xl border border-border bg-surface">
            <header class="flex items-center justify-between gap-4 border-b border-border px-4 py-3">
              <h3 class="font-semibold text-fg">{{ module.title }}</h3>
              <p class="flex shrink-0 items-center gap-1.5 text-xs text-muted">
                {{ moduleDuration(module) }}
                <span aria-hidden="true">·</span>
                <app-lessons-progress [track]="track()" [slugs]="moduleSlugs(module)" [compact]="true" />
              </p>
            </header>
            <ol class="grid gap-x-2 p-1.5 lg:grid-cols-2">
              @for (lesson of module.lessons; track lesson.slug) {
                <li>
                  <a
                    [routerLink]="lessonLink(lesson.slug)"
                    class="group flex items-start gap-3 rounded-lg px-2.5 py-2 transition-colors hover:bg-surface-2"
                  >
                    <app-status-icon
                      [state]="lessonState(lesson.slug, lesson.comingSoon)"
                      iconClass="mt-0.5 size-4"
                    />
                    <span class="min-w-0 flex-1 text-sm leading-5 text-fg-soft group-hover:text-fg">
                      {{ lesson.title }}
                      @if (!lesson.essential) {
                        <span
                          class="ml-2 inline-block rounded border border-border px-1 align-[1px] text-[10px] leading-4 font-semibold tracking-wide text-muted uppercase"
                          >Deep dive</span
                        >
                      }
                    </span>
                    <span class="shrink-0 text-xs leading-5 text-faint tabular-nums">{{ lesson.minutes }} min</span>
                  </a>
                </li>
              }
            </ol>
          </article>
        }
      </div>
    </section>
  `,
})
export class StageSectionComponent {
  private readonly store = inject(ProgressStore);

  readonly track = input.required<TrackId>();
  readonly basePath = input.required<string>();
  readonly stage = input.required<Stage>();

  protected readonly anchor = computed(() => stageAnchor(this.stage()));
  protected readonly number = computed(() => pad2(this.stage().number));
  protected readonly slugs = computed(() =>
    this.stage().modules.flatMap((module) => module.lessons.map((lesson) => lesson.slug)),
  );
  protected readonly duration = computed(() =>
    formatDuration(minutesOf(this.stage().modules.flatMap((module) => module.lessons))),
  );

  protected moduleDuration(module: CurriculumModule) {
    return formatDuration(minutesOf(module.lessons));
  }

  protected moduleSlugs(module: CurriculumModule) {
    return module.lessons.map((lesson) => lesson.slug);
  }

  protected lessonLink(slug: string) {
    return lessonPath(this.basePath(), slug);
  }

  protected lessonState(slug: string, comingSoon?: boolean) {
    return lessonState(this.store.progress(), this.track(), slug, comingSoon);
  }
}
