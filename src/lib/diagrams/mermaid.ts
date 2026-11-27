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

/**
 * Mermaid's colours for each theme. Mermaid derives shades from these, so they are colour values
 * rather than CSS variables; each set matches the site's tokens for its theme.
 */
export const MERMAID_THEME_VARIABLES: Record<Theme, Record<string, string | boolean>> = {
  light: {
    darkMode: false,
    background: '#f3f5f9',
    primaryColor: '#ffffff',
    primaryTextColor: '#0d1526',
    primaryBorderColor: '#8591a5',
    secondaryColor: '#eef1f6',
    tertiaryColor: '#f6f8fb',
    lineColor: '#586579',
    textColor: '#2c384d',
    edgeLabelBackground: '#f3f5f9',
    clusterBkg: '#f6f8fb',
    clusterBorder: '#c5cdda',
    noteBkgColor: '#fdf2e1',
    noteTextColor: '#2c384d',
    noteBorderColor: '#e2b77a',
    actorBkg: '#ffffff',
    actorBorder: '#0369a1',
    actorTextColor: '#0d1526',
    actorLineColor: '#8591a5',
    signalColor: '#586579',
    signalTextColor: '#0d1526',
    labelBoxBkgColor: '#eef1f6',
    labelBoxBorderColor: '#8591a5',
    labelTextColor: '#0d1526',
    loopTextColor: '#2c384d',
    activationBkgColor: '#e2e7ef',
    activationBorderColor: '#8591a5',
    sequenceNumberColor: '#ffffff',
  },
  dark: {
    darkMode: true,
    background: '#0c1324',
    primaryColor: '#1e293b',
    primaryTextColor: '#e2e8f0',
    primaryBorderColor: '#475569',
    secondaryColor: '#172033',
    tertiaryColor: '#0b1220',
    lineColor: '#64748b',
    textColor: '#cbd5e1',
    edgeLabelBackground: '#0c1324',
    clusterBkg: '#0b1220',
    clusterBorder: '#334155',
    noteBkgColor: '#1e293b',
    noteTextColor: '#e2e8f0',
    noteBorderColor: '#475569',
    actorBkg: '#1e293b',
    actorBorder: '#38bdf8',
    actorTextColor: '#e2e8f0',
    actorLineColor: '#475569',
    signalColor: '#94a3b8',
    signalTextColor: '#e2e8f0',
    labelBoxBkgColor: '#1e293b',
    labelBoxBorderColor: '#475569',
    labelTextColor: '#e2e8f0',
    loopTextColor: '#cbd5e1',
    activationBkgColor: '#334155',
    activationBorderColor: '#64748b',
    sequenceNumberColor: '#0f172a',
  },
};

/** Colour of the message or edge being stepped through. */
export const MERMAID_STEP_COLOR: Record<Theme, string> = { light: '#0284c7', dark: '#38bdf8' };
