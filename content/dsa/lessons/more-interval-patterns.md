## The idea

Four more interval shapes that come up often, each a small twist on "sort, then sweep":
- **Two sorted lists:** walk them with two pointers, always advancing the interval that ends first.
- **Free time:** the gaps in the union of everyone's busy intervals.
- **Covered intervals:** a two-key sort puts every container before the intervals it contains.
- **Intervals that keep arriving:** a `TreeMap` keyed by start answers each booking in O(log n).

## When to use it

- "The intersection of two interval lists", "the common free time of two people".
- "When is everyone free?": the gaps across many schedules.
- "Remove the intervals covered by another", nesting, Russian dolls.
- Bookings that arrive one at a time, each to be answered immediately.

## How it works

- **Advance the one that ends first.** If a ends before b, a can't meet anything further along b's list: those intervals start after b ends, which is later still.
- **Free time is the complement of the union.** Sort everything by start and sweep with the latest end seen so far; a start beyond it opens a gap.
- **Sort by start, then by end descending.** With that tie-break, a container always comes before the intervals it contains, so an interval is covered exactly when its end doesn't pass the largest end seen so far.
- **A `TreeMap<start, end>` of disjoint bookings.** A new interval can only clash with its two neighbours by start: the last booking starting at or before it (`floorEntry`) and the first starting at or after it (`ceilingEntry`).

## Java template

```java
// LC 986: the intersections of two sorted, disjoint lists of closed intervals.
public int[][] intervalIntersection(int[][] a, int[][] b) {
    List<int[]> out = new ArrayList<>();
    int i = 0, j = 0;
    while (i < a.length && j < b.length) {
        int lo = Math.max(a[i][0], b[j][0]);
        int hi = Math.min(a[i][1], b[j][1]);
        if (lo <= hi) out.add(new int[] { lo, hi });     // a single shared point counts
        // the one ending first can't meet anything else
        if (a[i][1] < b[j][1]) i++;
        else j++;
    }
    return out.toArray(new int[0][]);
}
```

O(m + n). The same "advance the one that ends first" walk also merges two sorted interval lists, or subtracts one from the other.

## Worked examples

### Interval List Intersections (LC 986)

The template. `A = [[0,2],[5,10],[13,23],[24,25]]` and `B = [[1,5],[8,12],[15,24],[25,26]]` intersect in `[[1,2],[5,5],[8,10],[15,23],[24,24],[25,25]]`. Single shared points such as `[5,5]` count, because the intervals are closed.

### Employee Free Time (LC 759)

```java
// LC 759 Employee Free Time: the finite gaps when every employee is free.
public List<int[]> employeeFreeTime(List<List<int[]>> schedule) {
    List<int[]> all = new ArrayList<>();
    for (List<int[]> person : schedule) all.addAll(person);
    all.sort(Comparator.comparingInt(iv -> iv[0]));
    List<int[]> free = new ArrayList<>();
    int busyUntil = all.get(0)[1];
    for (int[] iv : all) {
        // nobody is busy in this gap
        if (iv[0] > busyUntil) free.add(new int[] { busyUntil, iv[0] });
        busyUntil = Math.max(busyUntil, iv[1]);
    }
    return free;
}
```

For the schedules `[[1,2],[5,6]]`, `[[1,3]]` and `[[4,10]]`, everyone is free during `[3,4]`. This is O(N log N) for N intervals in total. Each person's list is already sorted, so a k-way merge with a heap (as in Merge k Sorted Lists) brings it down to O(N log k). LC 759 uses an `Interval` class with `start` and `end` fields; the code is the same with `iv.start` in place of `iv[0]`.

### Remove Covered Intervals (LC 1288)

```java
// LC 1288: count the intervals not covered by another ([a, b] covers [c, d] if a <= c and d <= b).
public int removeCoveredIntervals(int[][] intervals) {
    int[][] sorted = intervals.clone();
    Arrays.sort(sorted, (a, b) -> a[0] != b[0]
            ? Integer.compare(a[0], b[0])          // start ascending
            : Integer.compare(b[1], a[1]));        // equal starts: the longest first
    int remaining = 0, maxEnd = Integer.MIN_VALUE;
    for (int[] iv : sorted) {
        if (iv[1] > maxEnd) {                      // reaches past everything before it: not covered
            remaining++;
            maxEnd = iv[1];
        }
    }
    return remaining;
}
```

`[[1,4],[3,6],[2,8]]` leaves 2, because `[3,6]` lies inside `[2,8]`. The tie-break is the whole problem: if `[1,2]` were sorted before `[1,4]`, `[1,2]` would look uncovered. The same two-key sort solves Russian Doll Envelopes (LC 354): width ascending, height **descending**, then the [longest increasing subsequence](lesson:sequence-dp) of the heights.

### My Calendar I (LC 729): bookings that arrive one at a time

```java
// LC 729 My Calendar I: book [start, end) only if it
// overlaps no existing booking. O(log n) per call.
class MyCalendar {
    private final TreeMap<Integer, Integer> bookings = new TreeMap<>();   // start -> end, disjoint

    public boolean book(int start, int end) {
        Map.Entry<Integer, Integer> before = bookings.floorEntry(start);    // latest start <= start
        Map.Entry<Integer, Integer> after = bookings.ceilingEntry(start);   // first start >= start
        if (before != null && before.getValue() > start) return false;      // not over by start
        if (after != null && after.getKey() < end) return false;            // starts before we end
        bookings.put(start, end);
        return true;
    }
}
```

Booking `[10,20)`, then `[15,25)`, then `[20,30)` returns true, false, true: the second overlaps the first, while the third starts just as the first ends. Each booking is O(log n), against O(n) for scanning a list; the `TreeMap` is a [balanced search tree](lesson:balanced-trees) underneath.

## Complexity

| Problem | Time | Space |
|---|---|---|
| Interval List Intersections | O(m + n) | O(m + n) for the output |
| Employee Free Time | O(N log N), or O(N log k) with a k-way merge | O(N) |
| Remove Covered Intervals | O(n log n) | O(n) for the sorted copy |
| My Calendar I | O(log n) per booking | O(n) |

## Variations

- **My Calendar II (LC 731)**, no triple bookings, and **My Calendar III (LC 732)**, the largest overlap so far: keep a `TreeMap<time, delta>` (+1 at each start, −1 at each end) and sweep it on every booking, O(n) per booking. It's the [sweep line](lesson:meeting-rooms) made dynamic.
- **Range Module (LC 715)** and **Data Stream as Disjoint Intervals (LC 352):** a `TreeMap` of disjoint intervals that merges its neighbours on every insert.
- **Merging or subtracting two sorted interval lists:** the intersection walk, keeping unions or differences instead.
- **Russian Doll Envelopes (LC 354):** the covered-intervals sort, followed by LIS.

## Common mistakes

- **Advancing the wrong pointer** in the intersection walk: always the interval that ends first.
- **Skipping the tie-break** in Remove Covered Intervals: equal starts must put the longest first.
- **Reporting the time before the first or after the last busy interval** as free: LC 759 wants only finite gaps.
- **Checking only one neighbour** in My Calendar: a new booking can clash with the booking before it *and* the one after it.
- **Comparing `Integer` objects with `==`** when reading `TreeMap` entries: compare with `.equals`, or unbox them to `int` first.

## Practice

Interval List Intersections (LC 986), Employee Free Time (LC 759), Remove Covered Intervals (LC 1288), My Calendar I (LC 729), My Calendar II (LC 731), Russian Doll Envelopes (LC 354), Data Stream as Disjoint Intervals (LC 352), Range Module (LC 715).

## Key takeaways

- For two sorted interval lists, intersect with `[max(starts), min(ends)]` and advance the one that ends first.
- Free time is the gaps in the union of the busy intervals: sort by start and track the latest end.
- Sort by start ascending and end descending to put containers before what they contain.
- A `TreeMap<start, end>` answers online bookings in O(log n) by checking the two neighbours.
- A `TreeMap<time, delta>` turns the sweep line into a dynamic structure.

## Knowledge check

```quiz
? In Interval List Intersections, a = [0, 2] and b = [1, 5]. Which pointer moves?
+ a's: it ends first, so it can't meet anything further along b's list
- b's, because it starts later
! Start times don't decide it.
- Both
! b may still meet a's next interval.
- Neither, until no overlap is left
! One pointer moves on every step.
> The intersection [1, 2] is recorded first.

? Why does Remove Covered Intervals sort equal starts by end, descending?
+ So that a container comes before the intervals it contains, and they're seen as covered
- To sort the intervals by length
! Only ties are broken by end.
- To make the sort stable
! Stability isn't the issue.
- It makes no difference
! [1,2] before [1,4] would make [1,2] look uncovered.
> With the tie-break, end <= maxEnd means covered.

? Schedules [[1,2],[5,6]], [[1,3]] and [[4,10]]. When is everyone free?
+ [3, 4]
- [2, 5]
! Someone is busy from 1 to 3, and from 4 on.
- [6, 10]
! The third person is busy until 10.
- Never
! Between 3 and 4, nobody is busy.
> Sort by start and look for a start beyond the latest end.

? A calendar holds [10, 20). Can [20, 30) be booked?
+ Yes: half-open bookings that only touch don't overlap
- No: both include 20
! [10, 20) doesn't include 20.
- Only if it had been booked first
! The order of bookings doesn't change overlap.
- Only in a second calendar
! One calendar is enough.
> floorEntry(20) is [10, 20), whose end isn't greater than 20.
```
