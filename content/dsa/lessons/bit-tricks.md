## The idea

Almost every bit trick is **a mask plus one operator**. `1 << i` is a mask with only bit i on; combine it with `&` to test, `|` to set, `& ~` to clear, or `^` to toggle. Two more expressions, `n & (−n)` and `n & (n − 1)`, isolate or remove the lowest set bit, and most of the remaining tricks are built from them.

## When to use it

- Treat an `int` as 32 flags: test, set, clear or toggle one of them.
- "Is n a power of two?", "how many bits are set?", "the lowest set bit".
- "Find the missing number" in 0..n with O(1) extra space: XOR.
- Work on a range of bits: clear, extract or count them.

## How it works

- **`(n & (1 << i)) != 0`**: `1 << i` has only bit i on, so ANDing zeroes every other bit and leaves something nonzero only if bit i was 1.
- **`n | (1 << i)`** forces bit i to 1; **`n & ~(1 << i)`** forces it to 0 (`~(1 << i)` is all 1s except at i); **`n ^ (1 << i)`** flips it.
- **The lowest set bit, `n & (−n)`:** `−n` is `~n + 1`. Adding 1 to `~n` carries through its trailing 1s (n's trailing 0s) and stops at n's lowest set bit, which comes out as 1 again, while every bit above it stays inverted. So n and −n share exactly one set bit, the lowest one, and the AND keeps only that: `12 & −12 = 4` (`1100` → `100`).
- **Removing the lowest set bit, `n & (n − 1)`:** subtracting 1 turns the lowest set bit into 0 and every 0 below it into 1. ANDing with n keeps all the higher bits and clears that lowest one: `12 & 11 = 8` (`1100 & 1011 = 1000`).

## Java template

```java
boolean isSet  = (n & (1 << i)) != 0;   // test bit i
n = n | (1 << i);                       // set bit i
n = n & ~(1 << i);                      // clear bit i
n = n ^ (1 << i);                       // toggle bit i
boolean isOdd  = (n & 1) == 1;          // the ones place: 1 exactly for odd numbers
int lowest     = n & (-n);              // isolate the lowest set bit
n = n & (n - 1);                        // remove the lowest set bit
```

Checking `(n & 1)` instead of `n % 2` is the idiom interviewers expect, and it also works for negative numbers, where `n % 2` is −1. For a `long`, write the mask as `1L << i`.

## Worked examples

### Power of Two (LC 231)

```java
boolean isPowerOfTwo = n > 0 && (n & (n - 1)) == 0;
```

A power of two has **exactly one** bit set, so removing the lowest set bit leaves 0. The `n > 0` guard matters: without it, 0 would pass, and so would `Integer.MIN_VALUE`, whose only set bit is the sign bit.

### Number of 1 Bits (LC 191): Kernighan's algorithm

```java
int countSetBits(int n) {
    int count = 0;
    while (n != 0) {
        n = n & (n - 1);   // clears the lowest set bit each time
        count++;
    }
    return count;
}
```

It runs in **O(number of set bits)**, not O(32): faster than checking every position when the number is sparse. It works for negative `n` too, because an `int` is a fixed 32-bit pattern, so the loop ends after clearing all of them: `countSetBits(−1) = 32`, `countSetBits(29) = 4`.

### Missing Number (LC 268): XOR

The numbers 0..n with one missing: XOR every index with every value, and each present number cancels with its index, leaving the missing one.

```java
public int missingNumber(int[] nums) {
    int x = nums.length;                         // the index n has no slot in the array
    for (int i = 0; i < nums.length; i++) x ^= i ^ nums[i];
    return x;
}
```

### Clearing a range of bits

```java
// Clear bits i..j (inclusive)
int mask = ~(((1 << (j - i + 1)) - 1) << i);
n = n & mask;
```

Build a block of `j − i + 1` ones with `(1 << width) − 1`, slide it into place with `<< i`, then invert it, so it's 0 exactly where you want to clear and 1 everywhere else. Clearing bits 2–5 of `11111111` gives `11000011`.

## Complexity

Every single-bit trick is **O(1)**. Kernighan's count is O(number of set bits), at most 32 for an `int`; the XOR scan is O(n) time with O(1) space.

## Variations

- **Do two numbers differ in exactly one bit?** `Integer.bitCount(a ^ b) == 1`: XOR marks every differing position.
- **Swap two numbers without a temporary variable:**

  ```java
  a = a ^ b;
  b = a ^ b;   // = (a^b)^b = the original a
  a = a ^ b;   // = (a^b)^(the original a) = the original b
  ```

  It breaks when `a` and `b` are the *same variable* (say, `arr[i]` and `arr[j]` with `i == j`): the value XORs with itself and becomes 0. In real code, use a temporary variable; this is an interview curiosity about XOR.
- **Cyclic sort, when XOR isn't enough.** If the values lie in `[1, n]`, put each value at its "home" index (`nums[i]` belongs at index `nums[i] − 1`) in one O(n) pass with no extra space, then scan for the first index that doesn't hold its own value. First Missing Positive (LC 41) needs this, because the values outside `[1, n]` can't be cancelled by XOR:

  ```java
  public int firstMissingPositive(int[] nums) {       // LC 41
      int n = nums.length;
      for (int i = 0; i < n; i++) {
          while (nums[i] > 0 && nums[i] <= n && nums[nums[i] - 1] != nums[i]) {
              int t = nums[nums[i] - 1];
              nums[nums[i] - 1] = nums[i];
              nums[i] = t;
          }
      }
      for (int i = 0; i < n; i++) if (nums[i] != i + 1) return i + 1;
      return n + 1;
  }
  ```

- **Single Number and its follow-ups** use XOR cancellation across a whole array: see [bit patterns](lesson:bit-patterns).

## Common mistakes

- **Forgetting `n > 0` in the power-of-two check**, so 0 and `Integer.MIN_VALUE` pass.
- **`1 << i` for a `long`**: it's an `int` shift, so for i ≥ 32 it wraps. Write `1L << i`.
- **`n % 2 == 1` to test oddness**, which fails for negative odd numbers (their remainder is −1).
- **The XOR swap on two references to the same slot**, which zeroes it.
- **Missing parentheses:** `n & 1 << i` parses as `n & (1 << i)` by luck, but `n & 1 == 0` doesn't compile.

## Practice

Number of 1 Bits (LC 191), Power of Two (LC 231), Power of Four (LC 342), Missing Number (LC 268), Hamming Distance (LC 461), First Missing Positive (LC 41), Find the Duplicate Number (LC 287).

## Key takeaways

- A trick is a mask plus an operator: `1 << i` with `&` tests, `|` sets, `& ~` clears, `^` toggles.
- `n & (−n)` isolates the lowest set bit; `n & (n − 1)` removes it.
- n is a power of two exactly when `n > 0 && (n & (n − 1)) == 0`.
- Kernighan counts set bits in O(number of set bits).
- XOR of indexes and values finds a missing number in O(1) space; cyclic sort handles values XOR can't cancel.

## Knowledge check

```quiz
? What does 12 & (−12) return?
+ 4, the lowest set bit of 1100
- 12
! −12 shares only one set bit with 12.
- 0
! The lowest set bit survives.
- 8
! That's 12 & 11, which removes the lowest set bit.
> n & (−n) isolates the lowest set bit.

? Why does the power-of-two check need n > 0?
+ Without it, 0 and Integer.MIN_VALUE would pass: n & (n − 1) is 0 for both
- Because negative numbers can't be stored in binary
! They're stored in two's complement.
- Because n − 1 overflows for every positive n
! It only overflows for Integer.MIN_VALUE.
- It doesn't; the bit test alone is enough
! 0 & −1 == 0, so 0 would pass.
> Powers of two are positive and have exactly one set bit.

? How many times does Kernighan's loop run for n = 29 (11101)?
+ 4: once per set bit
- 32: once per bit position
! It skips the zeros.
- 5: once per significant bit
! The zero bit costs nothing.
- 29
! It counts bits, not the value.
> n & (n − 1) clears one set bit per iteration.

? Why does XORing every index and every value find the missing number in 0..n?
+ Each present number cancels with its own index (x ^ x = 0), leaving only the missing one
- Because XOR adds the numbers
! XOR isn't addition; cancellation is the point.
- Because the array is sorted
! Order doesn't matter: XOR is commutative.
- It only works when n is a power of two
! It works for any n.
> Start from n, the one index without a slot in the array.
```
