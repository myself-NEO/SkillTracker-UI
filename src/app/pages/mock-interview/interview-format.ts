import type { TopicId } from '@lib/topics';
import type { InterviewType } from './interview.service';

/** The interview kinds the server knows, in the order the booking form lists them. */
export const INTERVIEW_TYPES: readonly { value: InterviewType; label: string; topic: TopicId | null }[] = [
  { value: 'DSA', label: 'DSA / coding', topic: 'dsa' },
  { value: 'OOD', label: 'Low-level design', topic: 'lld' },
  { value: 'System Design', label: 'System design', topic: 'hld' },
  { value: 'Behavioral', label: 'Behavioral', topic: null },
];

const BY_VALUE = new Map(INTERVIEW_TYPES.map((type) => [type.value as string, type]));

export const typeLabel = (type: string) => BY_VALUE.get(type)?.label ?? type;

/** The topic whose colour the interview kind wears, if any. */
export const typeTopic = (type: string) => BY_VALUE.get(type)?.topic ?? null;

/** "Tue, 2 Dec 2026" in the reader's locale, from the server's yyyy-mm-dd (a calendar date, no time zone). */
export function formatDay(isoDate: string, locale?: string): string {
  const [year, month, day] = isoDate.split('-').map(Number);
  if (!year || !month || !day) return isoDate;
  return new Intl.DateTimeFormat(locale, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }).format(
    new Date(year, month - 1, day),
  );
}

/** Sort key of a booking: its date, then its time. */
export const whenKey = (interview: { date: string; time: string }) => `${interview.date}T${interview.time}`;
