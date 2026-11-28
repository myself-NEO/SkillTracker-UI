import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import type { MockHubData } from '../../core/content.resolvers';
import { InterviewSchedulerComponent } from './interview-scheduler.component';
import { PracticeOverviewComponent } from './practice-overview.component';

/**
 * /mock-interview, the Mock Interview tab: practice on one's own (Java's interview questions,
 * LLD's and HLD's timed mock interviews), and SkillTracker's scheduler for sessions with a person.
 */
@Component({
  selector: 'app-mock-interview-page',
  imports: [PracticeOverviewComponent, InterviewSchedulerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main id="main-content">
      <section class="relative overflow-hidden border-b border-border">
        <div class="dot-grid pointer-events-none absolute inset-0" aria-hidden="true"></div>
        <div class="relative mx-auto w-full max-w-[90rem] px-4 py-10 sm:px-6 lg:py-14">
          <p class="font-mono text-xs font-semibold tracking-[0.18em] text-muted uppercase">Mock interviews</p>
          <h1 class="mt-4 max-w-3xl font-display text-4xl leading-tight font-bold tracking-tight sm:text-5xl">
            Rehearse the real thing
          </h1>
          <p class="mt-4 max-w-2xl text-lg leading-8 text-muted">
            Practise on your own with Java's interview questions and timed design interviews, or book a session with a
            friend, a mentor or a colleague and score it afterwards.
          </p>
        </div>
      </section>

      <app-practice-overview [questions]="hub().questions" [lld]="hub().lld" [hld]="hub().hld" />

      <section aria-labelledby="schedule-title" class="mx-auto w-full max-w-[90rem] px-4 pt-14 pb-12 sm:px-6 lg:pt-20 lg:pb-16">
        <div class="max-w-2xl">
          <h2 id="schedule-title" class="font-display text-2xl font-semibold tracking-tight">With a person</h2>
          <p class="mt-2 text-muted">
            Book a session with a friend, a mentor or a colleague. Afterwards, score it and note what to work on before the
            next one.
          </p>
        </div>
        <app-interview-scheduler class="mt-8" />
      </section>
    </main>
  `,
})
export class MockInterviewPageComponent {
  /** Resolved by the route (mockHubResolver). */
  readonly hub = input.required<MockHubData>();
}
