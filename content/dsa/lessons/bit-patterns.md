## The idea

Almost every bit manipulation question is one of five templates in disguise:
- **A. XOR cancels duplicates.**
- **B. A bitmask stands for a subset.**
- **C. Counting bits, often with DP.**
- **D. A bitmask as DP state.**
- **E. Arithmetic with bits**, without `+` or `-`.

Plus one bonus: **the common binary prefix** of a range.

## When to use it

| Signal | Pattern |
|---|---|
| "every element appears twice except one", "find the missing number", "two elements appear once" | A: XOR everything |
| "all subsets", "all combinations", "partition into groups", with n ≤ about 20 | B: loop over masks from 0 to 2ⁿ − 1 |
| "count the set bits of every number from 0 to n" | C: `dp[i] = dp[i >> 1] + (i & 1)` |
| "visit all cities or items", n ≤ about 20, with a cost or a count | D: [bitmask DP](lesson:bitmask-dp) |
| "add two integers without + or −" | E: XOR for the sum, AND-shift for the carry |
| "the bitwise AND of every number in [m, n]" | the common prefix of m and n |

## How it works

- **A. XOR cancellation:** XOR every element together. By the [XOR identities](lesson:bitwise-operators), pairs vanish (`a ^ a = 0`) and the order doesn't matter, so only the unpaired value survives.
- **B. Subsets as masks:** with n elements, the numbers 0 to 2ⁿ − 1 are exactly the subsets: bit j set means "element j is included".
- **C. Counting bits with DP:** the bit count of i is the bit count of `i >> 1` (i with its last bit chopped off) plus that last bit, `i & 1`. Since `i >> 1 < i`, it's already computed.
- **D. Masks as DP state:** in the travelling salesman DP, `dp[mask][i]` is the minimum cost of having visited exactly the cities in `mask`, ending at city i. Each bit is a yes/no for "visited". See [bitmask DP](lesson:bitmask-dp).
- **E. Arithmetic:** XOR gives the sum *ignoring the carries*; AND-then-shift-left gives *just the carries*. Repeat until there are no carries left.
- **The common prefix:** any bit position where the numbers in `[m, n]` disagree is zeroed by the AND somewhere in that range. So the answer is the common binary prefix of m and n, with the rest zeroed.

## Java template

```java
// Pattern B: every subset of n elements (n <= about 20).
for (int mask = 0; mask < (1 << n); mask++) {
    for (int j = 0; j < n; j++) {
        if ((mask & (1 << j)) != 0) {
            // element j is in this subset
        }
    }
}
```

## Worked examples

### Single Number (LC 136): XOR cancellation

*Given a non-empty array where every element appears twice except one, find that one, in O(n) time and O(1) space.*

```java
public int singleNumber(int[] nums) {
    int result = 0;
    for (int num : nums) {
        result ^= num;
    }
    return result;
}
```

`result` starts at 0. Every pair cancels to 0, and 0 XORed with the lone survivor is the survivor: on `{4, 1, 2, 1, 2}` it returns 4. In the interview, say the words "XOR is commutative and associative": it shows you understand *why* the order doesn't matter.

### Single Number III (LC 260): two unique numbers

XOR everything to get `a ^ b`, the XOR of the two unique numbers. Any set bit of that result, such as its lowest one, `(a ^ b) & −(a ^ b)` ([bit tricks](lesson:bit-tricks)), is a position where a and b differ. Split the whole array by that bit, and XOR within each group: each group isolates one of them.

```java
public int[] singleNumber(int[] nums) {
    int xorAll = 0;
    for (int num : nums) xorAll ^= num;
    int diffBit = xorAll & (-xorAll);
    int a = 0, b = 0;
    for (int num : nums) {
        if ((num & diffBit) != 0) a ^= num;
        else b ^= num;
    }
    return new int[]{a, b};
}
```

On `{1, 2, 1, 3, 2, 5}` it returns `{3, 5}`.

### Counting Bits (LC 338)

```java
public int[] countBits(int n) {
    int[] dp = new int[n + 1];
    for (int i = 1; i <= n; i++) {
        dp[i] = dp[i >> 1] + (i & 1);
    }
    return dp;
}
```

For n = 5 it produces `[0, 1, 1, 2, 1, 2]`, in O(n) time and O(1) extra space beyond the output. Calling Kernighan's count on every number would be O(n log n). Another recurrence works too: `dp[i] = dp[i & (i − 1)] + 1`, since `i & (i − 1)` removes one set bit.

### Sum of Two Integers (LC 371): arithmetic with bits

```java
int getSum(int a, int b) {
    while (b != 0) {
        int carry = (a & b) << 1;
        a = a ^ b;
        b = carry;
    }
    return a;
}
```

`getSum(23, 47)` is 70, and `getSum(−5, 8)` is 3: it works on the raw two's-complement patterns, so negatives need no special case.

### Bitwise AND of Numbers Range (LC 201): the common prefix

```java
int rangeBitwiseAnd(int m, int n) {
    int shift = 0;
    while (m != n) {
        m >>= 1;
        n >>= 1;
        shift++;
    }
    return m << shift;
}
```

`rangeBitwiseAnd(5, 7)` is 4, and `rangeBitwiseAnd(26, 30)` is 24.

## Complexity

| Pattern | Time | Space |
|---|---|---|
| XOR cancellation | O(n) | O(1) |
| Enumerating all subsets | O(2ⁿ · n) | O(1) beyond the output |
| Counting bits for 0..n | O(n) | the output |
| Sum without + or − | O(32): one round per carry position | O(1) |
| Range AND | O(32) | O(1) |

## Variations

- **Single Number II (LC 137):** every other element appears three times, so plain XOR fails (three copies don't cancel). Count the 1s at each bit position modulo 3; the leftover bits form the answer:

  ```java
  public int singleNumber(int[] nums) {
      int result = 0;
      for (int bit = 0; bit < 32; bit++) {
          int count = 0;
          for (int num : nums) count += (num >>> bit) & 1;
          if (count % 3 != 0) result |= 1 << bit;
      }
      return result;
  }
  ```

- **The submasks of a mask:** `for (int s = mask; s > 0; s = (s - 1) & mask)` visits every non-empty subset of `mask`'s bits; over all masks, that's O(3ⁿ) in total, a staple of [bitmask DP](lesson:bitmask-dp).
- **Subsets by backtracking** produce the same subsets in a different order: see [backtracking](lesson:backtracking-template).
- **The maximum XOR of two numbers** needs a [binary trie](lesson:binary-tries), not a single pass.

## Common mistakes

- **Using XOR when the duplicates appear three times**: they don't cancel.
- **Enumerating masks for n above about 25**: 2ⁿ grows past what fits in time, and `1 << n` overflows at n = 31.
- **Forgetting that the carry loop needs `int` wrap-around**: in a language with unbounded integers, negatives loop forever; in Java they don't.
- **Splitting Single Number III on a bit where a and b agree**: the bit must come from `a ^ b`.
- **Testing `mask & (1 << j)` against 1** instead of 0: the result is `1 << j`, not 1.

## Practice

Single Number (LC 136), Missing Number (LC 268), Single Number III (LC 260), Single Number II (LC 137), Subsets (LC 78) with masks, Counting Bits (LC 338), Sum of Two Integers (LC 371), Bitwise AND of Numbers Range (LC 201).

## Key takeaways

- XOR everything to cancel pairs; split by a differing bit when two values are unique.
- Masks 0 to 2ⁿ − 1 are the subsets of n elements: bit j means element j is in.
- `dp[i] = dp[i >> 1] + (i & 1)` counts bits for every number up to n in O(n).
- Sum without `+`: XOR for the sum, `(a & b) << 1` for the carry, until the carry is 0.
- The AND of a range is the common prefix of its ends.

## Knowledge check

```quiz
? Every element appears twice except one. Why does XORing them all find it?
+ Each pair XORs to 0, XOR is commutative and associative, and 0 ^ x = x
- Because XOR sorts the array
! XOR doesn't reorder anything; order just doesn't matter.
- Because XOR adds the numbers
! XOR isn't addition.
- It only works for positive numbers
! It works on any bit patterns.
> One pass, one variable: O(n) time, O(1) space.

? In Single Number III, why split the array by a set bit of xorAll?
+ A set bit of a ^ b is a position where the two unique numbers differ, so they land in different groups
- To sort the numbers
! It only partitions them.
- Because the lowest bit is always set
! It's the lowest set bit of xorAll, which can be anywhere.
- To halve the work
! Both groups are still scanned.
> The pairs fall into the same group and cancel.

? What does countBits(5) return?
+ [0, 1, 1, 2, 1, 2]
- [0, 1, 2, 3, 4, 5]
! Those are the numbers, not their bit counts.
- [0, 1, 1, 2, 1]
! The output has n + 1 entries.
- [1, 1, 2, 1, 2, 2]
! 0 has no set bits.
> dp[i] = dp[i >> 1] + (i & 1).

? What is the bitwise AND of every number from 5 to 7?
+ 4: the common binary prefix of 101 and 111
- 5
! 5 & 6 already clears bit 0.
- 0
! Bit 2 is set in all three numbers.
- 7
! AND can only clear bits.
> Shift both ends right until they're equal, then shift back.
```
