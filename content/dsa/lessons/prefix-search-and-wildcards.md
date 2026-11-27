## The idea

Both problems are walks from the root: one step per typed character for suggestions, and, for wildcards, a walk that **branches into every child** where the pattern says "any letter". What each node stores decides how cheap the answer is once you get there.

## When to use it

- "After each character the user types, return the matching suggestions": search suggestions, autocomplete.
- "`.` matches any one letter", "find the words that match a pattern".
- Many prefix queries against a dictionary that rarely changes.

## How it works

- **Suggestions while typing.** Precompute a short list on each node (here, the three smallest words that pass through it), and keep a pointer to the current node. Each keystroke is then one step and one read. Without a trie, you can sort once and binary-search each prefix.
- **Wildcards.** A normal letter follows one child. A `.` tries every existing child, as a DFS that returns as soon as one branch matches. The trie's sparsity prunes most branches immediately.

## Java template

```java
// Does some word match pattern from node onwards? '.' matches any one letter.
boolean matches(Node node, String pattern, int i) {
    if (i == pattern.length()) return node.isWord;
    char ch = pattern.charAt(i);
    if (ch != '.') {
        Node child = node.next[ch - 'a'];
        return child != null && matches(child, pattern, i + 1);
    }
    for (Node child : node.next) {                      // try every existing branch
        if (child != null && matches(child, pattern, i + 1)) return true;
    }
    return false;
}
```

## Worked examples

### Search Suggestions System (LC 1268)

After each character of `searchWord`, return up to three lexicographically smallest products with the current prefix.

**Approach 1: a trie with a top-3 list on every node.** Insert the products in **sorted order**: then the first three products to pass through a node are its three smallest, so each node keeps the first three it sees. Answering a keystroke is one step down the trie.

```java
// LC 1268: after each typed character, the (at most) 3 smallest products with that prefix.
public List<List<String>> suggestedProducts(String[] products, String searchWord) {
    String[] sorted = products.clone();
    Arrays.sort(sorted);                        // insert in sorted order, so at every node
    SuggestNode root = new SuggestNode();       // the first 3 words to arrive are the 3 smallest
    for (String p : sorted) {
        SuggestNode cur = root;
        for (char ch : p.toCharArray()) {
            int c = ch - 'a';
            if (cur.next[c] == null) cur.next[c] = new SuggestNode();
            cur = cur.next[c];
            if (cur.top.size() < 3) cur.top.add(p);
        }
    }
    List<List<String>> result = new ArrayList<>();
    SuggestNode cur = root;
    for (char ch : searchWord.toCharArray()) {
        cur = (cur == null) ? null : cur.next[ch - 'a'];
        result.add(cur == null ? List.of() : cur.top);
    }
    return result;
}

private static final class SuggestNode {
    final SuggestNode[] next = new SuggestNode[26];
    final List<String> top = new ArrayList<>(3);
}
```

**Approach 2: sort and binary search.** In a sorted array, all the products with prefix `p` form a contiguous run that starts at the first element `≥ p`. As the prefix grows, that start only moves right.

```java
// The same answer without a trie: sort once, then
// binary-search each prefix. Often the better choice.
public List<List<String>> suggestedProductsSorted(String[] products, String searchWord) {
    String[] sorted = products.clone();
    Arrays.sort(sorted);
    List<List<String>> result = new ArrayList<>();
    StringBuilder prefix = new StringBuilder();
    int lo = 0;
    for (char ch : searchWord.toCharArray()) {
        prefix.append(ch);
        String p = prefix.toString();
        lo = lowerBound(sorted, lo, p);          // first product >= p; it only moves right
        List<String> top = new ArrayList<>();
        for (int i = lo; i < sorted.length && top.size() < 3 && sorted[i].startsWith(p); i++) {
            top.add(sorted[i]);
        }
        result.add(top);
    }
    return result;
}

private int lowerBound(String[] a, int lo, String key) {
    int hi = a.length;
    while (lo < hi) {
        int mid = (lo + hi) >>> 1;
        if (a[mid].compareTo(key) < 0) lo = mid + 1;
        else hi = mid;
    }
    return lo;
}
```

**Which to present?** Both are fine. Sorting is simpler and uses no extra memory. The trie wins when the product list is large and fixed, queries are many, and each keystroke must be O(1): exactly the setting of [ranked autocomplete](lesson:autocomplete-and-aho-corasick). Offering both, with that trade-off, is the strong answer.

### Add and Search Words (LC 211)

`search` may contain `.`, which matches any single letter.

```java
// LC 211: search where '.' matches any one letter.
class WordDictionary {
    private static final class Node {
        final Node[] next = new Node[26];
        boolean isWord;
    }

    private final Node root = new Node();

    public void addWord(String word) {
        Node cur = root;
        for (char ch : word.toCharArray()) {
            int c = ch - 'a';
            if (cur.next[c] == null) cur.next[c] = new Node();
            cur = cur.next[c];
        }
        cur.isWord = true;
    }

    public boolean search(String word) {
        return search(root, word, 0);
    }

    private boolean search(Node node, String word, int i) {
        if (i == word.length()) return node.isWord;
        char ch = word.charAt(i);
        if (ch == '.') {                                     // try every existing branch
            for (Node child : node.next) {
                if (child != null && search(child, word, i + 1)) return true;
            }
            return false;
        }
        Node child = node.next[ch - 'a'];
        return child != null && search(child, word, i + 1);
    }
}
```

A normal letter follows one child; a `.` **branches into every existing child**, and the DFS returns as soon as any branch matches.

## Complexity

| | Build | Per query |
|---|---|---|
| Suggestions, trie with top-3 lists | sorting (O(n log n) comparisons of up to L characters), plus O(total characters) to insert | O(1) per keystroke |
| Suggestions, sorted array | the same sort | O(L log n) per keystroke, for the binary search |
| Wildcard search | O(L) per added word | O(L) without dots; up to 26ᵈ paths with d dots |

In practice the trie's sparsity prunes most wildcard branches. A `HashSet` can't do wildcard search at all without enumerating every substitution.

## Variations

- **Keep the current node between keystrokes.** The same pointer drives [ranked autocomplete](lesson:autocomplete-and-aho-corasick), where each node stores frequencies instead of the three smallest words.
- **`*` wildcards**, which match any sequence (including an empty one), make the branching unbounded. To match one pattern against one string, use [two-string DP](lesson:two-string-dp) instead.
- **Stream of Characters (LC 1032):** after each letter, did some word just end? Walk a trie of the words **reversed**, backwards from the newest letter: see [reversed tries](lesson:prefix-reversed-and-suffix-tries).
- **Fuzzy matching:** spell-checkers walk the trie while filling one row of the edit-distance table per node, so words with a shared prefix share their rows.

## Common mistakes

- **Restarting from the root on every keystroke** instead of keeping the current node.
- **Forgetting to stay off the trie** once the prefix matches nothing: every later keystroke has no suggestions either.
- **Inserting the products unsorted** when each node keeps "the first three that arrive".
- **Checking only that the path exists when the pattern ends**: the last node must also be a word end.
- **Expecting the sorted-array start to move left**: a longer prefix's first match is never earlier, which is what lets `lo` carry over.

## Practice

Search Suggestions System (LC 1268), Design Add and Search Words Data Structure (LC 211), Longest Common Prefix (LC 14), Stream of Characters (LC 1032), Design Search Autocomplete System (LC 642).

## Key takeaways

- Keep a pointer to the current node: each typed character is one step.
- Precompute what each keystroke needs on the nodes, such as the three smallest words, inserted in sorted order.
- Sorting plus binary search answers the same prefix queries without a trie; offer both.
- A wildcard branches into every existing child, and the trie's sparsity prunes most branches.
- With d wildcards, the worst case is 26ᵈ paths; a `HashSet` would have to try every substitution.

## Knowledge check

```quiz
? Why does the trie approach to LC 1268 insert the products in sorted order?
+ So the first three words to reach a node are its three smallest, and each node can simply keep the first three
- Because a trie requires sorted input
! A trie accepts any order; this is about the top-3 lists.
- To make the trie smaller
! The node count doesn't depend on the order.
- So the binary search works
! The trie approach has no binary search.
> Then each keystroke reads a ready-made list.

? In the sorted-array approach, why can lo carry over from one keystroke to the next?
+ A longer prefix's first match can't come before the shorter prefix's first match, so the start only moves right
- Because the products are unique
! Uniqueness isn't what makes it work.
- Because lowerBound always returns 0
! It returns the first product ≥ the prefix.
- It can't; each keystroke must search the whole array
! Restarting is correct, but unnecessary.
> p + c sorts after p, so its lower bound is never earlier.

? The dictionary holds cat, bat and car. How does search(".at") proceed?
+ It branches into every first-level child, then follows a and t, returning true at the first full match
- It returns false because '.' isn't a letter
! '.' means any one letter.
- It checks every word in the dictionary one by one
! It follows the trie, pruning branches with no a or t below them.
- It only tries the first child
! It tries children until one branch matches.
> A wildcard branches; a letter follows one child.

? The typed prefix has fallen off the trie. What do the following keystrokes return?
+ Empty lists, until the search is reset
- The suggestions for the last prefix that matched
! No product has the longer prefix.
- The three smallest products overall
! Those don't match the prefix.
- It throws NullPointerException
! The code keeps cur as null and returns empty lists.
> Once off the trie, stay off.
```
