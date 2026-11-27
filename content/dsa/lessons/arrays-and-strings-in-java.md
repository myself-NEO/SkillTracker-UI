Every technique in this module works on arrays and strings, and their costs in Java follow from two facts: an array is one contiguous block of memory, and a `String` can never change. Get those two right and you can predict the cost of almost every operation you write.

## What it is

- An **array** is a fixed-size, contiguous block of memory holding elements of one type, addressed by index: `int[] arr = new int[10]` reserves exactly 10 slots.
- A **`String`** is an **immutable** sequence of characters. Once created it never changes; every "modification" builds a new `String`.
- **`ArrayList`** and **`StringBuilder`** are the growable counterparts. Each keeps an internal array and replaces it with a bigger copy when it fills up.

## How it works

### Arrays

An array is a **contiguous block of memory**. That single fact explains almost every property you rely on:

- **Random access is O(1).** To get `arr[i]`, the computer computes `base_address + i * element_size` directly. No traversal is needed.
- **Insertion or deletion in the middle is O(n).** Every element after that point has to shift to keep the block contiguous.
- **The size is fixed at creation.** This is why `ArrayList` exists: it is backed by an array that it reallocates and copies when full, so `add` is amortized O(1), with a real O(n) copy whenever it resizes.

A 2-D array in Java, such as `int[][] grid = new int[rows][cols]`, is an **array of arrays**: each row is its own object, and rows can even have different lengths.

### Strings

`s = s + "a"` doesn't modify `s`; it creates an entirely new `String` and reassigns the reference. This single fact drives most string-technique design decisions:

- Concatenating in a loop (`result += c`) is **O(n) per operation**, so a loop of n concatenations is **O(n²)** in total. Writing it without comment is a red flag in an interview.
- **`StringBuilder`** is the mutable counterpart. It keeps a resizable internal buffer, so appends are amortized O(1) and a loop of n appends is O(n) in total.
- `s.charAt(i)` is O(1), because a `String` is backed by an array (a `byte[]` since Java 9's compact strings).
- `s.substring(i, j)` returns a **new** `String` and copies the characters, so it costs O(j − i).
- String **literals** are interned: the JVM keeps one shared copy of each in the string pool. That's why `==` sometimes appears to work on strings, as the [common mistakes](#common-mistakes) explain.

## Build it from scratch

A growable array is a few lines on top of a plain array. This is the idea behind `ArrayList`:

```java
public class IntList {
    private int[] data = new int[8];
    private int size;

    public void add(int value) {                       // amortized O(1)
        if (size == data.length) data = Arrays.copyOf(data, size * 2);   // full: double the capacity
        data[size++] = value;
    }

    public void add(int index, int value) {            // O(n): the tail shifts right
        if (index < 0 || index > size) throw new IndexOutOfBoundsException(index);
        if (size == data.length) data = Arrays.copyOf(data, size * 2);
        System.arraycopy(data, index, data, index + 1, size - index);
        data[index] = value;
        size++;
    }

    public int get(int index) {                        // O(1)
        if (index < 0 || index >= size) throw new IndexOutOfBoundsException(index);
        return data[index];
    }

    public int size() {
        return size;
    }
}
```

Why is `add` O(1) when a resize copies everything? Because the capacity grows **geometrically**. Over n appends, the copies move 8 + 16 + 32 + … < 2n elements in total, so the average cost per `add` is constant. `ArrayList` grows by half its size each time (×1.5) rather than doubling; any constant factor gives the same amortized O(1).

## Java API

```java
int[] arr = new int[5];              // primitive array, all zeros by default
int[] arr2 = {1, 2, 3, 4, 5};        // literal initialisation
int[][] grid = new int[rows][cols];  // 2-D array: an array of arrays

Arrays.sort(arr);                     // in-place sort, ascending
Arrays.fill(arr, 0);                  // fill all slots with a value
int[] copy = Arrays.copyOf(arr, arr.length);
boolean same = Arrays.equals(arr, arr2); // element-wise equality (== only compares references)
String shown = Arrays.toString(arr);  // "[1, 2, 3]", handy when debugging
```

```java
char[] chars = s.toCharArray();      // a mutable copy of the characters
String s2 = new String(chars);       // and back to a String
s.charAt(i);                          // O(1)
s.substring(i, j);                    // a NEW String: an O(j - i) copy
s.equals(other);                      // content comparison: ALWAYS use this
s == other;                           // reference comparison: object identity, not content

StringBuilder sb = new StringBuilder();
for (char c : someChars) {
    sb.append(c);                     // O(1) amortized
}
sb.reverse();                         // in place
sb.setCharAt(0, 'x');
sb.deleteCharAt(sb.length() - 1);
String result = sb.toString();        // O(n), once at the end
```

`Integer[]` (boxed) versus `int[]` (primitive) matters in interviews. Primitives are faster and use less memory: there is no object overhead and no autoboxing. But you need `Integer[]` to sort with a `Comparator`, because `Arrays.sort` has no comparator overload for `int[]`; primitive arrays sort ascending only.

## Operations and complexity

| Operation | Cost | Why |
|---|---|---|
| `arr[i]` read or write | O(1) | address arithmetic |
| Insert or delete at an index (array or `ArrayList`) | O(n) | the tail shifts |
| `ArrayList.add` at the end | amortized O(1) | geometric growth |
| `Arrays.sort(int[])` | O(n log n) | dual-pivot quicksort; not stable, which doesn't matter for primitives |
| `Arrays.sort(Object[])` | O(n log n) | TimSort: stable |
| `s.charAt(i)` | O(1) | backed by an array |
| `s.substring(i, j)`, `s.toCharArray()` | O(length) | copies |
| `s + t` | O(len(s) + len(t)) | builds a new `String` |
| `sb.append(c)` | amortized O(1) | resizable buffer |
| `s.equals(t)` | O(n) | compares characters |

## Patterns

These are the ways arrays and strings show up in the rest of the module:

- **Read and write pointers in one array**, for in-place compaction and partitioning: [two pointers](lesson:two-pointers).
- **Counting characters with a fixed-size array.** When the alphabet is known and small (lowercase English letters → `int[26]`), a frequency array is faster than a `HashMap<Character, Integer>` and avoids boxing. Used by [hashing](lesson:hashing-techniques) and the anagram window in [sliding window](lesson:sliding-window).

  ```java
  int[] freq = new int[26];
  freq[c - 'a']++;   // works because 'a'..'z' are contiguous in the character set
  ```

- **A canonical form**, such as sorting a word's `char[]` so that anagrams compare equal: [hashing](lesson:hashing-techniques).
- **An array one longer than the input**, holding running totals: [prefix sums](lesson:prefix-sums).
- **Grids** as `int[][]` or `char[][]`: [matrix techniques](lesson:matrix-techniques).

## Common mistakes

- **Comparing strings with `==`.** String literals are interned (cached) in Java's string pool, so `"abc" == "abc"` can be `true` by coincidence, but `new String("abc") == "abc"` is `false`. Never rely on `==` for string content; always use `.equals()`.
- **The same trap with `Integer`.** `Integer a = 100, b = 100; a == b` is `true` because values from −128 to 127 are cached, but `Integer a = 200, b = 200; a == b` is `false`: two distinct objects. Use `.equals()`, or compare `intValue()`s.
- **`+=` on a `String` inside a loop**, which is O(n²) in total. Use a `StringBuilder`.
- **`Arrays.asList(arr)` on an `int[]`.** It produces a `List<int[]>` with one element (the whole array), not a `List<Integer>`, because generics don't work with primitives. Use `Integer[]` or `Arrays.stream(arr).boxed().toList()`.
- **Changing the list from `Arrays.asList(...)`.** It's a fixed-size view of the array, so `.add()` and `.remove()` throw `UnsupportedOperationException`. Wrap it in `new ArrayList<>(Arrays.asList(...))` when you need a mutable copy.
- **Expecting `toCharArray()` to share storage.** It returns a copy: changing the `char[]` doesn't change the `String`.

## Key takeaways

- An array is contiguous: O(1) access by index, O(n) to insert or delete in the middle, fixed size. `ArrayList` grows by copying into a bigger array, which keeps `add` amortized O(1).
- `String`s are immutable: build them with `StringBuilder` and compare them with `.equals()`.
- `substring`, `toCharArray` and concatenation all copy, so each costs O(length).
- For a small, known alphabet, count with an `int[26]` (or `int[128]`) rather than a `HashMap`.
- `int[]` can't be sorted with a `Comparator`; box it to `Integer[]`, or sort ascending and reverse.

## Knowledge check

```quiz
? Why is `arr[i]` O(1) for a Java array?
+ The address is computed directly as base + i × element size, with no traversal
- The JVM caches recently used indexes
! Caching isn't what makes indexing constant time; the address arithmetic is.
- Arrays are hash tables under the hood
! An array is a contiguous block, not a hash table.
- The JIT compiler unrolls the lookup
! JIT optimisations don't change the asymptotic cost.
> Contiguous memory means any index is one multiplication and one addition away.

? You build a string of n characters with `result += c` in a loop. What does it cost in total?
- O(n)
! That's the cost with a StringBuilder.
+ O(n²)
- O(n log n)
! Each concatenation copies the whole string so far, which is linear, not logarithmic.
- O(1) amortized per character
! That describes StringBuilder.append, not String concatenation.
> Each += copies the string built so far, so the copies add up to 1 + 2 + … + n.

? What does `new String("abc") == "abc"` evaluate to?
+ false, because == compares references and `new` always creates a new object
- true, because both contain "abc"
! == doesn't compare contents; .equals() does.
- It doesn't compile
! It compiles; it just compares references.
- It depends on the JVM version
! `new` always creates a distinct object, on every JVM.
> Only literals share the pooled instance; use .equals() for content.

? How do you sort an `int[]` in descending order?
- `Arrays.sort(arr, Collections.reverseOrder())`
! There's no Comparator overload for int[], so this doesn't compile.
+ Box it to `Integer[]` and pass a Comparator, or sort ascending and reverse it
- `Arrays.sortDescending(arr)`
! No such method exists.
- Negate every element, sort, and leave them negated
! You must negate them back, and Integer.MIN_VALUE can't be negated.
> Comparators need objects, so either box the values or reverse an ascending sort.

? Why is `ArrayList.add` amortized O(1) even though a resize copies every element?
+ The capacity grows geometrically, so the copies over n adds total O(n)
- `ArrayList` is a linked list underneath
! It's backed by an array.
- Java preallocates a very large array up front
! The default capacity is small; it grows when needed.
- Resizes run on a background thread
! Resizing happens synchronously inside add.
> With growth by a constant factor, each element is copied only a constant number of times on average.
```
