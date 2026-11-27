## What it is

Java's integers have fixed widths and are always signed, and its shift operators mask the shift distance. Those rules make a handful of bit tricks behave differently in Java from C or Python. This lesson collects those traps, the details that separate "knows bit tricks" from "has actually been burned by them", and the built-in helpers on `Integer` and `Long` that replace most hand-written loops.

## How it works

**Operator precedence, and Java's safety net.** In C, `if (n & 1 == 0)` is a classic silent bug: `==` binds **tighter** than `&`, so it means `n & (1 == 0)`. Java has the *same* precedence rule, but since Java doesn't convert between `int` and `boolean`, it's a **compile error** instead of a wrong answer. Still, always parenthesise:

```java
if ((n & 1) == 0) { ... }   // correct, and unambiguous to read
```

**Shift distances wrap around.** When shifting an `int`, Java uses only the **low 5 bits** of the shift distance (the distance mod 32); for a `long`, the low 6 bits (mod 64):

```java
1 << 32   // NOT 0: it equals 1, because 32 & 31 = 0, so this is really 1 << 0
1 << 33   // 2, because 33 & 31 = 1, so this is really 1 << 1
```

People who expect a shift by the full width to zero everything (true in some languages) get burned here.

**`>>` versus `>>>` on negative numbers:**

```java
-8 >> 1    // -4            (arithmetic: the sign bit is copied in)
-8 >>> 1   // 2147483644    (logical: a 0 is shifted in)
```

When a problem says "treat the integer as a 32-bit unsigned pattern" (bit reversal, some hashing problems), you almost certainly want `>>>`.

**Overflow is silent.** `n << k`, or repeated doubling, overflows a 32-bit `int` with no exception: `1 << 31` is already `Integer.MIN_VALUE`. Use `long` (and `1L << k`) when the values can be large.

**`Integer.MIN_VALUE` has no positive counterpart.** `Math.abs(Integer.MIN_VALUE)` still returns `Integer.MIN_VALUE`, because +2,147,483,648 doesn't fit in an `int`.

## Build it from scratch

Reverse Bits (LC 190) by hand, treating the `int` as an unsigned 32-bit pattern:

```java
public int reverseBits(int n) {
    int result = 0;
    for (int i = 0; i < 32; i++) {
        result = (result << 1) | (n & 1);   // append n's lowest bit to the result
        n >>>= 1;                           // >>>: never drag the sign bit in
    }
    return result;
}
```

It loops exactly 32 times, whatever the sign of n. In production, `Integer.reverse(n)` does the same.

## Java API

All of these are static methods on `Integer`, mirrored on `Long` for 64 bits:

| Method | What it does |
|---|---|
| `Integer.bitCount(n)` | the number of 1-bits |
| `Integer.toBinaryString(n)` | the binary string (no leading zeros) |
| `Integer.numberOfTrailingZeros(n)` | the 0s below the lowest set bit |
| `Integer.numberOfLeadingZeros(n)` | the 0s above the highest set bit |
| `Integer.highestOneBit(n)` | the highest set bit, as a power of two |
| `Integer.lowestOneBit(n)` | the lowest set bit: the same as `n & (-n)` |
| `Integer.reverse(n)` | all 32 bits, reversed |
| `Integer.rotateLeft(n, k)`, `rotateRight` | a rotation: the bits shifted out come back in on the other side |
| `Integer.toUnsignedString(n)`, `compareUnsigned`, `divideUnsigned` | treat the 32 bits as an unsigned number |
| `Integer.toHexString(n)`, `toOctalString(n)` | other base representations |

**Interview tip:** it's usually fine to write one of these by hand once, to *prove* you understand the trick (your own bit count, say), then mention "in production I'd use `Integer.bitCount`". That shows both depth and pragmatism.

## Operations and complexity

The helpers are **O(1)**: the JVM compiles methods like `bitCount` and `numberOfTrailingZeros` to single processor instructions where the hardware has them. A hand-written loop over the bits is O(32) for an `int`, which is constant but slower in practice.

## Patterns

- **`⌊log₂ n⌋` for n > 0:** `31 − Integer.numberOfLeadingZeros(n)`, exact, with no floating point.
- **A power of four:** a power of two whose single set bit is at an even position: `n > 0 && (n & (n − 1)) == 0 && Integer.numberOfTrailingZeros(n) % 2 == 0` (LC 342).
- **The next power of two at or above n** (for 1 < n ≤ 2³⁰): `Integer.highestOneBit(n − 1) << 1`.
- **Many flags:** `java.util.BitSet` is a growable bit array, with `set`, `get`, `nextSetBit` and bulk `and`/`or`, for more bits than a `long` holds.

## Common mistakes

- **Unparenthesised bitwise expressions** beside comparisons.
- **Shifting by 32 or more** and expecting 0: the distance wraps mod 32 (mod 64 for `long`).
- **`1 << i` where a `long` mask was meant**: for i ≥ 31 it overflows or wraps; write `1L << i`.
- **`>>` on a value meant as an unsigned pattern**, which drags the sign bit in.
- **Assuming `Math.abs` makes a value non-negative**: not for `Integer.MIN_VALUE`.

## Key takeaways

- Parenthesise: `(n & 1) == 0`. Java rejects the unparenthesised form, but don't rely on that.
- Shift distances are taken mod 32 for `int` and mod 64 for `long`: `1 << 32 == 1`.
- `>>` copies the sign bit; `>>>` shifts in zeros.
- Overflow is silent, `1 << 31` is negative, and `Integer.MIN_VALUE` has no absolute value.
- Know the helpers: `bitCount`, `numberOfTrailingZeros`, `numberOfLeadingZeros`, `highestOneBit`, `lowestOneBit`, `reverse`.

## Knowledge check

```quiz
? What does 1 << 32 evaluate to for an int?
+ 1: the shift distance is taken mod 32, so it's 1 << 0
- 0
! That's what some other languages give; Java masks the distance.
- It throws an ArithmeticException
! Shifts never throw.
- 4294967296
! That doesn't fit in an int.
> For a long, the distance is taken mod 64.

? Why is `if (n & 1 == 0)` a compile error in Java?
+ == binds tighter than &, so it becomes n & (1 == 0), and Java can't AND an int with a boolean
- Because & can't be used on ints
! & works on ints; the precedence is the problem.
- Because 1 == 0 is always false
! The types are the problem, not the value.
- It isn't; it compiles and works
! In C it compiles silently; in Java it doesn't compile.
> Write (n & 1) == 0.

? Which method gives ⌊log₂ n⌋ for a positive int n exactly?
+ 31 − Integer.numberOfLeadingZeros(n)
- (int) (Math.log(n) / Math.log(2))
! Floating-point rounding can be off by one.
- Integer.bitCount(n)
! That counts the set bits.
- Integer.highestOneBit(n)
! That returns 2^⌊log₂ n⌋, not the exponent.
> No floating point needed.

? Reverse Bits shifts n with >>> rather than >>. Why?
+ With >>, a negative n keeps copying its sign bit in, so the bits read later would be wrong
- >>> is faster
! Both are one instruction.
- >> doesn't work on ints
! It does; it just keeps the sign.
- It makes no difference after 32 iterations
! The bits appended along the way would differ.
> Treat the int as a raw 32-bit pattern.
```
