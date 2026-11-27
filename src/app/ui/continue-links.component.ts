import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import type { TrackId } from '@content/shared/types';
import { ProgressStore } from '../core/progress.store';

/** Where to pick a topic back up: the lesson and section last read, or else the first lesson. */
@Component({
  selector: 'app-continue-link',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'contents' },
  template: `
    @if (resume(); as resume) {
      <a [routerLink]="basePath() + '/' + resume.slug" [fragment]="resume.heading" [class]="linkClass()">
        {{ titles()[resume.slug] ? 'Continue: ' + titles()[resume.slug] : 'Continue where you left off' }}
        <span aria-hidden="true" class="ml-1.5">→</span>
      </a>
    } @else {
      <a [routerLink]="basePath() + '/' + first().slug" [class]="linkClass()">
        Start with {{ first().title }}
        <span aria-hidden="true" class="ml-1.5">→</span>
      </a>
    }
  `,
})
export class ContinueLinkComponent {
  private readonly store = inject(ProgressStore);

  readonly track = input.required<TrackId>();
  readonly basePath = input.required<string>();
  readonly first = input.required<{ slug: string; title: string }>();
  /** Lesson titles by slug, to name the lesson to continue. */
  readonly titles = input<Record<string, string>>({});
  readonly linkClass = input('');

  protected readonly resume = computed(() => this.store.progress().resume[this.track()]);
}

/** The most recently read lesson in any topic, for the hub. Renders nothing for a new learner. */
@Component({
  selector: 'app-continue-anywhere',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'contents' },
  template: `
    @if (latest(); as latest) {
      <a
        [routerLink]="latest.topic.basePath + '/' + latest.resume.slug"
        [fragment]="latest.resume.heading"
        [attr.data-track]="latest.topic.id"
        [class]="linkClass()"
      >
        Continue in {{ latest.topic.shortTitle }}
        <span aria-hidden="true" class="ml-1.5">→</span>
      </a>
    }
  `,
})
export class ContinueAnywhereComponent {
  private readonly store = inject(ProgressStore);

  readonly topics = input.required<readonly { id: TrackId; shortTitle: string; basePath: string }[]>();
  readonly linkClass = input('');

  protected readonly latest = computed(() => {
    const { resume } = this.store.progress();
    return this.topics()
      .flatMap((topic) => {
        const point = resume[topic.id];
        return point ? [{ topic, resume: point }] : [];
      })
      .sort((a, b) => b.resume.at - a.resume.at)[0];
  });
}
