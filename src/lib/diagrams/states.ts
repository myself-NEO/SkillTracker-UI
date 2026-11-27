import { escapeHtml } from '@lib/html';

// A state machine from a text block (```states fences):
//
//   [*] --> Idle
//   Idle --> HasMoney : insertCoin()
//   HasMoney --> Dispensing : select(item) [in stock]
//   Dispensing --> [*]
//
// "[*]" marks the initial state (on the left) or a final state (on the right).
// Ported from TheSWEguide's StateDiagram.tsx: the same parser, and the same markup as an HTML string.

export interface Transition {
  from: string;
  to: string;
  trigger?: string;
}

const LINE_RE = /^(\[\*\]|[\w-]+)\s*-{1,2}>\s*(\[\*\]|[\w-]+)(?:\s*:\s*(.+))?$/;

export const parseStates = (source: string) => {
  const transitions: Transition[] = [];
  const states: string[] = [];
  const initial = new Set<string>();
  const finals = new Set<string>();
  const addState = (s: string) => {
    if (s !== '[*]' && !states.includes(s)) states.push(s);
  };

  for (const raw of source.split('\n')) {
    const match = raw.trim().match(LINE_RE);
    if (!match) continue;
    const [, from, to, trigger] = match;
    addState(from);
    addState(to);
    if (from === '[*]') initial.add(to);
    else if (to === '[*]') finals.add(from);
    else transitions.push({ from, to, trigger });
  }
  return { states, transitions, initial, finals };
};

const STATE_CLASSES = {
  initial: 'border-accent/50 bg-accent-soft text-accent',
  final: 'border-border-strong bg-surface-2 text-fg ring-2 ring-border-strong ring-offset-2 ring-offset-surface',
  other: 'border-border bg-bg text-fg',
};

/** The state machine as HTML (a `<figure>`); every piece of the source is escaped. */
export const renderStates = (source: string, title?: string) => {
  const { states, transitions, initial, finals } = parseStates(source);
  const chips = states
    .map((s) => {
      const isInitial = initial.has(s);
      const isFinal = finals.has(s);
      const tone = isInitial ? STATE_CLASSES.initial : isFinal ? STATE_CLASSES.final : STATE_CLASSES.other;
      return (
        `<li class="rounded-full border px-3 py-1.5 font-mono text-xs font-semibold ${tone}">` +
        (isInitial ? '<span class="sr-only">Initial state: </span>' : '') +
        (isFinal ? '<span class="sr-only">Final state: </span>' : '') +
        escapeHtml(s) +
        (isInitial ? '<span class="ml-1.5 font-sans text-[10px] text-accent">start</span>' : '') +
        (isFinal ? '<span class="ml-1.5 font-sans text-[10px] text-muted">end</span>' : '') +
        '</li>'
      );
    })
    .join('');
  const rows = transitions
    .map(
      (t) =>
        `<tr class="border-b border-border last:border-0">` +
        `<td class="py-2 pr-3 font-mono whitespace-nowrap text-fg">${escapeHtml(t.from)}</td>` +
        `<td class="py-2 pr-3 font-mono text-warning">${escapeHtml(t.trigger ?? '—')}</td>` +
        `<td class="py-2 font-mono whitespace-nowrap text-fg"><span class="mr-1 text-accent" aria-hidden="true">→</span>${escapeHtml(t.to)}</td></tr>`,
    )
    .join('');
  return (
    `<figure class="not-prose my-6 rounded-xl border border-border bg-surface p-4 sm:p-5">` +
    `<figcaption class="mb-4 text-xs font-semibold tracking-wider text-muted uppercase">${escapeHtml(title ?? 'State machine')}</figcaption>` +
    `<ol class="mb-5 flex flex-wrap gap-2" aria-label="States">${chips}</ol>` +
    `<div class="overflow-x-auto"><table class="w-full text-left text-xs"><thead><tr class="border-b border-border text-muted">` +
    `<th scope="col" class="py-2 pr-3 font-semibold">From</th><th scope="col" class="py-2 pr-3 font-semibold">Event / guard</th>` +
    `<th scope="col" class="py-2 font-semibold">To</th></tr></thead><tbody>${rows}</tbody></table></div></figure>`
  );
};
