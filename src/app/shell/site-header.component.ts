import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { TOPICS } from '@lib/topics';
import { AccountMenuComponent } from './account-menu.component';
import { ThemeToggleComponent } from './theme-toggle.component';

/** The signed-in header: the brand, the four topics and Mock Interview, the theme switch and the account. */
@Component({
  selector: 'app-site-header',
  imports: [RouterLink, RouterLinkActive, ThemeToggleComponent, AccountMenuComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="sticky top-0 z-40 border-b border-border bg-bg/85 backdrop-blur-md">
      <div class="mx-auto flex h-14 w-full max-w-[90rem] items-center gap-3 px-4 sm:gap-8 sm:px-6">
        <a routerLink="/learn" class="flex shrink-0 items-center gap-2.5 rounded-md" aria-label="NeoLevelUP: all topics">
          <img src="assets/logo.svg" alt="" class="size-7" />
          <span class="hidden font-display text-[1.05rem] font-bold tracking-tight text-fg sm:inline">NeoLevelUP</span>
        </a>
        <nav aria-label="Main" class="flex min-w-0 items-center gap-0.5 overflow-x-auto">
          @for (topic of topics; track topic.id) {
            <a
              [routerLink]="'/' + topic.id"
              routerLinkActive
              #topicLink="routerLinkActive"
              [attr.aria-current]="topicLink.isActive ? 'page' : null"
              [attr.data-track]="topic.id"
              [title]="topic.title"
              class="flex shrink-0 items-center gap-1.5 rounded-md px-2 py-1.5 text-sm font-medium transition-colors sm:gap-2 sm:px-2.5"
              [class.bg-accent-soft]="topicLink.isActive"
              [class.text-fg]="topicLink.isActive"
              [class.text-muted]="!topicLink.isActive"
              [class.hover:bg-surface-2]="!topicLink.isActive"
              [class.hover:text-fg]="!topicLink.isActive"
            >
              <span class="hidden size-2 rounded-full bg-accent sm:block" aria-hidden="true"></span>
              {{ topic.shortTitle }}
            </a>
          }
          <a
            routerLink="/mock-interview"
            routerLinkActive
            #mockLink="routerLinkActive"
            [attr.aria-current]="mockLink.isActive ? 'page' : null"
            title="Mock interviews"
            class="flex shrink-0 items-center rounded-md px-2 py-1.5 text-sm font-medium whitespace-nowrap transition-colors sm:px-2.5"
            [class.bg-surface-2]="mockLink.isActive"
            [class.text-fg]="mockLink.isActive"
            [class.text-muted]="!mockLink.isActive"
            [class.hover:bg-surface-2]="!mockLink.isActive"
            [class.hover:text-fg]="!mockLink.isActive"
          >
            <span class="sm:hidden">Mocks</span>
            <span class="hidden sm:inline">Mock Interview</span>
          </a>
        </nav>
        <div class="ml-auto flex shrink-0 items-center gap-1 sm:gap-2">
          <!-- On phones the theme switch is in the account menu, which leaves room for the tabs. -->
          <app-theme-toggle class="hidden sm:block" />
          <app-account-menu />
        </div>
      </div>
    </header>
  `,
})
export class SiteHeaderComponent {
  protected readonly topics = TOPICS;
}
