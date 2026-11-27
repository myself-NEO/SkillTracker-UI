## The idea

Interval problems are almost always "sort, then sweep once", and two decisions come first:
- **Closed or half-open?** `[s, e]` or `[s, e)` decides `<` versus `<=` in every comparison.
- **Sort by what?** To *combine* intervals (merge, insert, union, total coverage), sort by **start**: everything that can join the current group then comes right after it. If the next interval starts before the group ends, extend the group; otherwise, start a new one.

The other two sort keys, end and separate events, are in [non-overlapping intervals](lesson:non-overlapping-intervals) and [meeting rooms](lesson:meeting-rooms).

## When to use it

- "Merge overlapping intervals", "insert into a sorted list of intervals", "the total length covered".
- Any problem built on an overlap test: bookings, rectangles (which overlap on x *and* y), ranges of IDs.
- Items that each cover a range, where the connected groups matter: [Partition Labels](lesson:partition-labels-and-task-scheduler) is merging in disguise.

## How it works

The vocabulary, once. Intervals come in two conventions:
- **Closed `[s, e]`**, as in Merge (LC 56), Insert (LC 57), Arrows (LC 452) and Intersections (LC 986). `[1, 2]` and `[2, 3]` overlap at 2. The overlap test for a and b is `a.s <= b.e && b.s <= a.e`.
- **Half-open `[s, e)`**, as in Meeting Rooms (LC 252, 253), Non-overlapping Intervals (LC 435), My Calendar (LC 729) and Car Pooling (LC 1094). `[1, 2)` and `[2, 3)` only touch, so they don't overlap. The overlap test is `a.s < b.e && b.s < a.e`.

Rules worth memorising:
- Two intervals **don't** overlap exactly when one ends before the other starts. Negate that to get the overlap test.
- The **intersection** of two intervals is `[max(starts), min(ends)]`. For closed intervals it's non-empty when `max(starts) <= min(ends)`.
- The **union** of two overlapping intervals is `[min(starts), max(ends)]`.

```text
a:   |-------|                    a.e < b.s: no overlap (a is entirely before b)
b:              |------|

a:   |------------|               a.s <= b.e && b.s <= a.e: overlap
b:          |----------|          intersection = [b.s, a.e]
```

**Why sorting by start makes merging a single pass:** after sorting, any interval that overlaps the current group must start before the group ends, so it comes next in the order. The moment an interval starts after the group's end, no later interval (they all start later still) can reach back into the group: the group is finished.

## Java template

```java
// LC 56 Merge Intervals (closed intervals: [1, 2] and [2, 3] overlap at 2).
public int[][] merge(int[][] intervals) {
    int[][] sorted = intervals.clone();
    Arrays.sort(sorted, Comparator.comparingInt(a -> a[0]));           // by start
    List<int[]> merged = new ArrayList<>();
    for (int[] iv : sorted) {
        int[] last = merged.isEmpty() ? null : merged.get(merged.size() - 1);
        if (last != null && iv[0] <= last[1]) {
            last[1] = Math.max(last[1], iv[1]);          // overlap: extend the group
        } else {
            merged.add(new int[] { iv[0], iv[1] });      // a gap: start a new group
        }
    }
    return merged.toArray(new int[0][]);
}
```

## Worked examples

### Merge Intervals (LC 56)

The template. `[[1,3],[2,6],[8,10],[15,18]]` merges to `[[1,6],[8,10],[15,18]]`, and `[[1,4],[4,5]]` merges to `[[1,5]]`, because closed intervals that touch overlap.
- It extends its own copies (`new int[] { ... }`), never the caller's arrays.
- It extends with `Math.max(last[1], iv[1])`, not `iv[1]`: an interval contained in the group would otherwise shrink it.

### Insert Interval (LC 57)

The input is already sorted and disjoint, so there's nothing to sort: copy what comes before the new interval, absorb what overlaps it, copy what comes after.

```java
// LC 57 Insert Interval: the input is sorted and disjoint. Three phases, O(n), no sorting.
public int[][] insert(int[][] intervals, int[] newInterval) {
    List<int[]> out = new ArrayList<>();
    int i = 0, n = intervals.length;
    int start = newInterval[0], end = newInterval[1];
    while (i < n && intervals[i][1] < start) out.add(intervals[i++]);     // 1. entirely before it
    // 2. overlapping: absorb them
    while (i < n && intervals[i][0] <= end) {
        start = Math.min(start, intervals[i][0]);
        end = Math.max(end, intervals[i][1]);
        i++;
    }
    out.add(new int[] { start, end });
    while (i < n) out.add(intervals[i++]);                                // 3. entirely after it
    return out.toArray(new int[0][]);
}
```

Inserting `[4,8]` into `[[1,2],[3,5],[6,7],[8,10],[12,16]]` absorbs `[3,5]`, `[6,7]` and `[8,10]`, giving `[[1,2],[3,10],[12,16]]`. Appending and re-merging also works, but it costs O(n log n) and misses the point of the question.

### Total covered length

Merge, then add up `end − start` over the groups. One pass can do both: keep the current group's start and end, and add its length whenever a gap closes it.

```java
// The total length covered by a set of intervals, counting overlaps once.
static long coveredLength(int[][] intervals) {
    if (intervals.length == 0) return 0;
    int[][] sorted = intervals.clone();
    Arrays.sort(sorted, Comparator.comparingInt(a -> a[0]));
    long total = 0;
    int start = sorted[0][0], end = sorted[0][1];
    for (int[] iv : sorted) {
        if (iv[0] <= end) {
            end = Math.max(end, iv[1]);              // overlaps or touches: extend the group
        } else {
            total += (long) end - start;             // a gap closes the group
            start = iv[0];
            end = iv[1];
        }
    }
    return total + ((long) end - start);             // the last group
}
```

`[[1,3],[2,5],[7,8]]` covers 4 + 1 = 5. This measures length as `e − s`; to count the whole days in closed intervals, add 1 per group.

## Complexity

| Operation | Time | Space |
|---|---|---|
| Merge | O(n log n): the sort, then one O(n) pass | O(n) for the output |
| Insert into a sorted, disjoint list | O(n) | O(n) for the output |
| Total covered length | O(n log n) | O(n) for the sorted copy |
| Overlap, intersection or union of two intervals | O(1) | O(1) |

## Variations

- **Count Days Without Meetings (LC 3169):** the number of days minus the covered length, where each group of closed, whole-day intervals covers `e − s + 1` days.
- **Rectangle Overlap (LC 836)** and **Rectangle Area (LC 223):** two rectangles overlap when their x-intervals *and* their y-intervals overlap ([geometry essentials](lesson:geometry-essentials)).
- **Summary Ranges (LC 228):** the same scan on single integers, grouping consecutive values.
- **Merging two sorted interval lists:** the two-pointer walk from [interval list intersections](lesson:more-interval-patterns), keeping unions instead of intersections.
- **Intervals that arrive one at a time** (Data Stream as Disjoint Intervals, LC 352): a `TreeMap` that merges neighbours on every insert ([more interval patterns](lesson:more-interval-patterns)).

## Common mistakes

- **Mixing up closed and half-open intervals**, which flips `<` and `<=` everywhere. Decide first.
- **`last[1] = iv[1]`** instead of `Math.max(last[1], iv[1])`: an interval contained in the group shrinks it.
- **Overflowing comparators**: `(a, b) -> a[0] - b[0]` overflows on LC 452, whose coordinates span the whole `int` range. Use `Comparator.comparingInt(a -> a[0])` or `Integer.compare`.
- **Changing the caller's arrays** while merging, when the caller still needs them: copy first.
- **Sorting Insert Interval's input**, which is already sorted: it hides the O(n) solution the question is after.

## Practice

Merge Intervals (LC 56), Insert Interval (LC 57), Summary Ranges (LC 228), Count Days Without Meetings (LC 3169), Rectangle Overlap (LC 836), Partition Labels (LC 763).

## Key takeaways

- Decide closed or half-open first: it fixes every comparison.
- Two intervals overlap unless one ends before the other starts.
- The intersection is `[max(starts), min(ends)]`; the union of overlapping intervals is `[min(starts), max(ends)]`.
- To combine intervals, sort by start and extend the current group with `max(end)`.
- Insert into a sorted, disjoint list in O(n): copy before, absorb, copy after.

## Knowledge check

```quiz
? Closed intervals [1, 2] and [2, 3]. Do they overlap?
+ Yes: they share the point 2
- No: one ends where the other starts
! That's the half-open reading, where touching isn't overlapping.
- Only if they're sorted
! Overlap doesn't depend on order.
- It can't be decided
! For closed intervals it can: both contain 2.
> Half-open [1, 2) and [2, 3) would only touch.

? Why sort by start to merge intervals?
+ Then everything that can join the current group comes right after it, so one pass finishes each group
- Because sorting by end is slower
! Both sorts cost the same.
- Because the output must be sorted by start
! The point is that one pass becomes enough.
- Any order works
! Unsorted, a later interval could reach back into an earlier group.
> Once an interval starts after the group's end, the group is finished.

? Merging [1, 10] with [2, 3]: what goes wrong with last[1] = iv[1]?
+ The group shrinks to [1, 3], losing everything from 3 to 10
- Nothing: the result is [1, 10]
! iv[1] is 3, so the end becomes 3.
- It throws an exception
! It runs, but returns the wrong interval.
- It creates two groups
! The overlap is detected; the new end is what goes wrong.
> Extend with Math.max(last[1], iv[1]).

? Insert Interval's input is sorted and disjoint. What is the best time complexity?
+ O(n): copy the intervals before it, absorb the overlapping ones, copy the rest
- O(n log n), because you must sort
! The input is already sorted.
- O(log n), with binary search
! Binary search finds the position, but the output still has to be built.
- O(n²)
! Each interval is handled once.
> Re-sorting works, but misses the point of the question.
```
