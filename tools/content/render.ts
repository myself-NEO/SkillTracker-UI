import { cx, escapeHtml } from '@lib/html';
import { CALLOUT_STYLES, ICON_ATTRIBUTES, REVEAL_STYLES, revealClasses, type RevealKind } from '@lib/markdown/blocks';

// The static markup of a lesson body: callouts, reveal blocks, code blocks and the problem notice
// of a broken animation block. The same markup and Tailwind classes as TheSWEguide's React
// components (components/markdown/*). The class strings live in this file and in
// src/lib/markdown/blocks.ts (shared with the browser's Markdown renderer), which Tailwind scans
// (styles.css → @source), because the generated JSON itself is git-ignored and never scanned.

export {
  calloutClasses,
  isRevealKind,
  REVEAL_KINDS,
  type RevealKind,
  revealTitle,
  TABLE_CLASS,
  TABLE_WRAPPER_CLASS,
} from '@lib/markdown/blocks';

const ICON_OPEN = `<svg ${Object.entries(ICON_ATTRIBUTES)
  .map(([name, value]) => `${name}="${value}"`)
  .join(' ')}>`;
const icon = (path: string) => `${ICON_OPEN}<path d="${path}"/></svg>`;

// --- Callouts: `> [!NOTE|TIP|WARNING|INTERVIEW] Optional title` ---------------------------------

/** Each callout type's style, with its icon as HTML. */
export const CALLOUTS: Record<string, { label: string; icon: string; classes: string; titleClass: string }> = Object.fromEntries(
  Object.entries(CALLOUT_STYLES).map(([type, style]) => [type, { ...style, icon: icon(style.iconPath) }]),
);

// --- Reveal blocks: ````hint / ````solution / ````reveal / ````question title="…" ----------------

/**
 * A collapsed block that works without script. `data-reveal` tells the app to track hint and
 * solution openings; an interview question carries `data-question` and an empty
 * `[data-slot="question-bookmark"]` where the app puts its notebook bookmark button.
 */
export const revealHtml = (kind: RevealKind, heading: string, bodyHtml: string, questionId?: string) => {
  const classes = revealClasses(kind);
  const question = questionId ? ` data-question="${escapeHtml(questionId)}"` : '';
  return (
    `<details class="${classes.details}" data-reveal="${kind}"${question}>` +
    `<summary class="${classes.summary}">` +
    `<span class="flex min-w-0 items-center gap-2">${icon(REVEAL_STYLES[kind].iconPath)}${escapeHtml(heading)}</span>` +
    `<span class="flex shrink-0 items-center gap-2">${questionId ? '<span data-slot="question-bookmark"></span>' : ''}` +
    `<span class="text-xs font-medium text-muted group-open:hidden">Show</span>` +
    `<span class="hidden text-xs font-medium text-muted group-open:inline">Hide</span></span>` +
    `</summary>` +
    `<div class="${classes.body}">${bodyHtml}</div>` +
    `</details>`
  );
};

// --- Code blocks -------------------------------------------------------------------------------

const LANGUAGE_LABEL: Record<string, string> = {
  java: 'Java',
  text: 'Diagram',
  txt: 'Text',
  bash: 'Shell',
  sh: 'Shell',
  json: 'JSON',
  xml: 'XML',
  sql: 'SQL',
  cql: 'CQL',
  http: 'HTTP',
  graphql: 'GraphQL',
  protobuf: 'Protocol Buffers',
  properties: 'Properties',
  yaml: 'YAML',
  lua: 'Lua',
  redis: 'Redis',
  javascript: 'JavaScript',
};

const COPY_ICON =
  '<svg class="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">' +
  '<path d="M7 3.5A1.5 1.5 0 018.5 2h3.879a1.5 1.5 0 011.06.44l3.122 3.12A1.5 1.5 0 0117 6.622V12.5a1.5 1.5 0 01-1.5 1.5h-1v-3.379a3 3 0 00-.879-2.121L10.5 5.379A3 3 0 008.379 4.5H7v-1z"/>' +
  '<path d="M4.5 6A1.5 1.5 0 003 7.5v9A1.5 1.5 0 004.5 18h7a1.5 1.5 0 001.5-1.5v-5.879a1.5 1.5 0 00-.44-1.06L9.44 6.439A1.5 1.5 0 008.378 6H4.5z"/></svg>';

const BOOKMARK_ICON =
  '<svg class="size-3.5" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">' +
  '<path stroke-linejoin="round" d="M5.5 3.5h9a.5.5 0 01.5.5v12.6a.4.4 0 01-.64.32L10 13.75l-4.36 3.17A.4.4 0 015 16.6V4a.5.5 0 01.5-.5z"/></svg>';

const TOOL_BUTTON =
  'inline-flex shrink-0 items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-muted transition-colors hover:bg-surface-3 hover:text-fg focus:outline-hidden focus-visible:ring-2 focus-visible:ring-accent';

export interface CodeBlockOptions {
  language?: string;
  title?: string;
  /** Minimum Java release the example needs, shown as a badge. */
  version?: number;
  /** The example uses a preview feature of `version` (needs --enable-preview). */
  preview?: boolean;
}

/**
 * A highlighted, copyable code block around Shiki's HTML. The buttons carry `data-action`; the
 * app wires them up. "Save" (to the notebook) starts hidden: the app shows it where the topic has
 * a notebook.
 */
export const codeBlockHtml = (shikiHtml: string, { language, title, version, preview }: CodeBlockOptions) => {
  const lang = language?.toLowerCase();
  const label = title ?? (lang ? (LANGUAGE_LABEL[lang] ?? lang) : 'Code');
  const badge =
    version !== undefined
      ? `<span class="shrink-0 rounded-sm border border-java/30 bg-java-soft px-1.5 py-px text-[10px] font-semibold text-java" title="${
          preview ? `Preview feature in Java ${version}: compile and run with --enable-preview` : `Needs Java ${version} or newer`
        }">${preview ? `Java ${version} preview` : `Java ${version}+`}</span>`
      : '';
  const save =
    lang !== 'text' && lang !== 'txt'
      ? `<button type="button" hidden data-action="save-snippet" class="${TOOL_BUTTON}" aria-label="Save snippet to your notebook">${BOOKMARK_ICON}<span aria-live="polite">Save</span></button>`
      : '';
  const copy = `<button type="button" data-action="copy" class="${TOOL_BUTTON}" aria-label="Copy code">${COPY_ICON}<span aria-live="polite">Copy</span></button>`;
  return (
    `<div class="render-when-near not-prose my-6 overflow-hidden rounded-xl border border-border bg-code" data-code="${escapeHtml(lang ?? 'text')}" data-label="${escapeHtml(label)}">` +
    `<div class="flex items-center justify-between gap-3 border-b border-border px-4 py-1.5">` +
    `<span class="flex min-w-0 items-center gap-2"><span class="truncate font-mono text-xs text-muted">${escapeHtml(label)}</span>${badge}</span>` +
    `<span class="flex shrink-0 items-center gap-1">${save}${copy}</span>` +
    `</div>` +
    `<div class="code-block">${shikiHtml}</div>` +
    `</div>`
  );
};

/** Inline code in widget text (quiz options, drill prompts, checklist items). */
export const INLINE_CODE_CLASS = 'rounded border border-border bg-surface-2 px-1 py-px font-mono text-[0.9em] text-fg';

/** Shown in place of an animation block that is wrong; the content validator reports the same problems. */
export const vizProblemHtml = (message: string) =>
  `<p role="alert" class="${cx('not-prose my-6 rounded-xl border border-danger/40 bg-danger-soft px-4 py-3 text-sm text-danger')}">${escapeHtml(message)}</p>`;

/** An empty spot the app fills with the widget `widgets[index]`. */
export const placeholderHtml = (index: number) => `<div data-w="${index}"></div>`;
