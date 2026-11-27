import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import type { Track } from '@content/shared/types';
import type { ContentIndex, DsaPractice } from '@lib/content/catalog';
import type { TopicId } from '@lib/topics';

/**
 * The lesson catalog and pages, generated at build time into public/content (tools/content/build.ts)
 * and served as static files from the same origin as the app, so they never wait for the backend.
 * Each file is fetched once per visit.
 */
@Injectable({ providedIn: 'root' })
export class ContentService {
  private readonly http = inject(HttpClient);
  private readonly cache = new Map<string, Promise<unknown>>();

  /** Every topic with its counts, and the content version. */
  index(): Promise<ContentIndex> {
    return this.get('/content/index.json');
  }

  /** A topic's curriculum: stages, modules, lessons and practice problems. */
  track(topic: TopicId): Promise<Track> {
    return this.get(`/content/${topic}/track.json`);
  }

  /** DSA's coding-question list (by practice topic) and its cheat sheets. */
  dsaPractice(): Promise<DsaPractice> {
    return this.get('/content/dsa/practice.json');
  }

  private get<T>(path: string): Promise<T> {
    let request = this.cache.get(path) as Promise<T> | undefined;
    if (!request) {
      request = firstValueFrom(this.http.get<T>(path));
      // A failed request isn't kept, so the next visit to the page tries again.
      request.catch(() => this.cache.delete(path));
      this.cache.set(path, request);
    }
    return request;
  }
}
