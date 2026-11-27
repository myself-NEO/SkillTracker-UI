import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import type { GcObject, GcState } from '@lib/viz/scenes/gc-generations/logic';
import { FlipDirective } from '../motion';

// The heap as regions: the young generation (Eden and two survivor spaces) and the old generation.
// Objects keep their identity, so copies and promotions move them.

@Component({
  selector: 'app-gc-region',
  imports: [FlipDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block rounded-lg border p-2', '[class]': 'hostClass()' },
  template: `
    <p class="text-[11px] font-semibold tracking-wide text-muted uppercase">{{ name() }}</p>
    <ul class="mt-1.5 flex min-h-8 flex-wrap gap-1" [attr.aria-label]="name()">
      @if (objects().length === 0) {
        <li class="text-[11px] text-faint">empty</li>
      }
      @for (object of objects(); track object.id) {
        <li
          [appFlip]="'gc-' + object.id"
          animate.enter="viz-pop-in"
          animate.leave="viz-fade-out"
          class="rounded-md border px-1.5 py-0.5 font-mono text-[11px] font-semibold"
          [class]="
            object.dead
              ? 'border-border text-faint line-through'
              : object.promote
                ? 'border-insight/60 bg-insight-soft text-insight'
                : 'border-border-strong bg-surface text-fg'
          "
        >
          {{ object.id }}
          @if (object.age > 0) {
            <span class="ml-1 font-sans text-[10px] font-normal text-muted">age {{ object.age }}</span>
          }
        </li>
      }
    </ul>
  `,
})
export class GcRegionComponent {
  readonly name = input.required<string>();
  readonly objects = input.required<readonly GcObject[]>();
  readonly wide = input(false);
  readonly active = input(false);

  protected readonly hostClass = computed(
    () => `${this.active() ? 'border-warning/60 bg-warning-soft' : 'border-border bg-bg'} ${this.wide() ? 'flex-[2]' : 'flex-1'}`,
  );
}

@Component({
  selector: 'app-gc-generations-view',
  imports: [GcRegionComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-3">
      <div class="rounded-xl border p-2.5" [class]="minor() ? 'border-warning/50' : 'border-border'">
        <p class="mb-2 flex items-center justify-between text-xs font-semibold text-fg">
          Young generation
          @if (minor()) {
            <span class="rounded-full bg-warning-soft px-2 py-0.5 text-[10px] text-warning uppercase">minor GC</span>
          }
        </p>
        <div class="flex flex-wrap gap-2">
          <app-gc-region name="Eden" [objects]="state().eden" [wide]="true" [active]="minor()" />
          <app-gc-region name="Survivor S0" [objects]="state().s0" />
          <app-gc-region name="Survivor S1" [objects]="state().s1" />
        </div>
      </div>
      <div class="rounded-xl border p-2.5" [class]="state().collecting === 'major' ? 'border-danger/50' : 'border-border'">
        <p class="mb-2 flex items-center justify-between text-xs font-semibold text-fg">
          Old generation
          @if (state().collecting === 'major') {
            <span class="rounded-full bg-danger-soft px-2 py-0.5 text-[10px] text-danger uppercase">major GC</span>
          }
        </p>
        <app-gc-region [name]="'Tenured (promoted at age ' + state().threshold + ')'" [objects]="state().old" [wide]="true" />
      </div>
    </div>
  `,
})
export class GcGenerationsViewComponent {
  readonly state = input.required<GcState>();
  protected readonly minor = computed(() => this.state().collecting === 'minor');
}
