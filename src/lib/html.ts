// Tiny helpers for building HTML strings safely (the diagram renderers use them, both at build
// time and, for diagrams people type in the browser, at runtime).

const ESCAPES: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

/** Escapes text for use in HTML content or a quoted attribute. */
export const escapeHtml = (text: string) => text.replace(/[&<>"']/g, (c) => ESCAPES[c]);

/** Joins class names, skipping empty ones. */
export const cx = (...classes: (string | false | null | undefined)[]) => classes.filter(Boolean).join(' ');
