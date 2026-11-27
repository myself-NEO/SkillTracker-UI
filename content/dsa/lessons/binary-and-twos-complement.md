## What it is

Binary is place value in base 2. Decimal 13 is 1101 in binary, because:

```text
1101 = (1 × 2³) + (1 × 2²) + (0 × 2¹) + (1 × 2⁰)
     =     8    +    4     +    0     +    1
     =    13
```

Each position is a **bit**, numbered from the right starting at 0: bit 0 is the least significant, rightmost bit.

**Why bit manipulation matters in interviews:**
- It tests whether you understand how computers represent data, not just whether you memorised an algorithm.
- It's a shortcut to O(1) extra space, which matters when the interviewer asks "can you do it without extra space?"
- A handful of patterns cover most questions: XOR cancellation, bitmasks for subsets, and counting bits. You don't need fifty tricks; you need to understand about a dozen deeply.

## How it works

Computers need a way to represent negative numbers with only 0s and 1s, in a scheme where ordinary addition still works without special cases. That scheme is **two's complement**, and Java uses it for every signed integer type.

**The rule:** to negate a number, invert every bit, then add 1. Using 8 bits for readability (an `int` has 32, but the logic is identical):

```text
 5 in binary:        00000101
Invert every bit:    11111010
Add 1:               11111011   ← this is -5
```

In real 32-bit Java, `Integer.toBinaryString(-5)` gives `11111111111111111111111111111011`: the same pattern, padded with leading 1s.

**Two consequences to internalise:**
1. **The leftmost bit is the sign bit.** A leading 0 means non-negative, a leading 1 means negative. That's why an `int` holds up to 2³¹ − 1 positive values but 2³¹ negative ones: the all-zeros pattern is 0, and there's no "negative zero".
2. **`~n` (bitwise NOT) equals `−(n + 1)`**, because `−n = ~n + 1`. That identity explains half of the "why does this trick work?" questions.

Adding works unchanged: `5 + (−5)` is `00000101 + 11111011 = 1 00000000`, and the carry out of the top bit is simply dropped, leaving 0.

## Build it from scratch

Printing all 32 bits of an `int`, including the leading zeros that `Integer.toBinaryString` leaves out, and negating by hand:

```java
static String bits32(int n) {
    StringBuilder sb = new StringBuilder(32);
    for (int i = 31; i >= 0; i--) sb.append((n >>> i) & 1);   // bit i, from the top down
    return sb.toString();
}

static int negate(int n) {
    return ~n + 1;                                // two's complement: invert, then add 1
}
```

`bits32(5)` ends in `00000101`, and `bits32(negate(5))` equals `bits32(-5)`. The `>>>` shift treats the bits as a raw pattern; the [operators lesson](lesson:bitwise-operators) explains why it, not `>>`, is the safe choice here.

## Java API

```java
int a = 0b1101;                          // 13: a binary literal (Java 7+)
int mask = 0b1111_0000;                  // underscores group digits for readability
String s = Integer.toBinaryString(13);   // "1101": no leading zeros; negatives print all 32 bits
int b = Integer.parseInt("1101", 2);     // 13: parse binary
int c = Integer.parseUnsignedInt("4294967295");   // -1: the same 32 bits as 2^32 - 1
String u = Integer.toUnsignedString(-1);          // "4294967295"
```

| Type | Width | Range |
|---|---|---|
| `byte` | 8 bits | −128 to 127 |
| `short` | 16 bits | −32,768 to 32,767 |
| `int` | 32 bits | −2,147,483,648 to 2,147,483,647 |
| `long` | 64 bits | about −9.2 × 10¹⁸ to 9.2 × 10¹⁸ |
| `char` | 16 bits | 0 to 65,535 (unsigned!) |

Unlike C and C++, **Java has no unsigned integer types** (except `char`): every `int` and `long` is signed. That's why the `>>>` operator and the `Integer.*Unsigned` helpers exist.

## Operations and complexity

Almost all interview bit manipulation uses `int`: **32 bits**. Keep that number in your head; it explains many of the gotchas. Every bitwise operation on an `int` or a `long` is O(1), and a loop over all the bits is O(32) or O(64): constant, but worth stating as O(number of bits), or O(log n) for a value n.

## Patterns

What the rest of this module covers:
- **The seven operators** and their truth tables: [bitwise operators](lesson:bitwise-operators).
- **Testing, setting and clearing bits**, the lowest set bit, powers of two, counting bits: [bit tricks](lesson:bit-tricks).
- **Java's traps and built-in helpers**: [bits in Java](lesson:bits-in-java).
- **The problem templates**: XOR cancellation, bitmask subsets, counting bits with DP, arithmetic with bits: [bit patterns](lesson:bit-patterns).

## Common mistakes

- **Expecting `Integer.toBinaryString` to pad to 32 bits.** It drops leading zeros for non-negative numbers.
- **Negating `Integer.MIN_VALUE`**: inverting and adding 1 gives the same pattern back, so `-Integer.MIN_VALUE == Integer.MIN_VALUE`.
- **Forgetting that `int` is signed:** a value with bit 31 set is negative, so comparisons and `>>` behave accordingly.
- **Assuming `char` arithmetic is signed:** `char` is Java's only unsigned type.

## Key takeaways

- Binary is base-2 place value; bit 0 is the rightmost bit.
- Two's complement negates by inverting every bit and adding 1; the top bit is the sign.
- `~n == −(n + 1)`.
- An `int` is 32 bits, signed, with one more negative value than positive ones.
- Java has no unsigned `int` or `long`: use `>>>` and the `*Unsigned` helpers to treat bits as a raw pattern.

## Knowledge check

```quiz
? In 8-bit two's complement, what is −5?
+ 11111011
- 10000101
! That's sign-and-magnitude, which Java doesn't use.
- 11111010
! That's ~5; two's complement adds 1.
- 00000101
! That's +5.
> Invert every bit, then add 1.

? What is ~7 in Java?
+ −8
- −7
! ~n is −(n + 1), not −n.
- 0
! ~ flips every bit; it doesn't clear them.
- 8
! The result is negative: the sign bit flips too.
> ~n == −(n + 1).

? Why can an int hold −2³¹ but not +2³¹?
+ The all-zeros pattern is 0, so of the 2³² patterns, 2³¹ are negative and only 2³¹ − 1 are positive
- Because of a bug in the JVM
! It's a property of two's complement.
- Because the sign bit is reserved for positive numbers
! A sign bit of 1 means negative.
- It can hold +2³¹
! Integer.MAX_VALUE is 2³¹ − 1.
> That's why Math.abs(Integer.MIN_VALUE) is negative.

? What does Integer.toBinaryString(5) return?
+ "101"
- "00000000000000000000000000000101"
! Leading zeros are dropped for non-negative numbers.
- "0b101"
! The 0b prefix is only for literals in source code.
- "5"
! That's Integer.toString.
> Negative numbers print all 32 bits, because their top bit is 1.
```
