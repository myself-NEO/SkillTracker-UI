import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import type { ObserverState } from '@lib/viz/scenes/observer/logic';
import { FlipDirective } from '../motion';

// The subject on the left, its subscribers on the right (above them in a narrow space). The event
// travels to each subscriber as it is notified; subscribers slide in and out as they subscribe and
// unsubscribe.

@Component({
  selector: 'app-observer-view',
  imports: [FlipDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="grid items-center gap-2 @lg:grid-cols-[minmax(0,11rem)_2.5rem_minmax(0,1fr)] @lg:gap-3">
      <div class="rounded-xl border-2 border-accent/60 bg-surface p-3 shadow-sm">
        <p class="font-mono text-sm font-semibold text-fg">{{ state().subject }}</p>
        <p class="mt-0.5 text-[11px] text-muted">subscribe · publish</p>
        <div class="mt-2 min-h-7">
          @for (event of state().event ? [state().event] : []; track event) {
            <span
              animate.enter="viz-pop-in"
              class="inline-block rounded-md border border-warning/50 bg-warning-soft px-2 py-1 font-mono text-[11px] font-semibold text-warning"
              >{{ event }}</span
            >
          }
        </div>
      </div>
      <span class="mx-auto h-4 w-px bg-border-strong @lg:mx-0 @lg:h-px @lg:w-auto" aria-hidden="true"></span>
      <ul class="space-y-2" aria-label="Subscribers">
        @for (subscriber of state().subscribers; track subscriber.name) {
          @let notified = state().notified.includes(subscriber.name);
          @let leaving = state().leaving === subscriber.name;
          <li
            [appFlip]="'subscriber-' + subscriber.name"
            animate.enter="viz-slide-in"
            animate.leave="viz-slide-out"
            class="flex items-center justify-between gap-2 rounded-lg border px-3 py-2 transition-[background-color,border-color,opacity] duration-300"
            [class]="notified ? 'border-success/60 bg-success-soft' : 'border-border bg-bg'"
            [class.opacity-35]="leaving"
          >
            <span class="font-mono text-[13px] font-semibold text-fg">
              {{ subscriber.name }}
              @if (subscriber.joined) {
                <span class="ml-2 font-sans text-[10px] font-semibold text-accent uppercase">new</span>
              }
              @if (leaving) {
                <span class="ml-2 font-sans text-[10px] font-semibold text-danger uppercase">leaving</span>
              }
            </span>
            <span class="min-w-[5.5rem] text-right font-mono text-[11px] text-success">{{ notified ? 'onEvent ✓' : '' }}</span>
          </li>
        }
      </ul>
    </div>
  `,
})
export class ObserverViewComponent {
  readonly state = input.required<ObserverState>();
}
