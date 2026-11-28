import { topicTitle } from '@content/java/interview';
import { flattenLessons } from '@content/shared/curriculum';
import type { JavaQuestionIndex, TrackFile } from '@lib/content/catalog';
import type { TopicIndex } from './revision';

/**
 * The compact index of a topic the notebook works from: its lessons and problems by slug, and for
 * Java the interview questions by id (public/content/java/interview-questions.json). TheSWEguide
 * built it on the server; here it comes from the topic's track.json, which the app already has.
 */
export const topicIndex = (track: TrackFile, questions: JavaQuestionIndex = {}): TopicIndex => ({
  track: track.id,
  basePath: track.basePath,
  lessons: Object.fromEntries(
    flattenLessons(track).map(({ lesson, stage, moduleTitle }) => [
      lesson.slug,
      { title: lesson.title, stage: stage.id, stageTitle: stage.title, module: moduleTitle },
    ]),
  ),
  problems: Object.fromEntries(track.problems.map((problem) => [problem.slug, problem.title])),
  questions: Object.fromEntries(
    Object.entries(questions).map(([id, question]) => [id, { ...question, topicTitle: topicTitle(question.topic) }]),
  ),
});
