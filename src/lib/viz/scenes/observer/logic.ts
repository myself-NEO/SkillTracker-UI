import type { Frame } from '@lib/viz/types';

// observer: a subject publishing events to its subscribers (the Observer lesson's OrderEvents
// and listeners). Each event fans out to whoever is subscribed at that moment; subscribers come
// and go without the subject changing.

export interface ObserverParams {
  subject: string;
  /** The first subscribers; the second one unsubscribes part-way through. */
  subscribers: string[];
  /** Joins later. */
  joining: string;
  events: string[];
}

export const OBSERVER_DEFAULTS: ObserverParams = {
  subject: 'OrderEvents',
  subscribers: ['EmailListener', 'LoyaltyListener', 'AuditListener'],
  joining: 'SmsListener',
  events: ['OrderPlaced #1042', 'OrderShipped #1042', 'OrderDelivered #1042'],
};

export interface ObserverState {
  subject: string;
  subscribers: { name: string; joined?: boolean }[];
  /** The event being published. */
  event?: string;
  /** Subscribers that have received the current event. */
  notified: string[];
  /** The subscriber that just unsubscribed. */
  leaving?: string;
}

export const buildObserver = ({ subject, subscribers, joining, events }: ObserverParams): Frame<ObserverState>[] => {
  const frames: Frame<ObserverState>[] = [];
  let current: ObserverState['subscribers'] = subscribers.map((name) => ({ name }));
  const push = (caption: string, extra: Partial<ObserverState> = {}) =>
    frames.push({ caption, state: { subject, subscribers: current.map((s) => ({ ...s })), notified: [], ...extra } });

  const publish = (event: string) => {
    push(`${subject}.publish(${event}): the subject only knows a list of listeners, not what they do.`, { event });
    const notified: string[] = [];
    for (const subscriber of current) {
      notified.push(subscriber.name);
      push(`${subscriber.name}.onEvent(${event})`, { event, notified: [...notified] });
    }
  };

  push(`${subject} keeps a list of ${current.length} subscribers. Each implements onEvent(event).`);
  publish(events[0] ?? 'Event');
  const leaver = current[1];
  if (leaver) {
    push(`${leaver.name} unsubscribes (closes its Subscription). ${subject} doesn't change.`, { leaving: leaver.name });
    current = current.filter((s) => s !== leaver);
  }
  publish(events[1] ?? events[0] ?? 'Event');
  current = [...current, { name: joining, joined: true }];
  push(`A new ${joining} subscribes. Adding behaviour needs no change to ${subject}.`);
  publish(events[2] ?? events[0] ?? 'Event');
  return frames;
};
