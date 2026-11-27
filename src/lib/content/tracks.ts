import { DSA_TRACK } from '@content/dsa';
import { HLD_TRACK } from '@content/hld';
import { JAVA_TRACK } from '@content/java';
import { LLD_TRACK } from '@content/lld';
import { findLesson, findProblem, flattenLessons } from '@content/shared/curriculum';
import { hasLessonBody } from '@content/shared/loaders';
import type { Track } from '@content/shared/types';
import { TOPIC_IDS, type TopicId } from '@lib/topics';

// Curriculum metadata of every topic. Pure data (plus the generated body manifest), so it can
// be used anywhere; Markdown bodies are read separately, on the server (./bodies.ts).

/** Every lesson without a Markdown body is shown as "coming soon" (Java and HLD already do this themselves). */
const withComingSoon = (track: Track): Track => ({
  ...track,
  stages: track.stages.map((stage) => ({
    ...stage,
    modules: stage.modules.map((module) => ({
      ...module,
      lessons: module.lessons.map((lesson) =>
        lesson.comingSoon || hasLessonBody(track.id, lesson.slug) ? lesson : { ...lesson, comingSoon: true },
      ),
    })),
  })),
});

export const TRACKS: Record<TopicId, Track> = {
  java: withComingSoon(JAVA_TRACK),
  dsa: withComingSoon(DSA_TRACK),
  lld: withComingSoon(LLD_TRACK),
  hld: withComingSoon(HLD_TRACK),
};

/** Every lesson page, as route params. Unwritten ("coming soon") lessons get a page too. */
export const lessonParams = () =>
  TOPIC_IDS.flatMap((topic) => flattenLessons(TRACKS[topic]).map(({ lesson }) => ({ topic, lesson: lesson.slug })));

/** Every problem page, as route params. */
export const problemParams = () =>
  TOPIC_IDS.flatMap((topic) => TRACKS[topic].problems.map((problem) => ({ topic, problem: problem.slug })));

export { findLesson, findProblem, flattenLessons };
