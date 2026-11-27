## The idea

A sorted matrix can be searched three ways, depending on *how* it's sorted:
- **Rows chain into one sorted list** (each row starts after the previous one ends): treat it as a 1-D array and binary search the flat index.
- **Rows and columns sorted separately:** walk a **staircase** from a corner, discarding a whole row or column per step.
- **The k-th smallest value:** binary search on the **value**, counting how many entries are ≤ it.

The same idea, binary search over sorted data, also hides inside data structures such as `TreeMap` and per-key timelines.

## When to use it

- "Search a 2D matrix" in any of its versions.
- "The k-th smallest element" of a matrix with sorted rows and columns, or of a multiplication table.
- Per-key histories that are appended in time order, such as a time-based key-value store.

## How it works

- **Flat index:** with `n` columns, flat index `k` is cell `(k / n, k % n)`, so the whole matrix is one sorted array of `m · n` elements.
- **Staircase:** at the top-right corner, the row increases to the left and the column increases downwards. If the corner is bigger than the target, its whole column below is bigger too, so drop the column; if it's smaller, its whole row to the left is smaller, so drop the row. Start at a corner where one direction increases and the other decreases: top-right or bottom-left.
- **Value search:** the number of entries ≤ v is monotonic in v. The first v whose count reaches k is the k-th smallest, and it's always an element of the matrix.

## Java template

```java
// LC 74: each row sorted, and each row starts after the previous one ends = one sorted array.
public boolean searchMatrix(int[][] matrix, int target) {
    int m = matrix.length, n = matrix[0].length;
    int lo = 0, hi = m * n - 1;
    while (lo <= hi) {
        int mid = lo + (hi - lo) / 2;
        int v = matrix[mid / n][mid % n];                    // flat index -> (row, column)
        if (v == target) return true;
        if (v < target) lo = mid + 1;
        else hi = mid - 1;
    }
    return false;
}
```

## Worked examples

### Search a 2D Matrix II (LC 240): the staircase

```java
// LC 240: rows and columns sorted independently. From the top-right corner every step
// discards a whole row or a whole column: O(m + n).
public boolean searchMatrixII(int[][] matrix, int target) {
    int r = 0, c = matrix[0].length - 1;
    while (r < matrix.length && c >= 0) {
        int v = matrix[r][c];
        if (v == target) return true;
        if (v > target) c--;                            // everything below in this column is bigger
        else r++;                                       // everything left in this row is smaller
    }
    return false;
}
```

### Kth Smallest Element in a Sorted Matrix (LC 378): search the value

```java
// LC 378: k-th smallest in an n x n matrix with sorted
// rows and columns: binary search on the VALUE.
public int kthSmallest(int[][] matrix, int k) {
    int n = matrix.length;
    return (int) firstTrue(matrix[0][0], matrix[n - 1][n - 1], v -> countAtMost(matrix, v) >= k);
}

private int countAtMost(int[][] matrix, long v) {           // staircase from the bottom-left: O(n)
    int n = matrix.length, count = 0, r = n - 1, c = 0;
    while (r >= 0 && c < n) {
        if (matrix[r][c] <= v) {
            count += r + 1;                                  // this column, rows 0..r, are all <= v
            c++;
        } else {
            r--;
        }
    }
    return count;
}
```

`firstTrue` is the predicate search from [binary search on a predicate](lesson:binary-search-on-predicates).

## Complexity

| Search | Time | Space |
|---|---|---|
| LC 74, flat index | O(log(m · n)) | O(1) |
| LC 240, staircase | O(m + n) | O(1) |
| LC 240, binary search in each row | O(m log n) | O(1) |
| LC 378, value search + staircase count | O(n log(max − min)) | O(1) |
| LC 378, heap of row frontiers | O(k log n) | O(n) |

## Variations

### Time Based Key-Value Store (LC 981)

`get(key, t)` returns the value set at the latest time ≤ `t`. Timestamps arrive in increasing order, so each key's list is already sorted: binary search it.

```java
// LC 981: set(key, value, timestamp) with increasing
// timestamps; get = the latest value at or before t.
class TimeMap {
    private final Map<String, List<Integer>> times = new HashMap<>();
    private final Map<String, List<String>> values = new HashMap<>();

    public void set(String key, String value, int timestamp) {
        // appended in sorted order
        times.computeIfAbsent(key, k -> new ArrayList<>()).add(timestamp);
        values.computeIfAbsent(key, k -> new ArrayList<>()).add(value);
    }

    public String get(String key, int timestamp) {
        List<Integer> ts = times.get(key);
        if (ts == null) return "";
        int lo = 0, hi = ts.size();                  // first index with time > timestamp
        while (lo < hi) {
            int mid = (lo + hi) >>> 1;
            if (ts.get(mid) <= timestamp) lo = mid + 1;
            else hi = mid;
        }
        return (lo == 0) ? "" : values.get(key).get(lo - 1);   // the one just before it
    }
}
```

The `TreeMap` version is shorter: a `TreeMap<Integer, String>` per key with `floorEntry(t)`, which also works when timestamps arrive out of order, at O(log n) per insert. Mention both: the list version shows you can write the search yourself, and the `TreeMap` version is what you'd ship.

### Binary search inside other structures

- `TreeMap`/`TreeSet` are red-black trees: `floor`, `ceiling` and `subMap` are binary searches.
- **Longest Increasing Subsequence** in O(n log n) binary searches a "tails" array: see [sequence DP](lesson:sequence-dp).
- **The k-th smallest of a sorted matrix with a heap** keeps one frontier per row: see [k-way merge](lesson:k-way-merge).
- Databases' B-tree indexes are binary search spread over disk pages.

## Common mistakes

- **Binary searching every row** of an LC 240 matrix, O(m log n), when the staircase is O(m + n).
- **Starting the staircase at the top-left or bottom-right**, where both directions increase (or decrease) and a comparison can't discard anything.
- **Mixing up rows and columns** in the flat index: divide and take the remainder by the number of *columns*.
- **Overflow in `m * n`** for very large matrices; use `long` if the product can exceed the `int` range.
- **Returning a value that isn't in the matrix** from a value search: search for the *first* value whose count reaches k.

## Practice

Search a 2D Matrix (LC 74), Search a 2D Matrix II (LC 240), Count Negative Numbers in a Sorted Matrix (LC 1351), Kth Smallest Element in a Sorted Matrix (LC 378), Kth Smallest Number in Multiplication Table (LC 668), Time Based Key-Value Store (LC 981).

## Key takeaways

- If the rows chain into one sorted list, binary search the flat index: cell `(k / n, k % n)`.
- If rows and columns are sorted separately, walk a staircase from the top-right or bottom-left: O(m + n).
- For the k-th smallest, binary search on the value and count the entries ≤ it.
- The first value whose count reaches k is always in the matrix.
- Per-key timelines appended in order are sorted lists; `TreeMap.floorEntry` does the same search for you.

## Knowledge check

```quiz
? In LC 74, the matrix has 4 columns. Which cell is flat index 9?
+ Row 2, column 1: (9 / 4, 9 % 4)
- Row 1, column 2
! Divide by the number of columns, not rows.
- Row 2, column 2
! 9 % 4 is 1.
- Row 3, column 1
! 9 / 4 is 2 in integer division.
> Row = k / columns, column = k % columns.

? Why start the LC 240 staircase at the top-right corner rather than the top-left?
+ At the top-right, moving left decreases and moving down increases, so each comparison rules out a row or a column
- Because the target is usually in the top-right
! The target can be anywhere.
- Because the top-left is the minimum
! It is, but that's why both directions increase from it, and no comparison can discard anything.
- It doesn't matter which corner
! Only the top-right and bottom-left corners work.
> The bottom-left corner works for the same reason.

? Binary searching on the value for LC 378, why is the answer guaranteed to be an element of the matrix?
+ The search finds the smallest v with count ≥ k, and the count only rises at values that occur in the matrix
- Because the search range is the matrix's elements
! The range is every integer from min to max.
- Because the matrix is square
! Shape isn't the reason.
- It isn't; you must round to the nearest element
! The first value reaching the count is always present.
> Any smaller value would have a smaller count.

? TimeMap.get uses an upper bound on the timestamps, then takes the index before it. Why?
+ The upper bound is the first time after t, so the one before it is the latest time at or before t
- To skip duplicate timestamps
! Timestamps are strictly increasing.
- Because the list is in descending order
! It's appended in increasing order.
- To return the earliest value
! The question asks for the latest value at or before t.
> lo == 0 means nothing was set at or before t.
```
