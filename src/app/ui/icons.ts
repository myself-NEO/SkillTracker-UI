import { ChangeDetectionStrategy, Component, input } from '@angular/core';

// Icons of the notebook, the progress pages and DSA's coding questions, from TheSWEguide's
// components/learn/ui.tsx. Each is an attribute on an <svg>, which keeps its own classes (size,
// colour): <svg appBookmarkIcon [filled]="saved" class="size-4">.

const STROKE = { viewBox: '0 0 20 20', fill: 'none', stroke: 'currentColor', 'stroke-width': '1.5', 'aria-hidden': 'true' };

@Component({
  selector: 'svg[appBookmarkIcon]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { ...STROKE, '[attr.fill]': "filled() ? 'currentColor' : 'none'" },
  template: `<svg:path
    stroke-linejoin="round"
    d="M5.5 3.5h9a.5.5 0 01.5.5v12.6a.4.4 0 01-.64.32L10 13.75l-4.36 3.17A.4.4 0 015 16.6V4a.5.5 0 01.5-.5z"
  />`,
})
export class BookmarkIconComponent {
  readonly filled = input(false);
}

@Component({
  selector: 'svg[appFlagIcon]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: STROKE,
  template: `<svg:path stroke-linecap="round" d="M4.5 17.5v-14" /><svg:path
      stroke-linejoin="round"
      [attr.fill]="filled() ? 'currentColor' : 'none'"
      d="M4.5 3.5h10l-2 3.5 2 3.5h-10"
    />`,
})
export class FlagIconComponent {
  readonly filled = input(false);
}

@Component({
  selector: 'svg[appNoteIcon]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: STROKE,
  template: `<svg:path stroke-linejoin="round" d="M5 2.75h7l3 3v11.5H5z" /><svg:path
      stroke-linecap="round"
      d="M7.5 9.5h5M7.5 12.5h5M7.5 6.5h2.5"
    />`,
})
export class NoteIconComponent {}

@Component({
  selector: 'svg[appSearchIcon]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { viewBox: '0 0 20 20', fill: 'currentColor', 'aria-hidden': 'true' },
  template: `<svg:path
    fill-rule="evenodd"
    clip-rule="evenodd"
    d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z"
  />`,
})
export class SearchIconComponent {}

/** A ring, or with `filled` a solid circle with a tick: done. */
@Component({
  selector: 'svg[appCheckCircleIcon]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { viewBox: '0 0 20 20', 'aria-hidden': 'true' },
  template: `
    @if (filled()) {
      <svg:path
        fill="currentColor"
        fill-rule="evenodd"
        clip-rule="evenodd"
        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
      />
    } @else {
      <svg:circle cx="10" cy="10" r="7.25" fill="none" stroke="currentColor" stroke-width="1.5" />
    }
  `,
})
export class CheckCircleIconComponent {
  readonly filled = input(false);
}

/** A half-filled ring: started. */
@Component({
  selector: 'svg[appHalfCircleIcon]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { viewBox: '0 0 20 20', 'aria-hidden': 'true' },
  template: `<svg:circle cx="10" cy="10" r="7.25" fill="none" stroke="currentColor" stroke-width="1.5" /><svg:path
      d="M10 2.75a7.25 7.25 0 010 14.5z"
      fill="currentColor"
    />`,
})
export class HalfCircleIconComponent {}

/** After a link that opens another site. */
@Component({
  selector: 'svg[appExternalLinkIcon]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: STROKE,
  template: `<svg:path stroke-linecap="round" stroke-linejoin="round" d="M11 3.5h5.5V9M16.5 3.5L9 11M8 4.5H4.5v11h11V12" />`,
})
export class ExternalLinkIconComponent {}

/** A right arrow, after "Guide: …" links. */
@Component({
  selector: 'svg[appArrowIcon]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '2', 'aria-hidden': 'true' },
  template: `<svg:path stroke-linecap="round" stroke-linejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />`,
})
export class ArrowIconComponent {}
