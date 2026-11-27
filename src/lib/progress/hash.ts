/**
 * Short stable id for a piece of text, e.g. a quiz question's prompt or a checklist item.
 * Stored progress is keyed by it, so the algorithm must never change. Free of React, so
 * server components can use it.
 */
export const questionHash = (text: string) => {
  let h = 0;
  for (let i = 0; i < text.length; i++) h = (Math.imul(31, h) + text.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36);
};
