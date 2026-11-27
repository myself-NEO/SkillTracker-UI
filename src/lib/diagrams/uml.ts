import { cx, escapeHtml } from '@lib/html';

// A lightweight class diagram from a text block (```uml fences, and the LLD mock interview's editor):
//
//   interface PricingStrategy
//     + priceFor(ticket: Ticket): Money
//   class ParkingLot
//     - levels: List<Level>
//     + park(vehicle: Vehicle): Ticket
//   ParkingLot *-- "1..*" Level : contains
//   HourlyPricing ..|> PricingStrategy
//
// Declarations: class | abstract class | interface | enum | record, members indented below.
// Relationships: --|> extends, ..|> implements, *-- composition, o-- aggregation,
//                --> association, ..> dependency (optional "multiplicity" on either side, ": label").
//
// Ported from TheSWEguide's UmlDiagram.tsx: the same parser, and the same markup as an HTML string.

type Kind = 'class' | 'abstract' | 'interface' | 'enum' | 'record';
type RelType = 'extends' | 'implements' | 'composition' | 'aggregation' | 'association' | 'dependency';

export interface UmlClass {
  name: string;
  kind: Kind;
  fields: string[];
  methods: string[];
}

export interface UmlRelation {
  from: string;
  to: string;
  type: RelType;
  fromMult?: string;
  toMult?: string;
  label?: string;
}

const DECL_RE = /^(abstract class|class|interface|enum|record)\s+([\w<>, ]+?)\s*$/;
const REL_RE = /^(\w+)\s+(?:"([^"]*)"\s+)?(--\|>|\.\.\|>|\*--|o--|-->|\.\.>)\s+(?:"([^"]*)"\s+)?(\w+)(?:\s*:\s*(.+))?$/;

const OPERATOR_TYPE: Record<string, RelType> = {
  '--|>': 'extends',
  '..|>': 'implements',
  '*--': 'composition',
  'o--': 'aggregation',
  '-->': 'association',
  '..>': 'dependency',
};

export const parseUml = (source: string) => {
  const classes: UmlClass[] = [];
  const relations: UmlRelation[] = [];
  let current: UmlClass | null = null;

  for (const rawLine of source.split('\n')) {
    if (!rawLine.trim() || rawLine.trim().startsWith('//')) continue;
    const indented = /^\s/.test(rawLine);
    const line = rawLine.trim();

    if (indented && current) {
      const isEnumConstant = current.kind === 'enum' && /^[A-Z][A-Z0-9_]*(\(.*\))?$/.test(line);
      (line.includes('(') && !isEnumConstant ? current.methods : current.fields).push(line);
      continue;
    }

    const decl = line.match(DECL_RE);
    if (decl) {
      const kind = decl[1] === 'abstract class' ? 'abstract' : (decl[1] as Kind);
      current = { name: decl[2], kind, fields: [], methods: [] };
      classes.push(current);
      continue;
    }

    const rel = line.match(REL_RE);
    if (rel) {
      relations.push({
        from: rel[1],
        fromMult: rel[2],
        type: OPERATOR_TYPE[rel[3]],
        toMult: rel[4],
        to: rel[5],
        label: rel[6],
      });
      current = null;
    }
  }
  return { classes, relations };
};

const STEREOTYPE: Partial<Record<Kind, string>> = {
  interface: '«interface»',
  abstract: '«abstract»',
  enum: '«enumeration»',
  record: '«record»',
};

const KIND_ACCENT: Record<Kind, string> = {
  class: 'border-info/40',
  abstract: 'border-insight/30',
  interface: 'border-insight/50',
  enum: 'border-warning/40',
  record: 'border-success/40',
};

const REL_META: Record<RelType, { glyph: string; name: string; describe: (r: UmlRelation) => string }> = {
  extends: { glyph: '───▷', name: 'Inheritance', describe: (r) => `${r.from} is a ${r.to} (extends)` },
  implements: { glyph: '- - -▷', name: 'Realization', describe: (r) => `${r.from} implements ${r.to}` },
  composition: {
    glyph: '◆───',
    name: 'Composition',
    describe: (r) => `${r.from} owns ${r.to}; the part's lifetime is bound to the whole`,
  },
  aggregation: {
    glyph: '◇───',
    name: 'Aggregation',
    describe: (r) => `${r.from} has ${r.to}, which can exist independently`,
  },
  association: { glyph: '───>', name: 'Association', describe: (r) => `${r.from} holds a reference to ${r.to}` },
  dependency: { glyph: '- - ->', name: 'Dependency', describe: (r) => `${r.from} uses ${r.to} transiently` },
};

const VISIBILITY_COLOUR: Record<string, string> = { '+': 'text-success', '-': 'text-danger', '#': 'text-warning', '~': 'text-info' };

const member = (text: string) => {
  const visibility = text[0];
  const hasVisibility = '+-#~'.includes(visibility);
  const body = escapeHtml(hasVisibility ? text.slice(1).trim() : text);
  const mark = hasVisibility ? `<span class="${VISIBILITY_COLOUR[visibility]} mr-1">${escapeHtml(visibility)}</span>` : '';
  return `<li class="font-mono text-[12px] leading-5 break-words text-fg-soft">${mark}${body}</li>`;
};

const classBox = (c: UmlClass) => {
  const stereotype = STEREOTYPE[c.kind]
    ? `<div class="font-mono text-[10px] text-muted">${STEREOTYPE[c.kind]}</div>`
    : '';
  const name = `<div class="${cx('font-mono text-sm font-semibold text-fg', c.kind === 'abstract' && 'italic')}">${escapeHtml(c.name)}</div>`;
  const fields = c.fields.length
    ? `<ul class="border-b border-border px-3 py-2 last:border-b-0">${c.fields.map(member).join('')}</ul>`
    : '';
  const methods = c.methods.length ? `<ul class="px-3 py-2">${c.methods.map(member).join('')}</ul>` : '';
  return (
    `<div class="${cx('rounded-lg border bg-bg', KIND_ACCENT[c.kind])}">` +
    `<div class="border-b border-border px-3 py-2 text-center">${stereotype}${name}</div>${fields}${methods}</div>`
  );
};

const relation = (r: UmlRelation) => {
  const meta = REL_META[r.type];
  const parts = [
    `<span class="font-semibold text-fg">${escapeHtml(r.from)}</span>`,
    r.fromMult ? `<span class="text-muted">${escapeHtml(r.fromMult)}</span>` : '',
    `<span class="text-accent" aria-hidden="true">${meta.glyph}</span>`,
    r.toMult ? `<span class="text-muted">${escapeHtml(r.toMult)}</span>` : '',
    `<span class="font-semibold text-fg">${escapeHtml(r.to)}</span>`,
    r.label ? `<span class="font-sans text-muted">: ${escapeHtml(r.label)}</span>` : '',
  ].join('');
  const multiplicity = r.toMult ? ` (multiplicity ${escapeHtml(r.toMult)})` : '';
  return (
    `<li class="rounded-lg border border-border bg-bg px-3 py-2">` +
    `<div class="flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-[12px]">${parts}</div>` +
    `<p class="mt-1 text-xs text-muted"><span class="font-medium text-fg-soft">${meta.name}.</span> ${escapeHtml(meta.describe(r))}${multiplicity}.</p></li>`
  );
};

/** The class diagram as HTML (a `<figure>`); every piece of the source is escaped. */
export const renderUml = (source: string, title?: string) => {
  const { classes, relations } = parseUml(source);
  const grid = classes.length
    ? `<div class="grid grid-cols-[repeat(auto-fill,minmax(210px,1fr))] gap-3">${classes.map(classBox).join('')}</div>`
    : '';
  const rels = relations.length
    ? `<div class="${classes.length ? 'mt-5' : ''}"><h4 class="mb-2 text-xs font-semibold tracking-wider text-muted uppercase">Relationships</h4>` +
      `<ul class="space-y-2">${relations.map(relation).join('')}</ul></div>`
    : '';
  return (
    `<figure class="not-prose my-6 rounded-xl border border-border bg-surface p-4 sm:p-5">` +
    `<figcaption class="mb-4 text-xs font-semibold tracking-wider text-muted uppercase">${escapeHtml(title ?? 'Class diagram')}</figcaption>` +
    `${grid}${rels}</figure>`
  );
};
