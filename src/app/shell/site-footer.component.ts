import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TOPICS } from '@lib/topics';

@Component({
  selector: 'app-site-footer',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <footer class="border-t border-border">
      <div class="mx-auto grid w-full max-w-[90rem] gap-8 px-4 py-10 sm:px-6 md:grid-cols-[minmax(0,1fr)_auto]">
        <div class="max-w-md">
          <a routerLink="/learn" class="inline-flex items-center gap-2.5 rounded-md">
            <img src="assets/logo.svg" alt="" class="size-6" />
            <span class="font-display text-[1.05rem] font-bold tracking-tight text-fg">NeoLevelUP</span>
          </a>
          <p class="mt-3 text-sm leading-6 text-muted">
            Java, data structures &amp; algorithms, low-level design and high-level design, from first principles to
            senior interviews.
          </p>
        </div>
        <nav aria-label="Explore">
          <ul class="grid gap-x-10 gap-y-2 text-sm sm:grid-cols-2">
            @for (topic of topics; track topic.id) {
              <li>
                <a [routerLink]="'/' + topic.id" class="text-muted transition-colors hover:text-fg">{{ topic.title }}</a>
              </li>
            }
            <li><a routerLink="/visualize" class="text-muted transition-colors hover:text-fg">Animations</a></li>
            <li><a routerLink="/mock-interview" class="text-muted transition-colors hover:text-fg">Mock interviews</a></li>
          </ul>
        </nav>
      </div>
    </footer>
  `,
})
export class SiteFooterComponent {
  protected readonly topics = TOPICS;
}
