## The idea

**Median of Two Sorted Arrays (LC 4)** asks for the median of two sorted arrays in O(log(min(m, n))). It's a famous hard problem that is pure binary search once you see the trick: don't search for the median itself, **search for how to split the two arrays**.

The median splits the combined data into a left half and a right half of equal size. Choose `i` elements from the shorter array `a` for the left half; then `j = half − i` must come from `b`. Binary search on `i`.

## When to use it

- **The median, or any k-th element, of two sorted arrays**, faster than merging them.
- Problems that ask you to **partition two sorted sequences** so that one side is entirely ≤ the other.

The O(m + n) merge (walk both arrays to the middle) is the baseline to state first; the partition search is the optimisation.

## How it works

The split is valid when everything on the left is ≤ everything on the right:

- `a[i−1] ≤ b[j]` and `b[j−1] ≤ a[i]`.

If `a[i−1] > b[j]`, you took too many elements from `a`, so move left; otherwise move right. Because `i` determines `j`, there's a single number to search for.

```text
a:  1  3 | 8  9            i = 2 elements from a
b:  2  4  5 | 7 10 11      j = 3 elements from b      (half = (4 + 6 + 1) / 2 = 5)
left = {1, 3, 2, 4, 5}  max = 5      right = {8, 9, 7, 10, 11}  min = 7
valid (3 <= 7 and 5 <= 8); even total -> median = (5 + 7) / 2 = 6.0
```

**The details:**
- Search the **shorter** array, so `j` never goes negative.
- Use **±∞ sentinels** for empty sides (`i == 0`, `i == m`, `j == 0`, `j == n`).
- For an **odd** total, the left half holds one extra element, so the median is the maximum of the left side; for an even total, average the maximum of the left and the minimum of the right.

## Java template

```java
// LC 4: the median of two sorted arrays in O(log(min(m, n))) by binary-searching a partition.
public double findMedianSortedArrays(int[] a, int[] b) {
    if (a.length > b.length) return findMedianSortedArrays(b, a);   // search the SHORTER array
    int m = a.length, n = b.length, half = (m + n + 1) / 2;
    int lo = 0, hi = m;
    while (lo <= hi) {
        int i = (lo + hi) / 2;                   // take i elements from a ...
        int j = half - i;                        // ... and the rest of the left half from b
        int aLeft = (i == 0) ? Integer.MIN_VALUE : a[i - 1];
        int aRight = (i == m) ? Integer.MAX_VALUE : a[i];
        int bLeft = (j == 0) ? Integer.MIN_VALUE : b[j - 1];
        int bRight = (j == n) ? Integer.MAX_VALUE : b[j];
        if (aLeft <= bRight && bLeft <= aRight) {           // every left element <= every right one
            if ((m + n) % 2 == 1) return Math.max(aLeft, bLeft);
            return (Math.max(aLeft, bLeft) + (double) Math.min(aRight, bRight)) / 2;
        }
        if (aLeft > bRight) hi = i - 1;          // took too many from a
        else lo = i + 1;                         // took too few from a
    }
    throw new IllegalArgumentException("inputs must be sorted");
}
```

## Worked examples

**`a = [1, 3, 8, 9]`, `b = [2, 4, 5, 7, 10, 11]`.** The total is 10, so `half = 5`.

```text
lo=0 hi=4  i=2 j=3   aLeft=3  aRight=8  bLeft=5  bRight=7    3 <= 7 and 5 <= 8: valid
even total: (max(3, 5) + min(8, 7)) / 2 = (5 + 7) / 2 = 6.0
```

**`a = [1, 2]`, `b = [3, 4, 5]`** (odd total 5, `half = 3`):

```text
lo=0 hi=2  i=1 j=2   aLeft=1  aRight=2  bLeft=4  bRight=5    4 > 2: took too few from a -> lo = 2
lo=2 hi=2  i=2 j=1   aLeft=2  aRight=+inf  bLeft=3  bRight=4    2 <= 4 and 3 <= +inf: valid
odd total: max(2, 3) = 3
```

## Complexity

O(log(min(m, n))) time and O(1) space. Merging to the middle is O(m + n); concatenating and sorting is O((m + n) log(m + n)).

## Variations

### The k-th smallest of two sorted arrays

A more general tool: drop about k/2 candidates per step. The median is then the k-th element for `k = (m + n + 1) / 2` (and the average with the next one for an even total).

```java
// The k-th smallest (1-based) of two sorted arrays: discard about k/2 candidates per step. O(log k).
public int kthSmallest(int[] a, int[] b, int k) {
    int i = 0, j = 0;                                   // a[i..] and b[j..] are still candidates
    while (true) {
        if (i == a.length) return b[j + k - 1];
        if (j == b.length) return a[i + k - 1];
        if (k == 1) return Math.min(a[i], b[j]);
        int step = k / 2;
        int ai = Math.min(i + step, a.length) - 1;      // the last of up to k/2 elements from a
        int bj = Math.min(j + step, b.length) - 1;
        if (a[ai] <= b[bj]) {                           // a[i..ai] are all among the k-1 smallest
            k -= ai - i + 1;
            i = ai + 1;
        } else {
            k -= bj - j + 1;
            j = bj + 1;
        }
    }
}
```

**Why it's safe:** if `a[ai] ≤ b[bj]`, then at most `(ai − i + 1) + (bj − j) ≤ k − 1` candidates are ≤ `a[ai]`, so none of `a[i..ai]` can be the k-th smallest; drop them and reduce k.

### Other medians

- **A running median of a stream** uses two heaps: see [top-k and two heaps](lesson:top-k-and-two-heaps).
- **The median of one unsorted array** is quickselect: see [quicksort and quickselect](lesson:quicksort-and-quickselect).

## Common mistakes

- **Searching the longer array**, which can make `j` negative or larger than `n`.
- **Missing sentinels** for empty sides, which reads outside the arrays.
- **Mixing up odd and even totals**: with `half = (m + n + 1) / 2`, the extra element of an odd total is on the left.
- **Integer division in the average**: cast to `double` before dividing by 2.
- **Leading with the hard version.** State the O(m + n) merge first, then optimise.

## Practice

Median of Two Sorted Arrays (LC 4), Merge Sorted Array (LC 88), Find Median from Data Stream (LC 295), Kth Largest Element in an Array (LC 215).

## Key takeaways

- Don't search for the median: search for how many elements of the shorter array go into the left half.
- A split is valid when `a[i−1] ≤ b[j]` and `b[j−1] ≤ a[i]`; otherwise move `i` toward the side that fixes it.
- Search the shorter array, and use ±∞ sentinels at the edges.
- Odd total: the maximum of the left; even: the average of the left's maximum and the right's minimum.
- The k-th smallest of two sorted arrays drops about k/2 candidates per step: O(log k).

## Knowledge check

```quiz
? Why does the algorithm binary search the shorter array?
+ So that j = half − i always stays between 0 and the longer array's length
- Because it's faster to sort
! Both arrays are already sorted.
- Because the median is always in the shorter array
! It can be in either.
- It doesn't matter which array you search
! Searching the longer one can push j out of range.
> It also gives the O(log(min(m, n))) bound.

? The current split has `a[i−1] > b[j]`. Which way do you move, and why?
+ Left (fewer from a): a's left side holds a value bigger than one on b's right side
- Right (more from a)
! That would make a's left side even larger.
- The split is valid; return the median
! A valid split needs a[i−1] ≤ b[j].
- Restart with the arrays swapped
! Swapping is only done once, at the start.
> Taking fewer elements from a lowers a[i − 1].

? For an odd total, why is the median `max(aLeft, bLeft)`?
+ With half = (m + n + 1) / 2, the left half holds the extra middle element, which is its largest value
- Because the right half is empty
! The right half has one fewer element, not zero.
- Because aLeft is always bigger
! Either side can hold the left half's maximum.
- It isn't; the median is min(aRight, bRight)
! That's the right half's smallest value, used only for even totals.
> Even totals average the left's maximum and the right's minimum.

? What's the simplest correct baseline to state before the partition search?
+ Merge the two arrays up to the middle: O(m + n)
- Binary search each array for the median separately
! The medians of the parts don't give the median of the whole.
- Average the two medians
! That's wrong unless the arrays have equal size and special structure.
- A heap of all elements
! It works, but it's slower and no simpler than merging.
> Then optimise to the O(log(min(m, n))) partition search.
```
