## The idea

The array trie from [trie basics](lesson:trie-basics) makes three choices you can change: how a node stores its children, what deleting a word does, and how you read the words back out. Each has a standard answer, picked by the alphabet and by the operations you need.

## When to use it

- **The alphabet isn't 26 lowercase letters** (Unicode, URLs, file paths, mixed case): store the children in a map.
- **Words must be removed**, and `startsWith` must stay truthful afterwards: delete with pruning.
- **You must return the words themselves** (every word with a prefix, in sorted order): run a DFS over the prefix's subtree.
- **Memory is tight**: compress the trie, or use something else.

## How it works

| Children as | Lookup | Ordered iteration | Memory per node | Use when |
|---|---|---|---|---|
| `Node[26]` (or `[128]` for ASCII) | O(1), fastest | yes (index order) | fixed: ~144 bytes for 26 slots, even if empty | small fixed alphabet (LeetCode) |
| `HashMap<Character, Node>` | O(1) average | no | ~150–200 bytes for a node with 1–2 children | large or unknown alphabets (Unicode, URLs) |
| `TreeMap<Character, Node>` | O(log σ) | yes | ~40 bytes per entry | large alphabet **and** sorted output |

A `HashMap` is **not** automatically smaller: its own object overhead outweighs a 26-slot array until the alphabet gets large. The real reason to use one is that a `Node[65536]` per node for Unicode would be absurd.

**Deleting** comes in two strengths. Clearing `isWord` is enough for `search` to be right, but the nodes below no longer lead to any word: they waste memory, and they make `startsWith` lie. For example, after deleting `"cart"`, `startsWith("cart")` would still return true. **Pruning on the way back up** removes them.

**Listing the words** with a prefix is a walk to the prefix's node, then a DFS of its subtree that builds each word in a `StringBuilder`: append a letter, recurse, delete it ([backtracking](lesson:backtracking-template)).

## Java template

```java
// Any alphabet (Unicode, URLs, file paths): a HashMap of children per node.
class MapTrie {
    private static final class Node {
        final Map<Character, Node> next = new HashMap<>();
        boolean isWord;
    }

    private final Node root = new Node();

    public void insert(String word) {
        Node cur = root;
        for (char ch : word.toCharArray()) cur = cur.next.computeIfAbsent(ch, k -> new Node());
        cur.isWord = true;
    }

    public boolean search(String word) {
        Node cur = root;
        for (char ch : word.toCharArray()) {
            cur = cur.next.get(ch);
            if (cur == null) return false;
        }
        return cur.isWord;
    }
}
```

## Worked examples

### Deleting words, with pruning

These methods go inside the [array `Trie`](lesson:trie-basics):

```java
// Remove a word and prune nodes that no longer lead
// to any word. Returns false if it was absent.
public boolean delete(String word) {
    if (!search(word)) return false;
    delete(root, word, 0);
    return true;
}

// returns true if 'node' can be unlinked
private boolean delete(Node node, String word, int depth) {
    if (depth == word.length()) {
        node.isWord = false;
    } else {
        int c = word.charAt(depth) - 'a';
        if (delete(node.next[c], word, depth + 1)) node.next[c] = null;
    }
    return node != root && !node.isWord && hasNoChildren(node);
}

private static boolean hasNoChildren(Node node) {
    for (Node child : node.next) if (child != null) return false;
    return true;
}
```

**How it works:**
- The recursion walks down to the word's last node and clears `isWord`.
- On the way back, each node reports whether it's now useless: not a word end, no children, and not the root.
- The parent unlinks useless children.

Deleting `"cart"` from `{car, cart}` removes only the `t` node, because `r` is still a word end.

### Listing words by prefix

Again, these are methods of the `Trie` class:

```java
// Every word that starts with prefix, in sorted order: the DFS visits children 'a'..'z'.
public List<String> wordsWithPrefix(String prefix) {
    List<String> out = new ArrayList<>();
    Node start = walk(prefix);
    if (start != null) collect(start, new StringBuilder(prefix), out);
    return out;
}

private void collect(Node node, StringBuilder path, List<String> out) {
    if (node.isWord) out.add(path.toString());
    for (int c = 0; c < 26; c++) {
        if (node.next[c] == null) continue;
        path.append((char) ('a' + c));
        collect(node.next[c], path, out);
        path.deleteCharAt(path.length() - 1);   // backtrack
    }
}
```

With array children, visiting `'a'..'z'` in index order yields the words **already sorted**, and a word is recorded before its longer extensions: free lexicographic order. With `HashMap` children you'd have to sort afterwards.

## Complexity

- **Map children:** O(L) average per operation for `HashMap` (one hash per character), O(L log σ) for `TreeMap`.
- **Delete:** O(L) nodes walked down and back up, with a 26-slot scan at each node to check for children.
- **Listing:** O(L) to reach the prefix, plus O(size of its subtree + total characters output).

## Variations

### Memory, and the alternatives

Tries trade memory for speed. 100,000 English words create a few hundred thousand nodes, which at ~144 bytes each is tens of megabytes, for data that's about 1 MB as plain text. When that matters:
- **A compressed (radix or Patricia) trie** merges chains of single-child nodes into one edge labelled with a whole substring. The node count drops to at most 2n, for n words. This is what routers and HTTP path matchers use.
- **A ternary search tree** gives each node `lo`, `eq` and `hi` children, like a BST over characters. Its memory is close to that of the strings themselves, and lookups take O(L + log n).
- **Just sort.** For static data, a sorted array plus binary search answers prefix queries in O(L log n) with no overhead. In Java, `TreeSet.subSet(prefix, prefix + Character.MAX_VALUE)` gives every word with the prefix. This is often the better engineering answer, so say so: [search suggestions](lesson:prefix-search-and-wildcards) shows both.
- **Arrays instead of node objects**: store the trie as `int[][] next = new int[maxNodes][26]`, with node ids in place of references, which removes the object headers. That's common in competitive programming.

### Deleting with counts

When words can repeat, keep a count of the words passing through each node, and cut a branch the moment its count drops to 0, with no recursion: see [counting tries](lesson:counting-tries).

### Sorted output with map children

`HashMap` children iterate in no particular order, so either collect the words and sort them, or use `TreeMap` children, which iterate in key order.

## Common mistakes

- **Deleting by clearing `isWord` only**, which leaves dead branches, so `startsWith` still reports prefixes of deleted words.
- **Pruning too much**: never unlink the root, a word end, or a node that still has children.
- **Deleting a word that isn't there.** Without the `search` check, the recursion follows a missing child and throws `NullPointerException`.
- **Forgetting the `deleteCharAt`** in the listing DFS, which corrupts every word after the first.
- **Expecting sorted output from `HashMap` children.**

## Practice

Implement Trie (Prefix Tree) (LC 208), with a `delete` added; Implement Trie II (LC 1804); Longest Word in Dictionary (LC 720); Search Suggestions System (LC 1268), by listing words; Remove Sub-Folders from the Filesystem (LC 1233), a trie over path segments with map children.

## Key takeaways

- Use `Node[26]` for small fixed alphabets: it's the fastest, and sorted for free.
- Use `HashMap` children for large or unknown alphabets, and `TreeMap` when you also need sorted output.
- Delete by clearing `isWord`, then prune childless non-word nodes on the way back up.
- List the words with a prefix by walking to its node and running a backtracking DFS below it.
- When memory matters, consider a compressed trie, a ternary search tree, or a sorted array.

## Knowledge check

```quiz
? A trie must store URLs, which can contain any printable character. Which children representation fits?
+ A HashMap<Character, Node> per node
- Node[26]
! Uppercase letters, digits and symbols would fall outside the array.
- Node[65536]
! That's 65,536 slots per node, almost all empty.
- A sorted array of all URLs per node
! That's not a trie at all.
> Use TreeMap instead if you also need the URLs in sorted order.

? "cart" is deleted from {car, cart} by clearing isWord only. What does startsWith("cart") return now?
+ true: the t node is still linked, though no word ends there
- false
! Only pruning would remove the t node.
- It throws NullPointerException
! The path is intact.
- It depends on the order of insertion
! The order of insertion doesn't matter.
> Pruning unlinks nodes that no longer lead to any word.

? Why does the listing DFS over Node[26] children return the words in sorted order?
+ It visits the children 'a'..'z' in index order, and records a word before its longer extensions
- Because the words were inserted in sorted order
! The insertion order doesn't affect the trie's shape.
- Because it sorts the list at the end
! No sort is needed.
- It doesn't; the output must be sorted afterwards
! That's only true for HashMap children.
> That's free lexicographic order.

? Deleting "cart" from {car, cart} with pruning removes which nodes?
+ Only the t node
- The r and t nodes
! r is still a word end ("car").
- Every node on the path
! The c, a and r nodes still lead to "car".
- None
! The t node no longer leads to any word.
> Each node reports whether it's useless; the parent unlinks it.
```
