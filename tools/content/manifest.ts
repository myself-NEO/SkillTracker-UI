import { existsSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { TOPIC_IDS, type TopicId } from '@lib/topics';

// content/.generated/manifest.json: which lesson and problem bodies exist for each topic. The
// curriculum modules read it (content/shared/loaders.ts) to mark unwritten lessons "coming soon".
// Ported from TheSWEguide's scripts/lib/manifest.ts.

/** Which Markdown bodies exist, so content modules can mark unwritten lessons "coming soon" without the file system. */
export interface ContentManifest {
  /** topic → slugs of `content/<topic>/lessons/<slug>.md` */
  lessons: Record<TopicId, string[]>;
  /** topic → slugs of `content/<topic>/problems/<slug>.md` */
  problems: Record<TopicId, string[]>;
}

const markdownSlugs = (dir: string): string[] =>
  existsSync(dir)
    ? readdirSync(dir, { withFileTypes: true })
        .filter((entry) => entry.isFile() && entry.name.endsWith('.md'))
        .map((entry) => entry.name.slice(0, -'.md'.length))
        .sort()
    : [];

export const buildManifest = (contentDir: string): ContentManifest => {
  const lessons = {} as Record<TopicId, string[]>;
  const problems = {} as Record<TopicId, string[]>;
  for (const topic of TOPIC_IDS) {
    lessons[topic] = markdownSlugs(path.join(contentDir, topic, 'lessons'));
    problems[topic] = markdownSlugs(path.join(contentDir, topic, 'problems'));
  }
  return { lessons, problems };
};

/** Builds the manifest and writes it to `content/.generated/manifest.json`; returns it and the file written. */
export const writeManifest = (contentDir: string) => {
  const manifest = buildManifest(contentDir);
  const file = path.join(contentDir, '.generated', 'manifest.json');
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, `${JSON.stringify(manifest, null, 2)}\n`);
  return { manifest, file };
};

export const countSlugs = (bySlug: Record<string, string[]>) =>
  Object.values(bySlug).reduce((n, slugs) => n + slugs.length, 0);
