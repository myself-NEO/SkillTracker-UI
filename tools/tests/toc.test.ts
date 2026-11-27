import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { formatDuration } from '@lib/format';
import { tocHeadings } from '@lib/markdown/toc';
import { renderDoc } from '../content/pipeline';

// The table of contents must give each section the id its rendered heading has. Ported from
// TheSWEguide's tests/toc.test.ts, which compared with React's renderer; this compares with the
// content pipeline's HTML. Headings inside reveal blocks are rendered separately and aren't sections.

/** The ids of the h2 and h3 headings in a body's HTML, outside reveal blocks, in order. */
const sectionIds = (html: string) => {
  const ids: string[] = [];
  let depth = 0;
  for (const match of html.matchAll(/<details\b|<\/details>|<h[23] id="([^"]*)"/g)) {
    if (match[0] === '<details') depth++;
    else if (match[0] === '</details>') depth--;
    else if (depth === 0) ids.push(match[1]);
  }
  return ids;
};

const renderedIds = async (markdown: string) => sectionIds((await renderDoc(markdown, { basePath: '/java' })).html);

const contentFiles = () => {
  const root = path.join(process.cwd(), 'content');
  return ['java', 'dsa', 'lld', 'hld'].flatMap((topic) =>
    ['lessons', 'problems', 'cheatsheets'].flatMap((folder) => {
      const dir = path.join(root, topic, folder);
      try {
        return readdirSync(dir)
          .filter((file) => file.endsWith('.md'))
          .map((file) => path.join(dir, file));
      } catch {
        return [];
      }
    }),
  );
};

describe('tocHeadings', () => {
  it('lists h2 and h3 sections with their text', () => {
    const headings = tocHeadings('## Why it exists\n\ntext\n\n### The `equals` contract\n\n#### Too deep\n');
    expect(headings).toEqual([
      { id: 'why-it-exists', text: 'Why it exists', depth: 2 },
      { id: 'the-equals-contract', text: 'The equals contract', depth: 3 },
    ]);
  });

  it('numbers repeated titles across every heading level, as the renderer does', async () => {
    const markdown = '# Example\n\n## Example\n\n#### Example\n\n### Example\n\n## Example\n';
    expect(tocHeadings(markdown).map((heading) => heading.id)).toEqual(['example-1', 'example-3', 'example-4']);
    expect(tocHeadings(markdown).map((heading) => heading.id)).toEqual(await renderedIds(markdown));
  });

  it('skips headings inside fenced blocks, including hint and solution blocks', async () => {
    const markdown = ['## Real', '', '```java', '## not a heading', '```', '', '````hint title="Hint"', '## Hidden', '````'].join('\n');
    expect(tocHeadings(markdown).map((heading) => heading.text)).toEqual(['Real']);
    expect(await renderedIds(markdown)).toEqual(['real']);
  });

  it('gives every section of the content the id its rendered heading has', async () => {
    const files = contentFiles();
    expect(files.length).toBeGreaterThan(500);
    for (const file of files) {
      const markdown = readFileSync(file, 'utf8');
      expect(tocHeadings(markdown).map((heading) => heading.id), file).toEqual(await renderedIds(markdown));
    }
  }, 300_000);
});

describe('formatDuration', () => {
  it('shows minutes under an hour and hours to the nearest half above', () => {
    expect(formatDuration(45)).toBe('45 min');
    expect(formatDuration(60)).toBe('1 h');
    expect(formatDuration(100)).toBe('1.5 h');
    expect(formatDuration(130)).toBe('2 h');
  });
});
