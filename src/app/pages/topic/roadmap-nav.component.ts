import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { scrollSpy } from '../../ui/scroll-spy';

export interface RoadmapNavItem {
  id: string;
  label: string;
  marker: string;
}

/** The topic page's list of stages, highlighting the one in view. */
@Component({
  selector: 'app-roadmap-nav',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block sticky top-20 max-h-[calc(100dvh-6rem)] overflow-y-auto pb-6' },
  template: `
    <nav aria-label="Roadmap">
      <p class="text-xs font-semibold tracking-[0.14em] text-muted uppercase">Roadmap</p>
      <ol class="mt-3 border-l border-border">
        @for (item of items(); track item.id) {
          <li>
            <a
              [routerLink]="[]"
              [fragment]="item.id"
              [attr.aria-current]="item.id === active() ? 'location' : null"
              class="-ml-px flex items-baseline gap-2.5 border-l py-1.5 pr-2 pl-3 text-sm transition-colors"
              [class.border-accent]="item.id === active()"
              [class.text-fg]="item.id === active()"
              [class.border-transparent]="item.id !== active()"
              [class.text-muted]="item.id !== active()"
              [class.hover:border-border-strong]="item.id !== active()"
              [class.hover:text-fg]="item.id !== active()"
            >
              <span
                class="font-mono text-xs tabular-nums"
                [class.text-accent]="item.id === active()"
                [class.text-faint]="item.id !== active()"
                >{{ item.marker }}</span
              >
              <span>{{ item.label }}</span>
            </a>
          </li>
        }
      </ol>
    </nav>
  `,
})
export class RoadmapNavComponent {
  readonly items = input.required<readonly RoadmapNavItem[]>();

  protected readonly active = scrollSpy(() => this.items().map((item) => item.id));
}
