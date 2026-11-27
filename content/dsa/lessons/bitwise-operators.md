## The idea

Java has seven bitwise and shift operators. Each works on every bit position independently (or moves the bits as a block), and each has one job you'll use again and again: `&` checks and clears, `|` sets, `^` toggles and cancels, `~` inverts, and the shifts multiply or divide by powers of two.

## When to use it

- **`&` (AND):** check whether bits are set, mask bits off, or clear them.
- **`|` (OR):** set bits.
- **`^` (XOR):** toggle bits, find where two numbers differ, and cancel out duplicates.
- **`~` (NOT):** build "everything except" masks.
- **`<<`, `>>`:** multiply or floor-divide by 2ᵏ.
- **`>>>`:** shift a 32-bit pattern right without regard to sign: bit reversal, hashing, unsigned values.

## How it works

**AND ( `&` )**: the result bit is 1 only if **both** input bits are 1.

| A | B | A & B |
|---|---|-------|
| 0 | 0 | 0 |
| 0 | 1 | 0 |
| 1 | 0 | 0 |
| 1 | 1 | 1 |

**OR ( `|` )**: the result bit is 1 if **either** input bit is 1.

| A | B | A \| B |
|---|---|--------|
| 0 | 0 | 0 |
| 0 | 1 | 1 |
| 1 | 0 | 1 |
| 1 | 1 | 1 |

**XOR ( `^` )**: the result bit is 1 if the input bits **differ**.

| A | B | A ^ B |
|---|---|-------|
| 0 | 0 | 0 |
| 0 | 1 | 1 |
| 1 | 0 | 1 |
| 1 | 1 | 0 |

**The four XOR identities** to be able to recite:

```text
a ^ a = 0                   (anything XORed with itself vanishes)
a ^ 0 = a                   (XOR with 0 changes nothing)
a ^ b = b ^ a               (commutative)
(a ^ b) ^ c = a ^ (b ^ c)   (associative: order doesn't matter)
```

These four lines are the entire engine behind the "Single Number" family of [bit patterns](lesson:bit-patterns).

**NOT ( `~` )** flips every bit, so `~n == −(n + 1)` ([two's complement](lesson:binary-and-twos-complement)).

**Left shift ( `<<` )** moves the bits left, filling with 0s on the right: multiplying by 2ᵏ, ignoring overflow.

**Right shift ( `>>` )** moves the bits right, filling the **left** with copies of the **sign bit**: floor division by 2ᵏ, preserving the sign of negative numbers.

**Unsigned right shift ( `>>>` )**, Java-specific, fills the left with **0s regardless of sign**. It stands in for the unsigned `int` that Java doesn't have.

## Java template

```java
int a = 0b1100, b = 0b1010;
int and = a & b;        // 0b1000 = 8
int or  = a | b;        // 0b1110 = 14
int xor = a ^ b;        // 0b0110 = 6: the positions where a and b differ
int not = ~5;           // -6
int shl = 5 << 3;       // 101 -> 101000 = 40   (5 * 8)
int shr = 20 >> 2;      // 5                    (20 / 4)
int neg = -8 >> 1;      // -4                   (the sign bit is copied in)
int uns = -8 >>> 1;     // 2147483644           (a 0 is shifted in: a huge positive number)
```

## Worked examples

### Hamming Distance (LC 461)

The number of positions where two numbers differ: XOR marks each one with a 1.

```java
public int hammingDistance(int x, int y) {
    return Integer.bitCount(x ^ y);
}
```

### Number Complement (LC 476)

Flip every bit of n's binary form, up to its highest set bit (no leading zeros): XOR with a mask of that many 1s. Plain `~n` would flip the leading zeros too, making the result negative.

```java
public int findComplement(int num) {
    int mask = (Integer.highestOneBit(num) << 1) - 1;   // 1s covering every bit of num
    return num ^ mask;
}
```

For `num = 5` (`101`), the mask is `111`, and the complement is `010` = 2. (With num up to 2³¹ − 1, the shift overflows to `Integer.MIN_VALUE`, and subtracting 1 still gives the right mask of 31 ones.)

### Do two numbers have opposite signs?

```java
boolean oppositeSigns = (a ^ b) < 0;    // the sign bits differ, so the XOR's sign bit is 1
```

## Complexity

Every operator is **O(1)**: one machine instruction on a fixed 32- or 64-bit value.

## Variations

- **Compound assignments:** `&=`, `|=`, `^=`, `<<=`, `>>=` and `>>>=` combine the operation with assignment: `flags |= 1 << i` sets bit i.
- **`&` and `|` on booleans** are the non-short-circuit forms of `&&` and `||`: both sides are always evaluated.
- **Precedence:** the bitwise operators bind more loosely than `==`, so always parenthesise: `(n & 1) == 0`. See [bits in Java](lesson:bits-in-java) for this and the other traps.

## Common mistakes

- **Writing `n & 1 == 0`**: `==` binds first; in Java that doesn't even compile. Parenthesise.
- **Using `>>` where you meant `>>>`**: on a negative number, `>>` keeps copying the sign bit.
- **Using `~n` as "the complement of n's significant bits"**: it flips all 32 bits, including the leading zeros.
- **Confusing `^` with exponentiation**: `2 ^ 3` is 1, not 8. Use `1 << 3` or `Math.pow`.
- **Expecting `<<` to detect overflow**: bits shifted past the top are silently lost.

## Practice

Hamming Distance (LC 461), Number Complement (LC 476), Complement of Base 10 Integer (LC 1009), Binary Number with Alternating Bits (LC 693), Reverse Bits (LC 190).

## Key takeaways

- `&` checks and clears, `|` sets, `^` toggles, `~` inverts.
- XOR's identities, `a ^ a = 0`, `a ^ 0 = a`, commutative and associative, power the cancellation tricks.
- `<<` multiplies by 2ᵏ; `>>` floor-divides, keeping the sign; `>>>` shifts in zeros.
- `x ^ y` marks the positions where x and y differ.
- Parenthesise every bitwise expression next to a comparison.

## Knowledge check

```quiz
? What is 0b1100 ^ 0b1010?
+ 0b0110 (6)
- 0b1110 (14)
! That's OR.
- 0b1000 (8)
! That's AND.
- 0b0001 (1)
! XOR marks the positions where the bits differ.
> XOR is 1 where the inputs differ.

? What do -8 >> 1 and -8 >>> 1 give?
+ −4 and 2147483644
- −4 and −4
! >>> shifts in a 0, not the sign bit.
- 2147483644 and −4
! They're the other way round.
- 4 and 4
! The shifts don't change the sign that way.
> >> copies the sign bit; >>> fills with 0.

? Why does Number Complement XOR with a mask instead of returning ~num?
+ ~num flips all 32 bits, including the leading zeros, so the result would be negative
- Because ~ isn't defined for ints
! It is: ~5 is −6.
- Because XOR is faster
! Both are one instruction.
- They give the same result
! For 5, ~5 is −6 but the complement is 2.
> The mask covers only the significant bits.

? Which expression is true exactly when a and b have opposite signs?
+ (a ^ b) < 0
- (a & b) < 0
! That's true only when both are negative.
- (a | b) < 0
! That's true when at least one is negative.
- a * b < 0
! It can overflow and give the wrong sign.
> The XOR's sign bit is 1 exactly when the sign bits differ.
```
