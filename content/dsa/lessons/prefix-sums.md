## The idea

Precompute cumulative sums once, so any range-sum query afterward is O(1) instead of re-summing the range every time. The sum of `arr[l..r]` becomes the difference of two running totals.

## When to use it

- **Many range-sum queries on an array that doesn't change.** Build once in O(n), then answer each query in O(1).
- **Counting subarrays with a given sum**, especially when values can be negative and a [sliding window](lesson:sliding-window) can't work. Combine prefix sums with a hash map.
- **Submatrix sums** on a grid: the 2-D version.
- **Many range updates that are read only at the end**: the inverse operation, a difference array.

If the array **changes between queries**, a prefix array needs an O(n) rebuild per update. Use a [Fenwick tree or segment tree](lesson:range-query-structures) instead.

## How it works

Keep an array one longer than the input, with `prefix[0] = 0` (the sum of zero elements) and `prefix[i + 1] = prefix[i] + arr[i]`. Then:

```text
sum(arr[l..r]) = prefix[r + 1] − prefix[l]
```

Why the `+1` offset: it lets `rangeSum(0, r)` be `prefix[r + 1] − prefix[0]` without a special case for `l == 0`. This is the single most common off-by-one source in prefix-sum code, so get comfortable with it.

The same idea works for any operation that can be undone: XOR (its own inverse), or counts. It doesn't work directly for max or min, because you can't "subtract" a maximum; static range min/max needs a [sparse table](lesson:sparse-table-and-sqrt-decomposition).

## Java template

```java
int[] prefix = new int[arr.length + 1];   // prefix[0] = 0 by convention (sum of zero elements)
for (int i = 0; i < arr.length; i++) {
    prefix[i + 1] = prefix[i] + arr[i];
}
// sum of arr[l..r] inclusive:
int rangeSum = prefix[r + 1] - prefix[l];
```

## Worked examples

**Range Sum Query – Immutable (LC 303).** The template, wrapped in a class: O(n) to build, O(1) per query.

```java
class NumArray {
    private final int[] prefix;

    NumArray(int[] nums) {
        prefix = new int[nums.length + 1];
        for (int i = 0; i < nums.length; i++) prefix[i + 1] = prefix[i] + nums[i];
    }

    int sumRange(int left, int right) {
        return prefix[right + 1] - prefix[left];
    }
}
```

**Subarray Sum Equals K (LC 560).** Count subarrays whose sum equals `k`. This is the highest-value prefix-sum problem to understand, because its trick (prefix sum + a hash map of counts) reappears constantly.

*Approach:* if `prefixSum[r+1] − prefixSum[l] == k`, then a valid subarray ends at `r`. Rearranged: `prefixSum[l] == prefixSum[r+1] − k`. So as you scan and build the running sum, ask at each position "how many earlier prefix sums equal `currentSum − k`?", and a hash map answers that in O(1).

```java
public int subarraySum(int[] nums, int k) {
    Map<Integer, Integer> prefixCount = new HashMap<>();
    prefixCount.put(0, 1);  // empty prefix (sum 0) occurs once, before the array starts
    int sum = 0, count = 0;
    for (int num : nums) {
        sum += num;
        count += prefixCount.getOrDefault(sum - k, 0);
        prefixCount.merge(sum, 1, Integer::sum);
    }
    return count;
}
```

That's O(n) time and O(n) space, against the O(n²) brute force of summing every subarray.

## Complexity

| Use | Build | Each query or update |
|---|---|---|
| 1-D prefix sums | O(n) time, O(n) space | O(1) query |
| Subarray sum equals k (with a hash map) | — | O(n) time and space in total |
| 2-D prefix sums | O(rows · cols) | O(1) query |
| Difference array | O(n) to rebuild at the end | O(1) update |

## Variations

### 2-D prefix sums (submatrix sums)

The same idea extended to grids, via inclusion–exclusion:

```java
// prefix[i][j] = sum of the rectangle from (0,0) to (i-1,j-1)
int[][] prefix = new int[rows + 1][cols + 1];
for (int i = 1; i <= rows; i++) {
    for (int j = 1; j <= cols; j++) {
        prefix[i][j] = matrix[i-1][j-1] + prefix[i-1][j] + prefix[i][j-1] - prefix[i-1][j-1];
    }
}
// sum of submatrix (r1,c1) to (r2,c2) inclusive:
int sum = prefix[r2+1][c2+1] - prefix[r1][c2+1] - prefix[r2+1][c1] + prefix[r1][c1];
```

The `- prefix[i-1][j-1]` term corrects for double-counting the top-left overlap when you add the top strip and the left strip. Draw it once on a 3×3 grid: it clicks immediately and is hard to forget after that.

### Prefix XOR

An identical idea with XOR instead of sum. It works because XOR is its own inverse:

```java
int[] prefixXor = new int[arr.length + 1];
for (int i = 0; i < arr.length; i++) prefixXor[i + 1] = prefixXor[i] ^ arr[i];
int rangeXor = prefixXor[r + 1] ^ prefixXor[l];
```

### Prefix products and remainders

- **Product of Array Except Self (LC 238)** multiplies a prefix product by a suffix product at each index: the same idea applied to multiplication, without division.
- **Continuous Subarray Sum (LC 523)** stores the first index at which each prefix sum *modulo k* appears. Two equal remainders mean the subarray between them sums to a multiple of `k`.

### Difference arrays: many range updates at once

**Trigger:** "add x to every position in [l, r]", many times, and the values are read only once all updates are done (car pooling, flight bookings, "how many lamps light this point").

**Core idea:** a difference array is the reverse of a prefix sum. Record each range update as `+x` at `l` and `−x` just past the end; a prefix sum at the end recovers every value. Each update costs O(1) instead of O(length).

```java
int[] diff = new int[n + 1];
// add val to every index in [l, r] inclusive:
diff[l] += val;
diff[r + 1] -= val;     // cancels the effect beyond r
// after ALL updates are applied, reconstruct the actual array with a running prefix sum:
int[] result = new int[n];
result[0] = diff[0];
for (int i = 1; i < n; i++) result[i] = result[i-1] + diff[i];
```

Two classic uses:

```java
// LC 1094 Car Pooling: trips [passengers, from, to], locations 0..1000. Never exceed capacity?
public boolean carPooling(int[][] trips, int capacity) {
    int[] delta = new int[1001];
    for (int[] t : trips) {
        delta[t[1]] += t[0];                         // they board at 'from' ...
        delta[t[2]] -= t[0];                         // ... and are gone at 'to'
    }
    int onboard = 0;
    for (int d : delta) {
        onboard += d;
        if (onboard > capacity) return false;
    }
    return true;
}

// LC 1109: bookings [first, last, seats] on flights
// 1..n. One +, one - per booking, then prefix sums.
public int[] corpFlightBookings(int[][] bookings, int n) {
    int[] diff = new int[n + 1];
    for (int[] b : bookings) {
        diff[b[0] - 1] += b[2];
        diff[b[1]] -= b[2];
    }
    int[] seats = new int[n];
    int running = 0;
    for (int i = 0; i < n; i++) {
        running += diff[i];
        seats[i] = running;
    }
    return seats;
}
```

```text
bookings   [1,2,+10]  [2,3,+20]  [2,5,+25]      flights 1..5 are indexes 0..4
diff        10   45  -10  -20    0  | -25        +x at (first - 1), -x at last
prefix      10   55   45   25   25
```

A difference array is the offline cousin of the [sweep line](lesson:meeting-rooms). The sweep sorts the events, while the difference array buckets them by coordinate, which works when the coordinate range is small (Car Pooling's locations are 0..1000). For large coordinates, use a `TreeMap<Integer, Integer>` of deltas. When updates and queries are *interleaved*, use a [Fenwick tree](lesson:fenwick-tree) or a [segment tree](lesson:segment-tree).

## Common mistakes

- **Off-by-one on the `+1` offset.** Pick one convention (`prefix[0] = 0`, the prefix array is `length + 1`) and stay consistent; mixing conventions mid-problem is the #1 source of bugs here.
- **Using prefix sums when the array changes between queries.** Each update needs an O(n) rebuild, which is often too slow. That's what [range-query structures](lesson:range-query-structures) are for.
- **Forgetting the empty prefix** in the hash-map version. Without `prefixCount.put(0, 1)`, subarrays that start at index 0 are never counted.
- **Integer overflow** on large arrays with large values. Accumulate in `long`, not `int`.

## Practice

Range Sum Query – Immutable (LC 303), Range Sum Query 2D – Immutable (LC 304), Subarray Sum Equals K (LC 560), Product of Array Except Self (LC 238), Continuous Subarray Sum (LC 523), Car Pooling (LC 1094), Corporate Flight Bookings (LC 1109).

## Key takeaways

- A prefix array of length n + 1 turns any range sum into one subtraction: `prefix[r + 1] − prefix[l]`.
- Prefix sums plus a hash map of counts solve "subarrays with sum k", negatives included, in O(n).
- The idea extends to 2-D grids (inclusion–exclusion), XOR, products and remainders, but not to max or min.
- A difference array is the reverse: O(1) per range update, one prefix-sum pass at the end.
- If values change between queries, use a Fenwick tree or a segment tree instead.

## Knowledge check

```quiz
? With `prefix[0] = 0` and `prefix[i + 1] = prefix[i] + arr[i]`, what is the sum of `arr[l..r]` inclusive?
+ `prefix[r + 1] − prefix[l]`
- `prefix[r] − prefix[l]`
! That leaves out arr[r].
- `prefix[r] − prefix[l − 1]`
! That's the formula without the +1 offset, and it breaks when l = 0.
- `prefix[r + 1] − prefix[l + 1]`
! That leaves out arr[l].
> The offset makes prefix[i] the sum of the first i elements, so no special case is needed for l = 0.

? In Subarray Sum Equals K, why does the map start with `{0: 1}`?
+ It represents the empty prefix, so subarrays that start at index 0 are counted
- To avoid a NullPointerException on the first lookup
! getOrDefault already handles missing keys.
- Because k can be 0
! k = 0 needs no special handling.
- To make the map's iteration order predictable
! Order is irrelevant here.
> A subarray starting at 0 has sum P[r + 1] − P[0], and P[0] = 0 must be in the map.

? Values change between range-sum queries, thousands of times. What should you use?
- Rebuild the prefix array after each change
! That's O(n) per update, too slow with many updates.
+ A Fenwick tree or a segment tree: O(log n) per update and per query
- A difference array
! It needs every update to happen before any read.
- A 2-D prefix sum
! Dimensions aren't the problem; updates are.
> Prefix arrays suit static data; dynamic data needs a tree.

? You need to add 5 to every element in positions [2, 7], a million times over different ranges, and read the array once at the end. What's the cost per update with a difference array?
+ O(1): one addition at the start and one subtraction just past the end
- O(length of the range)
! That's the naive loop the difference array avoids.
- O(log n)
! That's a Fenwick tree, needed only when reads interleave with updates.
- O(n)
! Only the final rebuild is O(n), once.
> The rebuild at the end is a single prefix-sum pass.
```
