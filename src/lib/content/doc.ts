import type { TocHeading } from '@lib/markdown/toc';
import type { DrillQuestion } from '@lib/widgets/formats';
import type { SceneCode, VizMode } from '@lib/viz/types';

// The JSON the content build (tools/content/build.ts) writes for every lesson, problem and cheat
// sheet, and the app reads: public/content/<topic>/<lessons|problems|cheatsheets>/<slug>.json.
//
// `html` is the page body, highlighted and laid out at build time. Interactive pieces are empty
// placeholders, `<div data-w="N"></div>`, whose data is `widgets[N]`; the app mounts its widget
// components into them. Placeholders may sit inside reveal blocks (`<details data-reveal>`).

export const CONTENT_DOC_VERSION = 1;

/** A short piece of Markdown, kept as written (progress is keyed by hashes of it) and as HTML. */
export interface InlineText {
  text: string;
  html: string;
}

export interface QuizWidget {
  type: 'quiz';
  questions: {
    prompt: InlineText;
    options: { text: InlineText; correct: boolean; reason?: InlineText }[];
    explanation: InlineText;
  }[];
}

export interface DrillWidget {
  type: 'drill';
  questions: (Omit<DrillQuestion, 'prompt' | 'solution'> & { prompt: InlineText; solution: InlineText })[];
  errors: string[];
}

export interface ChecklistWidget {
  type: 'checklist';
  title?: string;
  items: InlineText[];
}

export interface EstimatorWidget {
  type: 'estimator';
  title?: string;
  /** The block's preset, parsed by the widget (lib/widgets/estimate.ts). */
  preset: string;
}

export interface MermaidWidget {
  type: 'mermaid';
  title?: string;
  source: string;
}

export interface VizWidget {
  type: 'viz';
  scene: string;
  title: string;
  mode: VizMode;
  /** Checked against the scene's schema at build time, with its defaults filled in. */
  params: unknown;
  code?: SceneCode;
  /** Scroll-driven mode: each step's HTML, shown beside the frame with the same number. */
  steps?: string[];
}

export type Widget = QuizWidget | DrillWidget | ChecklistWidget | EstimatorWidget | MermaidWidget | VizWidget;

export interface ContentDoc {
  v: typeof CONTENT_DOC_VERSION;
  /** The body's h2 and h3 sections, with the ids its headings have. */
  toc: TocHeading[];
  html: string;
  widgets: Widget[];
  /** Interview-question reveal blocks by their id (`q-<hash of the title>`), for notebook bookmarks. */
  questions: Record<string, { title: string; body: string }>;
}
