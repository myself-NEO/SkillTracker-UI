## What it is

Two structures for the same family of range-query problems as [Fenwick](lesson:fenwick-tree) and [segment](lesson:segment-tree) trees, each the right tool in its own corner. Interviewers, especially in follow-up questions, expect you to know when each one fits.

- A **sparse table** answers range min, max or gcd on an array that **never changes**, in **O(1)** per query after an O(n log n) build.
- **Sqrt decomposition** splits the array into blocks of about √n elements. It's the "good enough, simpler to write" option: O(√n) per query, and flexible enough for operations the other structures handle awkwardly.

## How it works

**Sparse table.** Precompute the min (or max, gcd, bitwise and or or: anything **idempotent**, meaning `f(x, x) = x`) of every range whose length is a power of two. Any range `[l, r]` is then covered by **two** power-of-two ranges of the same length, one starting at `l` and one ending at `r`. They may overlap, and for idempotent operations that's harmless: `min` doesn't care if an element is counted twice. For sums it would double-count the overlap, which is why a sparse table can't do sums in O(1).

**Sqrt decomposition.** Keep one aggregate per block. A range query reads the whole blocks inside the range directly, and walks the at most two partial blocks at its ends element by element: O(√n) blocks plus O(√n) elements. A point update changes one element and its block's aggregate.

## Build it from scratch

### Sparse table

```java
class SparseTable {
    private final int[][] table;   // table[k][i] = min of the 2^k elements starting at i
    private final int[] log;

    public SparseTable(int[] arr) {
        int n = arr.length;
        log = new int[n + 1];
        for (int i = 2; i <= n; i++) log[i] = log[i / 2] + 1;

        int maxK = log[n] + 1;
        table = new int[maxK][n];
        table[0] = arr.clone();
        for (int k = 1; k < maxK; k++) {
            for (int i = 0; i + (1 << k) <= n; i++) {
                table[k][i] = Math.min(table[k-1][i], table[k-1][i + (1 << (k-1))]);
            }
        }
    }

    public int queryMin(int l, int r) {           // inclusive, O(1)
        int k = log[r - l + 1];
        return Math.min(table[k][l], table[k][r - (1 << k) + 1]);
    }
}
```

The `log` table gives ⌊log₂ len⌋ exactly. `31 - Integer.numberOfLeadingZeros(len)` does the same in O(1); avoid `Math.log`, whose floating-point rounding can be off by one at exact powers of two.

### Sqrt decomposition

```java
class SqrtDecomposition {
    private final int[] arr, blockSum;
    private final int blockSize;

    public SqrtDecomposition(int[] arr) {
        this.arr = arr.clone();
        int n = arr.length;
        blockSize = (int) Math.sqrt(n) + 1;
        blockSum = new int[blockSize + 1];
        for (int i = 0; i < n; i++) blockSum[i / blockSize] += arr[i];
    }

    public void update(int idx, int val) {
        blockSum[idx / blockSize] += val - arr[idx];
        arr[idx] = val;
    }

    public int query(int l, int r) {               // sum [l, r] inclusive
        int startBlock = l / blockSize, endBlock = r / blockSize, sum = 0;
        if (startBlock == endBlock) {
            for (int i = l; i <= r; i++) sum += arr[i];
        } else {
            for (int i = l; i < (startBlock + 1) * blockSize; i++) sum += arr[i];
            for (int b = startBlock + 1; b < endBlock; b++) sum += blockSum[b];
            for (int i = endBlock * blockSize; i <= r; i++) sum += arr[i];
        }
        return sum;
    }
}
```

## Java API

The JDK has neither structure; you write both yourself. They're short enough to write from memory, which is part of their appeal.

## Operations and complexity

| | Sparse table | Sqrt decomposition |
|---|---|---|
| Build | O(n log n) | O(n) |
| Range query | **O(1)** (min, max, gcd) | O(√n) |
| Point update | not supported: rebuild in O(n log n) | O(1) |
| Range update | not supported | O(√n), with a pending value per block |
| Space | O(n log n) | O(n) |
| Operations | idempotent only | anything you can maintain per block |

The sparse table is unbeatable for a static array with many queries, which is why it's worth knowing apart from "just use a segment tree for everything". Sqrt decomposition is asymptotically worse than a Fenwick or segment tree, but it's much easier to get right from memory under time pressure, and for many practical values of n the constant factors matter more than the difference.

## Patterns

- **Range minimum queries on a static array** (RMQ): the sparse table's home ground.
- **Lowest common ancestors in O(1):** record a tree's Euler tour (every node each time the DFS passes through it) with depths. The [LCA](lesson:tree-paths-and-lca) of `u` and `v` is the shallowest node between their first visits: a range-minimum query. Binary lifting uses the same powers-of-two idea on ancestors.
- **Range updates with sqrt decomposition:** keep a pending add per block, in the same spirit as [lazy propagation](lesson:lazy-propagation) but coarser. Whole blocks get the pending value; partial blocks are updated element by element.
- **Operations the trees handle awkwardly:** range assignment, or "the most frequent element in a range", with extra per-block bookkeeping.
- **Mo's algorithm** answers offline queries such as "how many distinct values are in `[l, r]`?": sort the queries by the block of `l`, then by `r`, and move two pointers, adding or removing one element at a time. That's O((n + q)√n) in total.

## Common mistakes

- **Using a sparse table for sums**: the two overlapping blocks double-count.
- **Updating a sparse table in place**: every block containing the element would change; it's for static data.
- **Computing the logarithm with `Math.log`**, whose rounding can be off by one: use a table or `Integer.numberOfLeadingZeros`.
- **Off-by-one errors in the partial-block loops**, especially when `l` and `r` fall in the same block.
- **A block size far from √n**: blocks that are too small or too large make one of the two loops long.

## Key takeaways

- A sparse table stores the answers for every power-of-two range: O(n log n) to build, O(1) per query.
- It needs a static array and an idempotent operation (min, max, gcd), because its two blocks overlap.
- Sqrt decomposition splits the array into about √n blocks of about √n elements: O(√n) per query, O(1) per point update.
- It's the simple, flexible fallback: per-block pending values, assignment, and Mo's algorithm for offline queries.
- Choose by whether the data changes, and by which operation you need.

## Knowledge check

```quiz
? Why can a sparse table answer range minimums in O(1), but not range sums?
+ Its two covering blocks may overlap, which is harmless for min but double-counts a sum
- Because sums need more memory
! Memory isn't the issue.
- Because the table only stores minimums
! You could store sums; combining overlapping blocks is the problem.
- It can answer both in O(1)
! Overlap corrupts sums.
> Idempotent operations ignore duplicates.

? Which two power-of-two ranges does the sparse table use for the query [2, 10]?
+ [2, 9] and [3, 10], both of length 8
- [2, 9] and [10, 10]
! Both blocks have the same length, 2^⌊log₂ 9⌋ = 8.
- [2, 5] and [6, 10]
! Lengths 4 and 5; the second isn't a power of two.
- [0, 15]
! That covers elements outside the range.
> One block starts at l, the other ends at r.

? With n = 10⁶, roughly how much work does a sqrt-decomposition range query do?
+ A few thousand steps: about 1,000 whole blocks plus up to two partial blocks of about 1,000 elements
- About 20 steps, like a Fenwick tree
! That's O(log n); sqrt decomposition is O(√n).
- One step
! Only a sparse table answers in O(1).
- A million steps
! Whole blocks are read in one step each.
> O(√n) with small constants.

? An element of a static array changes after a sparse table is built. What does it cost to stay correct?
+ At least O(n): about 2n stored ranges include the element, so in practice you rebuild in O(n log n)
- O(1): change one entry
! Every power-of-two range containing the element changes.
- O(log n): one entry per level
! On each level, up to 2ᵏ ranges contain the element.
- Nothing; queries stay correct
! Stored minimums would be stale.
> Use a segment tree when the data changes.
```
