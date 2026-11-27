import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Where the content build reads and writes. Everything under public/ is served as is.

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
export const CONTENT_DIR = path.join(ROOT, 'content');
export const PUBLIC_DIR = path.join(ROOT, 'public');
/** Generated lesson, problem and cheat sheet JSON (git-ignored). */
export const OUT_DIR = path.join(PUBLIC_DIR, 'content');
/** The ⌘K search index (git-ignored). */
export const SEARCH_INDEX_FILE = path.join(PUBLIC_DIR, 'search-index.json');

/** A path relative to the repository root, with forward slashes, for messages. */
export const rel = (file: string) => path.relative(ROOT, file).split(path.sep).join('/');
