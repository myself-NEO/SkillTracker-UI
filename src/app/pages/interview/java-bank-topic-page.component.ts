import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { BANK_TOPICS } from '@lib/interview/java-bank';
import type { JavaBankData, PageResult } from '../../core/content.resolvers';
import { LoadErrorComponent } from '../../ui/load-error.component';
import { SectionHeroComponent } from '../../ui/section-hero.component';
import { NotFoundComponent } from '../not-found/not-found-page.component';
import { TopicTabsComponent } from '../topic/topic-tabs.component';
import { BankProgressComponent, JavaQuestionComponent } from './java-question.component';

/**
 * /java/interview/:bankTopic: one topic of the Java question bank (or its tricky questions), each
 * question a card that opens to practise it. A #q-… link (from search or the notebook) opens its
 * question. Ported from TheSWEguide's [topic]/interview/[slug]/page.tsx.
 */
@Component({
  selector: 'app-java-bank-topic-page',
  imports: [RouterLink, TopicTabsComponent, SectionHeroComponent, BankProgressComponent, JavaQuestionComponent, NotFoundComponent, LoadErrorComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @switch (page().status) {
      @case ('missing') {
        <app-not-found />
      }
      @case ('error') {
        <main id="main-content" data-track="java">
          <app-topic-tabs topic="java" active="interview" />
          <app-load-error />
        </main>
      }
      @default {
        @let view = data()!;
        <main id="main-content" data-track="java">
          <app-topic-tabs topic="java" active="interview" />
          <app-section-hero topic="java" section="Interview prep" eyebrow="Java interview questions" [title]="view.topic.title" [hasAside]="true">
            <p>{{ view.topic.description }}</p>
            <div aside class="rounded-2xl border border-border bg-surface p-5">
              <app-bank-progress [ids]="ids()" />
            </div>
          </app-section-hero>
          <div class="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6 lg:py-12">
            <nav aria-label="Interview topics" class="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
              <ul class="flex gap-2 pb-1 sm:flex-wrap">
                @for (choice of topics; track choice.id) {
                  <li class="shrink-0">
                    <a
                      [routerLink]="'/java/interview/' + choice.id"
                      [attr.aria-current]="choice.id === view.topic.id ? 'page' : null"
                      class="inline-flex rounded-full border px-3 py-1.5 text-sm"
                      [class]="
                        choice.id === view.topic.id
                          ? 'border-accent/50 bg-accent-soft font-semibold text-fg'
                          : 'border-border bg-surface text-fg-soft hover:border-border-strong hover:text-fg'
                      "
                      >{{ choice.title }}</a
                    >
                  </li>
                }
              </ul>
            </nav>
            <p class="mt-6 text-sm text-muted">
              Open a question, answer it out loud or in writing, then reveal the model answer and rate yourself.
            </p>
            <ol class="mt-4 space-y-3">
              @for (question of view.questions; track question.id) {
                <li
                  appJavaQuestion
                  [question]="question"
                  [showTopic]="view.topic.id === 'tricky'"
                  [open]="'q-' + question.id === fragment()"
                ></li>
              }
            </ol>
          </div>
        </main>
      }
    }
  `,
})
export class JavaBankTopicPageComponent {
  /** From the route (javaBankResolver). */
  readonly page = input.required<PageResult<JavaBankData>>();

  protected readonly topics = BANK_TOPICS;
  protected readonly fragment = toSignal(inject(ActivatedRoute).fragment);
  protected readonly data = computed(() => {
    const page = this.page();
    return page.status === 'ok' ? page.value : null;
  });
  protected readonly ids = computed(() => (this.data()?.questions ?? []).map((question) => question.id));
}
