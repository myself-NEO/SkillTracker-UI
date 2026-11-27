## The idea

A trie node can carry more than an `isWord` flag: any aggregate of the words in its subtree. Update the aggregate on every node along a word's path when you insert or remove the word, and a prefix query becomes "walk to the prefix's node and read its value".

## When to use it

- **Duplicates are allowed**, and you must count the copies of a word: an end count.
- **"How many words start with p?"**: a pass count on every node.
- **"The sum of the values of keys with prefix p"**: a sum on every node (Map Sum).
- **A score for each word built from its prefixes** (Sum of Prefix Scores): read the pass counts along the word's path.

## How it works

Every word passes through the nodes of all its prefixes, so incrementing a counter on each node of the path makes every node count the words below it. Removal is the same walk with decrements. When a key's value can be replaced, update the path by the **difference** between the new value and the old one, which a side `HashMap` remembers.

## Java template

```java
// delta = +1 to add a word, −1 to remove it, or the change in a key's value
void update(String word, int delta) {
    Node cur = root;
    cur.aggregate += delta;
    for (char ch : word.toCharArray()) {
        int c = ch - 'a';
        if (cur.next[c] == null) cur.next[c] = new Node();
        cur = cur.next[c];
        cur.aggregate += delta;                 // every prefix of the word sees the change
    }
}
```

## Worked examples

### Implement Trie II (LC 1804)

Duplicates are allowed: count how many times a word was inserted, count the words that start with a prefix, and erase one copy.

```java
// LC 1804 Trie II: duplicates allowed; count exact words and prefixes; erase one copy.
class CountingTrie {
    private static final class Node {
        final Node[] next = new Node[26];
        int passCount;                       // words that pass through or end at this node
        int endCount;                        // words that end exactly here
    }

    private final Node root = new Node();

    public void insert(String word) {
        Node cur = root;
        cur.passCount++;
        for (int k = 0; k < word.length(); k++) {
            int c = word.charAt(k) - 'a';
            if (cur.next[c] == null) cur.next[c] = new Node();
            cur = cur.next[c];
            cur.passCount++;
        }
        cur.endCount++;
    }

    public int countWordsEqualTo(String word) {
        Node end = walk(word);
        return end == null ? 0 : end.endCount;
    }

    public int countWordsStartingWith(String prefix) {
        Node end = walk(prefix);
        return end == null ? 0 : end.passCount;
    }

    public void erase(String word) {         // precondition (as in LC 1804): the word is present
        Node cur = root;
        cur.passCount--;
        for (int k = 0; k < word.length(); k++) {
            int c = word.charAt(k) - 'a';
            if (--cur.next[c].passCount == 0) {   // no other word uses this branch: drop all of it
                cur.next[c] = null;
                return;
            }
            cur = cur.next[c];
        }
        cur.endCount--;
    }

    private Node walk(String s) {
        Node cur = root;
        for (int k = 0; k < s.length() && cur != null; k++) cur = cur.next[s.charAt(k) - 'a'];
        return cur;
    }
}
```

**The idea:** two counters per node.
- **`passCount`** is incremented on every node along the path, so a prefix's node knows how many words lie below it.
- **`endCount`** counts the words that end exactly there.

Erasing decrements along the path. When a child's `passCount` drops to 0, nothing else uses that branch, so the whole branch is cut in one assignment.

### Map Sum Pairs (LC 677)

Nodes can carry any aggregate of their subtree. LC 677 has `insert(key, val)` (re-inserting a key replaces its value) and `sum(prefix)` (the total of the values of the keys with that prefix).

```java
// LC 677: each node stores the sum of the values of all keys below it.
class MapSum {
    private static final class Node {
        final Node[] next = new Node[26];
        int sum;
    }

    private final Node root = new Node();
    private final Map<String, Integer> values = new HashMap<>();

    public void insert(String key, int val) {
        int delta = val - values.getOrDefault(key, 0);   // re-inserting a key REPLACES its value
        values.put(key, val);
        Node cur = root;
        cur.sum += delta;
        for (char ch : key.toCharArray()) {
            int c = ch - 'a';
            if (cur.next[c] == null) cur.next[c] = new Node();
            cur = cur.next[c];
            cur.sum += delta;
        }
    }

    public int sum(String prefix) {
        Node cur = root;
        for (char ch : prefix.toCharArray()) {
            cur = cur.next[ch - 'a'];
            if (cur == null) return 0;
        }
        return cur.sum;
    }
}
```

**The trick is the `delta`:** when a key is re-inserted, every node on its path must change by `new − old`, not by `new`. The side `HashMap` remembers the old values.

## Complexity

Every operation walks one word: **O(L)**. Space is O(total characters) nodes, each with one or two counters; Map Sum's side map adds one entry per key.

## Variations

### Sum of Prefix Scores (LC 2416)

The score of a word is the sum, over each of its prefixes, of how many words start with that prefix. Insert every word with pass counts, then walk each word again and add up the counts along its path:

```java
public int[] sumPrefixScores(String[] words) {
    CountNode root = new CountNode();
    for (String w : words) {
        CountNode cur = root;
        for (char ch : w.toCharArray()) {
            int c = ch - 'a';
            if (cur.next[c] == null) cur.next[c] = new CountNode();
            cur = cur.next[c];
            cur.passCount++;
        }
    }
    int[] scores = new int[words.length];
    for (int i = 0; i < words.length; i++) {
        CountNode cur = root;
        for (char ch : words[i].toCharArray()) {
            cur = cur.next[ch - 'a'];
            scores[i] += cur.passCount;          // the words that share this prefix
        }
    }
    return scores;
}

private static final class CountNode {
    final CountNode[] next = new CountNode[26];
    int passCount;
}
```

### Lists on nodes

Instead of a number, a node can keep a short list: the three smallest words through it, or the most frequent ones. That's how [search suggestions](lesson:prefix-search-and-wildcards) and [ranked autocomplete](lesson:autocomplete-and-aho-corasick) answer each keystroke with one step.

### Counts on bits

The same pass counts on a [binary trie](lesson:binary-tries) let you remove numbers, and count how many numbers have an XOR with x below a limit.

## Common mistakes

- **Incrementing only the last node**, so prefix counts miss every word that continues further.
- **Adding the new value on re-insert** instead of the difference, which counts a replaced key twice.
- **Erasing a word that isn't there**: the decrements corrupt the counts, and a missing child throws. LC 1804 promises the word is present; real code should check first.
- **Cutting a branch when the end count reaches 0** instead of the pass count: longer words may still use the branch.

## Practice

Implement Trie II (Prefix Tree) (LC 1804), Map Sum Pairs (LC 677), Sum of Prefix Scores of Strings (LC 2416), Count Prefix and Suffix Pairs II (LC 3045).

## Key takeaways

- Nodes can store any aggregate of their subtree: counts, sums, short lists.
- Update every node on the word's path; a prefix query then reads one node.
- Pass counts answer "how many words start with p"; end counts answer "how many copies of w".
- Replace a value by applying its difference, remembered in a side map.
- When a pass count reaches 0, the whole branch below is unused and can be cut in one step.

## Knowledge check

```quiz
? The counting trie holds "app", "apple" and "app" again. What do countWordsEqualTo("app") and countWordsStartingWith("app") return?
+ 2 and 3
- 1 and 2
! Duplicates are counted: "app" was inserted twice.
- 2 and 2
! "apple" also starts with "app".
- 3 and 3
! Only two words equal "app" exactly.
> endCount counts exact copies; passCount counts everything below.

? Map Sum: insert("apple", 3), then insert("apple", 2). What does sum("ap") return?
+ 2, because re-inserting a key replaces its value
- 5
! That adds both values instead of replacing.
- 3
! The second insert replaced 3 with 2.
- 0
! "apple" starts with "ap".
> The path changes by the difference, 2 − 3.

? Why can erase stop as soon as a child's passCount drops to 0?
+ No other word uses that branch, so unlinking the child removes the whole unused branch at once
- Because the word ends there
! The word may continue below; it's the count that matters.
- To avoid a NullPointerException
! It's about cutting the dead branch, not avoiding an exception.
- It can't; every node must be decremented
! Nodes below an unlinked child are discarded anyway.
> One assignment removes the branch.

? Words "abc", "ab", "bc" and "b". What is the prefix score of "abc"?
+ 5: "a" starts 2 words, "ab" starts 2 and "abc" starts 1
- 3
! Each prefix counts every word that starts with it.
- 4
! "a" and "ab" each start two words.
- 6
! "abc" itself starts only one word.
> Add up the pass counts along the word's path.
```
