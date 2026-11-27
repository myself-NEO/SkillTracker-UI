## The idea

**The fewest rooms equals the most meetings in progress at one moment.** Treat each meeting as two events, a start (+1) and an end (−1), process the events in time order, and track the running count: its peak is the answer. Whether one person can attend every meeting is the special case "is the peak 1?".

## When to use it

- "The minimum number of rooms / platforms / servers / CPUs".
- "The maximum number of overlapping intervals", "how many at once", "is anyone double-booked?".
- Capacity over time: in Car Pooling, each trip adds passengers at its start and removes them at its end.

## How it works

- **Sort the starts and the ends separately.** You only need *how many* meetings are running, not *which* ones, so the two lists can be sorted independently and swept together like a merge.
- **Ties decide closed versus half-open.** When an end and a start happen at the same time, processing the end first lets a room freed at 10:00 host a meeting that starts at 10:00, which is right for half-open meetings `[start, end)`. Ask the interviewer which convention applies: it's a good question, and a wrong guess changes the answer.
- **A min-heap of end times** is the same sweep with the rooms named: sort the meetings by start, and before each one, reuse the room that frees up first if it's free by then. The heap ends at the peak size, and it knows *which* room is free.

Three equivalent formulations:

| Method | How | When to prefer it |
|---|---|---|
| two sorted arrays | sort starts and ends separately, sweep both | the simplest code |
| min-heap of end times | sort by start; reuse the earliest-free room if it's free; push the end | you need to know *which* room (Meeting Rooms III, 2402) |
| event map `TreeMap<time, delta>` | +1 at each start, −1 at each end, add up in key order | intervals arrive one at a time (My Calendar III, 732) |

## Java template

```java
// LC 253: the fewest rooms = the most meetings in progress at once. Sweep sorted starts and ends.
public int minMeetingRooms(int[][] intervals) {
    int n = intervals.length;
    int[] starts = new int[n], ends = new int[n];
    for (int i = 0; i < n; i++) {
        starts[i] = intervals[i][0];
        ends[i] = intervals[i][1];
    }
    Arrays.sort(starts);
    Arrays.sort(ends);
    int inUse = 0, best = 0;
    for (int s = 0, e = 0; s < n; s++) {
        while (e < n && ends[e] <= starts[s]) {     // meetings that ended by now free their rooms
            e++;
            inUse--;
        }
        inUse++;
        best = Math.max(best, inUse);
    }
    return best;
}
```

The `<=` in `ends[e] <= starts[s]` processes an end before a start at the same time: half-open meetings.

## Worked examples

### Meeting Rooms (LC 252): can one person attend everything?

```java
// LC 252: can one person attend every meeting? Meetings are [start, end): back-to-back is fine.
public boolean canAttendMeetings(int[][] intervals) {
    int[][] sorted = intervals.clone();
    Arrays.sort(sorted, Comparator.comparingInt(a -> a[0]));
    for (int i = 1; i < sorted.length; i++) {
        if (sorted[i][0] < sorted[i - 1][1]) return false;
    }
    return true;
}
```

After sorting by start, only neighbours need checking: if no meeting overlaps the one just before it, the meetings form a chain, each ending before the next begins.

### Meeting Rooms II (LC 253): the sweep, traced

`[[0,30],[5,10],[15,20]]` has starts 0, 5, 15 and ends 10, 20, 30:

```text
start 0     no end <= 0             in use 1
start 5     no end <= 5             in use 2   (the peak)
start 15    end 10 <= 15 frees one  in use 2
answer: 2 rooms
```

### Meeting Rooms II with a min-heap of end times

```java
public int minMeetingRoomsWithHeap(int[][] intervals) {
    int[][] sorted = intervals.clone();
    Arrays.sort(sorted, Comparator.comparingInt(a -> a[0]));        // by start
    PriorityQueue<Integer> endTimes = new PriorityQueue<>();        // min-heap: the rooms, by end time
    for (int[] meeting : sorted) {
        if (!endTimes.isEmpty() && endTimes.peek() <= meeting[0]) {
            endTimes.poll();                  // the room that frees up first is free by now: reuse it
        }
        endTimes.offer(meeting[1]);           // occupy a room until this meeting ends
    }
    return endTimes.size();                   // rooms in use at the peak
}
```

**Why the heap's final size is the peak:** each meeting either reuses a room (one poll, one offer) or opens a new one, so the size never shrinks, and it grows only when every room is busy at a meeting's start. It ends at the largest number of rooms ever needed at once, which generalises to CPUs, platforms and connections. In Meeting Rooms III (LC 2402), the heap holds `[endTime, room]` pairs so that the room numbers are known too.

### Car Pooling (LC 1094): the sweep as a capacity check

Each trip `[passengers, from, to]` picks up at `from` and drops off at `to`. With locations only up to 1000, a [difference array](lesson:prefix-sums) buckets the events by location instead of sorting them; it's worked through there. With large coordinates, keep the events in a `TreeMap<location, delta>`:

```java
// LC 1094 with an event map: can one car with 'capacity' seats complete every trip?
public boolean carPooling(int[][] trips, int capacity) {
    TreeMap<Integer, Integer> delta = new TreeMap<>();               // location -> change in passengers
    for (int[] t : trips) {
        delta.merge(t[1], t[0], Integer::sum);                      // pick up at 'from'
        delta.merge(t[2], -t[0], Integer::sum);                     // drop off at 'to'
    }
    int onboard = 0;
    for (int change : delta.values()) {                              // locations in increasing order
        onboard += change;
        if (onboard > capacity) return false;
    }
    return true;
}
```

Merging the deltas at each location combines the drop-offs and pick-ups there, which is right because passengers leave at `to` before new ones board. `trips = [[2,1,5],[3,3,7]]` fails with 4 seats (5 people are aboard from location 3 to 5) and succeeds with 5.

## Complexity

| Method | Time | Space |
|---|---|---|
| Meeting Rooms (252) | O(n log n) | O(n) for the sorted copy |
| Two sorted arrays | O(n log n) | O(n) |
| Min-heap of end times | O(n log n) | O(n) |
| Event map (`TreeMap`) | O(n log n) | O(n) |

## Variations

- **Meeting Rooms III (LC 2402):** numbered rooms, and a meeting waits for the first free one: one heap of free room numbers, one of `[endTime, room]` for busy rooms.
- **Divide Intervals Into Minimum Number of Groups (LC 2406):** Meeting Rooms II with closed intervals, so an end and a start at the same time *do* overlap.
- **Minimum Number of Platforms:** the same sweep over train arrivals and departures, where a train leaving at 10:00 usually still blocks one arriving at 10:00.
- **My Calendar II and III (LC 731, 732):** the event map, updated as bookings arrive ([more interval patterns](lesson:more-interval-patterns)).
- **Corporate Flight Bookings (LC 1109)**, and Car Pooling with small coordinates: [difference arrays](lesson:prefix-sums).

## Common mistakes

- **Getting ties backwards**: for half-open meetings, process ends before starts at the same time (`<=`); for closed intervals, starts first (`<`).
- **Sorting the meetings by end** for the room count: the sweep needs the times in order, and the heap version needs the starts in order.
- **Returning the final heap size** in a version that frees several rooms per meeting (`while` instead of `if`): the size can then shrink, so track the maximum as you go.
- **Boarding before dropping off** at the same stop in Car Pooling, which overcounts the passengers aboard.
- **Forgetting the empty input**: zero meetings need zero rooms.

## Practice

Meeting Rooms (LC 252), Meeting Rooms II (LC 253), Car Pooling (LC 1094), Divide Intervals Into Minimum Number of Groups (LC 2406), Meeting Rooms III (LC 2402), My Calendar III (LC 732).

## Key takeaways

- The fewest rooms equals the most intervals alive at one moment.
- Sort the starts and the ends separately and sweep them; ties decide closed versus half-open.
- A min-heap of end times gives the same answer, and knows which room is free.
- An event map (`TreeMap<time, delta>`) handles intervals that arrive one at a time, and large coordinates.
- Ask whether back-to-back intervals overlap before writing any comparison.

## Knowledge check

```quiz
? Meetings [[0,30],[5,10],[15,20]] (half-open). How many rooms are needed?
+ 2
- 1
! [0,30] overlaps both other meetings.
- 3
! [5,10] ends before [15,20] starts, so they can share a room.
- 0
! There are meetings to host.
> At most two meetings run at any moment.

? Why can the starts and the ends be sorted separately?
+ Only the number of meetings running matters, not which meetings they are
- Because meetings never overlap
! They do; that's why several rooms are needed.
- Because each meeting starts and ends at the same time
! Meetings have a positive length.
- They can't: they must stay paired
! For counting, the pairing doesn't matter.
> The count changes by +1 at each start and −1 at each end.

? One meeting ends at 10:00 and another starts at 10:00. With half-open meetings, which does the sweep process first?
+ The end, so the room it frees can host the new meeting
- The start
! That would count both meetings as running at 10:00.
- Either: the order doesn't change the answer
! The order can change the peak.
- Neither: both are skipped
! Every event is processed.
> ends[e] <= starts[s] puts the end first.

? Why does the min-heap version's final heap size equal the answer?
+ It grows only when every room is busy, and reusing a room keeps its size, so it ends at the peak number of rooms
- Because the heap holds every meeting
! A reused room replaces its end time.
- Because the heap is sorted by start
! It's ordered by end time.
- It doesn't: the maximum size must be tracked
! With at most one room freed per meeting, the size never shrinks.
> Each meeting reuses the earliest-free room or opens a new one.
```
