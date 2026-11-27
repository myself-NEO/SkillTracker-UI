## The idea

A sorted array rotated at an unknown point (`[4, 5, 6, 7, 0, 1, 2]`) isn't sorted, but **split it anywhere and at least one half is still sorted**. Check the target against the sorted half's range, then discard a half.

## When to use it

- "Search in a rotated sorted array."
- "Find the minimum" of a rotated sorted array, or **how many times it was rotated** (the index of the minimum).
- Any array that's sorted but shifted, where a plain binary search's comparisons don't hold everywhere.

## How it works

- **Which half is sorted?** If `nums[lo] <= nums[mid]`, the left half `[lo, mid]` is sorted (the rotation point isn't inside it); otherwise the right half `[mid, hi]` is.
- **Where can the target be?** If the target lies within the sorted half's range, search there; otherwise it must be in the other half.
- **The minimum** sits just after the drop. Compare `nums[mid]` with `nums[hi]`: if `nums[mid] > nums[hi]`, the drop is to the right of `mid`; otherwise `mid` is in the low run and may itself be the minimum. Comparing with `nums[lo]` can't tell an unrotated array from a rotated one.
- **Duplicates** can make `nums[lo] == nums[mid] == nums[hi]`, which gives no information at all, so the worst case degrades to O(n).

## Java template

```java
// LC 33: search in a rotated sorted array (distinct values).
public int searchRotated(int[] nums, int target) {
    int lo = 0, hi = nums.length - 1;
    while (lo <= hi) {
        int mid = lo + (hi - lo) / 2;
        if (nums[mid] == target) return mid;
        if (nums[lo] <= nums[mid]) {                         // the left half [lo, mid] is sorted
            if (nums[lo] <= target && target < nums[mid]) hi = mid - 1;
            else lo = mid + 1;
        } else {                                             // the right half [mid, hi] is sorted
            if (nums[mid] < target && target <= nums[hi]) lo = mid + 1;
            else hi = mid - 1;
        }
    }
    return -1;
}
```

## Worked examples

### Search in Rotated Sorted Array (LC 33)

The template above. A trace on `[4, 5, 6, 7, 0, 1, 2]`, target `0`:

```text
lo=0 hi=6 mid=3 (7)   left half [4..7] sorted; 0 not in [4, 7) -> lo = 4
lo=4 hi=6 mid=5 (1)   left half [0..1] sorted; 0 in [0, 1)     -> hi = 4
lo=4 hi=4 mid=4 (0)   found at index 4
```

### Find Minimum in Rotated Sorted Array (LC 153)

```java
// LC 153: the minimum of a rotated sorted array (distinct values).
public int findMin(int[] nums) {
    int lo = 0, hi = nums.length - 1;
    while (lo < hi) {
        int mid = lo + (hi - lo) / 2;
        if (nums[mid] > nums[hi]) lo = mid + 1;          // the drop is to the right of mid
        else hi = mid;                                   // mid is in the low run: it may be the min
    }
    return nums[lo];
}
```

The index of the minimum is also **the number of rotations**.

## Complexity

O(log n) time and O(1) space with distinct values. With duplicates, the worst case is O(n) (e.g. `[1, 1, 1, 1, 0, 1]`), because a step that can't tell the halves apart only removes one element.

## Variations

### Search in Rotated Sorted Array II (LC 81): duplicates allowed

```java
// LC 81: duplicates allowed. If nums[lo] == nums[mid] == nums[hi] we can't tell which half is
// sorted: shrink both ends by one. That makes the worst case O(n), e.g. [1, 1, 1, 1, 0, 1].
public boolean searchRotatedWithDuplicates(int[] nums, int target) {
    int lo = 0, hi = nums.length - 1;
    while (lo <= hi) {
        int mid = lo + (hi - lo) / 2;
        if (nums[mid] == target) return true;
        if (nums[lo] == nums[mid] && nums[mid] == nums[hi]) {
            lo++;
            hi--;
        } else if (nums[lo] <= nums[mid]) {
            if (nums[lo] <= target && target < nums[mid]) hi = mid - 1;
            else lo = mid + 1;
        } else {
            if (nums[mid] < target && target <= nums[hi]) lo = mid + 1;
            else hi = mid - 1;
        }
    }
    return false;
}
```

### The minimum with duplicates (LC 154)

```java
// LC 154: the minimum with duplicates. Equal values give no information: shrink hi by one.
public int findMinWithDuplicates(int[] nums) {
    int lo = 0, hi = nums.length - 1;
    while (lo < hi) {
        int mid = lo + (hi - lo) / 2;
        if (nums[mid] > nums[hi]) lo = mid + 1;
        else if (nums[mid] < nums[hi]) hi = mid;
        else hi--;                                  // nums[mid] == nums[hi]: can't tell; drop hi
    }
    return nums[lo];
}
```

Dropping `hi` is safe: `nums[mid]` has the same value and stays in range. Say that the worst case is O(n); interviewers ask.

## Common mistakes

- **Comparing with `nums[lo]` in `findMin`**, which can't tell an unrotated array from a rotated one; compare with `nums[hi]`.
- **`<` instead of `<=` in `nums[lo] <= nums[mid]`**: when `lo == mid`, the one-element left half is sorted, and `<` would misclassify it.
- **Half-open range checks in the wrong place**: the target test is `nums[lo] <= target < nums[mid]` on the left, `nums[mid] < target <= nums[hi]` on the right.
- **Claiming O(log n) with duplicates.** The all-equal case forces a linear worst case.

## Practice

Search in Rotated Sorted Array (LC 33), Find Minimum in Rotated Sorted Array (LC 153), Search in Rotated Sorted Array II (LC 81), Find Minimum in Rotated Sorted Array II (LC 154).

## Key takeaways

- In a rotated sorted array, at least one half of any split is sorted.
- `nums[lo] <= nums[mid]` means the left half is sorted; check the target against the sorted half's range.
- To find the minimum, compare `nums[mid]` with `nums[hi]`, not `nums[lo]`.
- The index of the minimum is the number of rotations.
- Duplicates can hide which half is sorted, making the worst case O(n).

## Knowledge check

```quiz
? Searching a rotated sorted array, `nums[lo] <= nums[mid]`. What do you know?
+ The left half [lo, mid] is sorted, so you can check whether the target lies in its range
- The right half is sorted
! The right half may contain the rotation point.
- The whole array is sorted
! Only the left half is guaranteed sorted.
- The target is in the left half
! Only a range check against the sorted half tells you that.
> One half is always sorted; this comparison tells you which.

? Why does findMin compare `nums[mid]` with `nums[hi]` rather than with `nums[lo]`?
+ Comparing with nums[lo] can't distinguish an unrotated array from a rotated one; nums[hi] always tells you which side the drop is on
- Because nums[hi] is always the minimum
! The minimum can be anywhere.
- To avoid an index out of bounds
! Both indexes are in range.
- It doesn't matter which end you compare with
! With nums[lo], a sorted array sends the search the wrong way.
> If nums[mid] > nums[hi], the drop is to the right of mid.

? `[4, 5, 6, 7, 0, 1, 2]`: how many times was the original sorted array rotated?
+ 4, the index of the minimum
- 3, the index of the maximum
! The rotation count is where the minimum ended up.
- 7, the array's length
! Rotating n times gives the original array back.
- 0, because it's still sorted in parts
! The minimum moved from index 0 to index 4.
> Find the minimum with binary search to get the count in O(log n).

? Why can rotated search with duplicates take O(n) time?
+ When nums[lo], nums[mid] and nums[hi] are equal, you can't tell which half is sorted, and can only drop one element
- Because duplicates must be removed first
! Nothing is removed in advance.
- Because the array must be rotated back
! The search never un-rotates the array.
- It doesn't; it's still O(log n)
! An array like [1, 1, 1, 1, 0, 1] forces a linear scan.
> State this worst case when asked about duplicates.
```
