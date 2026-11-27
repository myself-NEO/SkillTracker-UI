This module's techniques solve a large share of interview questions on their own. This recap is for telling them apart quickly: the signals, the order to try them in, the edge cases and mistakes that cost points, and a practice ladder.

## Recognizing the pattern

| Signal in the problem | Technique |
|---|---|
| Contiguous subarray/substring; longest or shortest one meeting a condition that stays true as the window shrinks | [Sliding window](lesson:sliding-window) |
| Contiguous; "sum equals k", values may be negative; or many range-sum queries | [Prefix sums](lesson:prefix-sums), with a hash map for counting |
| Contiguous; maximum (or minimum) sum or product, no other condition | [Kadane's algorithm](lesson:maximum-subarray) |
| Sorted input (or sortable); a pair or triplet with a target sum | [Two pointers](lesson:two-pointers), converging |
| In place, O(1) extra space; remove, compact or partition | [Two pointers](lesson:two-pointers), read and write |
| "Seen before?", complements, counts, groups of equivalent items | [Hashing](lesson:hashing-techniques) |
| A grid: traversal order, rotation, rows and columns | [Matrix techniques](lesson:matrix-techniques) |
| Many range updates, read once at the end | [Difference array](lesson:prefix-sums#difference-arrays-many-range-updates-at-once) |

The full table for every DSA technique is in [the problem-solving framework](lesson:problem-solving-framework#reading-the-signals).

## Decision procedure

Ask these in order; the first "yes" is usually the technique.

1. **Is the answer a contiguous subarray or substring?**
   - Maximum or minimum sum or product, and nothing else → Kadane.
   - Longest or shortest window meeting a condition, and the condition is monotonic (non-negative values, counts, distinct characters) → sliding window.
   - A target sum with negative values, or counting subarrays by sum → prefix sums with a hash map.
   - Many range-sum queries → a prefix array if the data never changes; a [Fenwick tree](lesson:fenwick-tree) if it does.
2. **Is the input sorted, or can you sort it without losing what the answer needs?** → two pointers (or [binary search](lesson:binary-search-template)).
3. **Do you need membership, counts or groups?** → hashing, with a plain array for small alphabets.
4. **Is it a grid?** → matrix techniques, or [grids as graphs](lesson:grids-as-graphs) for flood fill and paths.
5. **Nothing fits?** Write the brute force, then ask what it recomputes ([the framework](lesson:problem-solving-framework)).

## Complexity cheat sheet

| Operation | Time | Notes |
|---|---|---|
| Array random access `arr[i]` | O(1) | contiguous memory |
| Array insert/delete at arbitrary index | O(n) | must shift elements |
| `ArrayList.get/set` | O(1) | `ArrayList.add` at the end is amortized O(1), O(n) for a resize |
| `String` concatenation in a loop | O(n) **per op** → O(n²) total | use `StringBuilder` |
| `StringBuilder.append` | O(1) amortized | O(n) total for n appends |
| `HashMap`/`HashSet` get/put/contains | O(1) average | O(n) worst case on pathological collisions; essentially never hit in practice |
| `TreeMap`/`TreeSet` get/put/contains | O(log n) | kept sorted, backed by a red-black tree |
| `Arrays.sort(int[] ...)` | O(n log n) average | **dual-pivot quicksort**; O(n²) is theoretically possible on adversarial input |
| `Arrays.sort(Object[] ...)` | O(n log n) guaranteed | **TimSort**: stable, no quicksort worst case |
| `PriorityQueue` offer/poll | O(log n) | peek is O(1) |

## Edge cases to test

- **Empty input** and a **single element**.
- **All elements equal**, or all duplicates.
- **All negative numbers**, the classic trap for Kadane's algorithm and anything that starts a running best at 0.
- **k = 0, k = 1, and k larger than the array** for window and count problems.
- **Integer overflow.** `int` maxes out at 2,147,483,647: summing about 2.2 million elements of value 1,000 already overflows. Accumulate sums in `long` whenever the constraints make this plausible, and say so out loud even if the example doesn't hit it.
- **Character assumptions.** `int[26]` only works for lowercase `'a'..'z'`; uppercase, digits or Unicode need `int[128]` or a map.
- **Non-square matrices** and matrices with one row or one column.

## Common mistakes

- **A sliding window on negative values.** A sum-based window needs a monotonic condition; use prefix sums instead.
- **Prefix-sum off-by-ones.** Mixing the `prefix[i]` and `prefix[i + 1]` conventions in one solution.
- **Two pointers on unsorted data**, when the elimination argument depends on order.
- **Forgetting duplicates** when the answer must contain unique pairs or triplets.
- **Java traps:** `==` on strings or boxed integers, `+=` on a string in a loop, and `Arrays.asList` on an `int[]`. All are covered in [Arrays & Strings in Java](lesson:arrays-and-strings-in-java#common-mistakes).

## Practice ladder

Each rung assumes the previous one is comfortable, not perfect.

1. **The load-bearing four, which give the most interview mileage per hour spent:** [two pointers](lesson:two-pointers) → [sliding window](lesson:sliding-window) → [prefix sums](lesson:prefix-sums) → [hashing](lesson:hashing-techniques). Do 2–3 of each lesson's practice problems.
2. **The rest of the module:** [Kadane's algorithm](lesson:maximum-subarray) and [matrix techniques](lesson:matrix-techniques).
3. **A mixed set, solved without being told the technique.** Name the technique before you code:
   - Two Sum (LC 1)
   - 3Sum (LC 15)
   - Longest Substring Without Repeating Characters (LC 3)
   - Subarray Sum Equals K (LC 560)
   - Maximum Subarray (LC 53)
   - Product of Array Except Self (LC 238)
   - Group Anagrams (LC 49)
   - Trapping Rain Water (LC 42)
   - Minimum Window Substring (LC 76)
   - Spiral Matrix (LC 54)

At each rung, attempt the problems **without** looking at the solution first. If you can't get started within about 10 minutes, that's useful information: re-read the "When to use it" section for that technique, not the solution code.

Where to go next: [monotonic stacks](lesson:monotonic-stack) and [deques](lesson:monotonic-deque) for "next greater" and window maxima, [binary search on the answer](lesson:binary-search-on-the-answer), [string algorithms](lesson:string-algorithms-basics), and [range-query structures](lesson:range-query-structures). The range-query module is the densest one, and the one most people skip, which is exactly why knowing it well is a differentiator.

## Interview tips

- **Say the brute force out loud first**, even trivially ("the obvious approach checks every pair, which is O(n²); I think we can do better"). It shows structured thinking and gives the interviewer a checkpoint.
- **Name the technique before you code it**: "this looks like a sliding window, because we want a contiguous substring that satisfies a condition". Narrating the pattern match is exactly the skill this module builds.
- **State the complexity without being asked**, for both your brute force and your final solution.
- **Handle edge cases explicitly**: empty input, a single element, all duplicates, all negative values. Mention them even if the interviewer's example doesn't include them.
- **Dry-run your final code on the given example**, out loud, before saying you're done. This catches most off-by-one bugs, especially prefix-sum offsets and window boundaries.
- If you only half-remember something, **say so directly** rather than faking confidence: "I don't have this memorised exactly, but the idea is X; let me reconstruct it" reads far stronger than confidently writing something subtly wrong.

## Key takeaways

- Contiguous problems split three ways: windows (monotonic conditions), prefix sums (exact sums, negatives, range queries) and Kadane (best sum or product).
- Sorted data and pairs point to two pointers; membership, counts and groups point to hashing.
- Check each technique's precondition (sortedness, non-negative values, a static array) before committing.
- Test empty input, single elements, duplicates, all-negative values and overflow every time.
- Name the technique and its complexity out loud before you write code.

## Knowledge check

```quiz
? "Find the longest substring with at most two distinct characters." Which technique?
+ A variable-size sliding window with a count map
- Prefix sums
! There's no sum to subtract; the condition is about distinct characters.
- Kadane's algorithm
! Kadane maximises a sum, not a length under a condition.
- Two pointers after sorting the string
! Sorting destroys the substring.
> "At most two distinct" is monotonic: shrinking a valid window keeps it valid.

? "Count the subarrays whose sum is exactly k; values may be negative." Which technique?
+ Prefix sums with a hash map of counts
- A sliding window
! Negative values break the window's shrink rule.
- Two pointers
! There's no sorted order to exploit, and sorting breaks contiguity.
- Hashing alone, without prefix sums
! The map counts earlier prefix sums; without them there's nothing to look up.
> Each subarray sum is a difference of two prefix sums.

? "Given stock prices by day, find the best profit from one buy and one later sell." Which idea from this module solves it in O(n)?
+ Kadane's algorithm on day-over-day changes, or equivalently a running minimum price
- Two pointers converging from both ends
! The buy must come before the sell; converging pointers don't respect that.
- Sorting the prices
! Sorting loses which day each price was on.
- A prefix-sum array with a hash map
! There's no target sum to look up.
> The best profit is the maximum run of daily changes, clamped at 0.

? `nums` is sorted, and you need every unique triplet that sums to 0. What's the approach and its time?
+ Fix each element and run converging two pointers on the rest, skipping duplicates: O(n²)
- Three nested loops with a set of triplets: O(n³)
! Correct, but one degree slower than necessary.
- A hash map of pair sums: O(n)
! Enumerating pairs alone is already O(n²).
- A sliding window of size 3: O(n)
! The triplet's elements needn't be adjacent.
> Sorting enables the elimination argument for each fixed first element.
```
