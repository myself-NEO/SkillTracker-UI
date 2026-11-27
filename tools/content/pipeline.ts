import type { Element, ElementContent, Root, RootContent } from 'hast';
import rehypeSlug from 'rehype-slug';
import rehypeStringify from 'rehype-stringify';
import remarkGfm from 'remark-gfm';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import { unified } from 'unified';
import { CONTENT_DOC_VERSION, type ContentDoc, type InlineText, type Widget } from '@lib/content/doc';
import { renderStates } from '@lib/diagrams/states';
import { renderUml } from '@lib/diagrams/uml';
import { rehypeCallouts } from '@lib/markdown/callouts';
import { type HastNode, parseMeta, textOf } from '@lib/markdown/hast';
import { safeUrl, transformUrl } from '@lib/markdown/links';
import { prepareMarkdown } from '@lib/markdown/preprocess';
import { tocHeadings } from '@lib/markdown/toc';
import { questionHash } from '@lib/progress/hash';
import { splitScrolly } from '@lib/viz/fence';
import { sceneInfo } from '@lib/viz/registry';
import { parseSceneParams } from '@lib/viz/schemas';
import type { VizMode } from '@lib/viz/types';
import { parseChecklist, parseDrills, parseQuiz } from '@lib/widgets/formats';
import { highlight, highlightLines } from './highlight';
import {
  calloutClasses,
  CALLOUTS,
  codeBlockHtml,
  INLINE_CODE_CLASS,
  isRevealKind,
  placeholderHtml,
  revealHtml,
  revealTitle,
  TABLE_CLASS,
  TABLE_WRAPPER_CLASS,
  vizProblemHtml,
} from './render';

// Lesson Markdown → the HTML and widget data of a ContentDoc (src/lib/content/doc.ts). It renders
// what TheSWEguide's Markdown.tsx rendered with React, with the same dialect:
//
//   > [!NOTE] / [!TIP] / [!WARNING] / [!INTERVIEW] Optional title   → callout
//   ```java title="Ticket.java"                                     → highlighted, copyable code
//   ```java file="Demo.java" java="21" (preview="true")              → … with a Java version badge
//   ```uml / ```states                                              → class / state diagrams (static HTML)
//   ```mermaid / ```quiz / ```drill / ```estimator / ```checklist    → widgets (placeholders + data)
//   ```viz name="…" mode="…" / ````scrolly name="…"                 → animations (placeholders + data)
//   ````hint / ````solution / ````reveal / ````question title="…"    → collapsed blocks
//   [text](lesson:slug) and [text](problem:slug)                     → links within the current track
//
// Reveal bodies and scrolly steps are Markdown too: each is rendered by its own run of the
// pipeline, as TheSWEguide did, so their headings get ids independent of the page's sections.

export interface RenderOptions {
  /** The track's route prefix (e.g. "/java"), used to resolve lesson: and problem: links. */
  basePath: string;
  /** Baseline Java release: runnable examples (```java file="…") get a version badge. */
  javaVersion?: number;
}

interface Context extends RenderOptions {
  widgets: Widget[];
  questions: ContentDoc['questions'];
}

/** The ContentDoc of one lesson, problem or cheat sheet. */
export const renderDoc = async (markdown: string, options: RenderOptions): Promise<ContentDoc> => {
  const context: Context = { ...options, widgets: [], questions: {} };
  const html = await renderMarkdown(markdown, context);
  return { v: CONTENT_DOC_VERSION, toc: tocHeadings(markdown), html, widgets: context.widgets, questions: context.questions };
};

const renderMarkdown = async (markdown: string, context: Context): Promise<string> => {
  const file = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype) // raw HTML in the Markdown is dropped, as on TheSWEguide
    .use(rehypeSlug)
    .use(rehypeCallouts)
    .use(rehypeContent, context)
    .use(rehypeStringify, { allowDangerousHtml: true }) // only for the raw nodes this pipeline builds
    .process(prepareMarkdown(markdown));
  return String(file);
};

const rehypeContent = (context: Context) => async (tree: Root) => {
  await transformChildren(tree, context);
};

const raw = (value: string): RootContent => ({ type: 'raw', value }) as RootContent;

const element = (tagName: string, properties: Element['properties'], children: ElementContent[]): Element => ({
  type: 'element',
  tagName,
  properties,
  children,
});

/** Rewrites a parent's children in document order (in order, so widget numbers are stable). */
const transformChildren = async (parent: Root | Element, context: Context) => {
  const out: RootContent[] = [];
  for (const child of parent.children) {
    if (child.type !== 'element') {
      out.push(child);
      continue;
    }
    const first = child.children[0];
    if (child.tagName === 'pre' && first?.type === 'element' && first.tagName === 'code') {
      out.push(...(await fence(first, context)));
      continue;
    }
    await transformChildren(child, context);
    if (child.tagName === 'blockquote' && typeof child.properties?.dataCallout === 'string' && CALLOUTS[child.properties.dataCallout]) {
      out.push(callout(child));
    } else if (child.tagName === 'table') {
      out.push(element('div', { className: TABLE_WRAPPER_CLASS.split(' '), tabIndex: 0 }, [
        { ...child, properties: { ...child.properties, className: TABLE_CLASS.split(' ') } },
      ]));
    } else {
      if (child.tagName === 'a') fixLink(child, context.basePath);
      if (child.tagName === 'img' && typeof child.properties?.src === 'string') child.properties.src = safeUrl(child.properties.src);
      out.push(child);
    }
  }
  parent.children = out as typeof parent.children;
};

/** `> [!TIP] Title` (tagged by rehypeCallouts) → a titled note box. */
const callout = (quote: Element): Element => {
  const type = quote.properties!.dataCallout as string;
  const meta = CALLOUTS[type];
  const classes = calloutClasses(type);
  const title = (quote.properties!.dataCalloutTitle as string) || meta.label;
  return element('div', { role: 'note', ariaLabel: meta.label, className: classes.box.split(' ') }, [
    element('p', { className: classes.title.split(' ') }, [raw(meta.icon) as ElementContent, { type: 'text', value: title }]),
    element('div', { className: classes.body.split(' ') }, quote.children.filter((c) => !(c.type === 'text' && !c.value.trim()))),
  ]);
};

/** External links open in a new tab; lesson: and problem: links resolve within the track. */
const fixLink = (link: Element, basePath: string) => {
  const href = typeof link.properties?.href === 'string' ? transformUrl(link.properties.href, basePath) : '';
  link.properties = { ...link.properties, href: href || undefined };
  if (/^https?:\/\//.test(href)) {
    link.properties.target = '_blank';
    link.properties.rel = ['noreferrer'];
  }
};

/** A fenced block: a widget, a diagram, a reveal block or highlighted code. */
const fence = async (code: Element, context: Context): Promise<RootContent[]> => {
  const classes = (code.properties?.className as string[] | undefined) ?? [];
  const language = classes.find((c) => c.startsWith('language-'))?.slice('language-'.length);
  const meta = parseMeta((code.data as { meta?: string } | undefined)?.meta);
  const source = textOf(code as HastNode);

  switch (language) {
    case 'quiz':
      return [placeholder(context, quizWidget(source))];
    case 'drill':
      return [placeholder(context, drillWidget(source))];
    case 'checklist':
      return [placeholder(context, { type: 'checklist', title: meta.title, items: parseChecklist(source).map(inline) })];
    case 'estimator':
      return [placeholder(context, { type: 'estimator', title: meta.title, preset: source })];
    case 'mermaid':
      return [placeholder(context, { type: 'mermaid', title: meta.title, source })];
    case 'uml':
      return [raw(renderUml(source, meta.title))];
    case 'states':
      return [raw(renderStates(source, meta.title))];
    case 'viz':
      return [await animation(context, meta.name, meta.mode, source)];
    case 'scrolly': {
      const { json, steps } = splitScrolly(source);
      return [await animation(context, meta.name, 'scrolly', json, steps)];
    }
  }

  if (isRevealKind(language)) {
    const heading = revealTitle(language, meta.title);
    const questionId = language === 'question' ? `q-${questionHash(heading)}` : undefined;
    if (questionId) context.questions[questionId] = { title: heading, body: source };
    return [raw(revealHtml(language, heading, await renderMarkdown(source, context), questionId))];
  }

  const text = source.replace(/\n$/, '');
  const version = meta.java ? Number(meta.java) : language === 'java' && meta.file ? context.javaVersion : undefined;
  return [
    raw(
      codeBlockHtml(await highlight(text, language?.toLowerCase()), {
        language,
        title: meta.title ?? meta.file,
        version,
        preview: meta.preview === 'true',
      }),
    ),
  ];
};

const placeholder = (context: Context, widget: Widget) => {
  context.widgets.push(widget);
  return raw(placeholderHtml(context.widgets.length - 1));
};

/** An animation block: checked against its scene's schema, its code highlighted, its steps rendered. */
const animation = async (
  context: Context,
  name: string | undefined,
  mode: string | undefined,
  json: string,
  steps?: string[],
): Promise<RootContent> => {
  const info = sceneInfo(name);
  if (!info) return raw(vizProblemHtml(`There is no animation called “${name ?? ''}”.`));
  const parsed = parseSceneParams(info.id, json);
  if ('error' in parsed) return raw(vizProblemHtml(`${info.title}: ${parsed.error}`));
  const chosen: VizMode = steps ? 'scrolly' : mode && (info.modes as string[]).includes(mode) ? (mode as VizMode) : info.modes[0];
  const code = info.code
    ? { label: info.code.label, lines: await highlightLines(info.code.source, info.code.language) }
    : undefined;
  const stepHtml: string[] = [];
  for (const step of steps ?? []) stepHtml.push(await renderMarkdown(step, context));
  return placeholder(context, {
    type: 'viz',
    scene: info.id,
    title: info.title,
    mode: chosen,
    params: parsed.params,
    code,
    steps: steps ? stepHtml : undefined,
  });
};

// --- Widgets whose text is short Markdown (quiz, drill, checklist) -----------------------------

const inlineProcessor = unified().use(remarkParse).use(remarkRehype).use(rehypeInline).use(rehypeStringify);

/** Paragraphs unwrap to their content; inline code gets the widget style; links stay safe. */
function rehypeInline() {
  return (tree: Root) => {
    const walk = (parent: Root | Element) => {
      const out: RootContent[] = [];
      for (const child of parent.children) {
        if (child.type === 'element') {
          walk(child);
          if (child.tagName === 'p') {
            out.push(...child.children);
            continue;
          }
          if (child.tagName === 'code') child.properties = { ...child.properties, className: INLINE_CODE_CLASS.split(' ') };
          if (child.tagName === 'a' && typeof child.properties?.href === 'string') {
            child.properties.href = safeUrl(child.properties.href) || undefined;
          }
        }
        out.push(child);
      }
      parent.children = out as typeof parent.children;
    };
    walk(tree);
  };
}

/** A short piece of widget text: as written, and as HTML. */
export const inline = (text: string): InlineText => ({ text, html: String(inlineProcessor.processSync(text)).trim() });

const quizWidget = (source: string): Widget => ({
  type: 'quiz',
  questions: parseQuiz(source).map((q) => ({
    prompt: inline(q.prompt),
    options: q.options.map((o) => ({ text: inline(o.text), correct: o.correct, reason: o.reason ? inline(o.reason) : undefined })),
    explanation: inline(q.explanation),
  })),
});

const drillWidget = (source: string): Widget => {
  const { questions, errors } = parseDrills(source);
  return {
    type: 'drill',
    errors,
    questions: questions.map(({ prompt, solution, ...rest }) => ({ ...rest, prompt: inline(prompt), solution: inline(solution) })),
  };
};
