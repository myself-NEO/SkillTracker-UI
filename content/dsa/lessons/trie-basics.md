## What it is

A **trie** (from re*trie*val, usually pronounced "try") is a tree in which **each edge is a character** and **each path from the root spells a prefix**. Words that share a prefix share the path for it.

```text
words: car, cart, cat, dog

            (root)
            /    \
           c      d
           |      |
           a      o
          / \     |
         r*  t*   g*          * = a word ends here (isWord)
         |
         t*
```

Tries show up in fewer problems than arrays or graphs, but when they do, the trie is usually *the* idea, and the problems are often rated hard. They also run real systems: autocomplete, spell-checkers, predictive text, and the longest-prefix matching in IP routing tables.

## How it works

Three facts explain every trie algorithm:
1. **A node = a prefix.** The node reached by following `c → a` represents the prefix `"ca"`, and its subtree holds exactly the words that start with `"ca"`.
2. **Lookups cost O(L), the length of the key, independent of how many words are stored.** With a million words, finding `"cart"` still takes 4 steps.
3. **A node's path existing ≠ a word existing.** `"ca"` is a path, but not a word. That's why every node needs an `isWord` flag (or a count, or the word itself).

How it compares with the structures you already know:

| Need | `HashSet<String>` | `TreeSet<String>` / sorted array | Trie |
|---|---|---|---|
| Is `w` a word? | O(L) average | O(L log n) | O(L) |
| Does any word start with `p`? | ✗ (scan everything) | O(L log n) (`ceiling(p)`) | O(L) |
| All words with prefix `p`, sorted | ✗ | O(L log n + output) | O(L + output) |
| Character-by-character typing | recompute each time | binary search each time | **keep a pointer, one step per key** |
| Wildcards (`c.t`), grid search with pruning | ✗ | awkward | **natural** |
| Max XOR, longest prefix match | ✗ | ✗ | **natural** (binary / IP tries) |
| Memory | low | low | **high** (a node per character) |

The sentence to say when the interviewer asks "why a trie?":

> *I need many prefix queries, or to extend a prefix one character at a time and know immediately whether any word still continues. A trie answers that in O(1) per character.*

## Build it from scratch

**LC 208 Implement Trie**: `insert`, `search` (whole word) and `startsWith` (prefix).

```java
// LC 208. Lowercase 'a'..'z' only, so each node has an array of 26 children.
class Trie {
    private static final class Node {
        final Node[] next = new Node[26];
        boolean isWord;                      // a word ENDS here (not just passes through)
    }

    private final Node root = new Node();

    public void insert(String word) {
        Node cur = root;
        for (int k = 0; k < word.length(); k++) {
            int c = word.charAt(k) - 'a';
            if (cur.next[c] == null) cur.next[c] = new Node();   // create the path on demand
            cur = cur.next[c];
        }
        cur.isWord = true;
    }

    public boolean search(String word) {
        Node end = walk(word);
        return end != null && end.isWord;    // the path exists AND a word ends there
    }

    public boolean startsWith(String prefix) {
        return walk(prefix) != null;         // the path exists: some word continues from here
    }

    private Node walk(String s) {            // follow s from the root; null if we fall off
        Node cur = root;
        for (int k = 0; k < s.length() && cur != null; k++) cur = cur.next[s.charAt(k) - 'a'];
        return cur;
    }
}
```

**The non-obvious parts:**
- **`search` and `startsWith` differ only in the last check.** Both walk the path. `search` also needs `isWord`, because inserting `"cart"` makes the path `"car"` exist even if `"car"` was never inserted.
- **`walk` is the workhorse.** Almost every trie method starts with "walk the prefix, then do something at that node". Write it once.
- **`c - 'a'` maps `'a'..'z'` to `0..25`.** Anything outside that range (uppercase, digits, spaces) throws `ArrayIndexOutOfBoundsException`, so check the alphabet in the constraints. Other alphabets need map children: see [design choices](lesson:trie-design-choices).

## Java API

The JDK has no trie class: in interviews you write your own. When you only need prefix queries over words that rarely change, a sorted set does the job with no extra memory:

```java
TreeSet<String> words = new TreeSet<>(List.of("car", "cart", "cat", "dog"));
SortedSet<String> withCa = words.subSet("ca", "ca" + Character.MAX_VALUE);   // [car, cart, cat]
String first = words.ceiling("ca");                                          // "car": the first word >= "ca"
boolean anyStartsWithCa = first != null && first.startsWith("ca");
```

Each query costs O(L log n). Outside the JDK, Apache Commons Collections has a `PatriciaTrie` (a compressed trie) with a `prefixMap(prefix)` view.

## Operations and complexity

| Operation | Time | Notes |
|---|---|---|
| `insert`, `search`, `startsWith` | O(L) | L = the key's length, whatever the number of words |
| All words with a prefix | O(L + output) | sorted for free with array children ([listing words](lesson:trie-design-choices)) |
| Space | O(total characters) nodes | fewer when words share prefixes; each array node holds 26 references |

## Patterns

The rest of this module, at a glance:
- **Choose the node layout, delete words, list them**: [design choices](lesson:trie-design-choices).
- **Store counts or values on nodes**: [counting tries](lesson:counting-tries).
- **Answer as the user types, and match wildcards**: [prefix search and wildcards](lesson:prefix-search-and-wildcards).
- **Prune a grid search or a word-break DP**: [tries with backtracking and DP](lesson:tries-with-backtracking-and-dp).
- **Shortest roots, reversed words, all suffixes**: [prefix, reversed and suffix tries](lesson:prefix-reversed-and-suffix-tries).
- **Maximum XOR over the bits of numbers**: [binary tries](lesson:binary-tries).
- **Ranked autocomplete, and many patterns in one pass**: [autocomplete and Aho–Corasick](lesson:autocomplete-and-aho-corasick).

### Longest common prefix (LC 14)

A small first pattern, written as a method of the `Trie` above: after inserting every word, walk down from the root while there's exactly one way to continue and no word has ended yet.

```java
public String longestCommonPrefix() {
    StringBuilder prefix = new StringBuilder();
    Node cur = root;
    while (!cur.isWord) {                                  // a word ends here: the prefix can't grow
        int only = -1;
        for (int c = 0; c < 26; c++) {
            if (cur.next[c] == null) continue;
            if (only != -1) return prefix.toString();      // a second branch: the words split here
            only = c;
        }
        if (only == -1) break;                             // no children: no words were inserted
        prefix.append((char) ('a' + only));
        cur = cur.next[only];
    }
    return prefix.toString();
}
```

## Common mistakes

- **Confusing "the path exists" with "the word exists"**: `search` must check `isWord`.
- **A `[26]` array with uppercase letters, digits or spaces**: `ArrayIndexOutOfBoundsException`. Check the alphabet in the constraints.
- **Re-walking from the root in every method** instead of writing `walk` once.
- **Using a trie where a `HashSet` is enough.** For exact lookups only, a hash set is simpler and smaller.
- **Ignoring memory.** Every character can become a node with 26 references; say so when the dictionary is large.

## Key takeaways

- A trie node is a prefix, and its subtree holds exactly the words with that prefix.
- `insert`, `search` and `startsWith` walk the string: O(L), whatever the number of words.
- `search` needs `isWord`; `startsWith` only needs the path to exist.
- Reach for a trie for many prefix queries or character-by-character extension; use a `HashSet` for exact lookups.
- The JDK has no trie: write the array version, or use a `TreeSet`'s `subSet` for static prefix queries.

## Knowledge check

```quiz
? After inserting only "cart", what do search("car") and startsWith("car") return?
+ false and true
- true and true
! The path "car" exists, but no word ends there.
- false and false
! startsWith only needs the path, which exists.
- true and false
! search is the stricter of the two.
> search needs isWord at the end node; startsWith only needs the node.

? A trie holds a million words. How many steps does search("cart") take?
+ 4: one step per character, whatever the number of words
- About 20, like a binary search over a million words
! A trie doesn't binary-search; it follows one edge per character.
- Up to a million
! It never scans the other words.
- About 80: four characters times 20 comparisons
! That's the sorted array's cost.
> Lookups cost O(L), independent of n.

? When is a HashSet<String> a better choice than a trie?
+ When you only need exact-word lookups
- When you need every word with a given prefix
! A hash set would have to scan every word.
- When you extend a prefix one character at a time
! A trie keeps a pointer and steps once per character.
- When you need wildcard search
! A hash set can't branch on a wildcard.
> Tries earn their memory with prefix queries.

? Why does inserting "Cat" into the array trie throw?
+ 'C' - 'a' is negative, outside the 26-slot array
- Because strings are immutable
! Immutability doesn't matter here.
- Because the trie is empty
! insert creates nodes as needed.
- It doesn't; Java lowercases the character automatically
! Nothing is lowercased for you.
> Check the alphabet, or use map children.
```
