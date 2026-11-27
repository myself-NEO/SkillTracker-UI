import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import type { ContentIndex, DsaPractice, TrackFile } from '@lib/content/catalog';
import type { ContentDoc } from '@lib/content/doc';
import type { TopicId } from '@lib/topics';

/** How many page bodies (lessons, problems, cheat sheets) stay in memory for Back and Forward. */
const DOC_CACHE_SIZE = 24;

/**
 * The lesson catalog and pages, generated at build time into public/content (tools/content/build.ts)
 * and served as static files from the same origin as the app, so they never wait for the backend.
 * Catalog files are fetched once per visit; page bodies are kept for the most recent pages.
 */
@Injectable({ providedIn: 'root' })
export class ContentService {
  private readonly http = inject(HttpClient);
  private readonly catalog = new Map<string, Promise<unknown>>();
  private readonly docs = new Map<string, Promise<ContentDoc>>();

  /** Every topic with its counts, and the content version. */
  index(): Promise<ContentIndex> {
    return this.cached(this.catalog, '/content/index.json');
  }

  /** A topic's curriculum: stages, modules, lessons and practice problems. */
  track(topic: TopicId): Promise<TrackFile> {
    return this.cached(this.catalog, `/content/${topic}/track.json`);
  }

  /** DSA's coding-question list (by practice topic) and its cheat sheets. */
  dsaPractice(): Promise<DsaPractice> {
    return this.cached(this.catalog, '/content/dsa/practice.json');
  }

  lesson(topic: TopicId, slug: string): Promise<ContentDoc> {
    return this.doc(`/content/${topic}/lessons/${encodeURIComponent(slug)}.json`);
  }

  problem(topic: TopicId, slug: string): Promise<ContentDoc> {
    return this.doc(`/content/${topic}/problems/${encodeURIComponent(slug)}.json`);
  }

  cheatsheet(slug: string): Promise<ContentDoc> {
    return this.doc(`/content/dsa/cheatsheets/${encodeURIComponent(slug)}.json`);
  }

  /** Starts downloading a lesson the reader is likely to open next, when the browser is idle. */
  prefetchLesson(topic: TopicId, slug: string): void {
    const start = () => void this.lesson(topic, slug).catch(() => {});
    if (typeof requestIdleCallback === 'function') requestIdleCallback(start, { timeout: 4000 });
    else setTimeout(start, 1500);
  }

  private doc(path: string): Promise<ContentDoc> {
    const request = this.cached(this.docs, path) as Promise<ContentDoc>;
    // Most recently used last; the oldest goes once the cache is full.
    this.docs.delete(path);
    this.docs.set(path, request);
    if (this.docs.size > DOC_CACHE_SIZE) this.docs.delete(this.docs.keys().next().value!);
    return request;
  }

  private cached<T>(cache: Map<string, Promise<unknown>>, path: string): Promise<T> {
    let request = cache.get(path) as Promise<T> | undefined;
    if (!request) {
      request = firstValueFrom(this.http.get<T>(path));
      // A failed request isn't kept, so the next visit to the page tries again.
      request.catch(() => {
        if (cache.get(path) === request) cache.delete(path);
      });
      cache.set(path, request);
    }
    return request;
  }
}
