This is the meta-skill. Most interview problems are solved by running the same short sequence of steps, and the steps matter more than any single technique: they turn an unfamiliar problem into one you recognise. Run through them on every practice problem until they are automatic.

## The steps

**Step 1 — Read the constraints before you think about the algorithm.** The input size tells you how fast the solution must be. A judge (or an interviewer's mental model) allows roughly 10⁷–10⁸ simple operations, so:

| `n` up to | Time budget | Typical approaches |
|---|---|---|
| 10–12 | O(n!) | permutations, brute-force search |
| 20 | O(2ⁿ) | subsets, backtracking, bitmask DP |
| 500 | O(n³) | interval DP, Floyd–Warshall |
| 5,000 | O(n²) | DP over pairs, comparing all pairs |
| 10⁵–10⁶ | O(n log n) or O(n) | sorting, two pointers, sliding window, hashing, heaps |
| 10⁹ and up | O(log n) or O(1) | binary search, maths |

This alone eliminates most wrong turns before you write a line of code.

**Step 2 — Identify the signal.** Certain phrases in a problem statement point at specific techniques almost every time (see [Reading the signals](#reading-the-signals) below).

**Step 3 — State the brute force out loud**, even if you never write it. It establishes correctness, gives you something to optimise away from, and is a fallback answer. Interviewers explicitly want to hear it.

**Step 4 — Ask what's being recomputed.** If you're re-summing a range you've already summed → prefix sum. If you're re-scanning a window you've already scanned → sliding window. If you're re-comparing pairs you've already ruled out → two pointers (usually after sorting).

**Step 5 — Handle edge cases before you're asked to.** Empty array, single element, all duplicates, all negative numbers, integer overflow. Java's `int` maxes out at about 2.1 billion, so a sum of a million elements near `Integer.MAX_VALUE` overflows silently; use `long` for accumulating sums.

**Step 6 — Dry-run on the example** the interviewer gave you, out loud, before declaring you're done.

## Reading the signals

| Signal in the problem | Likely technique | Typical complexity |
|---|---|---|
| Contiguous subarray/substring + sum, max, or min | [Sliding window](lesson:sliding-window), [prefix sums](lesson:prefix-sums) or [Kadane's algorithm](lesson:maximum-subarray) | O(n) |
| Sorted array + find a pair/triplet matching a target | [Two pointers](lesson:two-pointers) | O(n) or O(n log n) |
| "Number of subarrays with sum == k" | [Prefix sum + HashMap](lesson:prefix-sums) | O(n) |
| Range sum queries, array **never changes** | [Prefix sum array](lesson:prefix-sums) | O(1) per query after an O(n) build |
| Range queries, array has **point updates** | [Fenwick tree](lesson:fenwick-tree) or [segment tree](lesson:segment-tree) | O(log n) update and query |
| **Range updates** + range queries | [Segment tree with lazy propagation](lesson:lazy-propagation), or a dual-BIT Fenwick tree | O(log n) |
| Range min/max, array is **static** | [Sparse table](lesson:sparse-table-and-sqrt-decomposition) | O(1) per query after an O(n log n) build |
| "Next greater/smaller element" | [Monotonic stack](lesson:monotonic-stack) | O(n) |
| "Maximum/minimum in every window of size k" | [Monotonic deque](lesson:monotonic-deque) | O(n) |
| Numbers confined to range [1, n], find missing/duplicate | Cyclic sort or the [XOR trick](lesson:bit-tricks) | O(n) time, O(1) space |
| "Kth largest/smallest" | [Heap](lesson:top-k-and-two-heaps), or [quickselect](lesson:quicksort-and-quickselect) | O(n log k), or O(n) on average |
| "Minimise the maximum" / "maximise the minimum" | [Binary search on the answer](lesson:binary-search-on-the-answer) | O(n log(range)) |
| Anagram / permutation-of-a-string check | [Frequency array + fixed sliding window](lesson:sliding-window) | O(n) |
| Longest palindromic substring | [Expand around the centre](lesson:palindromes) (or DP) | O(n²) |
| Find a pattern's occurrences in text | [KMP](lesson:kmp) or [Rabin–Karp](lesson:rabin-karp) | O(n + m) |
| "Longest consecutive sequence" in an unsorted array | [HashSet](lesson:hashing-techniques) | O(n) |
| Rotate/transpose a matrix in place | [Transpose and reverse](lesson:matrix-techniques) | O(n²), O(1) extra space |

A signal suggests a technique; it doesn't prove it. Before you commit, check the technique's precondition: two pointers on a pair sum needs sorted data, and a sliding window needs a condition that stays true as the window shrinks.

## Worked example

**Subarray Sum Equals K (LC 560):** count the contiguous subarrays of `nums` whose sum is exactly `k`. Values can be negative, and `n ≤ 2 × 10⁴`.

1. **Constraints.** `n² = 4 × 10⁸` is too slow to be comfortable, so aim for O(n) or O(n log n).
2. **Signal.** "Subarrays" means contiguous, and "sum equals k" is the prefix-sum row of the table. A sliding window looks tempting, but negative values break it: growing a window can *lower* its sum, so there's no rule for when to shrink.
3. **Brute force.** For every start, extend the end one step at a time and keep a running sum: O(n²), but clearly correct.
4. **What's recomputed?** The brute force re-adds the same ranges over and over. With prefix sums `P`, the sum of `nums[l..r]` is `P[r+1] − P[l]`. It equals `k` when `P[l] = P[r+1] − k`, so for each position you only need to know how many earlier prefix sums equal the current one minus `k`. A `HashMap` from prefix sum to count answers that in O(1), which gives O(n) overall ([prefix sums](lesson:prefix-sums) has the code).
5. **Edge cases.** A subarray that starts at index 0 needs the empty prefix, so seed the map with `{0: 1}`. `k = 0` and negative values need no special code. The largest possible sum, 2 × 10⁴ × 1,000, fits in an `int`.
6. **Dry run.** `nums = [1, 2, 3]`, `k = 3`: the prefix sums are 0, 1, 3, 6. At 3, one earlier prefix sum equals 3 − 3 = 0, which counts `[1, 2]`. At 6, one equals 6 − 3 = 3, which counts `[3]`. The answer is 2, which is correct.

## Common mistakes

- **Coding before reading the constraints.** You can spend twenty minutes polishing an O(n²) solution that was never going to pass.
- **Matching a keyword without checking the precondition.** "Subarray" doesn't always mean sliding window, and "pair" doesn't always mean two pointers. Negative numbers, unsorted input and duplicate values are the usual reasons a familiar technique doesn't apply.
- **Skipping the brute force.** Without it you have no correctness baseline to test the fast version against, and nothing to say while you think.
- **Leaving edge cases until the interviewer asks.** Mention empty input, a single element and overflow as you design, not after.
- **Declaring victory without a dry run.** Most off-by-one bugs show up within two iterations of tracing the example by hand.

## Key takeaways

- Constraints come first: they set the time budget, roughly 10⁷–10⁸ simple operations.
- Signals in the problem statement point to techniques, but check each technique's precondition before you commit.
- State the brute force, then ask what it recomputes; removing that repeated work is usually the optimisation.
- Cover the edge cases while you design, and dry-run the example before you say you're done.

## Knowledge check

```quiz
? A problem allows n up to 10⁵. Which time complexity should you aim for?
- O(n²)
! 10¹⁰ operations is far over the budget of roughly 10⁸.
+ O(n log n) or better
- O(2ⁿ)
! Exponential time only works for n up to about 20.
- O(n³)
! Even n = 10³ would already need 10⁹ operations.
> Around 10⁷–10⁸ simple operations fit in the time limit, so 10⁵ elements need O(n) or O(n log n).

? "Count the subarrays whose sum is exactly k; values can be negative." Which technique fits?
+ Prefix sums with a HashMap of counts
- A variable-size sliding window
! Negative values mean a growing window can lose sum, so there's no rule for when to shrink it.
- Two pointers after sorting the array
! Sorting destroys contiguity, and subarrays must be contiguous.
- Binary search on the answer
! There's no monotonic yes/no question to search over here.
> A subarray sum is a difference of two prefix sums, so count earlier prefix sums equal to the current one minus k.

? Your brute force re-adds the same ranges of the array again and again. What removes that repeated work?
+ Precomputing prefix sums, so any range sum is one subtraction
- Sorting the array first
! Sorting changes which elements are next to each other.
- Recursion with backtracking
! Backtracking explores choices; it doesn't share sums between ranges.
- A priority queue
! A heap orders elements; it doesn't answer range sums.
> Prefix sums turn every range sum into P[r + 1] − P[l].

? Why accumulate large sums in a `long` rather than an `int` in Java?
+ An `int` overflows silently past about 2.1 billion
- A `long` is faster to add than an `int`
! It isn't; the point is range, not speed.
- Java doesn't allow adding more than a million `int`s
! There's no such limit; the sum just wraps around.
- To avoid boxing in collections
! Boxing is about objects like Integer, not the width of the sum.
> Java integer arithmetic wraps around without an error, so an overflowing sum gives a wrong answer silently.
```
