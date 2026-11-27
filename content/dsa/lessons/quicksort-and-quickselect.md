## The idea

Pick a pivot and **partition** the array into `< pivot`, `= pivot` and `> pivot`. **Quicksort** recurses into both outer parts; **quickselect** keeps only the part that contains the answer, which finds the k-th element in expected O(n) without sorting everything.

## When to use it

- **Sorting in place**, with good cache behaviour and no merge buffer (`Arrays.sort(int[])` is a quicksort).
- **The k-th smallest or largest element** of an in-memory array you may reorder: quickselect.
- **Partitioning problems**: sort 0s, 1s and 2s; move zeros to the end; group values around a threshold.

## How it works

**3-way partitioning (Dijkstra's)** keeps the block equal to the pivot out of the recursion, which fixes the classic O(n²) behaviour on arrays with many duplicates. It maintains three regions with one scan:

```text
a[lo..lt)  < pivot      a[lt..i)  == pivot      a[i..gt]  unexamined      a(gt..hi]  > pivot
```

- `a[i] < pivot`: swap it into the "<" region and advance both `lt` and `i`.
- `a[i] > pivot`: swap it to the end and shrink `gt`, but **don't advance `i`**: the value that came back from the right hasn't been examined yet. This is the single most common bug in 3-way partitioning.
- `a[i] == pivot`: just advance `i`.

**A random pivot** makes the O(n²) worst case astronomically unlikely for any input. A fixed pivot (the first or last element) is O(n²) on already sorted input: a classic bug.

## Java template

```java
public void quickSort(int[] a) {
    quickSort(a, 0, a.length - 1);
}

private void quickSort(int[] a, int lo, int hi) {
    if (lo >= hi) return;
    // random: no adversarial O(n^2)
    int pivot = a[lo + ThreadLocalRandom.current().nextInt(hi - lo + 1)];
    int lt = lo, i = lo, gt = hi;      // a[lo..lt) < pivot, a[lt..i) == pivot, a(gt..hi] > pivot
    while (i <= gt) {
        if (a[i] < pivot) swap(a, lt++, i++);
        // don't advance i: the swapped-in value is unchecked
        else if (a[i] > pivot) swap(a, i, gt--);
        else i++;
    }
    quickSort(a, lo, lt - 1);          // the block equal to the pivot is final: never recursed on
    quickSort(a, gt + 1, hi);
}

private void swap(int[] a, int i, int j) {
    int t = a[i];
    a[i] = a[j];
    a[j] = t;
}
```

## Worked examples

### Sort Colors (LC 75): the Dutch national flag

Sort an array of 0s, 1s and 2s in one pass with O(1) space. It's the 3-way partition with the pivot fixed at 1:

```java
// LC 75 Sort Colors (Dutch national flag): one pass, O(1) space. The same 3-way partition, pivot 1.
public void sortColors(int[] nums) {
    int lt = 0, i = 0, gt = nums.length - 1;     // [0, lt) = 0s, [lt, i) = 1s, (gt, end] = 2s
    while (i <= gt) {
        if (nums[i] == 0) swap(nums, lt++, i++);
        else if (nums[i] == 2) swap(nums, i, gt--);
        else i++;
    }
}
```

The comment on the first line of the method is the **invariant**. Write it before the loop, and the three branches follow from it.

### Kth Largest Element in an Array (LC 215): quickselect

You don't need to sort everything to find the k-th largest. Partition once, and **keep only the side that contains the answer**:

```java
// LC 215: the k-th largest element in expected O(n):
// partition, then keep only the side with the answer.
public int findKthLargest(int[] nums, int k) {
    int[] a = nums.clone();
    int target = a.length - k;                   // its index in ascending order
    int lo = 0, hi = a.length - 1;
    while (true) {
        int pivot = a[lo + ThreadLocalRandom.current().nextInt(hi - lo + 1)];
        int lt = lo, i = lo, gt = hi;
        while (i <= gt) {                        // 3-way partition, exactly as in quicksort
            if (a[i] < pivot) swap(a, lt++, i++);
            else if (a[i] > pivot) swap(a, i, gt--);
            else i++;
        }
        if (target < lt) hi = lt - 1;            // the answer is among the smaller values
        else if (target > gt) lo = gt + 1;       // ... among the larger values
        else return pivot;                       // ... or inside the block equal to the pivot
    }
}
```

**Expected O(n):** the work is `n + n/2 + n/4 + …` ≈ 2n with good pivots.

## Complexity

| | Expected | Worst case | Extra space | Stable? |
|---|---|---|---|---|
| Quicksort (random pivot) | O(n log n) | O(n²) | O(log n) stack expected | no |
| Quickselect | O(n) | O(n²) | O(1) | — |

**Methods for the k-th largest, compared:**

| Method | Time | Extra space | Notes |
|---|---|---|---|
| Sort, then index | O(n log n) | O(1)–O(n) | simplest; fine for most inputs |
| Min-heap of size k | O(n log k) | O(k) | streams; best when k is small (see [top-k and two heaps](lesson:top-k-and-two-heaps)) |
| Quickselect | **O(n)** expected | O(1) in place | reorders the array (here: a copy) |

## Variations

**Lomuto partition, the simplest two-way scheme.** The last element is the pivot; one pointer marks the end of the "smaller" region:

```java
private int partition(int[] nums, int lo, int hi) {
    int pivot = nums[hi], i = lo;
    for (int j = lo; j < hi; j++) {
        if (nums[j] < pivot) swap(nums, i++, j);
    }
    swap(nums, i, hi);
    return i;                                    // the pivot's final position
}
```

It's easy to write, but it puts every value equal to the pivot on one side, so arrays with many duplicates degrade to O(n²). Prefer the 3-way version, and randomise the pivot (swap a random element into `hi` first).

**A guaranteed O(log n) stack:** recurse into the smaller side and loop on the larger one.

**A deterministic O(n) quickselect:** the median-of-medians pivot guarantees O(n), but nobody codes it in interviews; name it.

**Top-k by quickselect:** after quickselect places the k-th element, everything on one side of it is the top k (in no particular order). K Closest Points to Origin (LC 973) can use this instead of a heap.

## Common mistakes

- **A fixed pivot**, which is O(n²) on sorted or nearly sorted input. Randomise.
- **Advancing `i` after swapping with `gt`**, which skips an unexamined value.
- **Two-way partitioning on many duplicates**, which unbalances the recursion; use 3-way.
- **Unbounded recursion depth** on unlucky inputs; recurse into the smaller side.
- **Reordering the caller's array** in quickselect without saying so; work on a copy if it matters.

## Practice

Sort an Array (LC 912), Sort Colors (LC 75), Move Zeroes (LC 283), Kth Largest Element in an Array (LC 215), K Closest Points to Origin (LC 973), Wiggle Sort II (LC 324).

## Key takeaways

- Partition around a pivot; quicksort recurses into both sides, quickselect into one.
- 3-way partitioning keeps the equal block out of the recursion, which handles duplicates.
- Pick the pivot at random: a fixed pivot makes sorted input O(n²).
- After swapping with the right end, don't advance `i`: the incoming value is unchecked.
- Quickselect finds the k-th element in expected O(n); sorting is O(n log n), a size-k heap O(n log k).

## Knowledge check

```quiz
? In 3-way partitioning, why doesn't `i` advance after swapping `a[i]` with `a[gt]`?
+ The value swapped in from the right end hasn't been examined yet
- Because `gt` already moved
! gt moving doesn't examine the new a[i].
- To keep the sort stable
! Quicksort isn't stable either way.
- It should advance; not advancing is a bug
! Advancing would skip an unchecked value.
> In the "<" case, the swapped-in value is known to equal the pivot, so i can advance.

? Why does a fixed last-element pivot make quicksort O(n²) on sorted input?
+ Every partition splits off just one element, so there are n levels of linear work
- Because sorted input has no duplicates
! Duplicates aren't the issue here.
- Because the pivot is always the median
! On sorted input the last element is the maximum, the worst pivot.
- It doesn't; sorted input is quicksort's best case
! That's insertion sort's best case.
> A random pivot makes such unbalanced splits vanishingly unlikely.

? Why is quickselect O(n) on average while quicksort is O(n log n)?
+ It recurses into only the side that contains the answer, so the work shrinks geometrically: n + n/2 + …
- Because it partitions only once
! It partitions repeatedly, on shrinking ranges.
- Because it skips the pivot
! Skipping one element per step doesn't change the order of growth.
- Because it uses a heap
! Quickselect uses partitioning, not a heap.
> Quicksort must process both sides at every level.

? Sort Colors in one pass: what do the regions [0, lt), [lt, i) and (gt, end] hold?
+ 0s, 1s and 2s respectively, with [i, gt] still unexamined
- 2s, 1s and 0s
! The 0s collect at the front.
- Unexamined values, 0s and 2s
! The unexamined region is in the middle, [i, gt].
- Sorted and unsorted halves
! There are three regions, one per colour.
> Writing that invariant first makes the three branches obvious.
```
