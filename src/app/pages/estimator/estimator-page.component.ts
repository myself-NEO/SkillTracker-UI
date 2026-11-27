import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SectionHeroComponent } from '../../ui/section-hero.component';
import { EstimatorComponent } from '../../widgets/estimator.component';
import { TopicTabsComponent } from '../topic/topic-tabs.component';

// Rough, round figures for estimation: orders of magnitude, not benchmarks. The "Numbers to Know"
// lesson explains where each comes from and how it varies.
const LATENCIES: [string, string][] = [
  ['L1 cache reference', '~1 ns'],
  ['Main memory reference', '~100 ns'],
  ['Read 1 MB sequentially from memory', '~50 µs'],
  ['Round trip within a datacenter', '~0.5 ms'],
  ['Random read from an NVMe SSD', '~0.1 ms'],
  ['Read 1 MB sequentially from SSD', '~0.5 ms'],
  ['Redis GET over the network (same zone)', '~0.5–1 ms'],
  ['Indexed primary-key lookup in Postgres', '~1–5 ms'],
  ['Round trip between US coasts', '~70 ms'],
  ['Round trip Europe ↔ US West', '~150 ms'],
];

const POWERS: [string, string][] = [
  ['Seconds per day', '86,400 ≈ 10⁵'],
  ['Seconds per month', '~2.6 × 10⁶'],
  ['1 million requests/day', '≈ 12 per second'],
  ['1 billion requests/day', '≈ 12,000 per second'],
  ['1 KB × 1 billion', '1 TB'],
  ['1 MB × 1 million', '1 TB'],
];

/** /hld/estimator: the back-of-the-envelope calculator, with figures worth knowing. Ported from TheSWEguide. */
@Component({
  selector: 'app-estimator-page',
  imports: [RouterLink, TopicTabsComponent, SectionHeroComponent, EstimatorComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main id="main-content" data-track="hld">
      <app-topic-tabs topic="hld" active="estimator" />
      <app-section-hero topic="hld" section="Estimator" eyebrow="Capacity estimation" title="Back-of-the-envelope estimator">
        <p>
          Change any assumption and every figure updates, with the working shown. Use it to check your mental maths; in
          an interview you will do this out loud with rounded numbers. The defaults are the classic exercise: 100 million
          requests a day, 10:1 reads to writes, 1 KB records kept for five years.
          <a
            routerLink="/hld/estimation-basics"
            class="text-accent underline decoration-accent/40 underline-offset-2 hover:decoration-accent"
            >Learn the method</a
          >.
        </p>
      </app-section-hero>
      <div class="mx-auto w-full max-w-[90rem] px-4 py-10 sm:px-6 lg:py-12">
        <h2 class="sr-only">Calculator</h2>
        <app-estimator title="Your system" />
        <section aria-labelledby="numbers-heading" class="mt-10 grid gap-5 md:grid-cols-2">
          <h2 id="numbers-heading" class="sr-only">Numbers to keep in mind</h2>
          @for (card of cards; track card.title) {
            <div class="rounded-2xl border border-border bg-surface p-5">
              <h3 class="font-display text-lg font-semibold">{{ card.title }}</h3>
              <dl class="mt-3 divide-y divide-border text-sm">
                @for (row of card.rows; track row[0]) {
                  <div class="flex justify-between gap-3 py-1.5">
                    <dt class="text-fg-soft">{{ row[0] }}</dt>
                    <dd class="font-mono whitespace-nowrap text-fg">{{ row[1] }}</dd>
                  </div>
                }
              </dl>
              @if (card.footnote) {
                <p class="mt-3 text-xs text-muted">{{ card.footnote }}</p>
              }
            </div>
          }
        </section>
      </div>
    </main>
  `,
})
export class EstimatorPageComponent {
  protected readonly cards = [
    { title: 'Latency, roughly', rows: LATENCIES, footnote: '' },
    {
      title: 'Conversions worth memorising',
      rows: POWERS,
      footnote:
        'These are orders of magnitude for estimation, not benchmarks; real numbers vary with hardware, payload and configuration.',
    },
  ];
}
