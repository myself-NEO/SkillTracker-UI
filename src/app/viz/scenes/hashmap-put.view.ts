import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import type { HashmapState } from '@lib/viz/scenes/hashmap-put/logic';
import { FlipDirective } from '../motion';

// The table as a column of buckets, each with its chain of nodes. Nodes keep their identity, so a
// resize shows them moving to their new buckets.

const HALF_CLASSES = {
  lo: 'border-info/50 bg-info-soft text-info',
  hi: 'border-insight/50 bg-insight-soft text-insight',
} as const;

@Component({
  selector: 'app-hashmap-put-view',
  imports: [FlipDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="grid gap-5 md:grid-cols-[minmax(0,15rem)_minmax(0,1fr)]">
      <div class="space-y-3">
        <div class="rounded-lg border border-border bg-bg p-3 font-mono text-[12.5px] leading-6">
          @if (state().current; as current) {
            <p class="font-sans text-xs font-semibold text-muted">put({{ current.label }}, …)</p>
            <p class="text-fg">hashCode() <span class="text-muted">=</span> {{ current.hashCode }}</p>
            <p [class]="current.spread === undefined ? 'text-faint' : 'text-fg'">
              h ^ (h &gt;&gt;&gt; 16) <span class="text-muted">=</span> {{ current.spread ?? '…' }}
            </p>
            <p [class]="current.index === undefined ? 'text-faint' : 'font-semibold text-accent'">
              (n − 1) &amp; hash <span class="text-muted">=</span> {{ current.index ?? '…' }}
            </p>
          } @else {
            <p class="font-sans text-sm text-muted">No key being put.</p>
          }
        </div>
        <dl class="grid grid-cols-3 gap-2 text-center text-xs">
          @for (figure of figures(); track figure.label) {
            <div class="rounded-lg border border-border bg-bg px-2 py-1.5">
              <dt class="text-muted">{{ figure.label }}</dt>
              <dd class="font-mono text-sm font-semibold text-fg tabular-nums">{{ figure.value }}</dd>
            </div>
          }
        </dl>
      </div>
      <ol class="space-y-1.5" aria-label="Buckets">
        @for (chain of state().buckets; track $index; let index = $index) {
          <li
            class="flex min-h-9 items-center gap-2 rounded-lg border px-2 py-1 transition-colors"
            [class]="state().bucket === index ? 'border-accent bg-accent-soft' : 'border-border bg-bg'"
          >
            <span class="w-6 shrink-0 text-right font-mono text-xs text-muted tabular-nums">{{ index }}</span>
            <span class="flex min-w-0 flex-wrap items-center gap-1">
              @if (chain.length === 0) {
                <span class="text-xs text-faint">empty</span>
              }
              @for (node of chain; track node.id; let first = $first) {
                <span [appFlip]="node.id" animate.enter="viz-pop-in" class="flex items-center gap-1">
                  @if (!first) {
                    <span class="text-xs text-faint" aria-hidden="true">→</span>
                  }
                  <span
                    class="rounded-md border px-2 py-0.5 font-mono text-xs font-semibold"
                    [class]="node.half ? halfClasses[node.half] : 'border-border-strong bg-surface text-fg'"
                  >
                    {{ node.label }}
                    @if (node.half) {
                      <span class="ml-1 font-sans text-[10px] uppercase">{{ node.half }}</span>
                    }
                  </span>
                </span>
              }
            </span>
          </li>
        }
      </ol>
    </div>
  `,
})
export class HashmapPutViewComponent {
  readonly state = input.required<HashmapState>();
  protected readonly halfClasses = HALF_CLASSES;
  protected readonly figures = computed(() => [
    { label: 'capacity', value: this.state().capacity },
    { label: 'size', value: this.state().size },
    { label: 'threshold', value: this.state().threshold },
  ]);
}
