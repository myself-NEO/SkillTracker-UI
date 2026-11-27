## The idea

**Activity selection:** to keep as many non-overlapping intervals as possible, sort by **end**. Keep the interval that finishes first, skip everything that overlaps it, and repeat: the earliest finish leaves the most room for everything else. The same scan answers "remove the fewest intervals" (n minus the number kept) and "the fewest points that hit every interval" (one point per interval kept).

## When to use it

- "Remove the fewest intervals so the rest don't overlap", "the most meetings in one room".
- "The fewest points (arrows, guards, sensors) that hit every interval".
- "The longest chain of pairs", where each pair must start after the previous one ends.

## How it works

- **Why the earliest end is safe (the exchange argument):** let X be the first interval in an optimal selection, and G the interval that ends earliest. G ends no later than X, so swapping X for G can't create an overlap that X didn't have: the count stays the same, and the optimal selection now starts like greedy. Repeat for the rest.
- **The dual problem: points that hit every interval.** The fewest points that hit every interval equals the most pairwise-disjoint intervals. Put each point at the *end* of the first interval not yet hit: that's the latest position that still hits it, so it also hits as many later intervals as possible.
- **Other sort keys fail** a minute's [counterexample hunt](lesson:greedy-fundamentals):
  - **By start:** `[1,10]`, `[2,3]`, `[4,5]`. `[1,10]` starts first and blocks both others, so greedy keeps 1, where 2 is possible.
  - **By length:** `[1,5]`, `[4,7]`, `[6,10]`. `[4,7]` is the shortest but overlaps both others, so greedy keeps 1, where 2 is possible.
- **The boundary comparison depends on the convention:** in LC 435 touching intervals don't overlap, so an interval is kept when `start >= lastEnd`; in LC 452 a balloon touching the arrow is burst, so a new arrow is needed only when `start > arrowAt`.

## Java template

```java
// LC 435: remove the fewest intervals so the rest don't overlap (touching at an endpoint is fine).
public int eraseOverlapIntervals(int[][] intervals) {
    int[][] sorted = intervals.clone();
    Arrays.sort(sorted, Comparator.comparingInt(a -> a[1]));  // by END: finish as early as possible
    int kept = 0;
    long lastEnd = Long.MIN_VALUE;
    for (int[] iv : sorted) {
        if (iv[0] >= lastEnd) {                               // starts after the last kept one ends
            kept++;
            lastEnd = iv[1];
        }
    }
    return intervals.length - kept;
}
```

Starting `lastEnd` at `Long.MIN_VALUE` avoids a special case for the first interval, and works even with `Integer.MIN_VALUE` coordinates.

## Worked examples

### Non-overlapping Intervals (LC 435)

The template, traced:

```text
sorted by end:   [1,3]  [2,4]  [3,5]  [1,6]  [5,7]
[1,3]                    keep, lastEnd = 3
[2,4]  starts 2 < 3      skip
[3,5]  starts 3 >= 3     keep, lastEnd = 5      (half-open: touching is fine)
[1,6]  starts 1 < 5      skip
[5,7]  starts 5 >= 5     keep, lastEnd = 7
kept 3, removed 2
```

### Minimum Number of Arrows to Burst Balloons (LC 452)

```java
// LC 452: the fewest arrows; an arrow at x bursts every balloon with start <= x <= end.
public int findMinArrowShots(int[][] points) {
    int[][] sorted = points.clone();
    Arrays.sort(sorted, Comparator.comparingInt(a -> a[1]));
    int arrows = 0;
    long arrowAt = Long.MIN_VALUE;
    for (int[] p : sorted) {
        if (p[0] > arrowAt) {              // not burst yet: shoot at its END (the latest safe spot)
            arrows++;
            arrowAt = p[1];
        }
    }
    return arrows;
}
```

`[[10,16],[2,8],[1,6],[7,12]]` needs 2 arrows: one at 6 bursts `[1,6]` and `[2,8]`, and one at 12 bursts `[7,12]` and `[10,16]`. The coordinates span the whole `int` range, which is why the comparator mustn't subtract and `arrowAt` starts as a `long`.

### Maximum Length of Pair Chain (LC 646)

Pairs `[a, b]` chain when the next pair's `a` is strictly greater than the previous pair's `b`. It's the same algorithm with a strict comparison:

```java
// LC 646: the longest chain of pairs where each pair starts after the previous one ends.
public int findLongestChain(int[][] pairs) {
    int[][] sorted = pairs.clone();
    Arrays.sort(sorted, Comparator.comparingInt(p -> p[1]));
    int chain = 0;
    long lastEnd = Long.MIN_VALUE;
    for (int[] p : sorted) {
        if (p[0] > lastEnd) {          // strictly after: closed intervals can't share a point
            chain++;
            lastEnd = p[1];
        }
    }
    return chain;
}
```

`[[1,2],[2,3],[3,4]]` gives 2 (`[1,2]`, then `[3,4]`). An O(n²) DP in the style of the [longest increasing subsequence](lesson:sequence-dp) also works, but the greedy is simpler and faster.

## Complexity

All three are O(n log n) for the sort plus O(n) for the scan, with O(n) space for the sorted copy.

## Variations

- **Weighted intervals:** once each interval carries a profit (Maximum Profit in Job Scheduling, LC 1235), no greedy works; it's [DP plus binary search](lesson:when-greedy-fails).
- **Video Stitching (LC 1024)** asks the opposite question, the fewest intervals that *cover* a range, and is a [jump game](lesson:jump-games).
- **Meeting Rooms II** asks how many rooms are needed to keep *all* the intervals: the [sweep line](lesson:meeting-rooms).
- **Set Intersection Size At Least Two (LC 757):** the arrows idea with two points per interval, sorted by end and placed as late as possible.

## Common mistakes

- **Sorting by start** when the goal is the most non-overlapping intervals.
- **The wrong comparison at the boundary**: `>=` when touching is allowed (LC 435), `>` when touching counts as overlapping (LC 452, LC 646).
- **Subtracting in the comparator**: LC 452's coordinates reach `Integer.MIN_VALUE` and `Integer.MAX_VALUE`.
- **Starting `lastEnd` at 0** when coordinates can be negative: start below every possible value.
- **Returning the number kept** when the question asks how many to remove.

## Practice

Non-overlapping Intervals (LC 435), Minimum Number of Arrows to Burst Balloons (LC 452), Maximum Length of Pair Chain (LC 646), Set Intersection Size At Least Two (LC 757), and Maximum Profit in Job Scheduling (LC 1235) for the weighted contrast.

## Key takeaways

- To keep the most non-overlapping intervals, sort by end, and keep each interval that starts after the last kept one ends.
- The exchange argument: the earliest-ending interval can replace the first choice of any optimal answer.
- The fewest points hitting every interval equals the most disjoint intervals; place each point at an end.
- Sorting by start or by length fails on three-interval counterexamples.
- Once intervals carry weights, the problem stops being greedy.

## Knowledge check

```quiz
? To keep the most non-overlapping intervals, what do you sort by?
+ End time: the earliest finish leaves the most room for the rest
- Start time
! An early-starting long interval can block many short ones.
- Length
! A short interval can overlap two intervals that fit together.
- The number of other intervals each one overlaps
! That greedy fails too, on larger counterexamples.
> Then keep each interval that starts after the last kept one ends.

? Intervals [1,3], [2,4], [3,5], [1,6], [5,7], where touching is allowed. How many must be removed?
+ 2: keep [1,3], [3,5] and [5,7]
- 1
! [2,4] and [1,6] both overlap intervals that are kept.
- 3
! Three intervals can be kept.
- 0
! [1,3] and [2,4] overlap.
> n − kept = 5 − 3.

? Balloons [[10,16],[2,8],[1,6],[7,12]]. How many arrows are needed?
+ 2: at 6 and at 12
- 1
! No single point lies in all four.
- 3
! An arrow at 6 bursts two balloons, and one at 12 bursts the other two.
- 4
! Overlapping balloons can share an arrow.
> Shoot at the end of the first balloon not yet burst.

? Why can't Arrows sort with (a, b) -> a[1] - b[1]?
+ Its coordinates span the whole int range, so the subtraction can overflow and flip the order
- Because it sorts by start
! a[1] is the end.
- Because balloons can share endpoints
! Shared endpoints affect the > test, not the sort.
- It can: it's fine
! An end near −2³¹ minus a positive end overflows.
> Use Comparator.comparingInt(a -> a[1]).
```
