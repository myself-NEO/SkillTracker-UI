## The idea

Store numbers in a trie over their **bits**, most significant first, with two children per node (`0` and `1`). To maximise `x ^ y` for a given `x`, walk down choosing the **opposite** bit whenever that child exists. A 1 in a higher bit beats any combination of lower bits, so being greedy from the top bit is optimal.

## When to use it

- "The maximum XOR of two numbers", or of a number with any element of a set.
- XOR queries with constraints, such as "only numbers ≤ m", answered offline.
- Counting the pairs whose XOR is below a limit, or within a range.
- Longest prefix match over bit strings, as in IP routing.

## How it works

```text
x = 0101 (5).  At each level prefer the child with the opposite bit:
bit 3: x has 0, want 1 -> exists?  take it, result bit = 1
bit 2: x has 1, want 0 -> missing? take 1,  result bit = 0
...
```

Each number is a path of B nodes (B = 31 for non-negative `int`s), so the trie has at most n · B nodes, and every insert or query takes O(B) steps, however many numbers are stored. That turns O(n²) pairwise checks into O(n · B).

## Java template

```java
private static final class BitNode {
    final BitNode[] next = new BitNode[2];
}

private void insertBits(BitNode root, int x) {          // non-negative ints: bits 30..0
    BitNode cur = root;
    for (int b = 30; b >= 0; b--) {
        int bit = (x >>> b) & 1;
        if (cur.next[bit] == null) cur.next[bit] = new BitNode();
        cur = cur.next[bit];
    }
}

private int maxXorWith(BitNode root, int x) {         // greedy: take the opposite bit when possible
    BitNode cur = root;
    int result = 0;
    for (int b = 30; b >= 0; b--) {
        int bit = (x >>> b) & 1;
        if (cur.next[1 - bit] != null) {
            result |= 1 << b;                           // this bit of the XOR can be 1
            cur = cur.next[1 - bit];
        } else {
            cur = cur.next[bit];
        }
    }
    return result;
}
```

`maxXorWith` needs at least one number in the trie: every level then has at least one child to follow.

## Worked examples

### Maximum XOR of Two Numbers in an Array (LC 421)

The maximum of `a ^ b` over all pairs, in O(n · 31) rather than O(n²):

```java
// LC 421: maximum a XOR b over all pairs. A binary trie of the numbers, top bit first.
public int findMaximumXOR(int[] nums) {
    BitNode root = new BitNode();
    int best = 0;
    for (int x : nums) {
        insertBits(root, x);
        best = Math.max(best, maxXorWith(root, x));     // x against everything inserted so far
    }
    return best;
}
```

Inserting `x` before querying keeps the trie non-empty; pairing `x` with itself gives 0, which never beats a real pair. For `[3, 10, 5, 25, 2, 8]`, the answer is 28 (`5 ^ 25`).

### Maximum XOR With an Element From Array (LC 1707)

Each query `(x, m)` may only use the numbers ≤ `m`, and returns −1 if there are none.

```java
// LC 1707: for each query (x, m), the max x XOR num over nums <= m, or -1. Answer queries offline:
// sort them by m, and insert numbers into the trie only once they become allowed.
public int[] maximizeXor(int[] nums, int[][] queries) {
    int[] sorted = nums.clone();
    Arrays.sort(sorted);
    Integer[] order = new Integer[queries.length];
    for (int i = 0; i < order.length; i++) order[i] = i;
    Arrays.sort(order, Comparator.comparingInt(i -> queries[i][1]));
    int[] answer = new int[queries.length];
    BitNode root = new BitNode();
    int next = 0;
    for (int qi : order) {
        int x = queries[qi][0], m = queries[qi][1];
        while (next < sorted.length && sorted[next] <= m) insertBits(root, sorted[next++]);
        answer[qi] = (next == 0) ? -1 : maxXorWith(root, x);
    }
    return answer;
}
```

**The offline-queries trick:** sort the queries by `m`, and the numbers in ascending order. Before answering a query, insert every number ≤ its `m`: the trie then contains exactly the allowed numbers. This "sort the queries so the data structure only grows" technique appears in many hard problems.

## Complexity

- **LC 421:** O(n · B) time and at most n · B nodes, for B = 31 bits.
- **LC 1707:** O(n log n + q log q) to sort, plus O((n + q) · B) for the inserts and queries.

## Variations

- **The maximum XOR of a subarray:** the XOR of `a[i..j]` is `p[j + 1] ^ p[i]`, where `p` holds the prefix XORs (with `p[0] = 0`). So it's LC 421 over the prefix XORs: the same move as [prefix sums](lesson:prefix-sums).
- **Counting XORs below a limit (LC 1803):** store a count on every node. To count the stored numbers y with `x ^ y < k`, walk k's bits from the top. Where k has a 1, every number in the child that makes this XOR bit 0 is smaller, so add that child's count, then continue into the child that makes the XOR bit 1. Where k has a 0, the XOR bit must be 0. A range is then `count(high + 1) − count(low)`.
- **Removing numbers:** with those counts, decrement along the path and treat a child whose count is 0 as missing. LC 1938 uses this to keep exactly the numbers on the current root-to-node path of a tree.
- **Longest prefix match:** a router's table is a binary trie of route prefixes. Looking up an address walks its bits and remembers the last route that ended on the way. Production routers compress chains of single-child nodes (Patricia tries).
- **Negative numbers:** the template walks bits 30 to 0, which covers non-negative `int`s. For negatives, include bit 31, and remember that a result with the top bit set is negative.

## Common mistakes

- **Inserting the least significant bit first**: the greedy choice is only right from the top bit down.
- **Walking too few bits**: cover every bit the values can have (30 to 0 for non-negative `int`s).
- **Querying an empty trie** (LC 1707 when no number is ≤ m): return −1 before walking.
- **Taking the same bit instead of the opposite one**, which finds the *minimum* XOR.
- **Checking every pair**: O(n²) times out at the usual n = 2 · 10⁵.

## Practice

Maximum XOR of Two Numbers in an Array (LC 421), Maximum XOR With an Element From Array (LC 1707), Count Pairs With XOR in a Range (LC 1803), Maximum Genetic Difference Query (LC 1938).

## Key takeaways

- A binary trie stores each number's bits from the most significant down, with two children per node.
- To maximise `x ^ y`, take the opposite bit whenever that child exists: a higher bit outweighs all the lower ones.
- Each insert and query is O(B) for B bits, so n numbers take O(n · B) instead of O(n²) pairs.
- When queries restrict which numbers count, sort the queries so the trie only grows.
- Counts on nodes let you remove numbers and count the XORs below a limit.

## Knowledge check

```quiz
? Why must the bits be inserted from the most significant down?
+ A 1 in a higher bit outweighs every combination of lower bits, so the greedy choice is only safe from the top
- Because Java stores ints most significant bit first
! Memory layout isn't the reason.
- To use less memory
! The node count is the same either way.
- It doesn't matter; XOR is symmetric
! The order decides whether the greedy walk is correct.
> Least-significant-first greedy can sacrifice a higher bit.

? What is the maximum XOR of two numbers in [3, 10, 5, 25, 2, 8]?
+ 28, from 5 ^ 25
- 27, from 2 ^ 25
! 5 ^ 25 = 28 is larger.
- 33, from 8 + 25
! That's a sum, not a XOR.
- 31
! No pair reaches 31.
> 5 = 00101 and 25 = 11001, so the XOR is 11100.

? In LC 1707, why sort the queries by m?
+ So the trie only grows: before each query, insert every number ≤ m, and it holds exactly the allowed numbers
- To answer them in the original order
! The answers are written back by index.
- Because maxXorWith needs sorted input
! The trie doesn't care about order.
- To remove numbers between queries
! Nothing is ever removed.
> Offline processing turns a constraint into growth.

? What does LC 421 cost with a binary trie, for n numbers and 31 bits?
+ O(31 · n)
- O(n²)
! That's checking every pair.
- O(n log n)
! There's no sorting; each number costs 31 steps.
- O(2³¹)
! The trie only holds the numbers' paths.
> Each insert and each query walks 31 levels.
```
