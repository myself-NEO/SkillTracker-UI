import { HttpClient } from '@angular/common/http';
import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  inject,
  Injector,
  signal,
  viewChild,
} from '@angular/core';
import { Router } from '@angular/router';
import { type SearchEntry, searchIndex, type SearchKind } from '@lib/search/score';
import { TOPICS } from '@lib/topics';
import { firstValueFrom } from 'rxjs';

// ⌘K / Ctrl+K search across every topic (ported from TheSWEguide's Search.tsx). The index
// (/search-index.json, built with the content) is fetched the first time the dialog opens and kept
// for the rest of the visit.

const KIND_LABEL: Record<SearchKind, string> = {
  page: 'Page',
  lesson: 'Lesson',
  section: 'Section',
  problem: 'Problem',
  coding: 'Coding question',
  question: 'Interview question',
  cheatsheet: 'Cheat sheet',
  animation: 'Animation',
};

const SHORT_TITLE: Record<string, string> = Object.fromEntries(TOPICS.map((topic) => [topic.id, topic.shortTitle]));

let indexRequest: Promise<SearchEntry[]> | null = null;

@Component({
  selector: 'app-search',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '(document:keydown)': 'onShortcut($event)' },
  templateUrl: './search.component.html',
})
export class SearchComponent {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly injector = inject(Injector);
  private readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');
  private readonly input = viewChild<ElementRef<HTMLInputElement>>('input');

  /** "⌘K" on Apple devices, "Ctrl K" elsewhere. */
  protected readonly shortcut = /Mac|iPhone|iPad/.test(navigator.platform) ? '⌘K' : 'Ctrl K';
  protected readonly kindLabel = KIND_LABEL;
  protected readonly shortTitle = SHORT_TITLE;
  protected readonly open = signal(false);
  protected readonly entries = signal<SearchEntry[] | null>(null);
  protected readonly failed = signal(false);
  protected readonly query = signal('');
  protected readonly selected = signal(0);
  protected readonly results = computed(() => {
    const entries = this.entries();
    return entries ? searchIndex(entries, this.query()) : [];
  });

  protected show() {
    this.open.set(true);
    this.failed.set(false);
    this.dialog().nativeElement.showModal();
    afterNextRender(() => this.input()?.nativeElement.select(), { injector: this.injector });
    indexRequest ??= firstValueFrom(this.http.get<SearchEntry[]>('/search-index.json')).catch((error: unknown) => {
      indexRequest = null; // let a later open try again
      throw error;
    });
    indexRequest.then(
      (entries) => this.entries.set(entries),
      () => this.failed.set(true),
    );
  }

  protected close() {
    this.dialog().nativeElement.close();
  }

  /** ⌘K / Ctrl+K from anywhere on the page opens the search, or closes it. */
  protected onShortcut(event: KeyboardEvent) {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      if (this.dialog().nativeElement.open) this.close();
      else this.show();
    }
  }

  /** A click on the backdrop (the dialog element itself, outside its content) closes it. */
  protected onDialogClick(event: MouseEvent) {
    if (event.target === this.dialog().nativeElement) this.close();
  }

  protected onInput(event: Event) {
    this.query.set((event.target as HTMLInputElement).value);
    this.selected.set(0);
  }

  protected onInputKeys(event: KeyboardEvent) {
    const results = this.results();
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      if (results.length === 0) return;
      const step = event.key === 'ArrowDown' ? 1 : -1;
      const next = (this.selected() + step + results.length) % results.length;
      this.selected.set(next);
      document.getElementById(`search-result-${next}`)?.scrollIntoView({ block: 'nearest' });
    } else if (event.key === 'Enter' && results[this.selected()]) {
      event.preventDefault();
      this.go(results[this.selected()].href);
    }
  }

  protected go(href: string) {
    this.close();
    void this.router.navigateByUrl(href);
  }
}
