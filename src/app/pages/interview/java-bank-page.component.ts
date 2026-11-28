import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { INTERVIEW_TOPICS } from '@content/java/interview';
import type { JavaQuestionIndex } from '@lib/content/catalog';
import { TRICKY } from '@lib/interview/java-bank';
import { LoadErrorComponent } from '../../ui/load-error.component';
import { SectionHeroComponent } from '../../ui/section-hero.component';
import { TopicTabsComponent } from '../topic/topic-tabs.component';
import { BankProgressComponent } from './java-question.component';

/**
 * /java/interview: the Java interview question bank, an index of its topics and of its tricky
 * questions, with how much of it the learner has practised. Ported from TheSWEguide's
 * [topic]/interview/page.tsx.
 */
@Component({
  selector: 'app-java-bank-page',
  imports: [RouterLink, TopicTabsComponent, SectionHeroComponent, BankProgressComponent, LoadErrorComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main id="main-content" data-track="java">
      <app-topic-tabs topic="java" active="interview" />
      @if (questions(); as index) {
        <app-section-hero topic="java" section="Interview prep" eyebrow="Interview prep" title="Java interview questions" [hasAside]="true">
          <p>
            {{ ids().length }} questions in {{ topicCount }} topics, from core Java to performance. Answer each one yourself
            first, open hints one at a time, then compare with the model answer and rate yourself. Missed questions go on your
            revision list.
          </p>
          <div aside class="rounded-2xl border border-border bg-surface p-5">
            <app-bank-progress [ids]="ids()" />
          </div>
        </app-section-hero>
        <div class="mx-auto w-full max-w-[90rem] px-4 py-10 sm:px-6 lg:py-12">
          <ul class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            @for (card of cards(); track card.id) {
              <li>
                <a
                  [routerLink]="'/java/interview/' + card.id"
                  class="group flex h-full flex-col rounded-xl border border-border bg-surface p-5 transition-colors hover:border-accent/60"
                >
                  <span class="font-display text-lg font-semibold text-fg group-hover:text-accent">{{ card.title }}</span>
                  <span class="mt-1 flex-1 text-sm leading-6 text-muted">{{ card.description }}</span>
                  <span class="mt-4 text-xs text-muted">
                    <span class="font-semibold text-fg tabular-nums">{{ card.count }}</span> questions
                    @if (card.tricky !== null) {
                      · <span class="tabular-nums">{{ card.tricky }}</span> tricky
                    }
                  </span>
                </a>
              </li>
            }
          </ul>
        </div>
      } @else {
        <app-load-error />
      }
    </main>
  `,
})
export class JavaBankPageComponent {
  /** From the route: every question's title, topic and whether it is tricky. */
  readonly questions = input<JavaQuestionIndex | null>(null);

  protected readonly topicCount = INTERVIEW_TOPICS.length;
  protected readonly ids = computed(() => Object.keys(this.questions() ?? {}));
  protected readonly cards = computed(() => {
    const all = Object.values(this.questions() ?? {});
    return [
      ...INTERVIEW_TOPICS.map((topic) => {
        const inTopic = all.filter((question) => question.topic === topic.id);
        return { ...topic, count: inTopic.length, tricky: inTopic.filter((question) => question.tricky).length as number | null };
      }),
      { ...TRICKY, count: all.filter((question) => question.tricky).length, tricky: null },
    ];
  });
}
