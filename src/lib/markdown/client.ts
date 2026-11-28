import type { Element, ElementContent, Root, RootContent } from 'hast';
import remarkGfm from 'remark-gfm';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import { unified } from 'unified';
import { renderStates } from '@lib/diagrams/states';
import { renderUml } from '@lib/diagrams/uml';
import {
  CALLOUT_STYLES,
  calloutClasses,
  ICON_ATTRIBUTES,
  isRevealKind,
  REVEAL_STYLES,
  revealClasses,
  revealTitle,
  TABLE_CLASS,
  TABLE_WRAPPER_CLASS,
} from './blocks';
import { rehypeCallouts } from './callouts';
import { type HastNode, parseMeta, textOf } from './hast';
import { safeUrl, transformUrl } from './links';
import { prepareMarkdown } from './preprocess';

// Markdown rendered in the browser: notes the learner wrote and model answers they saved (the
// notebook). It follows the lesson dialect, as TheSWEguide's ClientMarkdown did: GFM, callouts,
// reveal blocks, class and state diagrams, Mermaid (drawn by the app), lesson: and problem: links.
// Code is shown plain, since the highlighter runs at build time only.
//
// This text comes from the learner (or a backup file), not from the build, so it is never used as
// HTML. The Markdown is parsed to a syntax tree (raw HTML in it is dropped, as in the build), and
// the page elements are created from that tree one by one: only the elements and attributes below,
// text always as text, and links and images only with safe URLs.

const SVG_NS = 'http://www.w3.org/2000/svg';

/** Elements GFM Markdown produces, and those of the class and state diagrams. */
const ELEMENTS = new Set([
  'a', 'blockquote', 'br', 'caption', 'code', 'del', 'div', 'em', 'figcaption', 'figure', 'h1', 'h2', 'h3', 'h4', 'h5',
  'h6', 'hr', 'img', 'input', 'li', 'ol', 'p', 'pre', 'section', 'span', 'strong', 'sub', 'sup', 'table', 'tbody', 'td',
  'tfoot', 'th', 'thead', 'tr', 'ul',
]);

/** Attributes kept on any element; ids only as GFM writes them for footnotes (`user-content-…`). */
const GLOBAL_ATTRIBUTES = new Set(['class', 'title', 'aria-label', 'aria-hidden', 'aria-describedby', 'id']);

/** Attributes kept on particular elements; `href` and `src` are checked on top. */
const ELEMENT_ATTRIBUTES: Record<string, ReadonlySet<string>> = {
  a: new Set(['href']),
  img: new Set(['src', 'alt']),
  input: new Set(['type', 'checked']),
  ol: new Set(['start']),
  td: new Set(['align']),
  th: new Set(['align', 'scope']),
};

/** hast property names of the attributes above. */
const PROPERTY_NAMES: Record<string, string> = {
  className: 'class',
  title: 'title',
  ariaLabel: 'aria-label',
  ariaHidden: 'aria-hidden',
  ariaDescribedBy: 'aria-describedby',
  id: 'id',
  href: 'href',
  src: 'src',
  alt: 'alt',
  type: 'type',
  checked: 'checked',
  start: 'start',
  align: 'align',
  scope: 'scope',
};

const allowed = (tag: string, name: string) => GLOBAL_ATTRIBUTES.has(name) || (ELEMENT_ATTRIBUTES[tag]?.has(name) ?? false);

const PLAIN_CODE =
  'not-prose my-3 overflow-x-auto rounded-lg border border-border bg-code px-3 py-2.5 font-mono text-[13px] leading-relaxed text-fg';

// remark-rehype leaves raw HTML in the Markdown out of the tree (allowDangerousHtml is off).
const processor = unified().use(remarkParse).use(remarkGfm).use(remarkRehype).use(rehypeCallouts);

/** The syntax tree of some Markdown, with callouts tagged (rehypeCallouts). */
export const parseMarkdown = (markdown: string): Root => processor.runSync(processor.parse(prepareMarkdown(markdown))) as Root;

export interface MarkdownOptions {
  /** The track's route prefix (e.g. "/java"), for `lesson:` and `problem:` links. */
  basePath?: string;
  /**
   * Draws a ```mermaid block: gets the empty element to draw in, the source and the block's title.
   * Without it, the source shows as code.
   */
  mermaid?: (host: HTMLElement, source: string, title: string | undefined) => void;
}

/** Renders Markdown into new page elements (see the note at the top). */
export const renderMarkdown = (markdown: string, doc: Document, options: MarkdownOptions = {}): DocumentFragment => {
  const fragment = doc.createDocumentFragment();
  new Builder(doc, options).children(parseMarkdown(markdown).children, fragment);
  return fragment;
};

class Builder {
  constructor(
    private readonly doc: Document,
    private readonly options: MarkdownOptions,
  ) {}

  children(nodes: readonly (RootContent | ElementContent)[], parent: Node) {
    for (const node of nodes) this.node(node, parent);
  }

  private node(node: RootContent | ElementContent, parent: Node) {
    if (node.type === 'text') parent.appendChild(this.doc.createTextNode(node.value));
    else if (node.type === 'element') this.element(node, parent);
    // Comments, doctypes and raw HTML are never shown.
  }

  private element(node: Element, parent: Node) {
    const tag = node.tagName;
    const first = node.children[0];
    if (tag === 'pre' && first?.type === 'element' && first.tagName === 'code') return this.fence(first, parent);
    const props = node.properties ?? {};
    if (tag === 'blockquote' && typeof props['dataCallout'] === 'string' && CALLOUT_STYLES[props['dataCallout']]) {
      return this.callout(node, props['dataCallout'], String(props['dataCalloutTitle'] ?? ''), parent);
    }
    if (!ELEMENTS.has(tag)) return this.children(node.children, parent); // keep the text, not the element
    if (tag === 'img') return this.image(node, parent);
    if (tag === 'input' && props['type'] !== 'checkbox') return;

    const element = this.doc.createElement(tag);
    for (const [property, value] of Object.entries(props)) {
      const name = PROPERTY_NAMES[property];
      if (!name || !allowed(tag, name) || name === 'href') continue;
      this.setAttribute(element, name, value);
    }
    if (tag === 'a') this.link(element, props['href']);
    if (tag === 'input') element.setAttribute('disabled', ''); // GFM task-list boxes are read-only
    this.children(node.children, element);

    if (tag === 'table') {
      element.setAttribute('class', TABLE_CLASS);
      const wrapper = this.doc.createElement('div');
      wrapper.setAttribute('class', TABLE_WRAPPER_CLASS);
      wrapper.setAttribute('tabindex', '0');
      wrapper.appendChild(element);
      parent.appendChild(wrapper);
    } else {
      parent.appendChild(element);
    }
  }

  private setAttribute(element: HTMLElement, name: string, value: unknown) {
    if (value === false || value === null || value === undefined) return;
    const text = value === true ? '' : Array.isArray(value) ? value.join(' ') : String(value);
    if (name === 'id' && !text.startsWith('user-content-')) return;
    element.setAttribute(name, text);
  }

  /** Links within the app stay in it (the component routes them); other sites open in a new tab. */
  private link(element: HTMLElement, href: unknown) {
    const url = typeof href === 'string' ? transformUrl(href, this.options.basePath ?? '') : '';
    if (!url) return;
    element.setAttribute('href', url);
    if (/^https?:\/\//i.test(url)) {
      element.setAttribute('target', '_blank');
      element.setAttribute('rel', 'noreferrer');
    }
  }

  private image(node: Element, parent: Node) {
    const src = typeof node.properties?.['src'] === 'string' ? safeUrl(node.properties['src']) : '';
    if (!src) return;
    const image = this.doc.createElement('img');
    image.setAttribute('src', src);
    image.setAttribute('loading', 'lazy');
    image.setAttribute('referrerpolicy', 'no-referrer');
    for (const name of ['alt', 'title'] as const) {
      const value = node.properties?.[name];
      if (typeof value === 'string') image.setAttribute(name, value);
    }
    parent.appendChild(image);
  }

  /** `> [!TIP] Title` → the titled note box of lessons. */
  private callout(quote: Element, type: string, title: string, parent: Node) {
    const style = CALLOUT_STYLES[type];
    const classes = calloutClasses(type);
    const box = this.doc.createElement('div');
    box.setAttribute('class', classes.box);
    box.setAttribute('role', 'note');
    box.setAttribute('aria-label', style.label);
    const heading = this.doc.createElement('p');
    heading.setAttribute('class', classes.title);
    heading.append(this.icon(style.iconPath), this.doc.createTextNode(title || style.label));
    const body = this.doc.createElement('div');
    body.setAttribute('class', classes.body);
    this.children(
      quote.children.filter((child) => !(child.type === 'text' && !child.value.trim())),
      body,
    );
    box.append(heading, body);
    parent.appendChild(box);
  }

  /** A fenced block: a diagram, a reveal block, or plain code. */
  private fence(code: Element, parent: Node) {
    const classes = (code.properties?.['className'] as string[] | undefined) ?? [];
    const language = classes.find((name) => name.startsWith('language-'))?.slice('language-'.length);
    const meta = parseMeta((code.data as { meta?: string } | undefined)?.meta);
    const source = textOf(code as HastNode).replace(/\n$/, '');

    if (language === 'mermaid' && this.options.mermaid) {
      const host = this.doc.createElement('div');
      parent.appendChild(host);
      this.options.mermaid(host, source, meta['title']);
    } else if (language === 'uml' || language === 'states') {
      // The diagram renderers escape every piece of the source; their markup still goes through
      // the same allowlist.
      this.markup(language === 'uml' ? renderUml(source, meta['title']) : renderStates(source, meta['title']), parent);
    } else if (isRevealKind(language)) {
      const kind = language;
      const classesOf = revealClasses(kind);
      const details = this.doc.createElement('details');
      details.setAttribute('class', `not-prose ${classesOf.details}`);
      const summary = this.doc.createElement('summary');
      summary.setAttribute('class', classesOf.summary);
      const label = this.doc.createElement('span');
      label.setAttribute('class', 'flex min-w-0 items-center gap-2');
      label.append(this.icon(REVEAL_STYLES[kind].iconPath), this.doc.createTextNode(revealTitle(kind, meta['title'])));
      const state = this.doc.createElement('span');
      state.setAttribute('class', 'flex shrink-0 items-center gap-2 text-xs font-medium text-muted');
      const show = this.doc.createElement('span');
      show.setAttribute('class', 'group-open:hidden');
      show.textContent = 'Show';
      const hide = this.doc.createElement('span');
      hide.setAttribute('class', 'hidden group-open:inline');
      hide.textContent = 'Hide';
      state.append(show, hide);
      summary.append(label, state);
      const body = this.doc.createElement('div');
      body.setAttribute('class', `prose prose-sm max-w-none ${classesOf.body}`);
      this.children(parseMarkdown(source).children, body);
      details.append(summary, body);
      parent.appendChild(details);
    } else {
      const pre = this.doc.createElement('pre');
      pre.setAttribute('class', PLAIN_CODE);
      const inner = this.doc.createElement('code');
      inner.textContent = source;
      pre.appendChild(inner);
      parent.appendChild(pre);
    }
  }

  /** Markup this app generated (the diagram renderers), copied through the allowlist. */
  private markup(html: string, parent: Node) {
    const template = this.doc.createElement('template'); // its content is inert: nothing in it runs or loads
    template.innerHTML = html;
    this.copy(template.content, parent);
  }

  private copy(source: Node, parent: Node) {
    for (const child of Array.from(source.childNodes)) {
      if (child.nodeType === child.TEXT_NODE) {
        parent.appendChild(this.doc.createTextNode(child.textContent ?? ''));
      } else if (child.nodeType === child.ELEMENT_NODE) {
        const from = child as globalThis.Element;
        const tag = from.tagName.toLowerCase();
        if (!ELEMENTS.has(tag) || tag === 'a' || tag === 'img' || tag === 'input') {
          this.copy(from, parent);
          continue;
        }
        const element = this.doc.createElement(tag);
        for (const attribute of Array.from(from.attributes)) {
          if (allowed(tag, attribute.name) && attribute.name !== 'id') element.setAttribute(attribute.name, attribute.value);
        }
        this.copy(from, element);
        parent.appendChild(element);
      }
    }
  }

  private icon(path: string) {
    const svg = this.doc.createElementNS(SVG_NS, 'svg');
    for (const [name, value] of Object.entries(ICON_ATTRIBUTES)) svg.setAttribute(name, value);
    const line = this.doc.createElementNS(SVG_NS, 'path');
    line.setAttribute('d', path);
    svg.appendChild(line);
    return svg;
  }
}
