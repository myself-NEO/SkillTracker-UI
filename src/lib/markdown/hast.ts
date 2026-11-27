// Minimal view of the HTML syntax tree (hast) that react-markdown hands to components and plugins.

export type HastNode = {
  type: string;
  tagName?: string;
  value?: string;
  properties?: Record<string, unknown>;
  children?: HastNode[];
  data?: { meta?: string };
};

/** The text content of a node and its descendants. */
export const textOf = (node: HastNode | undefined): string =>
  !node ? '' : node.type === 'text' ? (node.value ?? '') : (node.children ?? []).map(textOf).join('');

/** `key="value"` pairs of a fence's info string, e.g. ```java title="Demo.java" java="21"```. */
export const parseMeta = (meta: string | undefined) => {
  const attrs: Record<string, string> = {};
  if (!meta) return attrs;
  for (const match of meta.matchAll(/(\w+)="([^"]*)"/g)) attrs[match[1]] = match[2];
  return attrs;
};
