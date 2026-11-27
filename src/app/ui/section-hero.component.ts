import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { TOPICS, type TopicId } from '@lib/topics';
import { BreadcrumbComponent } from '../pages/article/article-parts';

/**
 * The header of a topic's section page (estimator; later the notebook and progress pages), ported
 * from TheSWEguide's SectionHero. The introduction is the projected content; `[aside]` content
 * sits beside the title on wide screens, under it on narrow ones.
 */
@Component({
  selector: 'app-section-hero',
  imports: [BreadcrumbComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <section class="relative overflow-hidden border-b border-border">
      <div class="dot-grid pointer-events-none absolute inset-0" aria-hidden="true"></div>
      <div class="relative mx-auto w-full max-w-[90rem] px-4 py-10 sm:px-6 lg:py-12">
        <app-breadcrumb [items]="breadcrumb()" />
        <div class="mt-6 grid items-end gap-8" [class]="hasAside() ? 'lg:grid-cols-[minmax(0,1fr)_20rem]' : ''">
          <div>
            <p class="text-sm font-semibold text-accent">{{ eyebrow() }}</p>
            <h1 class="mt-2 font-display text-4xl leading-tight font-bold tracking-tight sm:text-5xl">{{ title() }}</h1>
            <div class="mt-4 max-w-3xl text-lg leading-8 text-muted"><ng-content /></div>
          </div>
          <ng-content select="[aside]" />
        </div>
      </div>
    </section>
  `,
})
export class SectionHeroComponent {
  readonly topic = input.required<TopicId>();
  /** The page's name in the breadcrumb, e.g. "Notebook". */
  readonly section = input.required<string>();
  readonly eyebrow = input.required<string>();
  readonly title = input.required<string>();
  /** Whether an `[aside]` is projected (it takes a column on wide screens). */
  readonly hasAside = input(false);

  protected readonly breadcrumb = computed(() => {
    const info = TOPICS.find((topic) => topic.id === this.topic());
    return [
      { title: 'All topics', href: '/learn' },
      { title: info?.shortTitle ?? this.topic(), href: `/${this.topic()}` },
      { title: this.section() },
    ];
  });
}
