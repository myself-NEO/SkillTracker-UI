/**
 * A short text's `inline code` and plain parts, e.g. a question title ("Why is `String`
 * immutable?"), to show without a Markdown pass.
 */
export const inlineCodeParts = (text: string) =>
  text
    .split(/(`[^`]+`)/g)
    .filter(Boolean)
    .map((part) =>
      part.length > 2 && part.startsWith('`') && part.endsWith('`') ? { code: true, text: part.slice(1, -1) } : { code: false, text: part },
    );
