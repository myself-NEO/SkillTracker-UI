import type { HastNode } from './hast';

// `> [!NOTE] / [!TIP] / [!WARNING] / [!INTERVIEW] Optional title` → callout.

export const CALLOUT_RE = /^\[!(NOTE|TIP|WARNING|INTERVIEW)\][ \t]*([^\n]*)\n?/;

/** Rehype plugin: tags `> [!TIP] Title` blockquotes with data-callout and data-callout-title. */
export const rehypeCallouts = () => (tree: HastNode) => {
  const visit = (node: HastNode) => {
    if (node.type === 'element' && node.tagName === 'blockquote') {
      const paragraph = node.children?.find((c) => c.type === 'element');
      const first = paragraph?.tagName === 'p' ? paragraph.children?.[0] : undefined;
      const match = first?.type === 'text' ? first.value?.match(CALLOUT_RE) : null;
      if (first && match) {
        first.value = first.value!.slice(match[0].length);
        node.properties = {
          ...node.properties,
          dataCallout: match[1].toLowerCase(),
          dataCalloutTitle: match[2].trim(),
        };
      }
    }
    node.children?.forEach(visit);
  };
  visit(tree);
};
