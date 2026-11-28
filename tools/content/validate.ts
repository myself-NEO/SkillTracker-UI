// Content checks, run before every build (`npm run validate`). Exits non-zero on any error.
// Ported from TheSWEguide's scripts/validate-content.ts.
//
// Errors: curriculum entries and Markdown bodies that don't match, duplicate or reserved slugs,
// references and links that point nowhere, widget blocks that don't parse, leftover #hash routes.
// Warnings (reported, not fatal): HLD and DSA bodies that deviate from their format's section contract,
// unknown fence languages and Mermaid diagram types, animations missing from their lesson, and raw
// HTML outside code fences (the site doesn't render it).
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { CHEATSHEETS } from '@content/dsa/cheatsheets';
import { PRACTICE_TOPICS } from '@content/dsa/practiceTopics';
import { LESSON_SECTIONS as DSA_LESSON_SECTIONS } from '@content/dsa/formats';
import { LESSON_SECTIONS as HLD_LESSON_SECTIONS, PROBLEM_SECTIONS } from '@content/hld/formats';
import { INTERVIEW_TOPICS } from '@content/java/interview';
import manifest from '@content/.generated/manifest.json';
import { flattenLessons } from '@content/shared/curriculum';
import { TRACKS } from '@lib/content/tracks';
import { parseMeta } from '@lib/markdown/hast';
import { RESERVED_SEGMENTS } from '@lib/routes';
import { TOPIC_IDS } from '@lib/topics';
import { BUILDERS } from '@lib/viz/builders';
import { SCENES } from '@lib/viz/registry';
import { hasSchema } from '@lib/viz/schemas';
import { checkFence, checkLink, duplicates, leftoverHashRoutes, sectionProblems, type SiteRoutes } from './checks';
import { scanMarkdown } from './markdown-scan';
import { CONTENT_DIR, rel } from './paths';

const CONTENT = CONTENT_DIR;
const errors: string[] = [];
const warnings: string[] = [];

// Pages the app serves (TheSWEguide's URL scheme): the topics with their lessons, problems and
// section pages (practice, interview prep, notebook, progress, …), DSA's practice topics and cheat
// sheets, and the animations.
const pages = new Set<string>(['/']);
for (const topic of TOPIC_IDS) {
  const track = TRACKS[topic];
  pages.add(track.basePath);
  for (const { lesson } of flattenLessons(track)) pages.add(`${track.basePath}/${lesson.slug}`);
  pages.add(`${track.basePath}/problems`);
  for (const problem of track.problems) pages.add(`${track.basePath}/problems/${problem.slug}`);
  for (const link of track.sectionLinks ?? []) pages.add(link.href);
  if (topic === 'lld' || topic === 'hld')
    for (const problem of track.problems) pages.add(`${track.basePath}/interview/${problem.slug}`);
}
for (const interviewTopic of INTERVIEW_TOPICS) pages.add(`/java/interview/${interviewTopic.id}`);
for (const practiceTopic of PRACTICE_TOPICS) pages.add(`/dsa/problems/${practiceTopic.id}`);
for (const sheet of CHEATSHEETS) pages.add(`/dsa/cheatsheets/${sheet.slug}`);
pages.add('/visualize');
for (const scene of SCENES) pages.add(`/visualize/${scene.id}`);
const routes: SiteRoutes = { pages };
/** Files each animation is embedded in, by scene id. */
const embeds = new Map<string, string[]>();

const stats = { links: 0, fences: new Map<string, number>(), bodies: 0 };

/** The section contracts of the topics that have them, by lesson format. */
const contracts: Partial<Record<string, Partial<Record<string, readonly string[]>>>> = {
  hld: HLD_LESSON_SECTIONS,
  dsa: DSA_LESSON_SECTIONS,
};

/** Checks one Markdown body: its links, its fenced blocks and, optionally, its section contract. */
const checkBody = (file: string, basePath: string, requiredSections?: readonly string[]) => {
  const scanned = scanMarkdown(readFileSync(file, 'utf8'));
  stats.bodies++;
  for (const link of scanned.links) {
    const verdict = checkLink(link.url, basePath, routes);
    if (verdict === 'ok') stats.links++;
    if (typeof verdict === 'object') errors.push(`${rel(file)}:${link.line}  ${verdict.broken}`);
  }
  for (const html of scanned.rawHtml)
    warnings.push(`${rel(file)}:${html.line}  raw HTML is not rendered: ${html.value.trim().slice(0, 60)}`);
  for (const fence of scanned.fences) {
    stats.fences.set(fence.lang || '(none)', (stats.fences.get(fence.lang || '(none)') ?? 0) + 1);
    if (fence.lang === 'viz' || fence.lang === 'scrolly') {
      const scene = parseMeta(fence.meta).name ?? '';
      embeds.set(scene, [...(embeds.get(scene) ?? []), rel(file)]);
    }
    const found = checkFence(fence);
    errors.push(...found.errors.map((e) => `${rel(file)}:${fence.line}  ${e}`));
    warnings.push(...found.warnings.map((w) => `${rel(file)}:${fence.line}  ${w}`));
  }
  if (requiredSections) {
    const sections = scanned.headings.filter((h) => h.depth === 2).map((h) => h.text);
    const { missing, outOfOrder } = sectionProblems(sections, requiredSections);
    if (missing.length > 0) warnings.push(`${rel(file)}  missing sections: ${missing.join(', ')}`);
    if (outOfOrder.length > 0) warnings.push(`${rel(file)}  sections out of order: ${outOfOrder.join(', ')}`);
  }
};

let lessonCount = 0;
let comingSoon = 0;
let problemCount = 0;

for (const topic of TOPIC_IDS) {
  const track = TRACKS[topic];
  const lessons = flattenLessons(track).map(({ lesson }) => lesson);
  const lessonSlugs = new Set(lessons.map((l) => l.slug));
  const problemSlugs = new Set(track.problems.map((p) => p.slug));
  const where = (kind: string, slug: string) => `content/${topic} ${kind} "${slug}"`;

  for (const slug of duplicates(lessons.map((l) => l.slug))) errors.push(`${where('lesson', slug)} is listed twice`);
  for (const slug of duplicates(track.problems.map((p) => p.slug)))
    errors.push(`${where('problem', slug)} is listed twice`);
  for (const lesson of lessons)
    if ((RESERVED_SEGMENTS as readonly string[]).includes(lesson.slug))
      errors.push(`${where('lesson', lesson.slug)} uses a slug reserved for a section page; rename it`);

  for (const lesson of lessons) {
    lessonCount++;
    for (const slug of [...lesson.prerequisites, ...lesson.related])
      if (!lessonSlugs.has(slug)) errors.push(`${where('lesson', lesson.slug)} refers to unknown lesson "${slug}"`);
    for (const slug of lesson.problems)
      if (!problemSlugs.has(slug)) errors.push(`${where('lesson', lesson.slug)} refers to unknown problem "${slug}"`);
    if (lesson.comingSoon) {
      comingSoon++;
      continue;
    }
    const required = lesson.format ? contracts[topic]?.[lesson.format] : undefined;
    if (lesson.format && !required)
      errors.push(
        `${where('lesson', lesson.slug)} has format "${lesson.format}", which content/${topic}/formats.ts doesn't define`,
      );
    checkBody(path.join(CONTENT, topic, 'lessons', `${lesson.slug}.md`), track.basePath, required);
  }

  for (const problem of track.problems) {
    problemCount++;
    for (const slug of problem.concepts)
      if (!lessonSlugs.has(slug)) errors.push(`${where('problem', problem.slug)} refers to unknown lesson "${slug}"`);
    const file = path.join(CONTENT, topic, 'problems', `${problem.slug}.md`);
    if (existsSync(file)) checkBody(file, track.basePath, topic === 'hld' ? PROBLEM_SECTIONS : undefined);
  }

  for (const slug of manifest.lessons[topic] as string[])
    if (!lessonSlugs.has(slug)) errors.push(`content/${topic}/lessons/${slug}.md has no curriculum entry`);
  for (const slug of manifest.problems[topic] as string[])
    if (!problemSlugs.has(slug)) errors.push(`content/${topic}/problems/${slug}.md has no curriculum entry`);
}

// The Java interview bank's answers (rendered with the interview pages).
const interviewDir = path.join(CONTENT, 'java', 'interview');
if (existsSync(interviewDir))
  for (const name of readdirSync(interviewDir).filter((n) => n.endsWith('.md')))
    checkBody(path.join(interviewDir, name), TRACKS.java.basePath);

// The DSA cheat sheets: every entry has a body and every body has an entry.
const cheatsheetDir = path.join(CONTENT, 'dsa', 'cheatsheets');
const cheatsheetFiles = existsSync(cheatsheetDir) ? readdirSync(cheatsheetDir).filter((n) => n.endsWith('.md')) : [];
for (const sheet of CHEATSHEETS) {
  const file = path.join(cheatsheetDir, `${sheet.slug}.md`);
  if (existsSync(file)) checkBody(file, TRACKS.dsa.basePath);
  else errors.push(`content/dsa cheat sheet "${sheet.slug}" has no Markdown body`);
}
for (const name of cheatsheetFiles)
  if (!CHEATSHEETS.some((sheet) => `${sheet.slug}.md` === name))
    errors.push(`content/dsa/cheatsheets/${name} has no entry in content/dsa/cheatsheets.ts`);

// No #hash routes may survive the import, in Markdown or TypeScript.
const listFiles = (dir: string): string[] =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory()
      ? entry.name.startsWith('.')
        ? []
        : listFiles(path.join(dir, entry.name))
      : /\.(md|ts)$/.test(entry.name) && entry.name !== 'SOURCE.md'
        ? [path.join(dir, entry.name)]
        : [],
  );
for (const file of listFiles(CONTENT)) {
  const text = readFileSync(file, 'utf8');
  for (const index of leftoverHashRoutes(text))
    errors.push(`${rel(file)}:${text.slice(0, index).split('\n').length}  leftover #hash route`);
}

// Every registered animation has a schema and a frame builder, and is embedded in its lesson.
for (const id of duplicates(SCENES.map((scene) => scene.id))) errors.push(`src/lib/viz/registry.ts lists "${id}" twice`);
for (const scene of SCENES) {
  const where = `src/lib/viz/registry.ts scene "${scene.id}"`;
  if (!hasSchema(scene.id)) errors.push(`${where} has no parameter schema in src/lib/viz/schemas.ts`);
  if (!BUILDERS[scene.id]) errors.push(`${where} has no frame builder in src/lib/viz/builders.ts`);
  const lessonFile = `content/${scene.topic}/lessons/${scene.lesson}.md`;
  if (!flattenLessons(TRACKS[scene.topic]).some(({ lesson }) => lesson.slug === scene.lesson))
    errors.push(`${where} names unknown lesson ${scene.topic}/${scene.lesson}`);
  else if (!embeds.get(scene.id)?.includes(lessonFile)) warnings.push(`${where} is not embedded in ${lessonFile}`);
}

const fenceSummary = [...stats.fences.entries()]
  .sort((a, b) => b[1] - a[1])
  .map(([lang, n]) => `${lang} ${n}`)
  .join(', ');
console.log(
  `validate: ${lessonCount} lessons (${lessonCount - comingSoon} written, ${comingSoon} coming soon) and ${problemCount} problems across ${TOPIC_IDS.length} topics; ${stats.bodies} Markdown bodies checked`,
);
console.log(
  `validate: ${stats.links} internal links resolve`,
);
console.log(`validate: fenced blocks: ${fenceSummary}`);
if (warnings.length > 0) {
  console.warn(`validate: ${warnings.length} warning(s)\n${warnings.map((w) => `  - ${w}`).join('\n')}`);
}
if (errors.length > 0) {
  console.error(`validate: ${errors.length} error(s)\n${errors.map((e) => `  - ${e}`).join('\n')}`);
  process.exit(1);
}
console.log('validate: content OK');
