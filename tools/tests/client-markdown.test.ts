import { JSDOM } from 'jsdom';
import { describe, expect, it, vi } from 'vitest';
import { renderMarkdown } from '@lib/markdown/client';

// The browser's Markdown renderer (notes and saved answers): the lesson dialect, built element by
// element from an allowlist, never from the learner's text as HTML.

const { document } = new JSDOM('<!doctype html><html><body></body></html>').window;

const render = (markdown: string, options: Parameters<typeof renderMarkdown>[2] = { basePath: '/hld' }) => {
  const host = document.createElement('div');
  host.appendChild(renderMarkdown(markdown, document, options));
  return host;
};

/** Every attribute name in the rendered tree. */
const attributeNames = (root: Element) =>
  [...root.querySelectorAll('*')].flatMap((element) => [...element.attributes].map((attribute) => attribute.name));

describe('client Markdown: the lesson dialect', () => {
  it('renders GFM: emphasis, lists, task lists, tables and strikethrough', () => {
    const host = render('**bold** ~~gone~~\n\n- [x] done\n- [ ] todo\n\n| a | b |\n|:--|--:|\n| 1 | 2 |');
    expect(host.querySelector('strong')?.textContent).toBe('bold');
    expect(host.querySelector('del')?.textContent).toBe('gone');
    const boxes = [...host.querySelectorAll('input')];
    expect(boxes.map((box) => [box.type, box.checked, box.disabled])).toEqual([
      ['checkbox', true, true],
      ['checkbox', false, true],
    ]);
    const table = host.querySelector('table')!;
    expect(table.parentElement?.getAttribute('tabindex')).toBe('0'); // scrolls in its own box
    expect(table.querySelector('td:last-child')?.getAttribute('align')).toBe('right');
  });

  it('renders callouts as titled note boxes', () => {
    const host = render('> [!WARNING] Hot keys\n> One key can melt a shard.');
    const box = host.querySelector('[role="note"]')!;
    expect(box.getAttribute('aria-label')).toBe('Watch out');
    expect(box.querySelector('p')?.textContent).toBe('Hot keys');
    expect(box.querySelector('svg path')).not.toBeNull();
    expect(box.textContent).toContain('One key can melt a shard.');
    expect(host.querySelector('blockquote')).toBeNull();
  });

  it('renders reveal blocks with their Markdown inside', () => {
    const host = render('````solution title="Answer"\nUse **consistent hashing**.\n````');
    const details = host.querySelector('details')!;
    expect(details.querySelector('summary')?.textContent).toContain('Answer');
    expect(details.querySelector('strong')?.textContent).toBe('consistent hashing');
  });

  it('renders class and state diagrams, and shows other code as plain text', () => {
    const host = render('```uml\nclass Cache {\n  +get(key)\n}\n```\n\n```java\nint x = 1 < 2 ? 1 : 0;\n```');
    expect(host.querySelector('figure figcaption')?.textContent).toBe('Class diagram');
    expect(host.querySelector('pre code')?.textContent).toBe('int x = 1 < 2 ? 1 : 0;');
  });

  it('hands Mermaid blocks to the app, or shows their source without it', () => {
    const mermaid = vi.fn();
    const host = render('```mermaid title="Read path"\nflowchart LR\n  A --> B\n```', { mermaid });
    expect(mermaid).toHaveBeenCalledWith(expect.anything(), 'flowchart LR\n  A --> B', 'Read path');
    expect(host.children).toHaveLength(1);
    expect(render('```mermaid\nflowchart LR\n```').querySelector('pre code')?.textContent).toBe('flowchart LR');
  });

  it('resolves lesson: and problem: links, and opens other sites in a new tab', () => {
    const host = render('[a](lesson:caching) [b](problem:url-shortener) [c](https://example.com) [d](#top)');
    const links = [...host.querySelectorAll('a')].map((a) => [a.getAttribute('href'), a.getAttribute('target'), a.getAttribute('rel')]);
    expect(links).toEqual([
      ['/hld/caching', null, null],
      ['/hld/problems/url-shortener', null, null],
      ['https://example.com', '_blank', 'noreferrer'],
      ['#top', null, null],
    ]);
  });
});

describe('client Markdown: safety', () => {
  it('never turns HTML in the text into elements', () => {
    const host = render('<script>alert(1)</script>\n\n<img src=x onerror="alert(1)">\n\nInline <b onclick="x()">bold</b> and <iframe src="https://example.com"></iframe>');
    expect(host.querySelector('script, img, iframe, b')).toBeNull();
    expect(attributeNames(host).filter((name) => name.startsWith('on'))).toEqual([]);
  });

  it('drops links and images with unsafe URLs', () => {
    const host = render('[click](javascript:alert(1)) [data](data:text/html,<b>x</b>) ![pic](javascript:alert(1)) ![ok](https://example.com/a.png)');
    expect([...host.querySelectorAll('a')].map((a) => a.getAttribute('href'))).toEqual([null, null]);
    const images = [...host.querySelectorAll('img')];
    expect(images.map((image) => image.getAttribute('src'))).toEqual(['https://example.com/a.png']);
    expect(images[0].getAttribute('referrerpolicy')).toBe('no-referrer');
  });

  it('keeps diagram text as text', () => {
    const host = render('```uml\nclass Evil<img src=x onerror=alert(1)> {\n}\n```\n\n```states title="<b>t</b>"\n[*] --> A\n```');
    expect(host.querySelector('img, b')).toBeNull();
    expect(attributeNames(host).filter((name) => name.startsWith('on'))).toEqual([]);
  });

  it('only keeps the ids GFM gives footnotes', () => {
    const host = render('A claim.[^1]\n\n[^1]: The source.\n\n# Heading');
    const ids = [...host.querySelectorAll('[id]')].map((element) => element.id);
    expect(ids.length).toBeGreaterThan(0);
    expect(ids.every((id) => id.startsWith('user-content-'))).toBe(true);
  });

  it('renders text that looks like markup as text', () => {
    const host = render('# Title with <span class="evil">markup</span>\n\n`<script>` in code');
    expect(host.querySelector('span.evil')).toBeNull();
    expect(host.querySelector('code')?.textContent).toBe('<script>');
  });
});
