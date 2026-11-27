import type { Level } from '@content/shared/types';

/** A reading time: "45 min" under an hour, then hours to the nearest half, e.g. "2.5 h". */
export const formatDuration = (minutes: number) =>
  minutes < 60 ? `${minutes} min` : `${Math.round(minutes / 30) / 2} h`;

/** Stage and step numbers as two digits: 1 → "01". */
export const pad2 = (n: number) => String(n).padStart(2, '0');

/** Thousands separators, the same on the server and in every browser. */
export const formatCount = (n: number) => n.toLocaleString('en-US');

/** A difficulty level as a word: "intermediate" → "Intermediate". */
export const LEVEL_NAME: Record<Level, string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
};
