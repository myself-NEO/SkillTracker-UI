import { createHighlighter, type Highlighter } from 'shiki';
import { createJavaScriptRegexEngine } from 'shiki/engine/javascript';
import type { CodeToken } from '@lib/viz/types';

// Syntax highlighting at build time, so no highlighter ships to the browser. Both themes are
// emitted: each token carries --shiki-light and --shiki-dark, and styles.css applies the one that
// matches the page's theme. Ported unchanged from TheSWEguide's src/lib/markdown/highlight.ts.

const THEMES = { light: 'github-light', dark: 'github-dark' } as const;

/** Both themes' comment grey is below 4.5:1 on the code background; these greys meet it. */
const COLOR_REPLACEMENTS = {
  'github-light': { '#6a737d': '#5f6a7d' },
  'github-dark': { '#6a737d': '#8b949e' },
};

/** The fence languages used by the content, loaded once. */
const LANGUAGES = ['java', 'sql', 'http', 'shellscript', 'yaml', 'lua', 'json', 'javascript', 'graphql', 'proto', 'ini', 'xml'];

/** Fence names that differ from Shiki's ids, or that Shiki would read differently (cql is Cassandra here, not Cypher). */
const ALIASES: Record<string, string> = {
  bash: 'shellscript',
  sh: 'shellscript',
  shell: 'shellscript',
  protobuf: 'proto',
  properties: 'ini',
  cql: 'sql',
};

let highlighter: Promise<Highlighter> | undefined;

const getHighlighter = () =>
  (highlighter ??= createHighlighter({
    themes: Object.values(THEMES),
    langs: LANGUAGES,
    engine: createJavaScriptRegexEngine(),
  }));

/** Shiki's language id for a fence language; unknown ones (and diagrams in ```text) render as plain text. */
export const shikiLanguage = (language: string | undefined) => {
  const lang = language?.toLowerCase();
  if (!lang) return 'text';
  const id = ALIASES[lang] ?? lang;
  return LANGUAGES.includes(id) ? id : 'text';
};

/** Highlighted `<pre class="shiki">` HTML for a code block; styles.css picks the theme's colours. */
export const highlight = async (code: string, language: string | undefined) =>
  (await getHighlighter()).codeToHtml(code, {
    lang: shikiLanguage(language),
    themes: THEMES,
    defaultColor: false,
    colorReplacements: COLOR_REPLACEMENTS,
  });

/** Highlighted tokens of each line, for code drawn in the browser (the animation code panel). */
export const highlightLines = async (code: string, language: string | undefined): Promise<CodeToken[][]> => {
  const { tokens } = (await getHighlighter()).codeToTokens(code, {
    lang: shikiLanguage(language) as Parameters<Highlighter['codeToTokens']>[1]['lang'],
    themes: THEMES,
    defaultColor: false,
    colorReplacements: COLOR_REPLACEMENTS,
  });
  return tokens.map((line) =>
    line.map((token) => ({ content: token.content, style: token.htmlStyle as Record<string, string> | undefined })),
  );
};
