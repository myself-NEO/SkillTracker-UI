import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import type { JavaQuestionIndex, TrackFile } from '@lib/content/catalog';
import { formatClock, MOCK_KITS, type MockTopic } from '@lib/interview/mock';
import { elapsedMs, type InterviewAttempt } from '@lib/progress/interviews';
import { InterviewsStore } from '../../core/interviews.store';
import { ProgressBarComponent } from '../../ui/stat-parts';
import { TopicGlyphComponent } from '../../ui/topic-glyph.component';
import { BankProgressComponent } from '../interview/java-question.component';

/** How many of a topic's problems were done as mock interviews, the attempts and the best score. */
@Component({
  selector: 'app-mock-progress',
  imports: [ProgressBarComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <div class="flex items-baseline justify-between gap-3 text-sm">
      <span class="text-muted">
        <span class="font-semibold text-fg tabular-nums">{{ figures().done }}</span> of {{ slugs().length }} problems interviewed
      </span>
      <span class="text-xs text-muted tabular-nums">{{ percent() }}%</span>
    </div>
    <app-progress-bar class="mt-2" [value]="figures().done" [max]="slugs().length" label="Problems interviewed" />
    <p class="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
      <span><span class="font-semibold text-fg tabular-nums">{{ figures().attempts }}</span> {{ figures().attempts === 1 ? 'attempt' : 'attempts' }}</span>
      @if (figures().attempts > 0) {
        <span>best <span class="font-semibold text-fg tabular-nums">{{ figures().best }}%</span></span>
      }
      @if (figures().inProgress > 0) {
        <span><span class="font-semibold text-warning tabular-nums">{{ figures().inProgress }}</span> in progress</span>
      }
    </p>
  `,
})
export class MockProgressComponent {
  private readonly store = inject(InterviewsStore);

  readonly topic = input.required<MockTopic>();
  /** The problems that can be done as interviews (their breakdown is written). */
  readonly slugs = input.required<readonly string[]>();

  protected readonly figures = computed(() => {
    const { sessions, history } = this.store.state();
    const attempts: InterviewAttempt[][] = this.slugs().map((slug) => history[`${this.topic()}:${slug}`] ?? []);
    return {
      done: attempts.filter((list) => list.length > 0).length,
      attempts: attempts.reduce((sum, list) => sum + list.length, 0),
      best: Math.max(0, ...attempts.flat().map((attempt) => attempt.score)),
      inProgress: this.slugs().filter((slug) => sessions[`${this.topic()}:${slug}`]).length,
    };
  });
  protected readonly percent = computed(() =>
    this.slugs().length ? Math.round((this.figures().done / this.slugs().length) * 100) : 0,
  );
}

interface PracticeCard {
  topic: 'java' | MockTopic;
  eyebrow: string;
  title: string;
  description: string;
  href: string;
  action: string;
}

/**
 * The practice on /mock-interview: Java's interview question bank and LLD's and HLD's timed mock
 * interviews, with how far the learner has got in each, and the interviews left unfinished.
 */
@Component({
  selector: 'app-practice-overview',
  imports: [RouterLink, TopicGlyphComponent, BankProgressComponent, MockProgressComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <section aria-labelledby="practise-title" class="mx-auto w-full max-w-[90rem] px-4 pt-12 sm:px-6 lg:pt-16">
      <div class="max-w-2xl">
        <h2 id="practise-title" class="font-display text-2xl font-semibold tracking-tight">On your own</h2>
        <p class="mt-2 text-muted">
          Answer interview questions and run timed design interviews at your own pace. Your answers, timings and ratings
          are saved to your account.
        </p>
      </div>
      <ul class="mt-6 grid gap-5 lg:grid-cols-3">
        @for (card of cards(); track card.topic) {
          <li [attr.data-track]="card.topic">
            <article
              class="group relative flex h-full flex-col rounded-2xl border border-border bg-surface p-6 transition-colors hover:border-accent/60"
            >
              <div class="flex items-center gap-3.5">
                <span class="grid size-11 shrink-0 place-items-center rounded-xl bg-accent-soft text-accent">
                  <svg [appTopicGlyph]="card.topic" class="size-6"></svg>
                </span>
                <div>
                  <p class="font-mono text-xs font-semibold tracking-[0.16em] text-accent uppercase">{{ card.eyebrow }}</p>
                  <h3 class="font-display text-xl font-semibold tracking-tight">
                    <a [routerLink]="card.href" class="after:absolute after:inset-0 after:rounded-2xl">{{ card.title }}</a>
                  </h3>
                </div>
              </div>
              <p class="mt-4 flex-1 text-fg-soft">{{ card.description }}</p>
              @switch (card.topic) {
                @case ('java') {
                  @if (questionIds().length > 0) {
                    <app-bank-progress class="mt-6 border-t border-border pt-5" [ids]="questionIds()" />
                  }
                }
                @default {
                  @if (written()[card.topic]; as slugs) {
                    <app-mock-progress class="mt-6 border-t border-border pt-5" [topic]="$any(card.topic)" [slugs]="slugs" />
                  }
                }
              }
              <span class="mt-5 text-sm font-semibold text-accent">
                {{ card.action }}
                <span aria-hidden="true" class="ml-1 inline-block transition-transform group-hover:translate-x-0.5">→</span>
              </span>
            </article>
          </li>
        }
      </ul>

      @if (unfinished().length > 0) {
        <div class="mt-8">
          <h3 class="text-sm font-semibold text-fg">Pick up where you left off</h3>
          <ul class="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            @for (item of unfinished(); track item.key) {
              <li [attr.data-track]="item.topic">
                <a
                  [routerLink]="item.href"
                  class="flex items-center justify-between gap-3 rounded-xl border border-border bg-surface px-4 py-3 text-sm transition-colors hover:border-accent/60"
                >
                  <span class="min-w-0">
                    <span class="block truncate font-semibold text-fg">{{ item.title }}</span>
                    <span class="block text-xs text-muted">{{ item.detail }}</span>
                  </span>
                  <span class="shrink-0 font-semibold text-accent">Resume <span aria-hidden="true">→</span></span>
                </a>
              </li>
            }
          </ul>
        </div>
      }
    </section>
  `,
})
export class PracticeOverviewComponent {
  private readonly interviews = inject(InterviewsStore);

  /** The Java question bank's titles by id (empty when it couldn't be read). */
  readonly questions = input.required<JavaQuestionIndex>();
  readonly lld = input<TrackFile | null>(null);
  readonly hld = input<TrackFile | null>(null);

  protected readonly questionIds = computed(() => Object.keys(this.questions()));

  /** The problems each topic has interviews for. */
  protected readonly written = computed((): Partial<Record<MockTopic, string[]>> => {
    const lld = this.lld();
    const hld = this.hld();
    return { ...(lld && { lld: lld.writtenProblems }), ...(hld && { hld: hld.writtenProblems }) };
  });

  protected readonly cards = computed((): PracticeCard[] => {
    const questions = Object.values(this.questions());
    const topics = new Set(questions.map((question) => question.topic)).size;
    return [
      {
        topic: 'java',
        eyebrow: 'Java',
        title: 'Interview questions',
        description:
          (questions.length > 0 ? `${questions.length} questions in ${topics} topics. ` : '') +
          'Answer each one yourself, open hints one at a time, then compare with the model answer and rate yourself.',
        href: '/java/interview',
        action: 'Open the question bank',
      },
      {
        topic: 'lld',
        eyebrow: 'LLD',
        title: 'Low-level design interviews',
        description:
          'Timed interviews on real problems: clarify the rules, model the classes, code the core flow in Java, then handle concurrency and follow-ups.',
        href: '/lld/interview',
        action: 'See the LLD interviews',
      },
      {
        topic: 'hld',
        eyebrow: 'HLD',
        title: 'System design interviews',
        description:
          'Timed interviews on real systems: clarify the scale, estimate, design the APIs and the architecture, then go deep and weigh the trade-offs.',
        href: '/hld/interview',
        action: 'See the HLD interviews',
      },
    ];
  });

  /** Mock interviews started and not finished, the latest first. */
  protected readonly unfinished = computed(() => {
    const now = Date.now();
    const tracks = { lld: this.lld(), hld: this.hld() };
    return Object.entries(this.interviews.state().sessions)
      .flatMap(([key, session]) => {
        const [topic, slug] = key.split(':') as [string, string];
        if (topic !== 'lld' && topic !== 'hld') return [];
        const problem = tracks[topic]?.problems.find((candidate) => candidate.slug === slug);
        if (!problem) return [];
        const phase = MOCK_KITS[topic].phases.find((candidate) => candidate.id === session.phase)?.short;
        return [
          {
            key,
            topic,
            title: problem.title,
            detail: [topic.toUpperCase(), phase, `${formatClock(elapsedMs(session, now))} of ${session.minutes} min`]
              .filter(Boolean)
              .join(' · '),
            href: `/${topic}/interview/${slug}`,
            updatedAt: session.updatedAt,
          },
        ];
      })
      .sort((a, b) => b.updatedAt - a.updatedAt);
  });
}
