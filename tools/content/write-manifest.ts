// Writes content/.generated/manifest.json. Runs first in `npm run content`, and before the content
// tests and the validator, because the curriculum modules import the manifest.
import path from 'node:path';
import { countSlugs, writeManifest } from './manifest';
import { CONTENT_DIR, ROOT } from './paths';

const { manifest, file } = writeManifest(CONTENT_DIR);
console.log(
  `manifest: ${countSlugs(manifest.lessons)} lessons, ${countSlugs(manifest.problems)} problems -> ${path.relative(ROOT, file)}`,
);
