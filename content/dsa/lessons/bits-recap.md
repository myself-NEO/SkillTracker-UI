You don't need fifty bit tricks: about a dozen, understood deeply, plus a way to derive the rest. This recap gathers the signals, the framework, the edge cases and the mistakes for the module.

## Recognizing the pattern

| The problem says… | Reach for |
|---|---|
| elements pair up or repeat; "appears once" | XOR cancellation ([bit patterns](lesson:bit-patterns)) |
| "appears three times except one" | count each bit modulo 3 ([bit patterns](lesson:bit-patterns)) |
| choose subsets or combinations, n ≤ about 20 | bitmask enumeration ([bit patterns](lesson:bit-patterns)) |
| subsets with an optimal cost or a count | [bitmask DP](lesson:bitmask-dp) |
| powers of two, doubling, halving | shifts, `n & (n − 1)` ([bit tricks](lesson:bit-tricks)) |
| count the set bits, for one number or for 0..n | Kernighan, or `dp[i] = dp[i >> 1] + (i & 1)` ([bit tricks](lesson:bit-tricks), [bit patterns](lesson:bit-patterns)) |
| "do X without +, −, *, /" | XOR for the sum, AND-shift for the carry ([bit patterns](lesson:bit-patterns)) |
| a bitwise operation across a whole range of numbers | the common prefix ([bit patterns](lesson:bit-patterns)) |
| where two numbers differ, Hamming distance | `Integer.bitCount(a ^ b)` ([operators](lesson:bitwise-operators)) |
| "treat it as an unsigned 32-bit pattern", reverse the bits | `>>>` and the `Integer` helpers ([bits in Java](lesson:bits-in-java)) |
| the maximum XOR of two numbers | a [binary trie](lesson:binary-tries) |

## Decision procedure

When you hit a bit problem you haven't seen before, work through these steps, in order, out loud:

1. **Restate the problem in bit language.** What do "unique", "set", "count" or "combine" mean at the bit level here?
2. **Write 3–4 small examples by hand, in binary.** Patterns that are invisible in decimal jump out in binary. This is the highest-leverage habit in the whole topic.
3. **Ask the trigger questions** from the table above, in order: pairs, subsets, powers of two, counting, arithmetic, ranges.
4. **State the recurrence or invariant in plain English before writing code.** "Each pair cancels, so the running XOR after all the elements is the lone one" is a sentence to say before typing anything.
5. **Code it, then re-trace your hand examples** against the code. This catches off-by-one and precedence bugs before the interviewer does.
6. **State the time and space complexity, unprompted.** Almost every trick here is O(1) space and O(n) or O(number of bits) time: say so.

## Edge cases to test

| Input | What it breaks |
|---|---|
| 0 | power-of-two checks without `n > 0`; `Integer.highestOneBit(0)` is 0 |
| negative numbers | `>>` versus `>>>`, `n % 2` for oddness, loops that shift until n is 0 |
| `Integer.MIN_VALUE` | `Math.abs`, negation, the power-of-two check |
| −1 (all 32 bits set) | bit counts (32), complements, loops with `>>` that never reach 0 |
| shift distances of 32 or more | `1 << 32 == 1`; `long` masks need `1L << i` |
| n near 31 bits for bitmasks | `1 << n` overflows; 2ⁿ masks may be too many to enumerate |

## Common mistakes

1. **Missing parentheses:** `(n & 1) == 0`, never `n & 1 == 0`.
2. **Expecting a shift by the full width to give 0**: `int` shift distances wrap mod 32, `long` ones mod 64.
3. **`>>` where `>>>` was meant**, which drags the sign bit into a "raw pattern".
4. **`1 << i` for a `long` mask**: write `1L << i`.
5. **The power-of-two check without `n > 0`.**
6. **`n % 2 == 1` for oddness**, which fails on negative odd numbers: use `(n & 1) == 1`.
7. **XOR cancellation when values repeat three times**: count bits modulo 3 instead.
8. **The XOR swap on two references to the same slot**, which zeroes it.
9. **Silent overflow** from `<<` and repeated doubling.

## Practice ladder

**Pattern A: XOR cancellation**
- Single Number (136)
- Missing Number (268)
- Single Number III, two unique numbers (260)
- Single Number II, everything else three times (137)

**Pattern B: bitmask subsets**
- Subsets (78)
- Subsets II, with duplicates (90)
- Maximum XOR of Two Numbers in an Array (421): a [binary trie](lesson:binary-tries), once the core patterns feel solid

**Pattern C: counting bits**
- Number of 1 Bits (191)
- Counting Bits (338)
- Power of Two (231) and Power of Four (342)

**Pattern E: arithmetic and raw bits**
- Sum of Two Integers (371)
- Reverse Bits (190)

**Mixed and foundational**
- Bitwise AND of Numbers Range (201)
- Binary Number with Alternating Bits (693)
- Complement of Base 10 Integer (1009) and Number Complement (476)
- Hamming Distance (461)

## The one-page cheat sheet

```text
Check bit i:           (n & (1 << i)) != 0
Set bit i:             n | (1 << i)
Clear bit i:           n & ~(1 << i)
Toggle bit i:          n ^ (1 << i)
Is odd:                (n & 1) == 1
Multiply by 2^k:       n << k
Divide by 2^k:         n >> k
Lowest set bit:        n & (-n)
Remove lowest set bit: n & (n - 1)
Is power of two:       n > 0 && (n & (n-1)) == 0
Count set bits:        loop "n = n & (n-1)" until 0, counting iterations
Differ in one bit:     Integer.bitCount(a ^ b) == 1
Sum without + / -:     XOR = sum w/o carry, (a&b)<<1 = carry, repeat till carry=0
Clear bits [i..j]:     n & ~(((1 << (j-i+1)) - 1) << i)

XOR identities:  a^a=0   a^0=a   commutative   associative

Java gotchas:
  - int shifts wrap the shift-amount mod 32 (1 << 32 == 1, NOT 0)
  - long shifts wrap mod 64
  - >> keeps the sign bit, >>> always fills with 0
  - always parenthesize: (n & 1) == 0, never n & 1 == 0
```

## Key takeaways

- Most bit problems are XOR cancellation, subset masks, bit counting, mask DP, or arithmetic with bits.
- Write small examples in binary before coding: the pattern usually shows itself there.
- The core tricks are a mask plus an operator, and `n & (−n)` and `n & (n − 1)`.
- Java's traps: precedence, shift distances mod 32 or 64, `>>` versus `>>>`, silent overflow, `Integer.MIN_VALUE`.
- State O(1) space and O(n) or O(number of bits) time out loud.

## Knowledge check

```quiz
? "Find the two numbers that appear once; every other number appears twice." Which pattern?
+ XOR everything, then split by a bit where the two unique numbers differ
- Enumerate all subsets
! That's exponential and unnecessary.
- Count bits modulo 3
! That's for values repeated three times.
- Sort, then compare neighbours
! It works, in O(n log n); XOR does it in O(n) with O(1) space.
> Single Number III.

? "Add two integers without using + or −." Which pattern?
+ XOR for the sum without carries, (a & b) << 1 for the carries, repeated until there are none
- Bitmask enumeration
! Nothing is being chosen.
- Kernighan's bit count
! That counts set bits.
- Multiply by 2 with <<
! Shifting alone doesn't add two numbers.
> It works on negatives too, thanks to two's complement.

? Which input breaks the check (n & (n − 1)) == 0 when it's used without n > 0?
+ 0, and Integer.MIN_VALUE: both pass without being powers of two
- 1
! 1 is 2⁰, a power of two.
- Any odd number above 1
! Those fail the check correctly.
- 2³⁰
! That's a power of two.
> Powers of two are positive.

? n = 22 and you need every subset of n elements. Is bitmask enumeration reasonable?
+ Yes: 2²² is about 4 million masks, fine for an O(2ⁿ · n) loop
- No: masks only work up to n = 8
! An int mask covers up to 31 elements.
- No: 1 << 22 overflows
! Overflow starts at 1 << 31.
- Only with a long
! An int holds masks for up to 31 elements.
> Above about 25, 2ⁿ becomes too large to enumerate.
```
