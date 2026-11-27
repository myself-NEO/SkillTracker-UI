// Owned by TheSWEguide: the content import never overwrites this file.
//
// Which Markdown bodies exist. scripts/build-manifest.ts generates the manifest from the file
// tree before every dev server start, build, typecheck and test run, so these lookups need no
// file system access and work in server and browser code alike. The bodies themselves are
// read on the server only, by src/lib/content/bodies.ts.
import manifest from '../.generated/manifest.json';
import type { TrackId } from './types';

const toSets = (slugs: Record<TrackId, readonly string[]>): Record<TrackId, ReadonlySet<string>> => ({
  java: new Set(slugs.java),
  dsa: new Set(slugs.dsa),
  lld: new Set(slugs.lld),
  hld: new Set(slugs.hld),
});

const lessonBodies = toSets(manifest.lessons);
const problemBodies = toSets(manifest.problems);

export const hasLessonBody = (track: TrackId, slug: string) => lessonBodies[track].has(slug);

export const hasProblemBody = (track: TrackId, slug: string) => problemBodies[track].has(slug);
