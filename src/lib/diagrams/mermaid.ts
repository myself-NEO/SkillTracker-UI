// Mermaid helpers free of any UI framework: the content validator uses diagramType, and the
// diagram widget uses prepareSource before handing the source to Mermaid in the browser.
// Ported from TheSWEguide's MermaidDiagram.tsx.

export type Theme = 'light' | 'dark';

/** Node classes the flowcharts can use (`class A db`), in each theme's colours. */
const CLASS_DEFS: Record<Theme, string[]> = {
  light: [
    'classDef client fill:#e0f2fe,stroke:#0284c7,color:#0c4a6e',
    'classDef lb fill:#e0e7ff,stroke:#6366f1,color:#312e81',
    'classDef svc fill:#ffffff,stroke:#0284c7,color:#0f172a',
    'classDef db fill:#d1fae5,stroke:#059669,color:#064e3b',
    'classDef cache fill:#fee2e2,stroke:#dc2626,color:#7f1d1d',
    'classDef queue fill:#fef3c7,stroke:#d97706,color:#78350f',
    'classDef store fill:#f3e8ff,stroke:#9333ea,color:#3b0764',
    'classDef ext fill:#f5f5f5,stroke:#737373,color:#262626,stroke-dasharray:4 3',
  ],
  dark: [
    'classDef client fill:#0c4a6e,stroke:#38bdf8,color:#e0f2fe',
    'classDef lb fill:#1e1b4b,stroke:#818cf8,color:#e0e7ff',
    'classDef svc fill:#1e293b,stroke:#38bdf8,color:#e2e8f0',
    'classDef db fill:#064e3b,stroke:#34d399,color:#d1fae5',
    'classDef cache fill:#7f1d1d,stroke:#f87171,color:#fee2e2',
    'classDef queue fill:#78350f,stroke:#fbbf24,color:#fef3c7',
    'classDef store fill:#3b0764,stroke:#c084fc,color:#f3e8ff',
    'classDef ext fill:#262626,stroke:#a3a3a3,color:#e5e5e5,stroke-dasharray:4 3',
  ],
};

/** Adds the shared node classes, in the theme's colours, to flowcharts (after the header line). */
export const prepareSource = (source: string, theme: Theme) => {
  const lines = source.replace(/\r\n?/g, '\n').split('\n');
  const header = lines.findIndex((l) => l.trim() && !l.trim().startsWith('%%'));
  if (header === -1 || !/^(flowchart|graph)\b/.test(lines[header].trim())) return lines.join('\n');
  return [...lines.slice(0, header + 1), ...CLASS_DEFS[theme].map((d) => `  ${d}`), ...lines.slice(header + 1)].join(
    '\n',
  );
};

/** The diagram type: the first word of the first line that isn't a %% comment, e.g. "sequenceDiagram". */
export const diagramType = (source: string) => {
  const first =
    source
      .split('\n')
      .find((l) => l.trim() && !l.trim().startsWith('%%'))
      ?.trim() ?? '';
  return first.split(/\s+/)[0];
};
