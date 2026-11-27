// Text-level rewrites applied to lesson Markdown before it is parsed. Ported unchanged from the
// portfolio's components/learn/MarkdownContent.tsx.

const DETAILS_OPEN = /^\s*<details>\s*<summary>(.*?)<\/summary>(.*)$/;
const FENCE = /^\s*(```|~~~)/;

const revealKind = (title: string) => {
  if (/solution|answer/i.test(title)) return 'solution';
  if (/hint/i.test(title)) return 'hint';
  return 'reveal';
};

/**
 * Rewrites HTML <details><summary>…</summary>…</details> blocks (raw HTML isn't rendered)
 * into the reveal-block syntax, so collapsible answers in authored notes work and look like
 * every other hint and solution. Handles the single-line form and the multi-line form whose
 * body may contain fenced code.
 */
export const htmlDetailsToReveals = (markdown: string): string => {
  if (!markdown.includes('<details')) return markdown;
  const out: string[] = [];
  let inFence = false;
  let inDetails = false;
  // Notes may be checked out with CRLF endings (git autocrlf on Windows); match per line without the \r.
  for (const line of markdown.replace(/\r\n?/g, '\n').split('\n')) {
    const isFence = FENCE.test(line);
    if (inDetails) {
      if (isFence) inFence = !inFence;
      if (!inFence && line.includes('</details>')) {
        const before = line.slice(0, line.indexOf('</details>'));
        if (before.trim()) out.push(before);
        out.push('````');
        inDetails = false;
      } else {
        out.push(line);
      }
      continue;
    }
    if (isFence) inFence = !inFence;
    const open = inFence ? null : line.match(DETAILS_OPEN);
    if (!open) {
      out.push(line);
      continue;
    }
    const title = open[1].replace(/"/g, "'").trim() || 'Details';
    let rest = open[2];
    const closesHere = rest.includes('</details>');
    if (closesHere) rest = rest.slice(0, rest.indexOf('</details>'));
    out.push('````' + revealKind(title) + ' title="' + title + '"');
    if (rest.trim()) out.push(rest.trim());
    if (closesHere) out.push('````');
    else inDetails = true;
  }
  if (inDetails) out.push('````'); // unterminated block: close it rather than swallow the page
  return out.join('\n');
};

/** `<!-- match: … -->` comments are keyword hints for the HLD and LLD mock interviews, not page content. */
export const stripMatchComments = (markdown: string) =>
  markdown.includes('<!--') ? markdown.replace(/[ \t]*<!--\s*match:[^>]*-->/g, '') : markdown;

/** Everything applied to lesson Markdown before parsing. */
export const prepareMarkdown = (markdown: string) => htmlDetailsToReveals(stripMatchComments(markdown));
