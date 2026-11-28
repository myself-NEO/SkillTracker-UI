import { parseStates } from '@lib/diagrams/states';
import { parseUml } from '@lib/diagrams/uml';
import { parsePreset } from '@lib/widgets/estimate';
import { parseChecklist, parseDrills, parseQuiz } from '@lib/widgets/formats';
import { diagramType } from '@lib/diagrams/mermaid';
import { parseMeta } from '@lib/markdown/hast';
import { BUILDERS } from '@lib/viz/builders';
import { splitScrolly } from '@lib/viz/fence';
import { sceneInfo } from '@lib/viz/registry';
import { parseSceneParams } from '@lib/viz/schemas';
import { RESERVED_SEGMENTS } from '@lib/routes';
import type { ContentManifest } from './manifest';
import type { ScannedFence } from './markdown-scan';

const reserved: ReadonlySet<string> = new Set(RESERVED_SEGMENTS);

/** Lessons whose slug would shadow a section page such as /java/problems, as "topic/slug". */
export const reservedSlugCollisions = (manifest: ContentManifest): string[] =>
  Object.entries(manifest.lessons).flatMap(([topic, slugs]) =>
    slugs.filter((slug) => reserved.has(slug)).map((slug) => `${topic}/${slug}`),
  );

// Checks on single pieces of content. Each returns the problems it finds as messages; the
// validator (tools/content/validate.ts) attaches the file and line.

/** Code fence languages the site highlights or shows as text (`text` blocks are diagrams). */
export const CODE_LANGUAGES = new Set([
  '',
  'java',
  'text',
  'txt',
  'sql',
  'cql',
  'http',
  'bash',
  'sh',
  'yaml',
  'lua',
  'json',
  'redis',
  'protobuf',
  'properties',
  'javascript',
  'graphql',
  'xml',
]);

/** Fence languages that render as widgets or collapsible blocks. */
export const WIDGET_LANGUAGES = new Set([
  'quiz',
  'uml',
  'states',
  'mermaid',
  'estimator',
  'drill',
  'checklist',
  'hint',
  'solution',
  'reveal',
  'question',
  'viz',
  'scrolly',
]);

const MERMAID_TYPES = new Set([
  'flowchart',
  'graph',
  'sequenceDiagram',
  'classDiagram',
  'stateDiagram',
  'stateDiagram-v2',
  'erDiagram',
  'journey',
  'gantt',
  'pie',
  'quadrantChart',
  'requirementDiagram',
  'gitGraph',
  'mindmap',
  'timeline',
  'sankey-beta',
  'xychart-beta',
  'block-beta',
  'architecture-beta',
]);

export interface FenceFindings {
  errors: string[];
  warnings: string[];
}

/** Problems with one fenced block: widgets whose content doesn't parse, unknown languages. */
export const checkFence = (fence: ScannedFence): FenceFindings => {
  const errors: string[] = [];
  const warnings: string[] = [];
  const { lang, value } = fence;
  switch (lang) {
    case 'quiz': {
      const questions = parseQuiz(value);
      const prompts = value.split('\n').filter((line) => line.trim().startsWith('? ')).length;
      if (questions.length === 0) errors.push('quiz has no question with a correct (+) option');
      else if (questions.length < prompts)
        errors.push(`quiz: ${prompts - questions.length} of ${prompts} questions have no correct (+) option`);
      for (const q of questions)
        if (q.options.length < 2) errors.push(`quiz question "${q.prompt}" has fewer than two options`);
      break;
    }
    case 'drill': {
      const { questions, errors: drillErrors } = parseDrills(value);
      errors.push(...drillErrors.map((e) => `drill: ${e}`));
      if (questions.length === 0 && drillErrors.length === 0) errors.push('drill has no questions');
      break;
    }
    case 'estimator':
      errors.push(...parsePreset(value).errors.map((e) => `estimator: ${e}`));
      break;
    case 'checklist':
      if (parseChecklist(value).length === 0) errors.push('checklist has no "- " items');
      break;
    case 'uml':
      if (parseUml(value).classes.length === 0) errors.push('uml diagram has no classes');
      break;
    case 'states':
      if (parseStates(value).states.length === 0) errors.push('state diagram has no states');
      break;
    case 'viz':
    case 'scrolly':
      errors.push(...checkAnimation(fence));
      break;
    case 'mermaid': {
      const type = diagramType(value);
      if (!MERMAID_TYPES.has(type))
        warnings.push(`mermaid diagram type "${type}" is not one the site has been checked with`);
      break;
    }
    default:
      if (!CODE_LANGUAGES.has(lang) && !WIDGET_LANGUAGES.has(lang))
        warnings.push(`unknown fence language "${lang}": it renders as plain text`);
  }
  const javaVersion = /\bjava="([^"]*)"/.exec(fence.meta)?.[1];
  if (javaVersion !== undefined && !/^\d+$/.test(javaVersion))
    errors.push(`java="${javaVersion}" must be a Java release number`);
  return { errors, warnings };
};

/**
 * Problems with an animation block: an unknown scene, parameters its schema rejects, a mode it
 * can't play in, or (for a scroll-driven block) a number of steps that isn't its number of frames.
 */
export const checkAnimation = (fence: ScannedFence): string[] => {
  const meta = parseMeta(fence.meta);
  const info = sceneInfo(meta.name);
  if (!info) return [`${fence.lang} block: there is no animation called "${meta.name ?? ''}" (src/lib/viz/registry.ts)`];
  const scrolly = fence.lang === 'scrolly';
  const { json, steps } = scrolly ? splitScrolly(fence.value) : { json: fence.value, steps: [] };
  const parsed = parseSceneParams(info.id, json);
  if ('error' in parsed) return [`${info.id}: ${parsed.error}`];
  const errors: string[] = [];
  if (scrolly) {
    if (!info.modes.includes('scrolly'))
      errors.push(`${info.id} can't be scroll-driven (it plays as ${info.modes.join(' or ')})`);
    const frames = BUILDERS[info.id]?.(parsed.params).length ?? 0;
    if (steps.length !== frames)
      errors.push(`${info.id}: the scrolly block has ${steps.length} step(s) but the scene has ${frames} frame(s)`);
    steps.forEach((step, index) => {
      if (!step) errors.push(`${info.id}: step ${index + 1} of the scrolly block is empty`);
    });
  } else if (meta.mode && !(info.modes as string[]).includes(meta.mode)) {
    errors.push(`${info.id}: mode="${meta.mode}" is not one of ${info.modes.join(', ')}`);
  }
  return errors;
};

/**
 * Required sections (in order) that a body's `##` headings lack. Other sections may appear
 * between them. Returns the missing ones, or the out-of-order ones when none is missing.
 */
export const sectionProblems = (headings: readonly string[], required: readonly string[]) => {
  const missing = required.filter((section) => !headings.includes(section));
  if (missing.length > 0) return { missing, outOfOrder: [] as string[] };
  const positions = required.map((section) => headings.indexOf(section));
  const outOfOrder = required.filter((_, i) => i > 0 && positions[i] < positions[i - 1]);
  return { missing, outOfOrder };
};

/**
 * Positions of `#java/...`-style hash routes left over from the portfolio the content came from:
 * every link must be a path (`/java/...`), a `lesson:` or a `problem:` link.
 */
export const leftoverHashRoutes = (text: string) =>
  [...text.matchAll(/(?<=['"`(])#(?:java|dsa|system-design|learning)(?=[/'"`)$])/g)].map((m) => m.index);

/** Values that appear more than once. */
export const duplicates = (values: readonly string[]) => {
  const seen = new Set<string>();
  const repeated = new Set<string>();
  for (const value of values) (seen.has(value) ? repeated : seen).add(value);
  return [...repeated];
};

export interface SiteRoutes {
  /** Paths the site serves. */
  pages: ReadonlySet<string>;
}

export type LinkVerdict = 'ok' | 'external' | 'anchor' | { broken: string };

/**
 * Whether a link in a lesson of the track with `basePath` resolves. `lesson:` and `problem:`
 * links point within the track; absolute paths must be pages the site serves.
 */
export const checkLink = (url: string, basePath: string, routes: SiteRoutes): LinkVerdict => {
  if (/^(https?:|mailto:)/.test(url)) return 'external';
  if (url.startsWith('#')) return 'anchor';
  let path: string;
  if (url.startsWith('lesson:')) path = `${basePath}/${url.slice('lesson:'.length)}`;
  else if (url.startsWith('problem:')) path = `${basePath}/problems/${url.slice('problem:'.length)}`;
  else if (url.startsWith('/')) path = url;
  else return { broken: `relative link "${url}": use lesson:, problem: or an absolute path` };
  const [pathname] = path.split('#');
  if (routes.pages.has(pathname)) return 'ok';
  return { broken: `"${url}" points to ${pathname}, which is not a page of the site` };
};
