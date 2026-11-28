import { ChangeDetectionStrategy, Component, input } from '@angular/core';

// The notebook's icons, from TheSWEguide's components/learn/ui.tsx. Each is an attribute on an
// <svg>, which keeps its own classes (size, colour): <svg appBookmarkIcon [filled]="saved" class="size-4">.

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
