// Helpers of the architecture-diagram editor in the HLD mock interview (a Mermaid flowchart the
// learner writes, with a palette that inserts components and a helper that connects two), ported
// from TheSWEguide's DiagramEditor.tsx. The classes (:::client, :::db, …) are styled by
// lib/diagrams/mermaid.ts.

export const STARTER_DIAGRAM = `flowchart LR
  C[Client]:::client --> LB[Load balancer]:::lb
  LB --> S[Service]:::svc
  S --> DB[(Database)]:::db
`;

export interface PaletteItem {
  label: string;
  /** Node ids of this kind are the prefix and a number: S1, S2, … */
  prefix: string;
  shape: (id: string, label: string) => string;
}

export const PALETTE: PaletteItem[] = [
  { label: 'Client', prefix: 'C', shape: (id, label) => `${id}[${label}]:::client` },
  { label: 'CDN', prefix: 'CDN', shape: (id, label) => `${id}[${label}]:::lb` },
  { label: 'Load balancer', prefix: 'LB', shape: (id, label) => `${id}[${label}]:::lb` },
  { label: 'API gateway', prefix: 'GW', shape: (id, label) => `${id}[${label}]:::lb` },
  { label: 'Service', prefix: 'S', shape: (id, label) => `${id}[${label}]:::svc` },
  { label: 'Worker', prefix: 'W', shape: (id, label) => `${id}[${label}]:::svc` },
  { label: 'Database', prefix: 'DB', shape: (id, label) => `${id}[(${label})]:::db` },
  { label: 'Cache', prefix: 'CA', shape: (id, label) => `${id}[(${label})]:::cache` },
  { label: 'Queue', prefix: 'Q', shape: (id, label) => `${id}[[${label}]]:::queue` },
  { label: 'Object storage', prefix: 'OS', shape: (id, label) => `${id}[(${label})]:::store` },
  { label: 'Search index', prefix: 'SE', shape: (id, label) => `${id}[(${label})]:::db` },
  { label: 'External service', prefix: 'X', shape: (id, label) => `${id}[${label}]:::ext` },
];

const KEYWORD = /^(flowchart|graph|subgraph|end|classDef|class|style|linkStyle|direction|click)$/;
const STATEMENT = /^(flowchart|graph|classDef|class|style|linkStyle|direction|subgraph|end)\b/;

/** Node ids declared or used in a flowchart, in order of first appearance. */
export const nodeIds = (source: string): string[] => {
  const ids: string[] = [];
  for (const raw of source.split('\n')) {
    const line = raw.trim();
    if (!line || line.startsWith('%%') || STATEMENT.test(line)) continue;
    // Each side of an arrow starts with a node id, optionally after an |edge label|.
    for (const part of line.split(/<-->|-->|-\.->|==>|---|--x|--o|&/)) {
      const id = part
        .trim()
        .replace(/^\|[^|]*\|\s*/, '')
        .match(/^([A-Za-z]\w*)/)?.[1];
      if (id && !KEYWORD.test(id) && !ids.includes(id)) ids.push(id);
    }
  }
  return ids;
};

/** The first unused id with the prefix: "S1", then "S2", … */
export const nextId = (source: string, prefix: string) => {
  const used = new Set(nodeIds(source));
  for (let i = 1; ; i++) if (!used.has(`${prefix}${i}`)) return `${prefix}${i}`;
};

/** Whether the source is a flowchart (its first line that isn't a comment says so). */
export const isFlowchart = (source: string) =>
  /^\s*(flowchart|graph)\b/.test(source.split('\n').find((line) => line.trim() && !line.trim().startsWith('%%')) ?? '');

/** The source with a line added at the end (and a flowchart header first, when it was empty). */
export const appendLine = (source: string, line: string) => {
  const base = source.trim() ? source.replace(/\s*$/, '\n') : 'flowchart LR\n';
  return `${base}  ${line}\n`;
};

/** An arrow between two nodes, with an optional label (pipes would end the label, so they become slashes). */
export const arrow = (from: string, to: string, label = '') => {
  const text = label.trim().replace(/[|]/g, '/');
  return text ? `${from} -->|${text}| ${to}` : `${from} --> ${to}`;
};
