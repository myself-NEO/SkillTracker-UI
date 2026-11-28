import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { inlineCodeParts } from '@lib/markdown/inline-code';

/**
 * A title with its `inline code` shown as code (no Markdown pass), on any element:
 * `<span appInlineCode [text]="question.title">`.
 */
@Component({
  selector: '[appInlineCode]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  // On one line: whitespace inside the blocks would show as spaces around the code.
  template: `@for (part of parts(); track $index) {@if (part.code) {<code class="rounded border border-border bg-surface-2 px-1 py-px font-mono text-[0.88em]">{{ part.text }}</code>} @else {<span>{{ part.text }}</span>}}`,
})
export class InlineCodeComponent {
  readonly text = input.required<string>();
  protected readonly parts = computed(() => inlineCodeParts(this.text()));
}
