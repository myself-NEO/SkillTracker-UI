## The idea

Numbers too big for a `long` can be handled the way you learned at school: digit by digit, from the right, carrying as you go. And a number in any base is just digits times powers of that base, so converting is a loop of `% b` and `/ b` one way, and **Horner's rule** (`value = value * b + digit`) the other.

## When to use it

- Numbers given as strings, too long for a `long`; "without using BigInteger".
- Adding numbers stored as digit arrays or linked lists: Plus One, Add Binary, Add Two Numbers.
- Converting between bases: binary, base 7, hexadecimal, Excel column titles.

## How it works

- **Addition:** walk both numbers from the last digit, add the digits and the carry, write `sum % base`, and carry `sum / base`. Keep going while either number has digits left *or* a carry remains.
- **Multiplication:** digit i of a times digit j of b contributes to position `i + j + 1` of the product, with its carry going to position `i + j`. A product of an n-digit and an m-digit number has at most n + m digits.
- **To base b:** repeatedly take `n % b` (the next digit, least significant first) and `n /= b`, then reverse.
- **From base b:** Horner's rule, `value = value * b + digit`, left to right.
- **Excel columns are "bijective base 26":** there's no zero digit ("Z" is 26 and "AA" is 27), so subtract 1 before each step.

```text
a = 1 2 3   (i = 0..2)       b = 4 5   (j = 0..1)
a[i] * b[j] adds its low digit to pos[i + j + 1] and its carry to pos[i + j]
pos     [0] [1] [2] [3] [4]
         0   5   5   3   5      ->  "5535" after skipping the leading zero (123 * 45 = 5535)
```

## Java template

```java
// Add two numbers written as digit strings in the given base, right to left, carrying.
static String add(String a, String b, int base) {
    StringBuilder sb = new StringBuilder();
    int i = a.length() - 1, j = b.length() - 1, carry = 0;
    while (i >= 0 || j >= 0 || carry > 0) {
        int sum = carry;
        if (i >= 0) sum += a.charAt(i--) - '0';
        if (j >= 0) sum += b.charAt(j--) - '0';
        sb.append(sum % base);
        carry = sum / base;
    }
    return sb.reverse().toString();
}
```

With `base = 10` this is Add Strings (LC 415); with `base = 2`, Add Binary (LC 67).

## Worked examples

### Multiply Strings (LC 43)

```java
// LC 43 Multiply Strings: digit i of a times digit j of b lands in positions i + j and i + j + 1.
public String multiply(String a, String b) {
    int[] pos = new int[a.length() + b.length()];
    for (int i = a.length() - 1; i >= 0; i--) {
        for (int j = b.length() - 1; j >= 0; j--) {
            int sum = (a.charAt(i) - '0') * (b.charAt(j) - '0') + pos[i + j + 1];
            pos[i + j + 1] = sum % 10;
            pos[i + j] += sum / 10;
        }
    }
    StringBuilder sb = new StringBuilder();
    for (int d : pos) {
        if (sb.length() > 0 || d != 0) sb.append(d);   // skip leading zeros
    }
    return sb.length() == 0 ? "0" : sb.toString();
}
```

### Excel Sheet Column Title and Number (LC 168, LC 171)

```java
// LC 168 Excel Sheet Column Title: base 26 with digits
// 1..26 and no zero, so shift down by one each step.
public String convertToTitle(int columnNumber) {
    StringBuilder sb = new StringBuilder();
    while (columnNumber > 0) {
        columnNumber--;                          // 1..26 -> 0..25
        sb.append((char) ('A' + columnNumber % 26));
        columnNumber /= 26;
    }
    return sb.reverse().toString();
}

// LC 171 Excel Sheet Column Number: the inverse, by Horner's rule (value = value * base + digit).
public int titleToNumber(String columnTitle) {
    int value = 0;
    for (char c : columnTitle.toCharArray()) value = value * 26 + (c - 'A' + 1);
    return value;
}
```

### Base 7 (LC 504), negatives included

```java
// LC 504 Base 7, negatives included. Integer.toString(num, 7) gives the same answer.
public String convertToBase7(int num) {
    if (num == 0) return "0";
    StringBuilder sb = new StringBuilder();
    long n = Math.abs((long) num);               // a long, so Integer.MIN_VALUE works too
    while (n > 0) {
        sb.append(n % 7);
        n /= 7;
    }
    if (num < 0) sb.append('-');
    return sb.reverse().toString();
}
```

## Complexity

- Adding an n-digit and an m-digit number: **O(n + m)**.
- Schoolbook multiplication: **O(n · m)**.
- Converting n to base b: **O(log_b n)** digits.

## Variations

- **The same carry loop** powers Plus One (LC 66), Add to Array-Form of Integer (LC 989), and Add Two Numbers (LC 2) on [linked lists](lesson:two-lists-at-once).
- **Fraction to Recurring Decimal (LC 166)** is long division: append `remainder * 10 / d`, and remember each remainder's position in a map. When a remainder repeats, the digits since its first appearance repeat forever. Use `long`s: `Integer.MIN_VALUE / -1` overflows.
- **The library:** `BigInteger` is fine in real code (interviewers ask for these to see clean carry handling). `Integer.toString(n, radix)`, `Integer.parseInt(s, radix)`, `Integer.toBinaryString(n)` and `Long.toHexString(n)` convert bases.

## Common mistakes

- **Stopping when both numbers run out**, and dropping the final carry ("99" + "1").
- **Leading zeros** in a product, and returning `""` instead of `"0"` when one factor is zero.
- **Treating Excel columns as ordinary base 26**, which has a zero digit they lack: subtract 1 first.
- **Negating `Integer.MIN_VALUE`** when handling the sign: widen to `long`.
- **Building the result with `+=`** instead of a `StringBuilder`, then reversing.

## Practice

Add Strings (LC 415), Add Binary (LC 67), Plus One (LC 66), Multiply Strings (LC 43), Excel Sheet Column Title (LC 168), Excel Sheet Column Number (LC 171), Base 7 (LC 504), Fraction to Recurring Decimal (LC 166).

## Key takeaways

- Add from the right, writing `sum % base` and carrying `sum / base`, until both numbers and the carry are used up.
- In multiplication, digit i times digit j lands at position `i + j + 1`, carrying into `i + j`.
- To base b: `% b` and `/ b`, then reverse. From base b: Horner's rule.
- Excel columns have no zero digit: subtract 1 before each step.
- Handle the sign separately, on a `long`.

## Knowledge check

```quiz
? In Multiply Strings, where does the product of digit i of a and digit j of b go?
+ Its low digit into pos[i + j + 1], and its carry into pos[i + j]
- Into pos[i · j]
! Positions add, they don't multiply.
- Into pos[i + j], with the carry into pos[i + j − 1]
! That's one position off.
- Into a separate row, summed at the end
! That works by hand, but the array accumulates directly.
> The product has at most n + m digits.

? What is Excel column 28?
+ "AB"
- "BB"
! That's 2 · 26 + 2 = 54.
- "AA"
! That's 27.
- "B2"
! Excel columns use letters only.
> 28 − 1 = 27 gives 'B' then 1, and 1 − 1 = 0 gives 'A'.

? Why does the Excel conversion subtract 1 before each step?
+ Its digits run from 1 to 26 with no zero, so shifting to 0..25 makes % and / work
- To skip the letter A
! A is used: it's the digit 1.
- Because arrays start at 0
! It's about the number system, not arrays.
- It doesn't need to
! Without it, 26 leaves remainder 0, which has no letter: the loop gives "BA" instead of "Z".
> Bijective base 26.

? When does the addition loop stop?
+ When both numbers have no digits left and there's no carry
- When the shorter number runs out
! The longer number's remaining digits still need adding.
- When both numbers run out
! A final carry would be lost.
- After a fixed number of steps
! The length depends on the inputs.
> "99" + "1" needs the carry to produce "100".
```
