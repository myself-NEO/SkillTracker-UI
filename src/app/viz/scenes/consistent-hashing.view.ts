import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { hex, RING, type RingState } from '@lib/viz/scenes/consistent-hashing/logic';

// The ring as an SVG circle (position 0x00 at the top, increasing clockwise), each arc in the colour
// of the node that owns it, with a panel listing each node's share of the ring and its keys. Keys
// change colour when they change owner; the ones that just moved get a halo.

const SIZE = 300;
const C = SIZE / 2;
const R = 112;

const COLORS = [
  { stroke: 'stroke-info', fill: 'fill-info', bg: 'bg-info' },
  { stroke: 'stroke-success', fill: 'fill-success', bg: 'bg-success' },
  { stroke: 'stroke-warning', fill: 'fill-warning', bg: 'bg-warning' },
  { stroke: 'stroke-danger', fill: 'fill-danger', bg: 'bg-danger' },
  { stroke: 'stroke-insight', fill: 'fill-insight', bg: 'bg-insight' },
  { stroke: 'stroke-fg-soft', fill: 'fill-fg-soft', bg: 'bg-fg-soft' },
];

const xy = (at: number, r: number) => {
  const angle = (at / RING) * 2 * Math.PI;
  return [C + r * Math.sin(angle), C - r * Math.cos(angle)] as const;
};

/** The arc after `from` up to `to`, clockwise. */
const arcPath = (from: number, to: number, r: number) => {
  const span = (to - from + RING) % RING || RING;
  if (span === RING) return `M ${C} ${C - r} A ${r} ${r} 0 1 1 ${C} ${C + r} A ${r} ${r} 0 1 1 ${C} ${C - r}`;
  const [x1, y1] = xy(from, r);
  const [x2, y2] = xy(to, r);
  return `M ${x1} ${y1} A ${r} ${r} 0 ${span > RING / 2 ? 1 : 0} 1 ${x2} ${y2}`;
};

@Component({
  selector: 'app-consistent-hashing-view',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="grid items-center gap-4 @lg:grid-cols-[minmax(0,19rem)_minmax(0,1fr)]">
      <svg [attr.viewBox]="'0 0 ' + size + ' ' + size" class="mx-auto w-full max-w-[19rem]" aria-hidden="true">
        <!-- The ring, and the arc each point owns. -->
        <circle [attr.cx]="c" [attr.cy]="c" [attr.r]="r" fill="none" class="stroke-border-strong" stroke-width="2" />
        @for (arc of arcs(); track arc.key) {
          <path [attr.d]="arc.d" fill="none" stroke-width="7" class="opacity-80 transition-colors" [class]="arc.stroke" />
        }
        <!-- Where the positions start; node labels give the rest. -->
        <text [attr.x]="c" [attr.y]="c - r + 18" text-anchor="middle" dominant-baseline="middle" class="fill-faint font-mono text-[9px]">
          0x00
        </text>
        <line [attr.x1]="c" [attr.y1]="c - r - 5" [attr.x2]="c" [attr.y2]="c - r + 5" class="stroke-faint" stroke-width="1.5" />

        <!-- A key's walk to the first node clockwise (drawn again for each new walk). -->
        @for (walk of walks(); track walk.key) {
          <path
            [attr.d]="walk.d"
            pathLength="1"
            fill="none"
            stroke-width="2.5"
            stroke-linecap="round"
            class="stroke-accent"
            animate.enter="viz-draw"
          />
        }

        <!-- Keys, inside the ring. -->
        @for (key of keys(); track key.name) {
          <g>
            @if (key.moved) {
              <circle [attr.cx]="key.x" [attr.cy]="key.y" r="8" fill="none" stroke-width="1.5" class="stroke-accent" />
            }
            <rect
              [attr.x]="key.x - 4"
              [attr.y]="key.y - 4"
              width="8"
              height="8"
              rx="1.5"
              [attr.transform]="'rotate(45 ' + key.x + ' ' + key.y + ')'"
              class="transition-colors"
              [class]="key.color ? key.color.fill : 'fill-surface stroke-muted'"
              [attr.stroke-width]="key.color ? 0 : 1.2"
            />
            @if (key.labelled) {
              <text
                [attr.x]="key.lx"
                [attr.y]="key.ly"
                text-anchor="middle"
                dominant-baseline="middle"
                class="fill-fg font-mono text-[10px] font-semibold"
              >
                {{ key.name }}
              </text>
            }
          </g>
        }

        <!-- Nodes that just left, as ghosts. -->
        @for (ghost of ghosts(); track ghost.key) {
          <circle
            [attr.cx]="ghost.x"
            [attr.cy]="ghost.y"
            [attr.r]="virtual() ? 4 : 9"
            stroke-dasharray="2 2"
            class="fill-surface stroke-faint"
          />
        }

        <!-- Points, on the ring. -->
        @for (point of points(); track point.key) {
          <g animate.enter="viz-fade-in" animate.leave="viz-fade-out">
            <circle
              [attr.cx]="point.x"
              [attr.cy]="point.y"
              [attr.r]="virtual() ? 4 : 10"
              class="stroke-surface"
              [class]="point.color?.fill ?? ''"
              stroke-width="2"
            />
            @if (!virtual()) {
              <text
                [attr.x]="point.x"
                [attr.y]="point.y"
                text-anchor="middle"
                dominant-baseline="central"
                class="fill-bg text-[10px] font-bold"
              >
                {{ point.node }}
              </text>
              <text
                [attr.x]="point.lx"
                [attr.y]="point.ly"
                text-anchor="middle"
                dominant-baseline="middle"
                class="fill-muted font-mono text-[9px]"
              >
                {{ point.label }}
              </text>
            }
          </g>
        }
      </svg>

      <div class="min-w-0 space-y-2 text-sm">
        <ul class="space-y-1.5" aria-label="Nodes">
          @for (row of rows(); track row.node) {
            <li class="rounded-lg border border-border bg-bg px-2.5 py-1.5">
              <div class="flex items-center gap-2">
                <span class="size-2.5 shrink-0 rounded-full" [class]="(row.color?.bg ?? '') + (row.left ? ' opacity-30' : '')"></span>
                <span class="font-semibold" [class]="row.left ? 'text-faint line-through' : 'text-fg'">{{ row.node }}</span>
                @if (row.left) {
                  <span class="text-[11px] text-muted">left the ring</span>
                }
                @if (row.share !== undefined && !row.left) {
                  <span class="ml-auto font-mono text-xs text-fg-soft tabular-nums">{{ row.percent }}%</span>
                  <span class="relative h-1.5 w-16 shrink-0 overflow-hidden rounded-full bg-surface-3">
                    <span
                      class="block h-full transition-[width] duration-400"
                      [class]="row.color?.bg ?? ''"
                      [style.width.%]="row.bar"
                    ></span>
                    <span class="absolute inset-y-0 left-1/2 w-px bg-fg"></span>
                  </span>
                }
              </div>
              @if (row.keys.length > 0) {
                <ul class="mt-1 flex flex-wrap gap-1" [attr.aria-label]="'Keys on ' + row.node">
                  @for (key of row.keys; track key.name) {
                    <li
                      class="rounded border px-1 font-mono text-[10px]"
                      [class]="key.moved ? 'border-accent bg-accent-soft text-fg' : 'border-border text-fg-soft'"
                    >
                      {{ key.name }}
                      @if (key.moved) {
                        <span class="sr-only"> (moved)</span>
                      }
                    </li>
                  }
                </ul>
              }
            </li>
          }
        </ul>
        @if (unowned().length > 0) {
          <p class="text-xs text-muted">
            Not yet placed on a node: <span class="font-mono text-[11px] text-fg-soft">{{ unowned() }}</span>
          </p>
        }
        @if (state().shares) {
          <p class="text-[11px] text-muted">
            Share of the ring each node owns; the tick marks a fair share ({{ fairPercent() }}%).
          </p>
        }
      </div>
    </div>
  `,
})
export class ConsistentHashingViewComponent {
  readonly state = input.required<RingState>();

  protected readonly size = SIZE;
  protected readonly c = C;
  protected readonly r = R;

  private colorOf(node?: string) {
    return node ? COLORS[this.state().nodes.indexOf(node) % COLORS.length] : null;
  }

  protected readonly virtual = computed(() => this.state().points.some((point) => point.replica > 0));

  protected readonly arcs = computed(() => {
    const state = this.state();
    if (!state.arcs) return [];
    return state.points.map((point, index) => {
      const previous = state.points[(index - 1 + state.points.length) % state.points.length];
      return {
        key: `${point.node}-${point.replica}`,
        d: arcPath(state.points.length === 1 ? point.at : previous.at, point.at, R),
        stroke: this.colorOf(point.node)?.stroke ?? '',
      };
    });
  });

  protected readonly walks = computed(() => {
    const walk = this.state().walk;
    return walk ? [{ key: `${walk.from}-${walk.to}`, d: arcPath(walk.from, walk.to, R + 12) }] : [];
  });

  protected readonly keys = computed(() => {
    const state = this.state();
    const featured = state.keys[0]?.name;
    return state.keys.map((key) => {
      const [x, y] = xy(key.at, R - 14);
      const [lx, ly] = xy(key.at, R - 48);
      return { ...key, x, y, lx, ly, color: this.colorOf(key.owner), labelled: key.name === featured };
    });
  });

  protected readonly ghosts = computed(() =>
    (this.state().gone ?? []).map((point) => {
      const [x, y] = xy(point.at, R);
      return { key: `${point.node}-${point.replica}`, x, y };
    }),
  );

  protected readonly points = computed(() =>
    this.state().points.map((point) => {
      const [x, y] = xy(point.at, R);
      const [lx, ly] = xy(point.at, R + 24);
      return { key: `${point.node}-${point.replica}`, node: point.node, x, y, lx, ly, label: hex(point.at), color: this.colorOf(point.node) };
    }),
  );

  private readonly fair = computed(() => 1 / Math.max(new Set(this.state().points.map((point) => point.node)).size, 1));
  protected readonly fairPercent = computed(() => Math.round(this.fair() * 100));

  protected readonly rows = computed(() => {
    const state = this.state();
    const present = new Set(state.points.map((point) => point.node));
    const gone = new Set(state.gone?.map((point) => point.node));
    return state.nodes
      .filter((node) => present.has(node) || gone.has(node))
      .map((node) => {
        const share = state.shares?.[node];
        return {
          node,
          color: this.colorOf(node),
          left: gone.has(node),
          share,
          percent: share === undefined ? 0 : Math.round(share * 100),
          // Each bar spans twice a fair share, so the tick in its middle marks a fair share.
          bar: share === undefined ? 0 : Math.min(share / (2 * this.fair()), 1) * 100,
          keys: state.keys.filter((key) => key.owner === node),
        };
      });
  });

  protected readonly unowned = computed(() =>
    this.state()
      .keys.filter((key) => !key.owner)
      .map((key) => key.name)
      .join(', '),
  );
}
