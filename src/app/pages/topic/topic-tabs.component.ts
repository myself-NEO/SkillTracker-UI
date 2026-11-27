import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { type SectionId, topicSections } from '@lib/sections';
import { TOPICS, type TopicId } from '@lib/topics';

/** The tab bar of a topic's pages: roadmap, practice, interview prep, notebook, progress… */
@Component({
  selector: 'app-topic-tabs',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <nav [attr.aria-label]="shortTitle() + ' pages'" [attr.data-track]="topic()" class="border-b border-border bg-bg">
      <ul
        class="mx-auto flex w-full max-w-[90rem] [scrollbar-width:none] gap-1 overflow-x-auto px-4 sm:px-6 [&::-webkit-scrollbar]:hidden"
      >
        @for (section of sections(); track section.id) {
          <li class="shrink-0">
            <a
              [routerLink]="section.href"
              [attr.aria-current]="section.id === active() ? 'page' : null"
              class="-mb-px inline-flex items-center border-b-2 px-3 py-3 text-sm font-medium whitespace-nowrap transition-colors"
              [class.border-accent]="section.id === active()"
              [class.text-fg]="section.id === active()"
              [class.border-transparent]="section.id !== active()"
              [class.text-muted]="section.id !== active()"
              [class.hover:text-fg]="section.id !== active()"
            >
              {{ section.label }}
            </a>
          </li>
        }
      </ul>
    </nav>
  `,
})
export class TopicTabsComponent {
  readonly topic = input.required<TopicId>();
  readonly active = input.required<SectionId>();

  protected readonly sections = computed(() => topicSections(this.topic()));
  protected readonly shortTitle = computed(
    () => TOPICS.find((info) => info.id === this.topic())?.shortTitle ?? this.topic(),
  );
}
