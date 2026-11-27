import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { HOPS, type JourneyState, type TimeKind } from '@lib/viz/scenes/request-journey/logic';

// The hops of one request in a grid, the ones in play highlighted, and a bar of where the
// milliseconds went, coloured by kind so the network's share stands out.

const KINDS: Record<TimeKind, { label: string; color: string }> = {
  dns: { label: 'DNS lookup', color: 'bg-warning' },
  network: { label: 'Network round trips', color: 'bg-info' },
  server: { label: 'Server work', color: 'bg-success' },
};

@Component({
  selector: 'app-request-journey-view',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-4">
      <ol class="grid grid-cols-2 gap-2 @md:grid-cols-3" aria-label="Hops">
        @for (hop of hops; track hop) {
          @let active = state().active.includes(hop);
          <li
            class="rounded-lg border px-3 py-2 text-sm font-semibold transition-[background-color,border-color,color,transform] duration-300"
            [class]="
              active
                ? 'scale-[1.03] border-accent bg-accent-soft text-fg'
                : state().visited.includes(hop)
                  ? 'border-border bg-surface text-fg-soft'
                  : 'border-dashed border-border bg-bg text-muted'
            "
          >
            {{ hop }}
            @if (active) {
              <span class="mt-0.5 block text-[10px] font-semibold tracking-wide text-accent uppercase">
                {{ state().returning ? 'response' : 'now' }}
              </span>
            }
          </li>
        }
      </ol>
      <div>
        <p class="flex items-baseline justify-between text-xs text-muted">
          <span>Where the time went</span>
          <span class="font-mono font-semibold text-fg tabular-nums">~{{ total() }} ms</span>
        </p>
        <div class="mt-1.5 flex h-3 gap-px overflow-hidden rounded-full bg-surface-3" aria-hidden="true">
          @for (part of state().spent; track part.label) {
            <span
              animate.enter="viz-grow-x"
              class="h-full origin-left transition-[width] duration-500"
              [class]="kinds[part.kind].color"
              [style.width.%]="(part.ms / max(total(), 1)) * 100"
            ></span>
          }
        </div>
        <ul class="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted">
          @for (part of state().spent; track part.label) {
            <li class="flex items-center gap-1">
              <span class="size-2 rounded-full" [class]="kinds[part.kind].color" aria-hidden="true"></span>
              {{ part.label }} {{ round(part.ms) }} ms
            </li>
          }
        </ul>
        <p class="mt-2 flex flex-wrap gap-x-2 text-[11px] text-muted">
          @for (kind of byKind(); track kind.label) {
            <span class="whitespace-nowrap">
              {{ kind.label }} <span class="font-semibold text-fg-soft">{{ kind.ms }} ms</span>
            </span>
          }
        </p>
      </div>
    </div>
  `,
})
export class RequestJourneyViewComponent {
  readonly state = input.required<JourneyState>();

  protected readonly hops = HOPS;
  protected readonly kinds = KINDS;
  protected readonly round = Math.round;
  protected readonly max = Math.max;
  protected readonly total = computed(() => Math.round(this.state().spent.reduce((sum, part) => sum + part.ms, 0)));
  protected readonly byKind = computed(() =>
    (Object.keys(KINDS) as TimeKind[]).flatMap((kind) => {
      const parts = this.state().spent.filter((part) => part.kind === kind);
      return parts.length ? [{ label: KINDS[kind].label, ms: Math.round(parts.reduce((sum, part) => sum + part.ms, 0)) }] : [];
    }),
  );
}
