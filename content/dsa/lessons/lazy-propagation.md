## The idea

A plain [segment tree](lesson:segment-tree) handles point updates. A **range** update ("add 5 to every element of `[l, r]`") would touch every leaf in the range: O(n). **Lazy propagation** keeps it at O(log n): when an update fully covers a node's range, update that node's aggregate, leave a note (a **lazy tag**) saying its children still owe the update, and stop. The note is handed down only when some later operation actually needs to visit the children.

## When to use it

- **Range updates and range queries together**: range add with range sum, range add with range min or max, range assignment.
- If you only need range add with range **sums**, the [two-Fenwick-tree trick](lesson:fenwick-tree) is less code. With min or max, lazy propagation is the general answer.
- If you only need the **final** array after all the updates, a [difference array](lesson:prefix-sums) is enough.

## How it works

Read `lazy[node] = v` as: *"this node's own aggregate already includes the add of v, but its children don't yet."*

- **Applying** an add to a node updates its aggregate (for a sum, by `(end − start + 1) · v`, one v per element) and adds `v` to its tag.
- **Pushing** hands the tag to both children (applying it to each) and clears it. Do it before going down into the children, whether to update them or to read them.
- An update that **fully covers** a node applies to it and stops; one that **partly covers** it pushes, recurses into both children, then recomputes the node from them.

Every operation still visits O(log n) nodes, and a push costs O(1), so both updates and queries stay O(log n).

## Java template

```java
private void apply(int node, int start, int end, long val) {   // add val to every element of the node's range
    tree[node] += (end - start + 1) * val;
    lazy[node] += val;                                          // ...and owe it to the children
}

private void push(int node, int start, int end) {               // pay the debt before going down
    if (lazy[node] == 0) return;
    int mid = (start + end) / 2;
    apply(2 * node, start, mid, lazy[node]);
    apply(2 * node + 1, mid + 1, end, lazy[node]);
    lazy[node] = 0;
}
```

## Worked examples

### Range add, range sum

```java
class LazySegmentTree {
    private final long[] tree, lazy;   // lazy[node]: an add the node's children still owe
    private final int n;

    public LazySegmentTree(int[] arr) {
        n = arr.length;
        tree = new long[4 * n];
        lazy = new long[4 * n];
        build(arr, 1, 0, n - 1);
    }

    private void build(int[] arr, int node, int start, int end) {
        if (start == end) { tree[node] = arr[start]; return; }
        int mid = (start + end) / 2;
        build(arr, 2 * node, start, mid);
        build(arr, 2 * node + 1, mid + 1, end);
        tree[node] = tree[2 * node] + tree[2 * node + 1];
    }

    public void rangeAdd(int l, int r, long val) { rangeAdd(1, 0, n - 1, l, r, val); }

    private void rangeAdd(int node, int start, int end, int l, int r, long val) {
        if (r < start || end < l) return;                       // no overlap
        if (l <= start && end <= r) {                           // total overlap: apply here and stop
            apply(node, start, end, val);
            return;
        }
        push(node, start, end);                                 // partial overlap: go down
        int mid = (start + end) / 2;
        rangeAdd(2 * node, start, mid, l, r, val);
        rangeAdd(2 * node + 1, mid + 1, end, l, r, val);
        tree[node] = tree[2 * node] + tree[2 * node + 1];
    }

    public long rangeSum(int l, int r) { return rangeSum(1, 0, n - 1, l, r); }

    private long rangeSum(int node, int start, int end, int l, int r) {
        if (r < start || end < l) return 0;
        if (l <= start && end <= r) return tree[node];         // already includes every pending add
        push(node, start, end);                                 // the children are about to be read
        int mid = (start + end) / 2;
        return rangeSum(2 * node, start, mid, l, r) + rangeSum(2 * node + 1, mid + 1, end, l, r);
    }

    private void apply(int node, int start, int end, long val) {
        tree[node] += (end - start + 1) * val;
        lazy[node] += val;
    }

    private void push(int node, int start, int end) {
        if (lazy[node] == 0) return;
        int mid = (start + end) / 2;
        apply(2 * node, start, mid, lazy[node]);
        apply(2 * node + 1, mid + 1, end, lazy[node]);
        lazy[node] = 0;
    }
}
```

Trace it on `[1, 2, 3]`: `rangeAdd(0, 1, 5)` fully covers node `[0,1]`, so it becomes 3 + 2·5 = 13 with a tag of 5, and the root becomes 16. A later `rangeSum(1, 1)` partly overlaps `[0,1]`, so it pushes first: the leaves become 6 and 7, and the query returns 7.

`push` is never called on a leaf: a leaf's range is a single element, so it's always fully inside or fully outside the operation's range.

**In an interview,** this is one of the more fiddly things to write under pressure. If it comes up, be honest that you're rebuilding it from the idea (a lazy tag is a promise to apply an update later, to whichever child actually gets visited) rather than pretending to have it memorised. Interviewers care more that you understand *why* the push happens before going down, in both updates and queries, than that you type it without pausing.

### Range add, range minimum

Two lines change. The combine step becomes `Math.min`, and an add raises a node's minimum by exactly `val`, not by `val` per element:

```java
private void apply(int node, int start, int end, long val) {
    tree[node] += val;                 // every element rises by val, so the minimum does too
    lazy[node] += val;
}
// and in build, rangeAdd and the query: tree[node] = Math.min(tree[2 * node], tree[2 * node + 1]);
// with Long.MAX_VALUE as the no-overlap value of a minimum query
```

### Range assignment

"Set every element of `[l, r]` to `v`" uses a different tag: the assigned value, or "none" (a sentinel). Applying an assignment to a node sets its sum to `(end − start + 1) · v`, and replaces any pending tag, because the assignment overwrites whatever was owed before.

## Complexity

**O(log n)** per range update and per range query, **O(n)** to build, and up to 4n slots for each of `tree` and `lazy`.

## Variations

- **Combining adds and assignments:** keep both tags. An assignment clears the pending add; an add on top of a pending assignment adds to the assigned value. Apply the assignment first when pushing.
- **Huge index ranges** (coordinates up to 10⁹, as in My Calendar III (LC 732) or Range Module (LC 715)): create children on demand (a **dynamic** segment tree), or compress the coordinates that actually occur first.
- **Coarser and simpler:** [sqrt decomposition](lesson:sparse-table-and-sqrt-decomposition) supports range updates with one pending value per block, at O(√n) per operation.

## Common mistakes

- **Not pushing before going down**, so the children are read or updated without the add they still owe.
- **Applying to the children of a leaf**: they don't exist, and `2 · node` can run past the array.
- **Using the sum formula for min or max**: adding `v` to every element raises the minimum by `v`, not by `(end − start + 1) · v`.
- **Forgetting to recompute a node** from its children after the recursive calls.
- **Overflowing `int`** with range sums: use `long`.

## Practice

Range Addition (LC 370) and Corporate Flight Bookings (LC 1109), warm-ups that need only a difference array; Range Sum Query - Mutable (LC 307), without lazy tags; My Calendar III (LC 732); Range Module (LC 715); Falling Squares (LC 699); Handling Sum Queries After Update (LC 2569).

## Key takeaways

- A lazy tag means the node's own value is up to date, but its children still owe the update.
- Fully covered: apply and stop. Partly covered: push, recurse into both children, recompute.
- Push before going down, in queries as well as updates.
- Change `apply` and the combine step for min, max or assignment.
- Both range updates and range queries stay O(log n).

## Knowledge check

```quiz
? In this lesson's convention, what does lazy[node] = 5 mean?
+ The node's aggregate already includes an add of 5, but its children don't yet
- The node itself still needs 5 added
! Here the node's own value is updated when the tag is set.
- The node's range has 5 elements
! The tag is an amount, not a size.
- Five updates are pending
! It's one combined amount.
> Pushing applies it to both children and clears it.

? Why must a query push before recursing into the children?
+ The children's values don't yet include the add their parent's tag records
- To clear memory
! Pushing doesn't free anything.
- Because the root must always be up to date
! The root is up to date already; the children aren't.
- It doesn't need to; only updates push
! A query would read stale children.
> Push whenever you go below a node.

? A segment tree answers range minimums. How does applying "add v" to a node change its value?
+ It adds v: every element rises by v, so the minimum does too
- It adds (end − start + 1) · v
! That's the sum formula.
- It sets the value to v
! That's assignment, not addition.
- It leaves the value unchanged until the push
! The node's own value is updated immediately in this convention.
> Only apply and the combine step change.

? Adding v to the whole array [0, n − 1] costs how much?
+ O(1): the root is fully covered, so the update stops there with a tag
- O(n): every element changes
! The children are only updated when visited.
- O(log n)
! Total overlap at the root stops immediately.
- O(n log n)
! Nothing near that.
> Laziness defers the work to later visits.
```
