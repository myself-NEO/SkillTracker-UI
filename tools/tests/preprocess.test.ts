import { describe, expect, it } from 'vitest';
import { rehypeCallouts } from '@lib/markdown/callouts';
import type { HastNode } from '@lib/markdown/hast';
import { parseMeta, textOf } from '@lib/markdown/hast';
import { htmlDetailsToReveals, prepareMarkdown, stripMatchComments } from '@lib/markdown/preprocess';

describe('htmlDetailsToReveals', () => {
  it('turns a one-line <details> into a reveal block named after its summary', () => {
    expect(htmlDetailsToReveals('<details><summary>Answer</summary>Use a TreeMap.</details>')).toBe(
      '````solution title="Answer"\nUse a TreeMap.\n````',
    );
  });

  it('keeps fenced code inside a multi-line <details> body', () => {
    const markdown = [
      '<details><summary>Hint 1</summary>',
      'Think about it.',
      '```java',
      'int x;',
      '```',
      '</details>',
    ].join('\n');
    expect(htmlDetailsToReveals(markdown).split('\n')).toEqual([
      '````hint title="Hint 1"',
      'Think about it.',
      '```java',
      'int x;',
      '```',
      '````',
    ]);
  });

  it('leaves <details> inside code fences alone, and closes an unterminated block', () => {
    expect(htmlDetailsToReveals('```html\n<details><summary>x</summary>y</details>\n```')).toBe(
      '```html\n<details><summary>x</summary>y</details>\n```',
    );
    expect(htmlDetailsToReveals('<details><summary>Why?</summary>\nBecause.')).toBe(
      '````reveal title="Why?"\nBecause.\n````',
    );
  });
});

describe('stripMatchComments', () => {
  it('removes mock-interview keyword hints but keeps other comments', () => {
    expect(stripMatchComments('Shard by user. <!-- match: shard, partition -->')).toBe('Shard by user.');
    expect(stripMatchComments('<!-- a normal comment -->')).toBe('<!-- a normal comment -->');
  });

  it('runs both rewrites in prepareMarkdown', () => {
    expect(prepareMarkdown('<details><summary>Hint</summary>Look <!-- match: x --></details>')).toBe(
      '````hint title="Hint"\nLook\n````',
    );
  });
});

describe('rehypeCallouts', () => {
  it('tags a [!TIP] blockquote with its type and title and drops the marker', () => {
    const text: HastNode = { type: 'text', value: '[!TIP] Pre-size it\nNew HashMap(64) avoids resizes.' };
    const blockquote: HastNode = {
      type: 'element',
      tagName: 'blockquote',
      children: [{ type: 'element', tagName: 'p', children: [text] }],
    };
    rehypeCallouts()({ type: 'root', children: [blockquote] });

    expect(blockquote.properties).toMatchObject({ dataCallout: 'tip', dataCalloutTitle: 'Pre-size it' });
    expect(text.value).toBe('New HashMap(64) avoids resizes.');
  });

  it('ignores ordinary blockquotes', () => {
    const blockquote: HastNode = {
      type: 'element',
      tagName: 'blockquote',
      children: [{ type: 'element', tagName: 'p', children: [{ type: 'text', value: 'A quote' }] }],
    };
    rehypeCallouts()({ type: 'root', children: [blockquote] });
    expect(blockquote.properties).toBeUndefined();
  });
});

describe('hast helpers', () => {
  it('reads key="value" pairs from a fence info string', () => {
    expect(parseMeta('title="Demo.java" java="21" preview="true"')).toEqual({
      title: 'Demo.java',
      java: '21',
      preview: 'true',
    });
    expect(parseMeta(undefined)).toEqual({});
  });

  it('collects the text of nested nodes', () => {
    expect(
      textOf({
        type: 'element',
        children: [
          { type: 'text', value: 'a' },
          { type: 'element', children: [{ type: 'text', value: 'b' }] },
        ],
      }),
    ).toBe('ab');
  });
});
