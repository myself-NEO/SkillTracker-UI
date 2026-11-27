## What it is

**The problem it solves:** you have an array and need to answer **range queries** (the sum, min, max or gcd over `[left, right]`) *and* support **point updates**, both efficiently. A [prefix-sum array](lesson:prefix-sums) answers range sums in O(1), but breaks the moment a value changes: an update forces every later prefix to be recomputed, O(n). A **segment tree** answers **both in O(log n)**, for any associative operation.

**The idea:** a binary tree over the array in which every node stores the aggregate of a contiguous range. Leaves hold single elements; each internal node combines its two children's ranges.

```text
Array: [1, 3, 5, 7, 9, 11]     (range sum example)

                    [0,5]=36
                   /          \
             [0,2]=9         [3,5]=27
             /     \          /     \
        [0,1]=4  [2,2]=5  [3,4]=16 [5,5]=11
        /   \               /   \
    [0,0]=1 [1,1]=3     [3,3]=7 [4,4]=9
```

## How it works

The tree is stored in an array, heap-style: the root is node 1, and node `i` has children `2i` and `2i + 1`. A range query starts at the root and meets three cases at each node:

- **No overlap** with the query range: contribute nothing (the identity of the operation).
- **Total overlap**: return the node's stored aggregate, without going further down.
- **Partial overlap**: ask both children and combine their answers.

**Why a query is O(log n):** on each level, at most two nodes can partially overlap the query range (the ones containing its two ends); every other node is either fully inside or fully outside and is resolved in O(1). A point update changes one leaf, then recomputes each ancestor on the way back up: one node per level.

**Why 4n slots:** the tree has ⌈log₂ n⌉ + 1 levels, and when n isn't a power of two, the heap layout can leave gaps. 4n is a safe upper bound on the largest index used.

## Build it from scratch

```java
class SegmentTree {
    private final int[] tree;
    private final int n;

    public SegmentTree(int[] arr) {
        n = arr.length;
        tree = new int[4 * n];      // 4n is a safe standard upper bound on nodes needed
        build(arr, 1, 0, n - 1);
    }

    private void build(int[] arr, int node, int start, int end) {
        if (start == end) { tree[node] = arr[start]; return; }
        int mid = (start + end) / 2;
        build(arr, 2 * node, start, mid);
        build(arr, 2 * node + 1, mid + 1, end);
        tree[node] = tree[2 * node] + tree[2 * node + 1];   // swap + for Math.min/max as needed
    }

    public void update(int idx, int val) { update(1, 0, n - 1, idx, val); }

    private void update(int node, int start, int end, int idx, int val) {
        if (start == end) { tree[node] = val; return; }
        int mid = (start + end) / 2;
        if (idx <= mid) update(2 * node, start, mid, idx, val);
        else update(2 * node + 1, mid + 1, end, idx, val);
        tree[node] = tree[2 * node] + tree[2 * node + 1];   // recompute on the way back up
    }

    public int query(int l, int r) { return query(1, 0, n - 1, l, r); }

    private int query(int node, int start, int end, int l, int r) {
        if (r < start || end < l) return 0;                 // no overlap
        if (l <= start && end <= r) return tree[node];        // total overlap
        int mid = (start + end) / 2;                          // partial overlap
        return query(2 * node, start, mid, l, r) + query(2 * node + 1, mid + 1, end, l, r);
    }
}
```

Some versions root the tree at index 0, with children `2i + 1` and `2i + 2`. Either works, as long as one convention is used throughout.

## Java API

The JDK has no segment tree; you write it yourself. Its `update` **sets** a value, which matches Range Sum Query - Mutable (LC 307) directly: no difference to compute, unlike a [Fenwick tree](lesson:fenwick-tree).

## Operations and complexity

| Operation | Time |
|---|---|
| Build | O(n) |
| Point update | O(log n) |
| Range query | O(log n) |
| Range update | O(log n), with [lazy propagation](lesson:lazy-propagation) |
| Space | up to 4n |

## Patterns

### Range minimum, maximum or gcd

**Swap `+` for `Math.min`, `Math.max` or `gcd`**, and the same skeleton answers range-minimum, range-maximum or range-gcd queries: only the combine step changes. A plain Fenwick tree can't do this, because it relies on undoing (subtracting) a prefix. One more line changes: the no-overlap case must return the **identity** of the new operation, a value that never affects the result:

| Operation | Combine | No-overlap value |
|---|---|---|
| Sum | `a + b` | `0` |
| Minimum | `Math.min(a, b)` | `Integer.MAX_VALUE` |
| Maximum | `Math.max(a, b)` | `Integer.MIN_VALUE` |
| GCD | `gcd(a, b)` | `0` |

### Richer nodes: the maximum subarray sum in a range

A node can store several values, as long as two neighbouring nodes can be combined. For "the largest subarray sum inside `[l, r]`", each node keeps its total, its best prefix, its best suffix and its best subarray:

```java
record Info(long sum, long prefix, long suffix, long best) {}

static Info merge(Info a, Info b) {     // a is the left neighbour of b
    return new Info(
        a.sum() + b.sum(),
        Math.max(a.prefix(), a.sum() + b.prefix()),
        Math.max(b.suffix(), b.sum() + a.suffix()),
        Math.max(Math.max(a.best(), b.best()), a.suffix() + b.prefix()));
}
// a leaf holding v is new Info(v, v, v, v)
```

The best subarray either lies in one half or crosses the middle, as a suffix of the left half plus a prefix of the right: the same split as [Kadane's](lesson:maximum-subarray) divide-and-conquer form.

### Walking down the tree

To find "the first index whose prefix sum reaches k", or "the first element ≥ x", don't binary-search over queries (O(log² n)). Descend from the root instead, choosing the left child whenever it alone can satisfy the condition: O(log n). Booking Concert Tickets in Groups (LC 2286) uses exactly this.

## Common mistakes

- **Allocating 2n slots instead of 4n**, which runs out of bounds when n isn't a power of two.
- **The wrong no-overlap value**: returning 0 from a range-minimum query makes every minimum 0.
- **Mixing the 0-rooted and 1-rooted child formulas** (`2i + 1` versus `2i`).
- **Forgetting to recompute the parent** after updating a child.
- **Recursing into the children on total overlap**, which still gives the right answer but makes the query O(n).

## Key takeaways

- Every node stores the aggregate of a contiguous range; leaves are single elements.
- Queries combine O(log n) nodes: no overlap returns the identity, total overlap returns the node, partial overlap recurses.
- A point update recomputes one node per level: O(log n).
- Change the combine step and the identity to get min, max or gcd; store several values per node for richer queries.
- Allocate 4n slots, and use one indexing convention throughout.

## Knowledge check

```quiz
? A range-minimum segment tree's query hits a node with no overlap. What should it return?
+ Integer.MAX_VALUE, the identity of min
- 0
! 0 would become the minimum of every range containing such a node.
- Integer.MIN_VALUE
! That's the identity of max; min would always pick it.
- The node's stored value
! That node is outside the query range.
> The no-overlap value must never affect the result.

? Why is a segment tree usually allocated 4n slots?
+ With n not a power of two, the heap layout leaves gaps, and 4n safely bounds the largest index used
- Because each node stores four values
! Each node stores one aggregate here.
- To leave room for future insertions
! A segment tree's size is fixed by n.
- 2n is always enough
! It can run out of bounds when n isn't a power of two.
> The tree has ⌈log₂ n⌉ + 1 levels.

? Why does a range query touch only O(log n) nodes?
+ On each level, at most two nodes partially overlap the range; every other node is resolved immediately
- Because the tree is a binary search tree
! It's ordered by position, not searched by value.
- Because the query stops at the first leaf
! It may combine several nodes.
- Because it caches earlier answers
! Nothing is cached.
> The two partial nodes are the ones that contain the range's ends.

? What does a point update cost, and why?
+ O(log n): it changes one leaf and recomputes each ancestor on the way back up
- O(1): only the leaf changes
! Every ancestor's aggregate includes the leaf.
- O(n): the whole tree is rebuilt
! Only the leaf's ancestors change.
- O(log² n)
! There's one node per level.
> One node per level, on the path from the root to the leaf.
```
