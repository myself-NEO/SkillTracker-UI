Range queries ask for an aggregate (a sum, a minimum, a gcd) over `a[l..r]`, many times over. Several structures can answer them, and candidates often know only the first one, prefix sums; interviewers occasionally probe past that on purpose. Picking the right structure comes down to one question:

> **Does the array change between queries? And if so, do updates hit a single point or a whole range?**

## The steps

1. **Does the array ever change?** No → [prefix sums](lesson:prefix-sums) for sums, or a [sparse table](lesson:sparse-table-and-sqrt-decomposition) for min, max or gcd.
2. **Only point updates, and only range sums?** → a [Fenwick tree](lesson:fenwick-tree).
3. **Point updates, and range min or max?** → a [segment tree](lesson:segment-tree). A Fenwick tree can't do this: it answers a range by subtracting one prefix from another, and min and max can't be subtracted.
4. **Range updates and range sums?** → two Fenwick trees (the dual-BIT trick) or a [lazy segment tree](lesson:lazy-propagation). Both are correct; the dual-BIT trick is less code, and the lazy segment tree generalizes to min and max.
5. **Range updates and range min or max?** → a lazy segment tree only: the dual-BIT trick is specific to sums.
6. **Short on time, n moderate (up to about 10⁵–10⁶), and simplicity matters more than the last log n factor?** → [sqrt decomposition](lesson:sparse-table-and-sqrt-decomposition).

## Reading the signals

| Access pattern | Best structure | Update | Query |
|---|---|---|---|
| The array never changes; range sums | Prefix sum array | — | O(1) |
| The array never changes; range **min, max or gcd** | Sparse table | — | O(1) |
| Range updates, and only the final values are needed | Difference array | O(1) | O(n), once at the end |
| Point updates, range sums | Fenwick tree | O(log n) | O(log n) |
| Point updates, range min or max | Segment tree | O(log n) | O(log n) |
| Range updates, point queries | Difference array in a Fenwick tree | O(log n) | O(log n) |
| Range updates, **range** queries | Lazy segment tree, or the dual-BIT trick for sums | O(log n) | O(log n) |
| Something non-standard (range assignment, the mode of a range) | Sqrt decomposition, the most flexible | O(1) to O(√n) | O(√n) |

**How often each comes up:** prefix sums and Fenwick trees with point updates and range sums appear with real frequency: Range Sum Query - Mutable (LC 307) is a well-known, fair-game question. Lazy segment trees and sparse tables are rarely implemented from scratch in a live interview, but knowing what they're for, and sketching the idea when asked "how would you support range updates too?", is the kind of depth that separates a strong answer from a merely correct one.

## Worked example

Four requests, run through the steps:

1. *"The sum of `nums[l..r]`, many times; `nums` never changes"* (LC 303). Step 1: prefix sums, O(1) per query.
2. *"The sum of `nums[l..r]`, with `nums[i] = val` updates in between"* (LC 307). Step 2: a Fenwick tree, O(log n) for both. A segment tree also works, with more code.
3. *"Add v to every element of `[l, r]`, and ask for the minimum of `[l, r]`."* Steps 4 and 5: range updates with minimum queries leave only the lazy segment tree.
4. *"For each element, count the smaller elements to its right"* (LC 315). It doesn't look like a range query, but walking from the right and asking "how many values below x have I seen so far?" is a prefix sum over the **values**: a Fenwick tree indexed by value, after compressing the values to ranks. See the [Fenwick tree](lesson:fenwick-tree) lesson.

## Common mistakes

- **Reaching for a segment tree when prefix sums would do.** If nothing changes, there's nothing to update.
- **Using a Fenwick tree for range min or max.** Prefix maxima can't be subtracted to give a range maximum.
- **Using a sparse table for sums.** Its two blocks overlap, which double-counts sums; it's only for idempotent operations such as min, max and gcd.
- **Recomputing prefix sums after every update**: O(n) per update, which is exactly what a Fenwick tree avoids.
- **Mixing indexing conventions.** Fenwick trees are 1-indexed, while most problems are 0-indexed.

## Practice

Range Sum Query - Immutable (LC 303), Range Sum Query 2D - Immutable (LC 304), Range Sum Query - Mutable (LC 307), Range Addition (LC 370), a clean difference-array problem; Count of Smaller Numbers After Self (LC 315); Count of Range Sum (LC 327), which is harder, usually solved with merge sort and counting or with a Fenwick tree over compressed values.

## Key takeaways

- Ask first: does the array change, and do updates hit a point or a range?
- Static arrays: prefix sums for sums, a sparse table for min, max and gcd, both O(1) per query.
- Point updates: a Fenwick tree for sums, a segment tree for anything associative.
- Range updates with range queries: the dual-BIT trick for sums, a lazy segment tree in general.
- Sqrt decomposition is the simple, flexible fallback, at O(√n) per query.

## Knowledge check

```quiz
? The array never changes, and you must answer a million range-minimum queries. Which structure?
+ A sparse table: O(n log n) to build, then O(1) per query
- A Fenwick tree
! A Fenwick tree can't answer range minimums.
- Prefix sums
! Prefix sums work for sums, not minimums.
- A lazy segment tree
! It works, at O(log n) per query, but there are no updates to be lazy about.
> Static data and an idempotent operation: the sparse table's sweet spot.

? Point updates and range sums, as in LC 307. What's the simplest structure that's fast enough?
+ A Fenwick tree: O(log n) per update and query, in about 15 lines
- A prefix sum array, recomputed after each update
! That's O(n) per update.
- A sparse table
! Any update means rebuilding it.
- A lazy segment tree
! It works, but there are no range updates; it's far more code.
> A plain segment tree also works, with more code.

? Why can't a Fenwick tree answer range-maximum queries?
+ It answers a range by subtracting one prefix from another, and a maximum can't be subtracted
- Because it's 1-indexed
! The indexing is a convention, not a limitation.
- Because it can't store negative numbers
! It stores any integers.
- Because maximum isn't associative
! Maximum is associative; it isn't invertible.
> Segment trees combine whole ranges instead of subtracting prefixes.

? Add v to every element of [l, r], and query the minimum of [l, r]. Which structure?
+ A segment tree with lazy propagation
- Two Fenwick trees (the dual-BIT trick)
! That trick is specific to sums.
- A sparse table
! It can't take updates.
- A difference array
! It can't answer range minimums between updates.
> Range updates plus min or max queries leave only the lazy segment tree.
```
