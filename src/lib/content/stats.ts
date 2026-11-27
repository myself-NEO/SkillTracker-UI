import { LEETCODE_PROBLEMS } from '@content/dsa/problems';
import type { TopicId } from '@lib/topics';
import { flattenLessons, TRACKS } from './tracks';

/** Counts shown on the homepage and topic pages. DSA's practice problems are its LeetCode list. */
export const topicStats = (topic: TopicId) => {
  const track = TRACKS[topic];
  const lessons = flattenLessons(track).map(({ lesson }) => lesson);
  const minutes = lessons.reduce((n, lesson) => n + lesson.minutes, 0);
  return {
    lessons: lessons.length,
    stages: track.stages.length,
    modules: track.stages.reduce((n, stage) => n + stage.modules.length, 0),
    problems: topic === 'dsa' ? LEETCODE_PROBLEMS.length : track.problems.length,
    problemNoun: topic === 'dsa' ? 'practice problems' : (track.practice?.noun ?? 'problems'),
    hours: Math.round(minutes / 60),
    firstLesson: lessons[0],
  };
};
