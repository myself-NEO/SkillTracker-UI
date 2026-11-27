Sorting creates order and binary search exploits it, so this recap covers both modules: which tool a problem wants, the checklist that prevents binary-search bugs, and a practice ladder.

## Recognizing the pattern

| The problem says… | Reach for |
|---|---|
| sorted input; "find", "first/last position", "insert" | [lower/upper bound](lesson:binary-search-template) |
| "minimum X such that…" / "maximum X such that…" | [binary search on the answer](lesson:binary-search-on-the-answer) |
| sorted but rotated; "minimum in rotated" | [rotated search](lesson:rotated-sorted-arrays) |
| "peak", "mountain", local maximum | [slope binary search](lesson:binary-search-on-predicates) |
| sorted matrix | [flat index / staircase / value search](lesson:binary-search-in-matrices) |
| median or k-th element of two sorted arrays | [partition binary search](lesson:median-of-two-sorted-arrays) |
| k-th smallest/largest, median of unsorted data | [quickselect](lesson:quicksort-and-quickselect), [a heap](lesson:top-k-and-two-heaps), or sort |
| pairs/triplets with a target sum | [sort + two pointers](lesson:sorting-as-preprocessing) |
| count pairs with an order condition (inversions) | [merge sort counting](lesson:merge-sort) |
| small integer range, or "sort in O(n)" | [counting / radix / buckets](lesson:linear-time-sorts) |
| "arrange to form the largest/smallest" | [a custom comparator](lesson:sorting-as-preprocessing) |

**Constraint hints:** n up to 10⁵–10⁶ with values up to 10⁹ and an O(n) check → binary search on the answer, O(n log 10⁹) ≈ 30n. A sorted array plus 10⁵ queries → O(log n) per query.

## Decision procedure

Before you write a binary-search loop, answer these out loud:

1. **What is the search space?** Indexes `[0, n]`, or values `[lo, hi]`? Is "not found" inside it?
2. **What's the predicate, and is it monotonic?** False → true, once.
3. **Which boundary do I want?** The first true (the default) or the last true (= first false − 1)?
4. **Updates:** `ok(mid)` → `hi = mid`; not ok → `lo = mid + 1`. Loop `while (lo < hi)`.
5. **Overflow:** `mid = lo + (hi − lo) / 2`, and `long` for products and sums.
6. **Test** on 1 element, 2 elements, a target smaller than everything, a target larger than everything, and duplicates.

For sorting problems, decide first whether the answer survives sorting at all (subarrays don't), then whether a comparison sort's O(n log n) fits, and whether the values are small enough to count instead.

### Sorting algorithms compared

| Algorithm | Best | Average | Worst | Extra space | Stable | Notes |
|---|---|---|---|---|---|---|
| Insertion sort | O(n) | O(n²) | O(n²) | O(1) | yes | fast for tiny or nearly sorted arrays; used inside TimSort |
| Selection sort | O(n²) | O(n²) | O(n²) | O(1) | no | the fewest writes (n swaps) |
| Bubble sort | O(n) | O(n²) | O(n²) | O(1) | yes | only for teaching |
| **Merge sort** | O(n log n) | O(n log n) | O(n log n) | O(n) | **yes** | linked lists, external sorting |
| **Quicksort** (random pivot) | O(n log n) | O(n log n) | O(n²) | O(log n) | no | fastest in practice for arrays |
| Heapsort | O(n log n) | O(n log n) | O(n log n) | O(1) | no | in place *and* guaranteed (see [heap basics](lesson:heap-basics)) |
| TimSort | O(n) | O(n log n) | O(n log n) | O(n) | yes | Java (objects), Python |
| Counting sort | O(n + k) | O(n + k) | O(n + k) | O(n + k) | yes* | small integer range k |
| Radix sort (LSD) | O(d(n + b)) | O(d(n + b)) | O(d(n + b)) | O(n + b) | yes | d digits in base b |

\* when written with prefix sums, as in the radix version.

## Edge cases to test

| Case | What breaks |
|---|---|
| empty array | `a[0]`, `nums.length - 1 = -1` |
| one element | `mid + 1` out of bounds (peaks, rotated) |
| target below all / above all | insertion at 0 / at n |
| all elements equal | rotated search with duplicates; quicksort without 3-way partitioning |
| `Integer.MIN_VALUE` / `MAX_VALUE` | `a - b` comparators, `(lo + hi) / 2`, `-x` |
| already sorted / reverse sorted input | a fixed-pivot quicksort is O(n²) |
| huge answer ranges | `int` overflow in sums inside feasibility checks |

## Common mistakes

1. **Mixing template conventions:** `while (lo <= hi)` with `hi = mid` loops forever. Pick one template.
2. **`(lo + hi) / 2` overflow**, and `int` overflow inside feasibility sums.
3. **Comparators written as `a - b`**, or `reversed()` applied to the wrong part of a chain.
4. **Searching for "equal" when the question needs a boundary.** Duplicates break `==`-style searches.
5. **Not proving monotonicity** before binary searching on the answer, or using a wrong search range.
6. **A fixed pivot in quicksort**, which is O(n²) on sorted input. And advancing `i` after swapping with `gt`.
7. **Allocating the merge buffer inside the recursion**, which costs O(n log n) allocations.
8. **Real-valued search with an epsilon loop** that never terminates.
9. **Sorting when the problem needs the original indexes**: sort an index array or pairs instead.
10. **Relying on stability from `Arrays.sort(int[])`**: it isn't stable, though that only matters for objects, which use stable TimSort.

## Practice ladder

**Sorting**
- Sort an Array (912): write merge sort and quicksort by hand
- Sort Colors (75) ⭐
- Kth Largest Element in an Array (215) ⭐: quickselect *and* heap
- Largest Number (179)
- Custom Sort String (791)
- H-Index (274)
- Relative Sort Array (1122)
- Maximum Gap (164)
- Wiggle Sort II (324) (quickselect + virtual indexing, hard)
- Count of Smaller Numbers After Self (315) ⭐: merge sort counting
- Reverse Pairs (493)
- Count of Range Sum (327)

**Binary search: the template**
- Binary Search (704)
- Search Insert Position (35)
- Find First and Last Position of Element in Sorted Array (34) ⭐
- First Bad Version (278)
- Sqrt(x) (69)
- Valid Perfect Square (367)

**Binary search: variants**
- Search in Rotated Sorted Array (33) ⭐
- Find Minimum in Rotated Sorted Array (153)
- Search in Rotated Sorted Array II (81)
- Find Peak Element (162)
- Peak Index in a Mountain Array (852)
- Search a 2D Matrix (74) and Search a 2D Matrix II (240)
- Kth Smallest Element in a Sorted Matrix (378)
- Time Based Key-Value Store (981)
- Single Element in a Sorted Array (540)

**Binary search on the answer ⭐**
- Koko Eating Bananas (875)
- Capacity To Ship Packages Within D Days (1011)
- Find the Smallest Divisor Given a Threshold (1283)
- Minimum Number of Days to Make m Bouquets (1482)
- Magnetic Force Between Two Balls (1552)
- Split Array Largest Sum (410) ⭐
- Minimize Max Distance to Gas Station (774) (real-valued)
- Find K-th Smallest Pair Distance (719)

**Hard**
- Median of Two Sorted Arrays (4) ⭐⭐
- Kth Smallest Number in Multiplication Table (668)
- Russian Doll Envelopes (354) (sort + LIS with binary search)

## The one-page summary

```text
SORT API     Arrays.sort(int[]) dual-pivot quicksort; objects: TimSort (stable, O(n) if sorted)
             comparators: Integer.compare / comparingInt / thenComparing; NEVER a - b
MERGE SORT   split, sort halves, merge with ONE buffer; stable; O(n log n) always
             counting while merging -> inversions, reverse pairs, smaller-after-self
QUICKSORT    random pivot + 3-way partition (lt / i / gt); don't advance i after swap with gt
QUICKSELECT  partition, keep the side with index n - k; expected O(n)
LINEAR       counting (small range), radix (bytes, stable passes), buckets (max gap)
CUSTOM       largest number: (b + a).compareTo(a + b); handle all zeros

BINARY SEARCH (first true):
             lo = first candidate, hi = last + 1
             while (lo < hi) { mid = lo + (hi - lo) / 2; if (ok(mid)) hi = mid; else lo = mid + 1; }
             return lo   (== hi + 1 sentinel when nothing is true)
BOUNDS       lowerBound: a[mid] < x ? go right   upperBound: a[mid] <= x ? go right
ROTATED      one half is always sorted; findMin compares with nums[hi]; duplicates -> O(n)
PEAK         nums[mid] < nums[mid+1] -> go right
ON ANSWER    range + greedy feasibility + monotonic -> first true (min) / first false - 1 (max)
MATRIX       flat index (74), staircase O(m+n) (240), value search + count (378)
REAL         fixed iteration count, not epsilon
MEDIAN       binary search the split of the shorter array; sentinels for empty sides
```

Print that block. Read it before every mock interview.

## Key takeaways

- Sorting buys structure for O(n log n); counting, radix and bucket sorts beat that only when values are bounded.
- Learn one binary-search template, the first true, and derive bounds, rotations, peaks and answer searches from it.
- Before any binary search: name the search space, prove the predicate is monotonic, and pick the boundary you want.
- "Minimise the maximum" and "maximise the minimum" mean binary search on the answer with a greedy check.
- Test empty input, one and two elements, targets outside the range, duplicates and extreme values.

## Knowledge check

```quiz
? "Find the first and last position of a target in a sorted array with duplicates." Which tool?
+ A lower bound and an upper bound
- The classic search that returns when it finds an equal element
! It returns an arbitrary match, not the first or last.
- A linear scan from the first match
! That's O(n) when the target repeats.
- Binary search on the answer
! There's no feasibility check; it's a plain bounds search.
> First = lowerBound, last = upperBound − 1.

? "Split the array into k parts to minimise the largest part's sum." Which tool?
+ Binary search on the answer, with a greedy check of how many parts a given maximum needs
- Sort the array, then take k chunks
! The parts must keep the original order.
- Quickselect
! It finds the k-th element, not a split.
- A heap of the k largest elements
! The constraint is on sums of contiguous parts.
> Feasibility is monotonic: a larger allowed maximum never needs more parts.

? "Count pairs i < j with nums[i] > nums[j]." Which tool?
+ Merge sort, counting pairs across the two halves while merging
- Two pointers after sorting
! Sorting destroys the i < j order the pairs depend on.
- A hash map of counts
! Counts can't capture the order relation.
- Binary search on the answer
! There's no answer range to search.
> Each right-half element placed early beats every remaining left element at once.

? Which loop never terminates for some inputs?
+ `while (lo <= hi)` with `hi = mid`
- `while (lo < hi)` with `hi = mid` and `lo = mid + 1`
! That's the standard first-true template.
- `while (lo <= hi)` with `hi = mid − 1` and `lo = mid + 1`
! That's the classic exact-match form, which always shrinks the range.
- A loop with a fixed number of halvings
! A fixed count always ends.
> Keep each template's condition and updates together.
```
