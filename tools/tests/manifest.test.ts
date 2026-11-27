import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { reservedSlugCollisions } from '../content/checks';
import { buildManifest } from '../content/manifest';

let contentDir: string;

const touch = (relativePath: string) => {
  const file = path.join(contentDir, relativePath);
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, '');
};

beforeEach(() => {
  contentDir = mkdtempSync(path.join(tmpdir(), 'theswe-content-'));
});

afterEach(() => {
  rmSync(contentDir, { recursive: true, force: true });
});

describe('buildManifest', () => {
  it('lists the Markdown bodies of each topic in sorted order, ignoring other files', () => {
    touch('java/lessons/records.md');
    touch('java/lessons/enums.md');
    touch('java/lessons/notes.txt');
    touch('hld/problems/url-shortener.md');

    const manifest = buildManifest(contentDir);

    expect(manifest.lessons.java).toEqual(['enums', 'records']);
    expect(manifest.problems.hld).toEqual(['url-shortener']);
  });

  it('returns empty lists for topics without content', () => {
    const manifest = buildManifest(contentDir);

    expect(manifest.lessons).toEqual({ java: [], dsa: [], lld: [], hld: [] });
    expect(manifest.problems).toEqual({ java: [], dsa: [], lld: [], hld: [] });
  });
});

describe('reservedSlugCollisions', () => {
  it('flags lessons whose slug would shadow a section page', () => {
    touch('dsa/lessons/problems.md');
    touch('dsa/lessons/two-pointers.md');

    expect(reservedSlugCollisions(buildManifest(contentDir))).toEqual(['dsa/problems']);
  });
});
