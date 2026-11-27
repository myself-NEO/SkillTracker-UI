import { readFileSync } from 'node:fs';
import path from 'node:path';
import { CHEATSHEETS } from '@content/dsa/cheatsheets';
import { LEETCODE_PROBLEMS, problemRef } from '@content/dsa/problems';
import { practiceTopic } from '@content/dsa/practiceTopics';
import { INTERVIEW_TOPICS, parseInterviewTopic, topicTitle } from '@content/java/interview';
import { practiceCopy } from '@lib/content/practice';
import { flattenLessons, TRACKS } from '@lib/content/tracks';
import { tocHeadings } from '@lib/markdown/toc';
import type { SearchEntry } from '@lib/search/score';
import { topicSections } from '@lib/sections';
import { TOPIC_IDS, TOPICS } from '@lib/topics';
import { SCENES } from '@lib/viz/registry';
import { CONTENT_DIR } from './paths';

// The ⌘K search index: the curriculum, the lesson and cheat sheet headings, the practice problems,
// the Java question bank and the animations. Ported from TheSWEguide's scripts/build-search-index.ts;
// the paths are the app's routes, which keep TheSWEguide's URL scheme.

const read = (...parts: string[]) => readFileSync(path.join(CONTENT_DIR, ...parts), 'utf8').replace(/\r\n?/g, '\n');
const headingsOf = (markdown: string): [string, string][] => tocHeadings(markdown).map((heading) => [heading.id, heading.text]);

export const buildSearchIndex = (): SearchEntry[] => {
  const entries: SearchEntry[] = [];

  for (const topic of TOPIC_IDS) {
    const track = TRACKS[topic];
    const info = TOPICS.find((candidate) => candidate.id === topic)!;
    for (const section of topicSections(topic)) {
      entries.push({
        kind: 'page',
        topic,
        title: section.id === 'roadmap' ? info.title : `${info.shortTitle} ${section.label.toLowerCase()}`,
        context: section.id === 'roadmap' ? 'Topic' : info.title,
        href: section.href,
      });
    }

    for (const { lesson, stage, moduleTitle } of flattenLessons(track)) {
      entries.push({
        kind: 'lesson',
        topic,
        title: lesson.title,
        context: `${info.shortTitle} · ${stage.title} · ${moduleTitle}`,
        href: `${track.basePath}/${lesson.slug}`,
        text: [lesson.summary, ...(lesson.tags ?? [])].join(' '),
        headings: lesson.comingSoon ? [] : headingsOf(read(topic, 'lessons', `${lesson.slug}.md`)),
      });
    }

    const copy = practiceCopy(track);
    for (const problem of track.problems) {
      entries.push({
        kind: 'problem',
        topic,
        title: problem.title,
        context: `${info.shortTitle} · ${copy.groupTitle}`,
        href: `${track.basePath}/problems/${problem.slug}`,
        text: [problem.summary, ...problem.patterns, ...problem.tags].join(' '),
      });
    }
  }

  for (const problem of LEETCODE_PROBLEMS) {
    entries.push({
      kind: 'coding',
      topic: 'dsa',
      title: `${problem.id}. ${problem.title}`,
      context: `DSA coding questions · ${practiceTopic(problem.topic)?.title ?? problem.topic} · ${problem.difficulty}`,
      href: `/dsa/problems/${problem.topic}#${problemRef(problem)}`,
      text: problem.patterns.join(' '),
    });
  }

  for (const sheet of CHEATSHEETS) {
    entries.push({
      kind: 'cheatsheet',
      topic: 'dsa',
      title: sheet.title,
      context: 'DSA cheat sheet',
      href: `/dsa/cheatsheets/${sheet.slug}`,
      text: sheet.summary,
      headings: headingsOf(read('dsa', 'cheatsheets', `${sheet.slug}.md`)),
    });
  }

  for (const topic of INTERVIEW_TOPICS) {
    const questions = parseInterviewTopic(topic.id, read('java', 'interview', `${topic.id}.md`), (message) => {
      throw new Error(`content/java/interview/${topic.id}.md: ${message}`);
    });
    for (const question of questions) {
      entries.push({
        kind: 'question',
        topic: 'java',
        title: question.title.replace(/`/g, ''),
        context: `Java interview · ${topicTitle(question.topic)}`,
        href: `/java/interview/${question.topic}#q-${question.id}`,
      });
    }
  }

  for (const scene of SCENES) {
    const info = TOPICS.find((candidate) => candidate.id === scene.topic)!;
    const lesson = flattenLessons(TRACKS[scene.topic]).find((location) => location.lesson.slug === scene.lesson)?.lesson;
    entries.push({
      kind: 'animation',
      topic: scene.topic,
      title: scene.title,
      context: `${info.shortTitle} animation`,
      href: `/visualize/${scene.id}`,
      text: [scene.summary, lesson?.title ?? '', 'animation visualization'].join(' '),
    });
  }

  return entries;
};
