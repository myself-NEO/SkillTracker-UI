import { formatDay, typeLabel, typeTopic, whenKey } from './interview-format';

describe('interview formatting', () => {
  it('shows the calendar date the server sent, whatever the time zone', () => {
    expect(formatDay('2026-12-02', 'en-GB')).toBe('Wed, 2 Dec 2026');
    expect(formatDay('not a date', 'en-GB')).toBe('not a date');
  });

  it('names the interview kinds and gives them their topic colour', () => {
    expect(typeLabel('OOD')).toBe('Low-level design');
    expect(typeTopic('System Design')).toBe('hld');
    expect(typeTopic('Behavioral')).toBeNull();
    expect(typeLabel('Pair programming')).toBe('Pair programming');
  });

  it('orders bookings by date, then time', () => {
    const bookings = [
      { date: '2026-12-03', time: '09:00' },
      { date: '2026-12-02', time: '18:30' },
      { date: '2026-12-02', time: '08:15' },
    ];
    expect(bookings.map(whenKey).sort()).toEqual(['2026-12-02T08:15', '2026-12-02T18:30', '2026-12-03T09:00']);
  });
});
