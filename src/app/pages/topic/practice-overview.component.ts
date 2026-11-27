import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import type { LeetCodeDifficulty } from '@content/dsa/problems';
import { findLesson } from '@content/shared/curriculum';
import type { Track } from '@content/shared/types';
import type { DsaPractice } from '@lib/content/catalog';
import { LEVELS, practiceCopy } from '@lib/content/practice';
import { lessonPath, problemPath } from '@lib/markdown/links';
import { ProgressStore } from '../../core/progress.store';
import { LevelBadgeComponent } from '../../ui/level-badge.component';
import { problemState, StatusIconComponent } from '../../ui/status-icon.component';

// The practice part of a topic page: Java, LLD and HLD problems by level, and DSA's LeetCode list
// by topic (ported from TheSWEguide's PracticeOverview).

@Component({
  selector: 'app-problems-by-level',
  imports: [RouterLink, LevelBadgeComponent, StatusIconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'grid items-start gap-4 lg:grid-cols-3' },
  template: `
    @for (group of groups(); track group.level) {
      <section [attr.aria-label]="group.level + ' ' + copy().noun" class="rounded-xl border border-border bg-surface">
        <header class="border-b border-border px-4 py-3.5">
          <div class="flex items-center justify-between gap-3">
            <app-level-badge [level]="group.level" />
            <span class="text-xs text-muted tabular-nums">{{ group.problems.length }} {{ copy().noun }}</span>
          </div>
          <p class="mt-2.5 text-sm leading-6 text-muted">{{ copy().levelBlurbs[group.level] }}</p>
        </header>
        <ul class="p-1.5">
          @for (problem of group.problems; track problem.slug) {
            <li>
              <a
                [routerLink]="problemLink(problem.slug)"
                class="group flex items-start gap-3 rounded-lg px-2.5 py-2 transition-colors hover:bg-surface-2"
              >
                @let status = problemStatus(problem.slug);
                <app-status-icon [state]="status.state" [label]="status.label" iconClass="mt-0.5 size-4" />
                <span class="min-w-0 flex-1 text-sm leading-5 text-fg-soft group-hover:text-fg">{{ problem.title }}</span>
                <span class="shrink-0 text-xs leading-5 text-faint tabular-nums">{{ problem.minutes }} min</span>
              </a>
            </li>
          }
        </ul>
      </section>
    }
  `,
})
export class ProblemsByLevelComponent {
  private readonly store = inject(ProgressStore);

  readonly track = input.required<Track>();

  protected readonly copy = computed(() => practiceCopy(this.track()));
  protected readonly groups = computed(() =>
    LEVELS.map((level) => ({ level, problems: this.track().problems.filter((problem) => problem.difficulty === level) })).filter(
      (group) => group.problems.length > 0,
    ),
  );

  protected problemLink(slug: string) {
    return problemPath(this.track().basePath, slug);
  }

  protected problemStatus(slug: string) {
    return problemState(this.store.progress(), this.track().id, slug);
  }
}

const DIFFICULTIES: readonly LeetCodeDifficulty[] = ['Easy', 'Medium', 'Hard'];
const DIFFICULTY_COLOR: Record<LeetCodeDifficulty, string> = { Easy: 'bg-success', Medium: 'bg-warning', Hard: 'bg-danger' };

@Component({
  selector: 'app-dsa-practice-topics',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <ul class="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      @for (topic of topics(); track topic.id) {
        <li class="flex flex-col rounded-xl border border-border bg-surface p-4">
          <h3 class="font-semibold">
            <a [routerLink]="track().basePath + '/problems/' + topic.id" class="hover:text-accent">{{ topic.title }}</a>
          </h3>
          <p class="mt-0.5 text-sm text-muted">{{ topic.total }} problems</p>
          <div class="mt-3 flex h-1.5 gap-0.5 overflow-hidden rounded-full" aria-hidden="true">
            @for (part of topic.counts; track part.difficulty) {
              @if (part.count) {
                <span [class]="part.color" [style.flex-grow]="part.count"></span>
              }
            }
          </div>
          <p class="mt-2 flex gap-3 text-xs text-muted">
            @for (part of topic.counts; track part.difficulty) {
              <span><span class="font-semibold text-fg tabular-nums">{{ part.count }}</span> {{ part.label }}</span>
            }
          </p>
          @if (topic.lesson; as lesson) {
            <a [routerLink]="lesson.link" class="mt-auto pt-4 text-sm font-medium text-accent hover:underline">
              Learn first: {{ lesson.title }}
            </a>
          }
        </li>
      }
    </ul>
  `,
})
export class DsaPracticeTopicsComponent {
  readonly track = input.required<Track>();
  readonly practice = input.required<DsaPractice>();

  protected readonly topics = computed(() => {
    const track = this.track();
    const { topics, problems } = this.practice();
    return topics.map((topic) => {
      const inTopic = problems.filter((problem) => problem.topic === topic.id);
      const lesson = findLesson(track, topic.guide)?.lesson;
      return {
        id: topic.id,
        title: topic.title,
        total: inTopic.length,
        counts: DIFFICULTIES.map((difficulty) => ({
          difficulty,
          label: difficulty.toLowerCase(),
          color: DIFFICULTY_COLOR[difficulty],
          count: inTopic.filter((problem) => problem.difficulty === difficulty).length,
        })),
        lesson: lesson && { title: lesson.title, link: lessonPath(track.basePath, lesson.slug) },
      };
    });
  });
}
