import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import type { LbServer, LoadBalancerState } from '@lib/viz/scenes/load-balancer/logic';
import { FlipDirective } from '../motion';

// Clients, the balancer and the server pool, left to right (top to bottom in a narrow space). The
// routed request is drawn in its server's box with the same id it had at the balancer, so it
// glides across.

const CHIP =
  'inline-grid h-6 min-w-9 place-items-center rounded-full border border-accent/50 bg-accent-soft px-2 font-mono text-[11px] font-semibold text-accent';

@Component({
  selector: 'app-load-balancer-view',
  imports: [FlipDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="grid items-center gap-2 @lg:grid-cols-[6rem_1fr_minmax(0,12rem)] @lg:gap-4">
      <div class="w-full max-w-40 justify-self-center rounded-lg border border-border bg-bg p-3 text-center @lg:max-w-none">
        <p class="text-xs font-semibold text-muted">Clients</p>
        <div class="mt-2 flex justify-center">
          @for (id of [state().next]; track id) {
            <span [appFlip]="'request-' + id" animate.enter="viz-pop-in" [class]="chip">r{{ id }}</span>
          }
        </div>
      </div>
      <div class="relative flex flex-col items-center @lg:flex-row">
        <span class="h-4 w-px bg-border-strong @lg:h-px @lg:w-auto @lg:flex-1" aria-hidden="true"></span>
        <div class="rounded-xl border-2 border-accent/60 bg-surface px-4 py-3 text-center shadow-sm">
          <p class="text-sm font-semibold text-fg">Load balancer</p>
          <p class="text-[11px] text-muted">round robin</p>
        </div>
        <span class="h-4 w-px bg-border-strong @lg:h-px @lg:w-auto @lg:flex-1" aria-hidden="true"></span>
      </div>
      <ul class="space-y-2" aria-label="Server pool">
        @for (server of state().servers; track server.name; let index = $index) {
          <li
            class="flex min-h-12 items-center justify-between gap-2 rounded-lg border px-3 py-2 transition-colors"
            [class]="serverClass(server, index)"
          >
            <span>
              <span class="block text-sm font-semibold text-fg">{{ server.name }}</span>
              <span class="text-[11px]" [class]="server.healthy ? 'text-muted' : 'font-semibold text-danger'">
                {{ server.healthy ? server.served + ' served' : 'failing health checks' }}
              </span>
            </span>
            @if (state().routed; as routed) {
              @if (routed.to === index) {
                <span [appFlip]="'request-' + routed.id" [class]="chip">r{{ routed.id }}</span>
              }
            }
          </li>
        }
      </ul>
    </div>
  `,
})
export class LoadBalancerViewComponent {
  readonly state = input.required<LoadBalancerState>();
  protected readonly chip = CHIP;

  protected serverClass(server: LbServer, index: number) {
    return !server.healthy
      ? 'border-danger/50 bg-danger-soft'
      : this.state().routed?.to === index
        ? 'border-success/60 bg-success-soft'
        : 'border-border bg-bg';
  }
}
