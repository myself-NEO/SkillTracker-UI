// The content build: turns content/ (Markdown + curriculum TypeScript) into the JSON the app
// loads, under public/ (git-ignored). Runs before `ng build` and `ng serve` (npm prebuild/predev).
//
//   public/content/index.json                          topics, their counts, and a content version
//   public/content/<topic>/track.json                  the topic's curriculum (stages, modules, lessons, problems)
//   public/content/<topic>/lessons/<slug>.json          a lesson body (ContentDoc, src/lib/content/doc.ts)
//   public/content/<topic>/problems/<slug>.json         a problem breakdown (ContentDoc)
//   public/content/dsa/cheatsheets/<slug>.json          a DSA cheat sheet (ContentDoc)
//   public/content/dsa/practice.json                   the DSA coding-question list and cheat sheet index
//   public/content/java/interview-questions.json       the Java question bank's titles by question id
//   public/content/java/interview/<topic>.json         a topic of the Java question bank, rendered (and tricky.json)
//   public/content/visualize.json                      the animation gallery's scenes
//   public/search-index.json                          the ⌘K search index
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { gzipSync } from 'node:zlib';
import { CHEATSHEETS } from '@content/dsa/cheatsheets';
import { LEETCODE_PROBLEMS } from '@content/dsa/problems';
import { PRACTICE_TOPICS } from '@content/dsa/practiceTopics';
import { INTERVIEW_TOPICS, parseInterviewTopic } from '@content/java/interview';
import { TRICKY } from '@lib/interview/java-bank';
import { hasProblemBody } from '@content/shared/loaders';
import type { ContentIndex, IndexTopic, JavaBankQuestion, JavaQuestionIndex, TrackFile, VisualizeIndex } from '@lib/content/catalog';
import type { ContentDoc, ContentFragment } from '@lib/content/doc';
import { topicStats } from '@lib/content/stats';
import { findLesson, flattenLessons, TRACKS } from '@lib/content/tracks';
import { TOPIC_IDS, TOPICS } from '@lib/topics';
import { SCENES } from '@lib/viz/registry';
import { parseSceneParams } from '@lib/viz/schemas';
import { countSlugs, writeManifest } from './manifest';
import { highlightLines } from './highlight';
import { CONTENT_DIR, OUT_DIR, rel, ROOT, SEARCH_INDEX_FILE } from './paths';
import { renderDoc } from './pipeline';
import { buildSearchIndex } from './search-index';

const started = Date.now();

// Skip the work when nothing it reads has changed since the last build (`--force` rebuilds anyway):
// the content, this tool, and the shared libraries it renders with.
const STAMP = path.join(CONTENT_DIR, '.generated', 'build-inputs');
const inputsHash = () => {
  const hash = createHash('sha256');
  const add = (dir: string) => {
    for (const entry of readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name !== '.generated') add(full);
      } else {
        hash.update(rel(full)).update(readFileSync(full));
      }
    }
  };
  for (const dir of [CONTENT_DIR, path.join(ROOT, 'tools', 'content'), path.join(ROOT, 'src', 'lib')]) add(dir);
  hash.update(readFileSync(path.join(ROOT, 'package-lock.json')));
  return hash.digest('hex');
};
const inputs = inputsHash();
const upToDate =
  existsSync(STAMP) && readFileSync(STAMP, 'utf8') === inputs && existsSync(path.join(OUT_DIR, 'index.json')) && existsSync(SEARCH_INDEX_FILE);
if (upToDate && !process.argv.includes('--force')) {
  console.log(`content: up to date (${rel(OUT_DIR)}); \`npm run content -- --force\` rebuilds anyway`);
  process.exit(0);
}

const written: { file: string; json: string }[] = [];

const write = (file: string, data: unknown) => {
  const json = JSON.stringify(data);
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, json);
  written.push({ file, json });
};

// LF only: quiz progress is keyed by hashes of the exact text, whatever line endings a checkout has.
const read = (...parts: string[]) => readFileSync(path.join(CONTENT_DIR, ...parts), 'utf8').replace(/\r\n?/g, '\n');

// Which bodies exist: the curriculum modules read this to mark unwritten lessons "coming soon".
const { manifest } = writeManifest(CONTENT_DIR);
console.log(`content: ${countSlugs(manifest.lessons)} lesson and ${countSlugs(manifest.problems)} problem bodies`);

rmSync(OUT_DIR, { recursive: true, force: true });

const docs: { file: string; doc: ContentDoc }[] = [];
const renderTo = async (file: string, markdown: string, basePath: string, javaVersion?: number) => {
  const doc = await renderDoc(markdown, { basePath, javaVersion });
  write(file, doc);
  docs.push({ file, doc });
};

for (const topic of TOPIC_IDS) {
  const track = TRACKS[topic];
  write(path.join(OUT_DIR, topic, 'track.json'), {
    ...track,
    writtenProblems: track.problems.filter((problem) => hasProblemBody(topic, problem.slug)).map((problem) => problem.slug),
  } satisfies TrackFile);
  for (const { lesson } of flattenLessons(track)) {
    if (lesson.comingSoon) continue;
    await renderTo(
      path.join(OUT_DIR, topic, 'lessons', `${lesson.slug}.json`),
      read(topic, 'lessons', `${lesson.slug}.md`),
      track.basePath,
      lesson.javaVersion ?? track.javaVersion,
    );
  }
  for (const problem of track.problems) {
    if (!hasProblemBody(topic, problem.slug)) continue;
    await renderTo(
      path.join(OUT_DIR, topic, 'problems', `${problem.slug}.json`),
      read(topic, 'problems', `${problem.slug}.md`),
      track.basePath,
      track.javaVersion,
    );
  }
}

for (const sheet of CHEATSHEETS) {
  await renderTo(path.join(OUT_DIR, 'dsa', 'cheatsheets', `${sheet.slug}.json`), read('dsa', 'cheatsheets', `${sheet.slug}.md`), TRACKS.dsa.basePath);
}
write(path.join(OUT_DIR, 'dsa', 'practice.json'), { topics: PRACTICE_TOPICS, problems: LEETCODE_PROBLEMS, cheatsheets: CHEATSHEETS });

// The Java question bank: each topic's questions with their Markdown rendered like the lessons
// (highlighted code), a file of the tricky ones, and every question's title by id (the bank's index
// counts them; the notebook names questions flagged for revision).
const java = TRACKS.java;
const fragment = async (markdown: string): Promise<ContentFragment> => {
  const { html, widgets } = await renderDoc(markdown, { basePath: java.basePath, javaVersion: java.javaVersion });
  return { html, widgets };
};
const javaQuestions: JavaQuestionIndex = {};
const tricky: JavaBankQuestion[] = [];
for (const topic of INTERVIEW_TOPICS) {
  const questions = parseInterviewTopic(topic.id, read('java', 'interview', `${topic.id}.md`), (message) => {
    throw new Error(`content/java/interview/${topic.id}.md: ${message}`);
  });
  const rendered: JavaBankQuestion[] = [];
  for (const question of questions) {
    const lessons = question.lessons.flatMap((slug) => {
      const lesson = findLesson(java, slug)?.lesson;
      return lesson ? [{ slug: lesson.slug, title: lesson.title }] : [];
    });
    const entry: JavaBankQuestion = {
      id: question.id,
      topic: question.topic,
      title: question.title,
      level: question.level,
      kind: question.kind,
      tricky: question.tricky,
      lessons,
      ...(question.body && { body: await fragment(question.body) }),
      hints: await Promise.all(question.hints.map(fragment)),
      answer: await fragment(question.answer),
      ...(question.whyNot && { whyNot: await fragment(question.whyNot) }),
      ...(question.followUp && { followUp: await fragment(question.followUp) }),
    };
    rendered.push(entry);
    if (question.tricky) tricky.push(entry);
    javaQuestions[question.id] = { title: question.title, topic: question.topic, ...(question.tricky && { tricky: true as const }) };
  }
  write(path.join(OUT_DIR, 'java', 'interview', `${topic.id}.json`), { topic, questions: rendered });
}
write(path.join(OUT_DIR, 'java', 'interview', 'tricky.json'), { topic: TRICKY, questions: tricky });
write(path.join(OUT_DIR, 'java', 'interview-questions.json'), javaQuestions);

// The animation gallery: every scene with its default parameters and highlighted code.
const visualize: VisualizeIndex = { scenes: [] };
for (const scene of SCENES) {
  const lesson = findLesson(TRACKS[scene.topic], scene.lesson)?.lesson;
  const parsed = parseSceneParams(scene.id, '');
  if ('error' in parsed) throw new Error(`${scene.id}: its default parameters are invalid (${parsed.error})`);
  visualize.scenes.push({
    id: scene.id,
    title: scene.title,
    summary: scene.summary,
    topic: scene.topic,
    modes: scene.modes,
    lesson: lesson && { title: lesson.title, href: `${TRACKS[scene.topic].basePath}/${lesson.slug}` },
    params: parsed.params,
    code: scene.code && { label: scene.code.label, lines: await highlightLines(scene.code.source, scene.code.language) },
  });
}
write(path.join(OUT_DIR, 'visualize.json'), visualize);

// A fingerprint of everything above: the app can add it to content URLs to skip stale caches.
const version = createHash('sha256')
  .update(written.map((w) => `${rel(w.file)}\n${w.json}`).sort().join('\n'))
  .digest('hex')
  .slice(0, 12);
write(path.join(OUT_DIR, 'index.json'), {
  version,
  topics: TOPICS.map((topic): IndexTopic => ({
    ...topic,
    basePath: TRACKS[topic.id].basePath,
    stats: topicStats(topic.id),
    lessonSlugs: flattenLessons(TRACKS[topic.id]).map(({ lesson }) => lesson.slug),
  })),
} satisfies ContentIndex);

const searchIndex = buildSearchIndex();
write(SEARCH_INDEX_FILE, searchIndex);

// Report: counts, sizes (raw and gzipped, as served) and the largest bodies.
const kb = (bytes: number) => `${(bytes / 1024).toFixed(0)} KB`;
const gz = (json: string) => gzipSync(json).length;
const docBytes = docs.map(({ file }) => written.find((w) => w.file === file)!.json);
const widgets = docs.reduce((n, { doc }) => n + doc.widgets.length, 0);
console.log(
  `content: ${docs.length} documents (${widgets} widgets), ${kb(docBytes.reduce((n, j) => n + j.length, 0))} raw, ` +
    `${kb(docBytes.reduce((n, j) => n + gz(j), 0))} gzipped -> ${rel(OUT_DIR)}`,
);
const largest = docs
  .map(({ file }, i) => ({ file, raw: docBytes[i].length, gzip: gz(docBytes[i]) }))
  .sort((a, b) => b.raw - a.raw)
  .slice(0, 3)
  .map((d) => `${rel(d.file).replace('public/content/', '')} ${kb(d.raw)} (${kb(d.gzip)} gz)`);
console.log(`content: largest: ${largest.join(', ')}`);
const indexJson = written.find((w) => w.file === SEARCH_INDEX_FILE)!.json;
console.log(`content: search index ${searchIndex.length} entries, ${kb(indexJson.length)} (${kb(gz(indexJson))} gz) -> ${rel(SEARCH_INDEX_FILE)}`);
writeFileSync(STAMP, inputs);
console.log(`content: version ${version}, done in ${((Date.now() - started) / 1000).toFixed(1)} s`);
