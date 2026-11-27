import GithubSlugger from 'github-slugger';
import type { Root } from 'mdast';
import remarkGfm from 'remark-gfm';
import remarkParse from 'remark-parse';
import { unified } from 'unified';
import { visit } from 'unist-util-visit';
import { prepareMarkdown } from './preprocess';

// The table of contents of a lesson: its h2 and h3 sections, with the ids rehype-slug gives the
// rendered headings.

export interface TocHeading {
  id: string;
  text: string;
  depth: 2 | 3;
}

const parser = unified().use(remarkParse).use(remarkGfm);

/** The text of a heading as rendered (headings may hold code, emphasis or links). */
const plainText = (node: unknown): string => {
  const { value, children } = node as { value?: unknown; children?: unknown };
  if (typeof value === 'string') return value;
  return Array.isArray(children) ? children.map(plainText).join('') : '';
};

export const tocHeadings = (markdown: string): TocHeading[] => {
  const tree = parser.parse(prepareMarkdown(markdown)) as Root;
  // rehype-slug slugs every heading of the document in order, so repeated titles get the same
  // "-1", "-2" suffixes here. Headings inside hint and solution blocks are part of a fenced
  // block's text, rendered separately, and never reach this tree.
  const slugger = new GithubSlugger();
  const headings: TocHeading[] = [];
  visit(tree, 'heading', (node) => {
    const text = plainText(node);
    const id = slugger.slug(text);
    if (node.depth === 2 || node.depth === 3) headings.push({ id, text: text.trim(), depth: node.depth });
  });
  return headings;
};
