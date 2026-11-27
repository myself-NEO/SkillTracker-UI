import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import type { SceneCode } from '@lib/viz/types';

/**
 * A scene's code, with the line the current frame runs highlighted. The tokens were highlighted at
 * build time; their colours are CSS variables for both themes (.shiki in styles.css).
 */
@Component({
  selector: 'app-code-panel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'flex min-w-0 flex-col border-border bg-code max-lg:border-t lg:border-l' },
  template: `
    <p class="border-b border-border px-4 py-1.5 font-mono text-xs text-muted">{{ code().label }}</p>
    <pre class="shiki min-w-0 flex-1 overflow-x-auto py-2 font-mono text-[12.5px] leading-6"><code>@for (tokens of lines(); track $index; let i = $index) {<span
      class="block border-l-2 pr-4 pl-3 transition-colors"
      [class.border-accent]="i + 1 === line()"
      [class.bg-accent-soft]="i + 1 === line()"
      [class.border-transparent]="i + 1 !== line()"
      [attr.aria-current]="i + 1 === line() ? 'step' : null"
    ><span class="mr-3 inline-block w-5 text-right text-faint select-none">{{ i + 1 }}</span>@if (tokens.length === 0) {<span> </span>} @else {@for (token of tokens; track $index) {<span [attr.style]="token.style">{{ token.content }}</span>}}</span>}</code></pre>
  `,
})
export class CodePanelComponent {
  readonly code = input.required<SceneCode>();
  /** The line to highlight (1-based). */
  readonly line = input<number>();

  /** Each token's colours as a style attribute ("--shiki-light:…;--shiki-dark:…"). */
  protected readonly lines = computed(() =>
    this.code().lines.map((tokens) =>
      tokens.map((token) => ({
        content: token.content,
        style: token.style
          ? Object.entries(token.style)
              .map(([name, value]) => `${name}:${value}`)
              .join(';')
          : null,
      })),
    ),
  );
}
