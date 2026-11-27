## What it is

A **Fenwick tree**, or **binary indexed tree** (BIT), stores partial sums at cleverly chosen indexes, so that both "add to one element" and "sum a prefix" take O(log n). It answers the same core question as a [segment tree](lesson:segment-tree) (prefix and range sums with point updates) with **less code and less memory**: an array of n + 1 numbers instead of up to 4n.

It's the direct upgrade from a plain [prefix-sum array](lesson:prefix-sums) the moment the array needs updates: about 15 lines that turn an O(n)-per-update situation into O(log n). The trade-off: it suits sums (and other operations that can be undone, such as XOR), not min or max, because a range answer is one prefix minus another, and you can't "subtract" a maximum.

## How it works

The whole structure runs on one bit trick: `i & (-i)` isolates the **lowest set bit** of `i` (in two's complement, `-i` flips every bit above it). Index `i` of the Fenwick array is **responsible for** the `i & (-i)` elements ending at position `i`:

```text
index  lowbit  covers
  1      1     [1]
  2      2     [1, 2]
  3      1     [3]
  4      4     [1..4]
  5      1     [5]
  6      2     [5, 6]
  7      1     [7]
  8      8     [1..8]
```

- **`query(i)`** (the sum of positions 1..i) walks **down**, removing the lowest set bit each time: `query(7)` reads index 7 (`[7]`), then 6 (`[5,6]`), then 4 (`[1..4]`), and stops at 0.
- **`update(i, delta)`** walks **up**, adding the lowest set bit each time, to every index whose range contains `i`: `update(5, …)` touches 5, 6 and 8.

Each walk changes one bit position per step, so both are **O(log n)**.

## Build it from scratch

```java
class FenwickTree {
    private final int[] tree;   // 1-indexed: tree[0] is unused
    private final int n;

    public FenwickTree(int n) {
        this.n = n;
        this.tree = new int[n + 1];
    }

    public void update(int i, int delta) {          // add delta at position i
        for (; i <= n; i += i & (-i)) tree[i] += delta;    // up: the next range that contains i
    }

    public int query(int i) {                        // prefix sum of positions [1, i]
        int sum = 0;
        for (; i > 0; i -= i & (-i)) sum += tree[i];       // down: the previous disjoint range
        return sum;
    }

    public int rangeQuery(int l, int r) {             // sum of [l, r], 1-indexed and inclusive
        return query(r) - query(l - 1);
    }
}
```

Building from an existing array with n updates costs O(n log n). An **O(n) build** pushes each index's total into the one index directly above it:

```java
public FenwickTree(int[] values) {                  // values[0..n-1] become positions 1..n
    this(values.length);
    for (int i = 1; i <= n; i++) {
        tree[i] += values[i - 1];
        int parent = i + (i & -i);                  // the next range that contains i
        if (parent <= n) tree[parent] += tree[i];
    }
}
```

## Java API

The JDK has no Fenwick tree. For a **static** array, `Arrays.parallelPrefix(a, Integer::sum)` turns `a` into its prefix sums in place; anything with updates, you write yourself.

## Operations and complexity

| Operation | Time |
|---|---|
| Build | O(n), or O(n log n) with n updates |
| Point update | O(log n) |
| Prefix sum, range sum | O(log n) |
| Range update and range sum (two trees, below) | O(log n) |
| Space | n + 1 numbers |

**Segment tree or Fenwick tree?**

| | Segment tree | Fenwick tree |
|---|---|---|
| Code | More | Less (~15 lines) |
| Memory | up to 4n | n + 1 |
| Range min, max or gcd | Yes | No (only operations that can be undone, such as sum and XOR) |
| Range updates | Yes, with lazy propagation | Yes for sums, with the two-tree trick |
| Reach for it when | you need min or max, or general range updates | you need prefix or range sums, with less code |

## Patterns

### Range Sum Query - Mutable (LC 307)

LeetCode's `update(index, val)` **sets** a value, while a Fenwick tree **adds**, so keep a copy of the array and add the difference. The problem is also 0-indexed, so shift by one:

```java
class NumArray {
    private final FenwickTree bit;
    private final int[] nums;

    public NumArray(int[] nums) {
        this.nums = nums.clone();
        bit = new FenwickTree(nums);                  // the O(n) build
    }

    public void update(int index, int val) {
        bit.update(index + 1, val - nums[index]);     // Fenwick adds; LC 307 sets, so add the difference
        nums[index] = val;
    }

    public int sumRange(int left, int right) {
        return bit.rangeQuery(left + 1, right + 1);   // shift to 1-indexed
    }
}
```

### Range update, point query

Store the [difference array](lesson:prefix-sums) in the Fenwick tree instead of the values. Adding `v` to `[l, r]` is two point updates, and an element's value is the prefix sum of the differences:

```java
void rangeAdd(int l, int r, int v) {  // add v to positions l..r
    bit.update(l, v);
    bit.update(r + 1, -v);            // update ignores r + 1 > n
}

int valueAt(int i) {
    return bit.query(i);
}
```

### Range update, range query: the two-tree trick

This is the piece most guides skip, and it's what makes Fenwick trees genuinely competitive with segment trees for range-update, range-query workloads.

**The derivation** (worth understanding, not just memorising): let `d[]` be the difference array of `a[]`, so `a[i] = d[1] + d[2] + ... + d[i]`. A range update "add val to `[l, r]`" is the usual difference-array move: `d[l] += val` and `d[r+1] -= val`. Now expand the prefix sum of `a[]` in terms of `d[]`:

```text
S(i) = Σ a[k] for k=1..i = Σ Σ d[j] for j=1..k, k=1..i = Σ d[j] * (i - j + 1) for j=1..i
     = (i + 1) * Σd[j] - Σ(d[j] * j)
```

So maintain **two** Fenwick trees, one (`B1`) storing `d[j]` and one (`B2`) storing `d[j] * j`. Then `S(i)` takes O(log n), and any range sum is `S(r) - S(l-1)`.

```java
class RangeFenwickTree {
    private final long[] B1, B2;
    private final int n;

    public RangeFenwickTree(int n) {
        this.n = n;
        B1 = new long[n + 1];
        B2 = new long[n + 1];
    }

    private void updateBIT(long[] bit, int i, long val) {
        for (; i <= n; i += i & (-i)) bit[i] += val;
    }

    private long queryBIT(long[] bit, int i) {
        long sum = 0;
        for (; i > 0; i -= i & (-i)) sum += bit[i];
        return sum;
    }

    public void rangeUpdate(int l, int r, long val) {     // add val to every element in [l, r]
        updateBIT(B1, l, val);
        updateBIT(B1, r + 1, -val);
        updateBIT(B2, l, val * l);
        updateBIT(B2, r + 1, -val * (r + 1));
    }

    private long prefixSum(int i) {
        return (i + 1) * queryBIT(B1, i) - queryBIT(B2, i);
    }

    public long rangeQuery(int l, int r) {                 // sum of [l, r]
        return prefixSum(r) - prefixSum(l - 1);
    }
}
```

Check it with a tiny example before trusting it under interview pressure: with `n = 3`, `rangeUpdate(1, 3, 5)` makes every element 5, so `rangeQuery(2, 3)` must return 10.

### Counting with a Fenwick tree over values (LC 315)

For each element, count the smaller elements to its right. Walk from the right, and keep a Fenwick tree of **how many times each value has been seen**: "how many smaller values have I seen?" is then a prefix sum. Compress the values to ranks 1..k first, so the tree stays small:

```java
public List<Integer> countSmaller(int[] nums) {
    int[] sorted = Arrays.stream(nums).distinct().sorted().toArray();   // value -> rank
    FenwickTree seen = new FenwickTree(sorted.length);
    Integer[] result = new Integer[nums.length];
    for (int i = nums.length - 1; i >= 0; i--) {
        int rank = Arrays.binarySearch(sorted, nums[i]) + 1;           // 1-based rank of nums[i]
        result[i] = seen.query(rank - 1);                              // smaller values to the right
        seen.update(rank, 1);
    }
    return Arrays.asList(result);
}
```

The same move counts inversions, and solves Count of Range Sum (LC 327) over prefix sums.

## Common mistakes

- **Using index 0.** `0 & -0` is 0, so `update(0, …)` never advances: an infinite loop. Fenwick trees are 1-indexed; shift 0-indexed input by one.
- **Treating LC 307's `update` as an add.** It sets the value: add `val − old`.
- **Forgetting the `l − 1`** in a range query: `query(r) − query(l)` drops position `l`.
- **Overflowing `int`** when sums can exceed about 2.1 × 10⁹: use `long`.
- **Trying to answer range min or max** with subtraction: use a segment tree.

## Key takeaways

- A Fenwick tree answers prefix sums and point updates in O(log n), with an array of n + 1 numbers.
- `i & (-i)` is the lowest set bit: queries remove it (walking down), updates add it (walking up).
- A range sum is `query(r) − query(l − 1)`, so it only works for operations that can be undone.
- A difference array inside a Fenwick tree gives range updates; two trees give range updates with range sums.
- Indexed by value instead of position, it counts "how many smaller values so far" (LC 315).

## Knowledge check

```quiz
? Which Fenwick indexes does query(7) read?
+ 7, 6 and 4
- 7, 8
! Walking up is what update does.
- 1 through 7
! That's a plain prefix-sum loop.
- 4 and 7
! Index 6 covers positions 5 and 6, which 4 and 7 miss.
> 7 covers [7], 6 covers [5,6], and 4 covers [1..4].

? Why are Fenwick trees 1-indexed?
+ Because 0 & -0 is 0: at index 0 the update loop would never advance
- Because Java arrays start at 1
! Java arrays start at 0; index 0 is left unused.
- To save memory
! It costs one extra slot.
- Because prefix sums are always 1-indexed
! It's the bit trick that requires it.
> Shift 0-indexed input by one.

? LC 307's update(index, val) sets nums[index] to val. What do you pass to the Fenwick tree?
+ val − nums[index], the difference, at position index + 1
- val, at position index
! The tree adds, and it's 1-indexed.
- val, at position index + 1
! That adds val instead of replacing the old value.
- nothing; rebuild the tree
! A rebuild is O(n), which defeats the purpose.
> Keep a copy of the array to know the old value.

? With the two-tree trick on n = 3, rangeUpdate(1, 3, 5) runs. What does rangeQuery(2, 3) return?
+ 10
- 15
! That's the sum of all three elements.
- 5
! Two elements of 5 are summed.
- 0
! The update applies to positions 2 and 3 too.
> prefixSum(3) − prefixSum(1) = 15 − 5.
```
