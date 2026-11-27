import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import type { CheatsheetData, PageResult } from '../../core/content.resolvers';
import { LoadErrorComponent } from '../../ui/load-error.component';
import { ArticleLayoutComponent } from '../article/article-layout.component';
import { BreadcrumbComponent, ClockGlyphComponent, MetaPillComponent, PrevNextComponent } from '../article/article-parts';
import { LessonBodyComponent } from '../article/lesson-body.component';
import { SidebarTopicLinkComponent } from '../article/sidebars.component';
import { NotFoundComponent } from '../not-found/not-found-page.component';

const sheetPath = (slug: string) => `/dsa/cheatsheets/${slug}`;

/** A DSA cheat sheet (/dsa/cheatsheets/:slug), a one-pass revision guide. Ported from TheSWEguide's cheatsheets/[slug]/page.tsx. */
@Component({
  selector: 'app-cheatsheet-page',
  imports: [
    RouterLink,
    ArticleLayoutComponent,
    SidebarTopicLinkComponent,
    BreadcrumbComponent,
    MetaPillComponent,
    ClockGlyphComponent,
    LessonBodyComponent,
    PrevNextComponent,
    NotFoundComponent,
    LoadErrorComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @switch (page().status) {
      @case ('missing') {
        <app-not-found />
      }
      @case ('error') {
        <app-load-error />
      }
      @default {
        @let view = data()!;
        <app-article-layout track="dsa" [headings]="view.doc.toc" sidebarLabel="Cheat sheets">
          <div sidebar>
            <app-sidebar-topic-link [track]="view.track" title="Data Structures & Algorithms" />
            <nav aria-label="Cheat sheets" class="border-t border-border pt-2 text-sm">
              <p class="px-2 py-1.5 text-[11px] font-semibold tracking-[0.1em] text-muted uppercase">Cheat sheets</p>
              <ul>
                @for (other of view.sheets; track other.slug) {
                  <li>
                    <a
                      [routerLink]="path(other.slug)"
                      [attr.aria-current]="other.slug === view.sheet.slug ? 'page' : null"
                      class="block rounded-md px-2 py-1.5 leading-5 transition-colors"
                      [class]="
                        other.slug === view.sheet.slug
                          ? 'bg-accent-soft font-medium text-fg'
                          : 'text-fg-soft hover:bg-surface-2 hover:text-fg'
                      "
                    >
                      {{ other.title }}
                      <span class="block text-xs font-normal text-muted">{{ other.minutes }} min read</span>
                    </a>
                  </li>
                }
              </ul>
              <a [routerLink]="view.track.basePath" class="mt-4 block px-2 text-sm text-accent hover:underline">All DSA lessons</a>
            </nav>
          </div>

          <header>
            <app-breadcrumb [items]="breadcrumb" />
            <h1 class="mt-4 font-display text-3xl leading-tight font-bold tracking-tight sm:text-4xl">{{ view.sheet.title }}</h1>
            <p class="mt-3 text-lg leading-8 text-muted">{{ view.sheet.summary }}</p>
            <div class="mt-5 flex flex-wrap items-center gap-2">
              <app-meta-pill><svg appClockGlyph></svg>{{ view.sheet.minutes }} min read</app-meta-pill>
              <app-meta-pill tone="accent">Revision</app-meta-pill>
            </div>
          </header>
          <div class="mt-10">
            <app-lesson-body [doc]="view.doc" [page]="{ track: 'dsa', kind: 'cheatsheet', slug: view.sheet.slug }" />
          </div>
          <footer class="mt-14">
            <app-prev-next [previous]="neighbour(-1)" [next]="neighbour(1)" />
          </footer>
        </app-article-layout>
      }
    }
  `,
})
export class CheatsheetPageComponent {
  /** Resolved by the route (cheatsheetResolver). */
  readonly page = input.required<PageResult<CheatsheetData>>();

  protected readonly data = computed(() => {
    const page = this.page();
    return page.status === 'ok' ? page.value : null;
  });
  protected readonly breadcrumb = [
    { title: 'DSA', href: '/dsa' },
    { title: 'Cheat sheets', href: '/dsa', fragment: 'cheatsheets' },
  ];
  protected readonly path = sheetPath;

  protected neighbour(offset: number) {
    const { sheet, sheets } = this.data()!;
    const other = sheets[sheets.indexOf(sheet) + offset];
    return other && { href: sheetPath(other.slug), title: other.title };
  }
}
