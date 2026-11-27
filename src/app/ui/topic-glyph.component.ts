import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import type { TopicId } from '@lib/topics';

/**
 * One small line drawing per topic: braces for Java, a tree for DSA, linked classes for LLD,
 * stacked servers for HLD. Use on an svg with a size class: `<svg [appTopicGlyph]="'java'" class="size-6">`.
 */
@Component({
  selector: 'svg[appTopicGlyph]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    'stroke-width': '1.7',
    'stroke-linecap': 'round',
    'stroke-linejoin': 'round',
    'aria-hidden': 'true',
  },
  template: `
    @switch (topic()) {
      @case ('java') {
        <svg:path
          d="M9 4C7 4 6 5 6 7v2.5c0 1.4-.8 2.3-2 2.5 1.2.2 2 1.1 2 2.5V17c0 2 1 3 3 3m6-16c2 0 3 1 3 3v2.5c0 1.4.8 2.3 2 2.5-1.2.2-2 1.1-2 2.5V17c0 2-1 3-3 3"
        />
      }
      @case ('dsa') {
        <svg:circle cx="12" cy="5" r="2.2" />
        <svg:circle cx="6" cy="18.5" r="2.2" />
        <svg:circle cx="18" cy="18.5" r="2.2" />
        <svg:path d="M11 7.1 7 16.4M13 7.1l4 9.3" />
      }
      @case ('lld') {
        <svg:rect x="3" y="3.5" width="9" height="7.5" rx="1.2" />
        <svg:path d="M3 7.2h9" />
        <svg:rect x="12" y="13" width="9" height="7.5" rx="1.2" />
        <svg:path d="M12 16.7h9M7.5 11v5.2H12" />
      }
      @case ('hld') {
        <svg:rect x="4" y="3.5" width="16" height="5" rx="1.2" />
        <svg:rect x="4" y="9.5" width="16" height="5" rx="1.2" />
        <svg:rect x="4" y="15.5" width="16" height="5" rx="1.2" />
        <svg:path d="M7.5 6h.01M7.5 12h.01M7.5 18h.01" />
      }
    }
  `,
})
export class TopicGlyphComponent {
  readonly topic = input.required<TopicId>({ alias: 'appTopicGlyph' });
}
