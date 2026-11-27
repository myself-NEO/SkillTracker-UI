// Lesson Markdown links within its track with `[text](lesson:slug)` and `[text](problem:slug)`.

export const lessonPath = (basePath: string, slug: string) => `${basePath}/${slug}`;
export const problemPath = (basePath: string, slug: string) => `${basePath}/problems/${slug}`;

const SAFE_PROTOCOL = /^(https?|ircs?|mailto|xmpp)$/i;

/**
 * Keeps relative URLs and safe protocols; anything else (javascript:, data:, …) becomes ''.
 * The same rule react-markdown applied on TheSWEguide (its defaultUrlTransform).
 */
export const safeUrl = (url: string) => {
  const colon = url.indexOf(':');
  const questionMark = url.indexOf('?');
  const numberSign = url.indexOf('#');
  const slash = url.indexOf('/');
  const relative =
    colon === -1 ||
    (slash !== -1 && colon > slash) ||
    (questionMark !== -1 && colon > questionMark) ||
    (numberSign !== -1 && colon > numberSign);
  return relative || SAFE_PROTOCOL.test(url.slice(0, colon)) ? url : '';
};

/** Resolves `lesson:` and `problem:` links against the track's base path; other URLs must be safe. */
export const transformUrl = (url: string, basePath: string) => {
  if (url.startsWith('lesson:')) return lessonPath(basePath, url.slice('lesson:'.length));
  if (url.startsWith('problem:')) return problemPath(basePath, url.slice('problem:'.length));
  return safeUrl(url);
};
