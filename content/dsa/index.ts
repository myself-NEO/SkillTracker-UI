import { Track } from '../shared/types';
import { FOUNDATIONS } from './stages/01-foundations';
import { RECURSION_TREES } from './stages/02-recursion-trees';
import { ADVANCED } from './stages/03-advanced';
import { STRINGS_MATH } from './stages/04-strings-math';

// The DSA track. It came from the portfolio's single-file guides; Phase 2 of TheSWEguide split
// them into one lesson per concept (scripts/dsa-split), so this folder now belongs to
// TheSWEguide and is no longer imported. Lessons are the Markdown files in ./lessons, the
// curriculum is in ./stages, and the three one-pass guides are revision pages in ./cheatsheets.

export { CHEATSHEETS } from './cheatsheets';
export type { Cheatsheet } from './cheatsheets';

export const DSA_TRACK: Track = {
  id: 'dsa',
  title: 'Data Structures & Algorithms',
  shortTitle: 'DSA',
  status: 'active',
  tagline: 'Interview-ready DSA in Java',
  description:
    'Patterns, templates and worked problems for every major data structure and algorithm, written for Java engineers preparing for coding interviews.',
  stages: [FOUNDATIONS, RECURSION_TREES, ADVANCED, STRINGS_MATH],
  problems: [],
  basePath: '/dsa',
  home: { label: 'DSA', href: '/dsa' },
  language: 'Java',
  hasKnowledgeChecks: true,
  sectionLinks: [
    { label: 'Coding questions', href: '/dsa/problems' },
    { label: 'Interview notes', href: '/dsa/notes' },
    { label: 'Progress', href: '/dsa/progress' },
  ],
};
