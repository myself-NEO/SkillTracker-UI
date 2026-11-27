import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import type { ChecklistWidget } from '@lib/content/doc';
import { questionHash } from '@lib/progress/hash';
import { InterviewsStore } from '../core/interviews.store';
import { type BodyPage, pageKey } from './page';

/**
 * A checklist (```checklist blocks), ported from TheSWEguide's Checklist.tsx. Ticks are kept per
 * page with the learner's account (items are identified by a hash of their text); on cheat sheets,
 * for the visit only.
 */
@Component({
  selector: 'app-checklist',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    @if (items().length > 0) {
      <section class="not-prose my-6 rounded-xl border border-success/30 bg-surface p-4 sm:p-5" [attr.aria-label]="title()">
        <div class="mb-3 flex flex-wrap items-center justify-between gap-2">
          <p class="text-sm font-semibold text-success">{{ title() }}</p>
          <span class="text-xs text-muted">{{ done() }} / {{ items().length }} covered</span>
        </div>
        <div
          role="progressbar"
          [attr.aria-label]="title() + ' items covered'"
          aria-valuemin="0"
          [attr.aria-valuemax]="items().length"
          [attr.aria-valuenow]="done()"
          [attr.aria-valuetext]="done() + ' of ' + items().length"
          class="mb-3 h-1.5 w-full overflow-hidden rounded-full bg-surface-3"
        >
          <div class="h-full rounded-full bg-accent transition-[width] duration-300" [style.width.%]="percent()"></div>
        </div>
        <ul class="space-y-1.5">
          @for (item of items(); track item.id) {
            <li>
              <label
                class="flex cursor-pointer items-start gap-2.5 rounded-lg px-2 py-1.5 text-sm text-fg hover:bg-surface-2 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-accent"
              >
                <input
                  type="checkbox"
                  [checked]="isOn(item.id)"
                  (change)="toggle(item.id, $any($event.target).checked)"
                  class="mt-0.5 accent-success"
                />
                <span
                  class="[overflow-wrap:anywhere]"
                  [class.text-muted]="isOn(item.id)"
                  [class.line-through]="isOn(item.id)"
                  [class.decoration-faint]="isOn(item.id)"
                  [innerHTML]="item.html"
                ></span>
              </label>
            </li>
          }
        </ul>
      </section>
    }
  `,
})
export class ChecklistComponent {
  private readonly store = inject(InterviewsStore);

  readonly widget = input.required<ChecklistWidget>();
  readonly page = input.required<BodyPage>();

  protected readonly title = computed(() => this.widget().title ?? 'Checklist');
  protected readonly items = computed(() =>
    this.widget().items.map((item) => ({ id: questionHash(item.text), html: item.html })),
  );
  private readonly key = computed(() => pageKey(this.page()));
  /** Ticks for the visit only, where the page keeps none (cheat sheets). */
  private readonly local = signal<Record<string, boolean>>({});
  private readonly ticks = computed<Record<string, unknown>>(() => {
    const key = this.key();
    return key ? (this.store.state().checklists[key] ?? {}) : this.local();
  });
  protected readonly done = computed(() => this.items().filter((item) => this.ticks()[item.id]).length);
  protected readonly percent = computed(() =>
    this.items().length ? Math.round((this.done() / this.items().length) * 100) : 0,
  );

  protected isOn(id: string) {
    return Boolean(this.ticks()[id]);
  }

  protected toggle(id: string, on: boolean) {
    const key = this.key();
    if (key) this.store.toggleChecklistItem(key, id, on);
    else this.local.update((local) => ({ ...local, [id]: on }));
  }
}
