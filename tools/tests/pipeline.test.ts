import { describe, expect, it } from 'vitest';
import { renderStates } from '@lib/diagrams/states';
import { renderUml } from '@lib/diagrams/uml';
import { questionHash } from '@lib/progress/hash';
import { inline, renderDoc } from '../content/pipeline';

// The content pipeline: Markdown → the HTML and widget data of a ContentDoc.

const render = (markdown: string, javaVersion?: number) => renderDoc(markdown, { basePath: '/java', javaVersion });

describe('renderDoc', () => {
  it('turns `> [!TIP] Title` into a titled note box and leaves other quotes alone', async () => {
    const { html } = await render('> [!TIP] Remember this\n> The body.\n\n> Just a quote.\n');
    expect(html).toContain('<div role="note" aria-label="Tip"');
    expect(html).toContain('Remember this</p>');
    expect(html).toContain('The body.');
    expect(html).toContain('<blockquote>\n<p>Just a quote.</p>');
  });

  it('highlights code at build time, with a label, a Java badge and copy/save buttons', async () => {
    const { html } = await render('```java file="Demo.java"\nint x = 1;\n```\n\n```text\n+---+\n```\n', 17);
    expect(html).toContain('data-code="java" data-label="Demo.java"');
    expect(html).toContain('Java 17+');
    expect(html).toContain('class="shiki');
    expect(html).toContain('data-action="copy"');
    // Diagrams in ```text get no "save snippet" button.
    expect(html.match(/data-action="save-snippet"/g)).toHaveLength(1);
  });

  it('labels preview features with their release', async () => {
    const { html } = await render('```java file="Demo.java" java="25" preview="true"\nvoid main() {}\n```\n');
    expect(html).toContain('Java 25 preview');
  });

  it('renders reveal blocks as <details> with their own Markdown and keeps interview questions for bookmarks', async () => {
    const doc = await render('````hint title="Try this"\nUse **two pointers**.\n````\n\n````question title="Why?"\nBecause.\n````\n');
    expect(doc.html).toContain('<details class="group my-5 rounded-xl border bg-surface border-warning/35" data-reveal="hint">');
    expect(doc.html).toContain('<strong>two pointers</strong>');
    const id = `q-${questionHash('Why?')}`;
    expect(doc.html).toContain(`data-question="${id}"`);
    expect(doc.questions[id]).toEqual({ title: 'Why?', body: 'Because.\n' });
  });

  it('resolves lesson: and problem: links and drops unsafe ones', async () => {
    const { html } = await render('[a](lesson:streams) [b](problem:lru-cache#tests) [c](javascript:alert(1)) [d](https://example.com)');
    expect(html).toContain('<a href="/java/streams">a</a>');
    expect(html).toContain('<a href="/java/problems/lru-cache#tests">b</a>');
    expect(html).toContain('<a>c</a>');
    expect(html).toContain('<a href="https://example.com" target="_blank" rel="noreferrer">d</a>');
  });

  it('wraps tables so wide ones scroll', async () => {
    const { html } = await render('| a | b |\n|---|---|\n| 1 | 2 |\n');
    expect(html).toContain('<div class="render-when-near my-6 overflow-x-auto rounded-xl border border-border" tabindex="0"><table class="my-0! min-w-full">');
  });

  it('drops raw HTML, as TheSWEguide did not render it either', async () => {
    const { html } = await render('Before <script>alert(1)</script> after\n');
    expect(html).not.toContain('<script');
  });

  it('leaves widgets as numbered placeholders with their data, in document order', async () => {
    const doc = await render(
      [
        '```quiz',
        '? Which is `O(1)`?',
        '- A scan',
        '+ A **hash** lookup',
        '! Scans are linear.',
        '> Hashing jumps to the bucket.',
        '```',
        '',
        '```checklist title="Before you start"',
        '- Read `the` brief',
        '```',
        '',
        '```mermaid',
        'flowchart LR',
        '  A --> B',
        '```',
        '',
        '```estimator',
        'dau = 1M',
        '```',
      ].join('\n'),
    );
    expect(doc.html).toContain('<div data-w="0"></div>');
    expect(doc.html).toContain('<div data-w="3"></div>');
    expect(doc.widgets.map((w) => w.type)).toEqual(['quiz', 'checklist', 'mermaid', 'estimator']);
    const quiz = doc.widgets[0];
    if (quiz.type !== 'quiz') throw new Error('not a quiz');
    // The prompt keeps its exact text: saved answers are keyed by a hash of it.
    expect(quiz.questions[0].prompt.text).toBe('Which is `O(1)`?');
    expect(quiz.questions[0].prompt.html).toBe(
      'Which is <code class="rounded border border-border bg-surface-2 px-1 py-px font-mono text-[0.9em] text-fg">O(1)</code>?',
    );
    expect(quiz.questions[0].options[1]).toMatchObject({ correct: true, text: { html: 'A <strong>hash</strong> lookup' } });
    // A `!` line explains the option just above it.
    expect(quiz.questions[0].options[1].reason?.text).toBe('Scans are linear.');
    expect(quiz.questions[0].explanation.text).toBe('Hashing jumps to the bucket.');
    expect(doc.widgets[1]).toMatchObject({ type: 'checklist', title: 'Before you start' });
    expect(doc.widgets[2]).toMatchObject({ type: 'mermaid', source: 'flowchart LR\n  A --> B\n' });
  });

  it('checks animation blocks against their schema and fills in defaults', async () => {
    const doc = await render('```viz name="hashmap-put"\n{ "keys": ["cat", "dog"] }\n```\n\n```viz name="nope"\n{}\n```\n');
    expect(doc.widgets).toHaveLength(1);
    expect(doc.widgets[0]).toMatchObject({ type: 'viz', scene: 'hashmap-put', mode: 'stepper', params: { keys: ['cat', 'dog'] } });
    expect(doc.html).toContain('role="alert"');
    expect(doc.html).toContain('There is no animation called “nope”.');
  });

  it('renders each step of a scroll-driven animation', async () => {
    const doc = await render('````scrolly name="gc-generations"\n{}\n---\nStep **one**\n---\nStep two\n````\n');
    const viz = doc.widgets[0];
    expect(viz).toMatchObject({ type: 'viz', mode: 'scrolly' });
    if (viz.type !== 'viz') throw new Error('not an animation');
    expect(viz.steps?.[0]).toContain('<strong>one</strong>');
  });

  it('lists the sections for the table of contents', async () => {
    const doc = await render('## One\n\n### Two\n');
    expect(doc.toc).toEqual([
      { id: 'one', text: 'One', depth: 2 },
      { id: 'two', text: 'Two', depth: 3 },
    ]);
  });
});

describe('inline widget text', () => {
  it('keeps the text and renders inline Markdown without a paragraph', () => {
    expect(inline('Use `a` and *b*')).toEqual({
      text: 'Use `a` and *b*',
      html: 'Use <code class="rounded border border-border bg-surface-2 px-1 py-px font-mono text-[0.9em] text-fg">a</code> and <em>b</em>',
    });
  });
});

describe('diagram renderers', () => {
  it('escape everything that comes from the source', () => {
    const uml = renderUml('class <script>\n  + run(): <b>\n', 'T<i>');
    expect(uml).not.toMatch(/<script|<b>|<i>/);
    expect(renderStates('[*] --> A\nA --> B : go<img>')).not.toContain('<img');
  });
});

describe('questionHash', () => {
  it('never changes: saved progress is keyed by it', () => {
    expect(questionHash('')).toBe('0');
    expect(questionHash('a')).toBe('2p');
    expect(questionHash('How does HashMap compute the bucket index?')).toBe('7eua82');
  });
});
