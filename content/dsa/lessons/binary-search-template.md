## The idea

Most binary-search bugs come from mixing conventions: `<=` versus `<`, `hi = mid` versus `hi = mid - 1`. Learn **one** template, the **lower bound** (the first index where the condition `a[i] ≥ target` becomes true), and derive every variant from it.

## When to use it

- The data is **sorted** and you need to find a value, its **insertion point**, its **first or last occurrence**, **how many times** it occurs, or the nearest value below or above it.
- More generally, the answers to a yes/no question switch from false to true **once** as the index grows: see [binary search on a predicate](lesson:binary-search-on-predicates).
- A problem needs O(log n) per query on a sorted array, or many lookups on data you can sort once.

## How it works

- **The invariant:** everything left of `lo` is `< target`; everything at or right of `hi` is `≥ target`. So the answer is always in `[lo, hi]`, and when `lo == hi` it *is* the answer.
- **`hi = a.length`** (not `length - 1`) lets "insert at the end" be a valid answer.
- **Termination:** `mid < hi` always holds, so `hi = mid` shrinks the range, and so does `lo = mid + 1`. It can't loop forever.
- **`lo + (hi - lo) / 2`** avoids the overflow of `(lo + hi)` when both are near `Integer.MAX_VALUE`. `(lo + hi) >>> 1` is an equivalent trick.

## Java template

```java
// The first index i in [0, n] with a[i] >= target (n if there is none). The template to memorise.
public int lowerBound(int[] a, int target) {
    int lo = 0, hi = a.length;               // the answer always stays inside [lo, hi]
    while (lo < hi) {
        int mid = lo + (hi - lo) / 2;        // not (lo + hi) / 2: that can overflow
        if (a[mid] < target) lo = mid + 1;   // mid is too small: the answer is to its right
        else hi = mid;                       // mid could be the answer: keep it in range
    }
    return lo;                               // lo == hi
}

// The first index with a[i] > target: the same loop with '<=' in place of '<'.
public int upperBound(int[] a, int target) {
    int lo = 0, hi = a.length;
    while (lo < hi) {
        int mid = lo + (hi - lo) / 2;
        if (a[mid] <= target) lo = mid + 1;
        else hi = mid;
    }
    return lo;
}
```

## Worked examples

```java
// LC 34: first and last position of target.
public int[] searchRange(int[] nums, int target) {
    int first = lowerBound(nums, target);
    if (first == nums.length || nums[first] != target) return new int[] { -1, -1 };
    return new int[] { first, upperBound(nums, target) - 1 };
}

// LC 35: the insertion position IS the lower bound.
public int searchInsert(int[] nums, int target) {
    return lowerBound(nums, target);
}
```

LC 34 shows the pattern: find a *boundary* rather than "an equal element", and duplicates stop being a problem.

## Complexity

O(log n) time and O(1) space: every iteration halves `[lo, hi]`.

## Variations

### The family, all from one loop

| Want | Use |
|---|---|
| first index with `a[i] ≥ x` (insertion point) | `lowerBound(x)` |
| first index with `a[i] > x` | `upperBound(x)` |
| does `x` exist? | `lb < n && a[lb] == x` |
| first / last occurrence of `x` | `lowerBound(x)` / `upperBound(x) - 1` |
| how many times `x` occurs | `upperBound(x) - lowerBound(x)` |
| largest element `< x` | index `lowerBound(x) - 1` (if ≥ 0) |
| largest element `≤ x` (floor) | index `upperBound(x) - 1` (if ≥ 0) |

### Java's built-in searches

```java
static void javaSearchApi() {
    int[] sorted = { 1, 3, 3, 5, 8 };
    int found = Arrays.binarySearch(sorted, 5);              // 3
    int missing = Arrays.binarySearch(sorted, 4);            // -4 = -(insertion point 3) - 1
    int insertAt = -missing - 1;                             // 3
    // With duplicates, binarySearch returns ANY matching
    // index: use a lower bound for the first.

    TreeSet<Integer> set = new TreeSet<>(List.of(1, 3, 5, 8));
    Integer floor = set.floor(4);                            // 3   largest <= 4
    Integer ceiling = set.ceiling(4);                        // 5   smallest >= 4
    Integer higher = set.higher(8);                          // null: nothing > 8
}
```

Use the built-ins when they fit, but know their limits: `Arrays.binarySearch` returns *some* matching index (not the first) when there are duplicates, and it needs the exact array type. Write your own lower bound in interviews anyway: it shows you understand the invariant.

### The classic `lo <= hi` form

```java
public int binarySearch(int[] arr, int target) {
    int lo = 0, hi = arr.length - 1;
    while (lo <= hi) {
        int mid = lo + (hi - lo) / 2;     // NOT (lo+hi)/2 — avoids int overflow on large arrays
        if (arr[mid] == target) return mid;
        else if (arr[mid] < target) lo = mid + 1;
        else hi = mid - 1;
    }
    return -1;
}
```

It's fine for "does x exist, and where?", with an inclusive range `[lo, hi]` and both pointers moving past `mid`. It can't find boundaries among duplicates, so learn the lower bound as your one template and recognise this form when you see it.

## Common mistakes

- **Mixing conventions**: `while (lo <= hi)` with `hi = mid` loops forever. Pick one template and keep all its parts together.
- **`(lo + hi) / 2` overflow** on very large ranges.
- **`hi = length - 1` in a lower bound**, which makes "insert at the end" impossible.
- **Searching for "equal" when the question needs a boundary**: with duplicates, an `==` search returns an arbitrary match.
- **Forgetting the existence check**: the lower bound is an insertion point; check `lb < n && a[lb] == x` before using it as a match.

## Practice

Binary Search (LC 704), Search Insert Position (LC 35), Find First and Last Position of Element in Sorted Array (LC 34), First Bad Version (LC 278), Find Smallest Letter Greater Than Target (LC 744).

## Key takeaways

- Memorise one template: the lower bound, with `[lo, hi)`, `while (lo < hi)`, `lo = mid + 1` or `hi = mid`.
- The invariant: left of `lo` is too small, `hi` onward is big enough; when they meet, that's the answer.
- Upper bound is the same loop with `<=`; first/last occurrence and counts follow from the two.
- Compute `mid` as `lo + (hi − lo) / 2` to avoid overflow.
- `Arrays.binarySearch` returns any match among duplicates; write your own bound when you need the first.

## Knowledge check

```quiz
? Why does `lowerBound` start with `hi = a.length` rather than `a.length - 1`?
+ So that inserting after every element (index n) is a possible answer
- To avoid an ArrayIndexOutOfBoundsException
! mid never reaches hi, so either choice stays in bounds.
- Because arrays are 1-based in the template
! Java arrays are 0-based.
- To make the loop run one extra time
! The extra slot is a valid answer, not an extra iteration.
> The answer lies in [0, n], so the search range must include n.

? A loop uses `while (lo <= hi)` with `hi = mid`. What can go wrong?
+ When lo == hi, mid == hi, and `hi = mid` makes no progress: an infinite loop
- It returns the last occurrence instead of the first
! The bigger problem is that it may never return.
- It overflows
! Overflow comes from (lo + hi) / 2, not the loop condition.
- Nothing; it's equivalent to the template
! The template pairs `lo < hi` with `hi = mid`.
> Keep each template's condition and updates together.

? How do you count how many times x appears in a sorted array in O(log n)?
+ `upperBound(x) − lowerBound(x)`
- Find x with Arrays.binarySearch and scan left and right
! Scanning is O(n) when x repeats many times.
- `lowerBound(x) − upperBound(x)`
! That's negative or zero.
- `upperBound(x) − lowerBound(x) + 1`
! The upper bound is already one past the last x.
> The two bounds bracket the run of x exactly.

? `Arrays.binarySearch(new int[] {1, 3, 3, 3, 5}, 3)` returns which index?
+ Any index holding 3: the method doesn't promise the first one
- Always 1, the first occurrence
! The documentation makes no such promise.
- Always 3, the last occurrence
! It's not guaranteed to be the last either.
- −1, because 3 appears more than once
! It finds a match; it just doesn't say which.
> Use a lower bound for the first occurrence.
```
