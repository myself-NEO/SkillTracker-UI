/**
 * Path segments under /<topic>/ that belong to section pages (e.g. /java/problems, /dsa/notes) or
 * to the topic's share image (/dsa/opengraph-image). Lessons live at /<topic>/<slug>, so no lesson
 * may use one of these as its slug.
 */
export const RESERVED_SEGMENTS = [
  'problems',
  'interview',
  'notebook',
  'progress',
  'estimator',
  'cheatsheets',
  'notes',
  'opengraph-image',
] as const;
