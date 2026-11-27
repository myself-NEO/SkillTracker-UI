import { ChangeDetectionStrategy, Component } from '@angular/core';
import { InterviewSchedulerComponent } from './interview-scheduler.component';

/**
 * /mock-interview. For now the scheduler; TheSWEguide's timed LLD and HLD mock interviews and the
 * Java question bank join it in Phase 6 (docs/plan.md).
 */
@Component({
  selector: 'app-mock-interview-page',
  imports: [InterviewSchedulerComponent],
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
            Book mock interviews with a friend, a mentor or a colleague. Afterwards, score each one and note what to
            work on before the next.
          </p>
        </div>
      </section>
      <app-interview-scheduler />
    </main>
  `,
})
export class MockInterviewPageComponent {}
