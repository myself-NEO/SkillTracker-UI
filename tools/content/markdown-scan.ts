import type { Root } from 'mdast';
import remarkGfm from 'remark-gfm';
import remarkParse from 'remark-parse';
import { unified } from 'unified';
import { visit } from 'unist-util-visit';
import { prepareMarkdown } from '@lib/markdown/preprocess';

export interface ScannedLink {
  url: string;
  line: number;
}

export interface ScannedFence {
  lang: string;
  meta: string;
  value: string;
  line: number;
}

export interface ScannedHeading {
  depth: number;
  text: string;
  line: number;
}

export interface ScannedMarkdown {
  links: ScannedLink[];
  fences: ScannedFence[];
  headings: ScannedHeading[];
  /** Raw HTML outside code fences, which the site doesn't render (lines). */
  rawHtml: { value: string; line: number }[];
}

/** Fences whose body is Markdown, rendered as part of the page. */
const MARKDOWN_FENCES = new Set(['hint', 'solution', 'reveal', 'question']);

const parser = unified().use(remarkParse).use(remarkGfm);

/** The text of a node and its descendants (headings may hold code, emphasis, links…). */
const plainText = (node: unknown): string => {
  const { value, children } = node as { value?: unknown; children?: unknown };
  if (typeof value === 'string') return value;
  return Array.isArray(children) ? children.map(plainText).join('') : '';
};

/**
 * Links, fenced blocks and section headings of lesson Markdown, as the site renders it: after
 * the same preprocessing, and including the Markdown inside hint, solution, reveal and question
 * blocks (whose own headings are not section headings). Lines are 1-based.
 */
export const scanMarkdown = (markdown: string): ScannedMarkdown => {
  const result: ScannedMarkdown = { links: [], fences: [], headings: [], rawHtml: [] };
  const walk = (source: string, lineOffset: number, topLevel: boolean) => {
    const tree = parser.parse(source) as Root;
    visit(tree, (node) => {
      const line = (node.position?.start.line ?? 1) + lineOffset;
      if (node.type === 'link' || node.type === 'definition') {
        result.links.push({ url: node.url, line });
      } else if (node.type === 'html') {
        result.rawHtml.push({ value: node.value, line });
      } else if (node.type === 'heading' && topLevel) {
        result.headings.push({ depth: node.depth, text: plainText(node).trim(), line });
      } else if (node.type === 'code') {
        const lang = node.lang ?? '';
        result.fences.push({ lang, meta: node.meta ?? '', value: node.value, line });
        // The body starts on the line after the opening fence.
        if (MARKDOWN_FENCES.has(lang)) walk(node.value, line, false);
      }
    });
  };
  walk(prepareMarkdown(markdown), 0, true);
  return result;
};
