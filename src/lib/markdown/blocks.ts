// The look of callouts, reveal blocks and tables in Markdown. Lesson bodies get them from the
// content build (tools/content/render.ts); the learner's own notes get the same from the browser's
// Markdown renderer (client.ts). The same markup and Tailwind classes as TheSWEguide's React
// components (components/markdown/*); Tailwind sees the class strings here.

/** The 20×20 stroke icons of callouts and reveal blocks: these attributes, and one path each. */
export const ICON_ATTRIBUTES = {
  class: 'size-4 shrink-0',
  viewBox: '0 0 20 20',
  fill: 'none',
  stroke: 'currentColor',
  'stroke-width': '1.7',
  'stroke-linecap': 'round',
  'stroke-linejoin': 'round',
  'aria-hidden': 'true',
} as const;

const BULB = 'M7.5 14.5h5M8.25 17.25h3.5M10 2.75a5 5 0 00-3 9c.6.45 1 1.1 1 1.85v.9h4v-.9c0-.75.4-1.4 1-1.85a5 5 0 00-3-9z';

// --- Callouts: `> [!NOTE|TIP|WARNING|INTERVIEW] Optional title` ---------------------------------

export interface CalloutStyle {
  label: string;
  iconPath: string;
  classes: string;
  titleClass: string;
}

export const CALLOUT_STYLES: Record<string, CalloutStyle> = {
  note: {
    label: 'Note',
    iconPath: 'M10 17.5a7.5 7.5 0 100-15 7.5 7.5 0 000 15zM10 9v4.5M10 6.25v.01',
    classes: 'border-info/30 border-l-info bg-info-soft',
    titleClass: 'text-info',
  },
  tip: {
    label: 'Tip',
    iconPath: BULB,
    classes: 'border-success/30 border-l-success bg-success-soft',
    titleClass: 'text-success',
  },
  warning: {
    label: 'Watch out',
    iconPath: 'M10 3.25l7.5 13H2.5l7.5-13zM10 8.5v3.5M10 14.25v.01',
    classes: 'border-warning/30 border-l-warning bg-warning-soft',
    titleClass: 'text-warning',
  },
  interview: {
    label: 'Interview insight',
    iconPath: 'M10 17.5a7.5 7.5 0 100-15 7.5 7.5 0 000 15zM10 13.75a3.75 3.75 0 100-7.5 3.75 3.75 0 000 7.5zM10 10.25v-.5',
    classes: 'border-insight/30 border-l-insight bg-insight-soft',
    titleClass: 'text-insight',
  },
};

/** Classes of a callout: the box, its title line and its body. */
export const calloutClasses = (type: string) => ({
  box: `my-6 rounded-xl border border-l-4 ${CALLOUT_STYLES[type].classes} px-4 py-3`,
  title: `!mt-0 !mb-1 flex items-center gap-2 text-sm font-semibold ${CALLOUT_STYLES[type].titleClass}`,
  body: 'text-[15px] [&_li]:my-0.5 [&_ol]:my-1.5 [&_p]:my-1.5 [&_ul]:my-1.5 [&>*:last-child]:mb-0',
});

/** Wide tables scroll inside their own box instead of stretching the page. */
export const TABLE_WRAPPER_CLASS = 'render-when-near my-6 overflow-x-auto rounded-xl border border-border';
export const TABLE_CLASS = 'my-0! min-w-full';

// --- Reveal blocks: ````hint / ````solution / ````reveal / ````question title="…" ----------------

export const REVEAL_KINDS = ['hint', 'solution', 'reveal', 'question'] as const;
export type RevealKind = (typeof REVEAL_KINDS)[number];

export const isRevealKind = (value: string | undefined): value is RevealKind =>
  (REVEAL_KINDS as readonly string[]).includes(value ?? '');

export interface RevealStyle {
  iconPath: string;
  defaultTitle: string;
  classes: string;
  summaryClass: string;
}

export const REVEAL_STYLES: Record<RevealKind, RevealStyle> = {
  hint: { iconPath: BULB, defaultTitle: 'Hint', classes: 'border-warning/35', summaryClass: 'text-warning' },
  solution: {
    iconPath: 'M10 17.5a7.5 7.5 0 100-15 7.5 7.5 0 000 15zM6.75 10.25l2.25 2.25 4.25-4.75',
    defaultTitle: 'Reference solution',
    classes: 'border-success/35',
    summaryClass: 'text-success',
  },
  reveal: {
    iconPath:
      'M1.75 10S4.75 4.25 10 4.25 18.25 10 18.25 10 15.25 15.75 10 15.75 1.75 10 1.75 10zM10 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z',
    defaultTitle: 'Show explanation',
    classes: 'border-border-strong',
    summaryClass: 'text-fg',
  },
  question: {
    iconPath:
      'M4.25 15.5l-1 2.25 3.5-1.25A7.5 7.5 0 1010 2.5a7.5 7.5 0 00-5.75 12.5zM7.75 8a2.25 2.25 0 114 1.4c-.6.5-1.75.9-1.75 2.1M10 13.75v.01',
    defaultTitle: 'Interview question',
    classes: 'border-insight/35',
    summaryClass: 'text-insight',
  },
};

export const revealTitle = (kind: RevealKind, title: string | undefined) => title ?? REVEAL_STYLES[kind].defaultTitle;

/** Classes of a reveal block: the `<details>`, its `<summary>` and the body under it. */
export const revealClasses = (kind: RevealKind) => ({
  details: `group my-5 rounded-xl border bg-surface ${REVEAL_STYLES[kind].classes}`,
  summary:
    `flex cursor-pointer list-none items-center justify-between gap-3 rounded-xl px-4 py-3 text-sm font-semibold ${REVEAL_STYLES[kind].summaryClass} ` +
    'group-open:rounded-b-none hover:bg-surface-2 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-accent [&::-webkit-details-marker]:hidden',
  body: 'border-t border-border px-4 py-4 sm:px-5 [&>*:first-child]:mt-0 [&>*:last-child]:mb-0',
});
