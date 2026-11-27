## The idea

Split the array in half, sort each half recursively, and **merge** the two sorted halves in linear time.

## When to use it

- You need a sort that's **O(n log n) in the worst case** and **stable**.
- The data is a **linked list**, where merging needs no extra buffer (see [merging and splitting lists](lesson:merging-and-splitting-lists)).
- The data is **bigger than memory**: sort chunks that fit, then k-way merge them (external sorting).
- You need to **count pairs across positions**: inversions, reverse pairs, "how many smaller elements come after me". Merge sort counts them while it merges.

## How it works

- **Divide and conquer.** There are log n levels of halving, and each level does O(n) merging work, so the total is O(n log n) whatever the input.
- **Merging** walks both sorted halves with one pointer each and repeatedly takes the smaller front element.
- **Stability:** on a tie, take from the left half first, so equal keys keep their original order.
- **One buffer.** Merging needs O(n) scratch space; allocate it once for the whole sort, not in every call.
- **The sorted-halves shortcut.** If the last element of the left half is ≤ the first of the right half, the halves are already in order and the merge can be skipped. That makes already sorted input O(n); TimSort generalises this by detecting natural runs.

## Java template

```java
public void mergeSort(int[] a) {
    int[] tmp = new int[a.length];               // one buffer for the whole sort
    mergeSort(a, tmp, 0, a.length - 1);
}

private void mergeSort(int[] a, int[] tmp, int lo, int hi) {
    if (lo >= hi) return;
    int mid = lo + (hi - lo) / 2;
    mergeSort(a, tmp, lo, mid);
    mergeSort(a, tmp, mid + 1, hi);
    if (a[mid] <= a[mid + 1]) return;            // halves already in order: skip the merge
    merge(a, tmp, lo, mid, hi);
}

private void merge(int[] a, int[] tmp, int lo, int mid, int hi) {
    System.arraycopy(a, lo, tmp, lo, hi - lo + 1);
    int i = lo, j = mid + 1;
    for (int k = lo; k <= hi; k++) {
        if (i > mid) a[k] = tmp[j++];            // left run used up
        else if (j > hi) a[k] = tmp[i++];        // right run used up
        // strict '<': equal keys keep their order (stable)
        else if (tmp[j] < tmp[i]) a[k] = tmp[j++];
        else a[k] = tmp[i++];
    }
}
```

## Worked examples

### Counting inversions

During a merge, both halves are sorted, so when an element from the right half is placed before the remaining left elements, it's smaller than **all of them at once**. That turns O(n²) pair counting into O(n log n):

```java
// Pairs i < j with a[i] > a[j]: count them while merging. O(n log n) instead of O(n^2).
public long countInversions(int[] a) {
    return sortAndCount(a.clone(), new int[a.length], 0, a.length - 1);
}

private long sortAndCount(int[] a, int[] tmp, int lo, int hi) {
    if (lo >= hi) return 0;
    int mid = lo + (hi - lo) / 2;
    long count = sortAndCount(a, tmp, lo, mid) + sortAndCount(a, tmp, mid + 1, hi);
    System.arraycopy(a, lo, tmp, lo, hi - lo + 1);
    int i = lo, j = mid + 1;
    for (int k = lo; k <= hi; k++) {
        if (i > mid) a[k] = tmp[j++];
        else if (j > hi) a[k] = tmp[i++];
        else if (tmp[j] < tmp[i]) {
            count += mid - i + 1;       // tmp[j] is smaller than EVERY element left in the left run
            a[k] = tmp[j++];
        } else a[k] = tmp[i++];
    }
    return count;
}
```

The **inversion count** measures how unsorted an array is: it equals the number of swaps bubble sort would make.

### Reverse Pairs (LC 493)

Pairs `i < j` with `nums[i] > 2 * nums[j]`. The condition isn't the merge order, so count with two pointers over the two sorted halves first, then merge:

```java
// LC 493: pairs i < j with nums[i] > 2 * nums[j]. Count with two pointers, then merge.
public int reversePairs(int[] nums) {
    return (int) reversePairs(nums.clone(), new int[nums.length], 0, nums.length - 1);
}

private long reversePairs(int[] a, int[] tmp, int lo, int hi) {
    if (lo >= hi) return 0;
    int mid = lo + (hi - lo) / 2;
    long count = reversePairs(a, tmp, lo, mid) + reversePairs(a, tmp, mid + 1, hi);
    for (int i = lo, j = mid + 1; i <= mid; i++) {          // both halves are sorted now
        while (j <= hi && (long) a[i] > 2L * a[j]) j++;     // long: 2 * a[j] can overflow int
        count += j - (mid + 1);
    }
    merge(a, tmp, lo, mid, hi);
    return count;
}
```

## Complexity

- **Time:** O(n log n) always: log n levels, O(n) merging per level. O(n) on already sorted input, thanks to the shortcut.
- **Space:** O(n) for the buffer, plus O(log n) recursion stack.
- **Stable:** yes.

## Variations

- **Count of Smaller Numbers After Self (LC 315):** sort indexes instead of values, and add, for each left element, how many right elements were placed before it.
- **Count of Range Sum (LC 327):** merge sort on prefix sums, counting with two pointers before each merge.
- **Bottom-up merge sort:** merge runs of size 1, 2, 4, … with a loop instead of recursion; it's the O(1)-extra-space way to sort a linked list.
- **External sorting:** sort memory-sized chunks, write them out, then [k-way merge](lesson:k-way-merge) them.
- **Merge Sorted Array (LC 88):** a single merge, filled from the back so nothing is overwritten.

## Common mistakes

- **Allocating a new buffer in every call**, which multiplies the allocation work. Allocate once.
- **Breaking stability** by taking from the right half on ties.
- **`(lo + hi) / 2` overflowing** for very large indexes; use `lo + (hi - lo) / 2`.
- **`int` overflow in counts and products**: inversion counts can exceed `int`, and `2 * a[j]` overflows; use `long`.
- **Counting after merging** in Reverse Pairs, when the counting needs both halves still separate.

## Practice

Sort an Array (LC 912), Merge Sorted Array (LC 88), Sort List (LC 148), Reverse Pairs (LC 493), Count of Smaller Numbers After Self (LC 315), Count of Range Sum (LC 327).

## Key takeaways

- Merge sort is O(n log n) in every case and stable, at the cost of an O(n) buffer.
- Take ties from the left half to keep it stable, and allocate the buffer once.
- Skipping the merge when the halves are already in order makes sorted input O(n).
- While merging, a right-half element placed early is smaller than every remaining left element: that counts pairs in O(n log n).
- It's the natural sort for linked lists and for data bigger than memory.

## Knowledge check

```quiz
? Why is merge sort O(n log n) even in the worst case?
+ Halving gives log n levels, and each level merges all n elements in linear time
- Because it picks a good pivot
! Merge sort has no pivot; it always splits in the middle.
- Because the input is sorted first
! It's what does the sorting.
- It isn't; its worst case is O(n²)
! That's quicksort's worst case.
> The split doesn't depend on the values, so no input is bad for it.

? What makes the merge stable?
+ On a tie, it takes the element from the left half first
- It uses a buffer
! The buffer is needed either way; the tie rule gives stability.
- It compares with <= throughout
! The comparison that picks the right element must be strict.
- It recurses on the left half first
! Recursion order doesn't decide ties.
> Equal keys therefore keep their original order.

? While merging, the next element taken comes from the right half, and 3 elements remain in the left half. How many inversions does that step add?
+ 3, because the right element is smaller than every remaining left element
- 1
! It's smaller than all of them at once.
- 0, inversions are only counted at the end
! They're counted during each merge.
- It depends on their values
! Both halves are sorted, so all remaining left elements are larger.
> That's what turns O(n²) counting into O(n log n).

? Why does the template allocate `tmp` once, in the public method?
+ Allocating a buffer in every recursive call would add O(n log n) allocation work and garbage
- Because recursion can't allocate arrays
! It can; it's just wasteful.
- To make the sort stable
! Stability comes from the tie rule.
- Because the buffer must hold the sorted output
! The output goes back into `a`; tmp is scratch space.
> One shared buffer keeps the extra space at O(n).
```
