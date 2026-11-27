Greedy and interval problems reward recognising the shape fast and proving it briefly. This recap gathers the recognition table, the greedy-or-DP check, the edge cases, the mistakes and a practice ladder, and closes with a one-page summary to reread before interviews.

## Recognizing the pattern

| The problem says… | Reach for |
|---|---|
| "can you reach…", "minimum jumps", covering a line with ranges | [farthest reach, BFS layers](lesson:jump-games) |
| a circular route, a running total that must stay ≥ 0 | [a running balance with a reset](lesson:running-balance-and-two-passes) |
| pair up two groups; each item goes to one of two bins | [sort and two pointers, or sort by difference](lesson:sort-and-match) |
| deadlines, "the most tasks", fuel stops, capital | [a forced order and a heap of regrets](lesson:greedy-with-a-heap) |
| constraints with both neighbours | [two passes](lesson:running-balance-and-two-passes) |
| "split into as many parts as possible" | [last occurrences](lesson:partition-labels-and-task-scheduler) |
| a cooldown between equal items | [count frames, or most frequent first](lesson:partition-labels-and-task-scheduler) |
| merge, insert, union, total covered length | [sort by start](lesson:interval-basics) |
| remove the fewest, keep the most non-overlapping, fewest points to hit all | [sort by end](lesson:non-overlapping-intervals) |
| minimum rooms, the most overlapping at once | [a sweep line](lesson:meeting-rooms) |
| many range additions, then read every value | [a difference array](lesson:prefix-sums) |
| two sorted interval lists | [two pointers, advancing the one that ends first](lesson:more-interval-patterns) |
| bookings that arrive one at a time | [a `TreeMap`, floor and ceiling](lesson:more-interval-patterns) |
| arbitrary weights, "number of ways", min cost with no exchange argument | **not greedy**: [DP](lesson:when-greedy-fails) |

**Constraint hints:** n up to 10⁵ with a "maximum/minimum number of…" question usually means sort and greedy, O(n log n). If n ≤ 1000 and you can't prove the greedy, an O(n²) DP is probably intended.

## Decision procedure

Run this before writing any code (the full method is in [the greedy lesson](lesson:greedy-fundamentals)):
1. **State the greedy choice in one sentence.** ("Always keep the interval that ends first.")
2. **Try to break it on 3–4 tiny inputs**, in about a minute: ties, one big item against two small ones, a cheap first step that leads somewhere expensive.
3. **Find the exchange argument.** If you can say "swapping the optimal solution's choice for mine never makes it worse" and explain why, code the greedy.
4. **If you can't, it's probably DP**, or a greedy that needs a [heap to change its mind](lesson:greedy-with-a-heap). Saying "I considered greedy, here's the counterexample, so DP" scores well in an interview.
5. **When unsure, compare it with an exact answer on small random inputs** ([when greedy fails](lesson:when-greedy-fails) shows how).

For intervals, answer two more questions first: **closed or half-open?** and **sort by start, by end, or by events?**

## Edge cases to test

| Input | What it breaks |
|---|---|
| empty list, single interval | `intervals[0]` access, `merged.get(size - 1)` |
| intervals touching at one point (`[1,2]`, `[2,3]`) | `<` vs `<=`: decide closed or half-open first |
| identical intervals | the covered-interval tie-break; duplicates in merge |
| one interval containing all the others | merge must take `max(end)`, not the latest interval's end |
| `Integer.MIN_VALUE` / `MAX_VALUE` coordinates | `a[0] - b[0]` comparators; sentinel values |
| unsorted input | assuming sorted input when only Insert Interval (57) promises it |
| zeros (a jump of 0, gas equal to cost) | `canJump` stuck on a zero; `tank < 0` vs `tank <= 0` |
| all tasks the same, or all different | the task scheduler's two regimes |

## Common mistakes

1. **Coding a greedy without trying to break it.** Look for a counterexample before you write code.
2. **Sorting intervals by the wrong key:** start for merging, end for selecting.
3. **Mixing up closed and half-open intervals**, which means `<` vs `<=` at every comparison.
4. **`(a, b) -> a[0] - b[0]` comparators** with large or negative coordinates.
5. **In merge, writing `last[1] = iv[1]`** instead of `Math.max(last[1], iv[1])`: a contained interval shrinks the group.
6. **Changing the caller's arrays** while merging, when the caller still needs them.
7. **Simulating step by step** when counting works (task scheduler, difference arrays).
8. **Using greedy for 0/1 knapsack or arbitrary coin change.**
9. **Missing the heap fix:** when a greedy almost works but needs to change its mind, keep the past choices in a heap.
10. **Not explaining *why*.** "It's greedy" isn't an answer; one sentence of exchange argument is.

## Practice ladder

If you only have time for a few, start with Jump Game, Gas Station, Partition Labels, Task Scheduler, Course Schedule III, Merge Intervals, Insert Interval, Non-overlapping Intervals and Meeting Rooms II.

- **Greedy, warm-up:** Assign Cookies (455), Lemonade Change (860), Best Time to Buy and Sell Stock II (122), Maximum Subarray (53) with Kadane's algorithm as a greedy, Boats to Save People (881)
- **Greedy, core:** Jump Game (55), Jump Game II (45), Gas Station (134), Partition Labels (763), Two City Scheduling (1029), Task Scheduler (621), Reorganize String (767), Hand of Straights (846), Valid Parenthesis String (678), Candy (135), Video Stitching (1024)
- **Greedy with a heap:** Furthest Building You Can Reach (1642), Course Schedule III (630), Minimum Number of Refueling Stops (871), IPO (502), Minimum Cost to Connect Sticks (1167)
- **Intervals:** Meeting Rooms (252), Merge Intervals (56), Insert Interval (57), Non-overlapping Intervals (435), Minimum Number of Arrows to Burst Balloons (452), Meeting Rooms II (253), Interval List Intersections (986), Remove Covered Intervals (1288), Car Pooling (1094), Corporate Flight Bookings (1109), My Calendar I (729), My Calendar II (731), Employee Free Time (759)
- **Hard:** Minimum Number of Taps to Open to Water a Garden (1326), Data Stream as Disjoint Intervals (352), Range Module (715), My Calendar III (732), Patching Array (330), and Maximum Profit in Job Scheduling (1235) as the "not greedy" contrast

## The one-page summary

```text
GREEDY        one irrevocable choice per step; valid only with a proof
PROVE IT      exchange argument  (swap OPT's choice for mine: no worse)
              stays ahead        (after each step, greedy is at least as far along)
              but first: try to break it on 3-4 tiny inputs
NOT GREEDY    0/1 knapsack, arbitrary coin change, weighted intervals -> DP

SHAPES
  reach       track farthest; Jump II = BFS layers (layerEnd, farthest)
  balance     running sum; reset the start when it goes negative; total >= 0 => answer
  match       sort both, two pointers from the extremes; two bins: sort by a - b
  regret      forced order + heap of past choices; drop the worst / take the best in hindsight
  two passes  left rule, then right rule with max
  last index  stretch end to the last occurrence; cut when i == end
  frames      (max - 1) * (n + 1) + tied, but at least tasks.length

INTERVALS     closed [s,e] vs half-open [s,e): decide first
  overlap     a.s <= b.e && b.s <= a.e      (strict < for half-open)
  merge       sort by START; extend with max(end)
  insert      before / absorb overlapping / after, O(n)
  select      sort by END; keep if start >= lastEnd (removals, arrows, pair chains)
  rooms       sort starts and ends separately (or a min-heap of ends); the most alive at once
  ranges      difference array: +x at l, -x past r, prefix sum
  two lists   intersection [max s, min e]; advance the one that ends first
  covered     start asc, end DESC; covered if end <= maxEnd
  online      TreeMap floorEntry / ceilingEntry
COMPARATORS   comparingInt / Integer.compare, never a[0] - b[0]
```

## Key takeaways

- Prove a greedy before trusting it, with an exchange argument or "greedy stays ahead"; break it with a tiny counterexample.
- The sort key is the decision: start to combine, end to select, separate events to count overlaps.
- Decide closed or half-open before writing any comparison.
- When a greedy needs to change its mind, keep its past choices in a heap.
- Weights, "number of ways", or no exchange argument: switch to DP.

## Knowledge check

```quiz
? "Return the fewest intervals to remove so that the rest don't overlap." What do you sort by?
+ End: keep each interval that starts after the last kept one ends
- Start
! Sorting by start is for merging, not selecting.
- Length
! A short interval can block two that fit together.
- Nothing: it doesn't need sorting
! The greedy depends on the order.
> Activity selection, then n − kept.

? "Each job has a start, an end and a profit; maximise the total profit." Which approach?
+ DP over the jobs sorted by end time, with binary search for the last compatible job
- Sort by end and keep greedily
! That maximises the number of jobs, not the profit.
- Sort by profit and keep greedily
! A high-profit job can block two that are worth more together.
- A sweep line
! A sweep counts overlaps; it doesn't choose jobs.
> Weights break the greedy: LC 1235.

? "The minimum number of conference rooms." Which technique?
+ A sweep line over the start and end events, or a min-heap of end times
- Merge the intervals and count the groups
! One merged group can need several rooms.
- Sort by end and keep greedily
! That finds the most meetings one room can hold.
- Union-find over overlapping meetings
! Connected meetings don't all run at the same time.
> The answer is the most meetings in progress at once.

? A greedy passes all the examples, but you can't explain why it works. What next?
+ Hunt for a counterexample on tiny inputs, or compare it with an exact answer; if it breaks, use DP
- Submit it: passing the examples is enough
! Examples tend to use friendly inputs.
- Add a heap
! A heap fixes some greedies, but only once you know what's wrong.
- Try other sort orders until the examples pass
! That's guessing, not proving.
> One counterexample settles it.
```
