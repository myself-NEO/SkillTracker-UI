import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import type { Track } from '@content/shared/types';
import type { ContentIndex, DsaPractice } from '@lib/content/catalog';
import type { TopicId } from '@lib/topics';
import { ContentService } from './content.service';

// Route resolvers for the generated catalog files. A page opens once its file has arrived (a small
// static file from the CDN), so it renders complete and links to #anchors land in the right place.
// A failed download resolves to null and the page offers to try again.

export const contentIndexResolver: ResolveFn<ContentIndex | null> = () =>
  inject(ContentService)
    .index()
    .catch(() => null);

/** The topic named in the route's data (`data: { topic }`). */
export const trackResolver: ResolveFn<Track | null> = (route) =>
  inject(ContentService)
    .track(route.data['topic'] as TopicId)
    .catch(() => null);

export const dsaPracticeResolver: ResolveFn<DsaPractice | null> = () =>
  inject(ContentService)
    .dsaPractice()
    .catch(() => null);
