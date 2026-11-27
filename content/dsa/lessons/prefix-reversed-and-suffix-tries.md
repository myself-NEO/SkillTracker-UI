## The idea

Three tricks reuse the plain trie walk for questions that don't look like prefix questions at first:
- **Where the walk passes word ends** tells you the shortest, or the longest, dictionary word that's a prefix of the input.
- **Reversing the words** turns questions about how words *end* into questions about how they *begin*.
- **Inserting every suffix** of a string turns questions about its substrings into prefix questions, because every substring is a prefix of some suffix.

## When to use it

- "Replace each word by its shortest root", "the longest prefix that's in the dictionary".
- "A word built one letter at a time, with every prefix also a word".
- "Does some word end here?", "`words[i] + words[j]` is a palindrome", suffix matching.
- "Count the distinct substrings", for small strings.

## How it works

- **Shortest and longest prefixes.** Walk the input down the trie and watch for word-end nodes: the first one you meet is the shortest dictionary prefix, and the last one before you fall off is the longest.
- **Reversed words.** Insert each word reversed. Walking a string forwards through that trie then matches the *ends* of the words against the *start* of the string.
- **Suffixes.** Inserting all n suffixes of a string creates exactly one node per distinct substring.

## Java template

The same bare node and insert as in [tries with backtracking and DP](lesson:tries-with-backtracking-and-dp):

```java
private static final class WordNode {
    final WordNode[] next = new WordNode[26];
    boolean isWord;
}

private static void insert(WordNode root, String word) {
    WordNode cur = root;
    for (char ch : word.toCharArray()) {
        int c = ch - 'a';
        if (cur.next[c] == null) cur.next[c] = new WordNode();
        cur = cur.next[c];
    }
    cur.isWord = true;
}
```

## Worked examples

### Replace Words (LC 648): the shortest root

Replace each word in a sentence by the **shortest** dictionary root that is a prefix of it.

```java
// LC 648: replace each word by the shortest dictionary root that is a prefix of it.
public String replaceWords(List<String> dictionary, String sentence) {
    WordNode root = new WordNode();
    for (String r : dictionary) insert(root, r);
    StringBuilder out = new StringBuilder();
    for (String word : sentence.split(" ")) {
        if (out.length() > 0) out.append(' ');
        out.append(shortestRoot(root, word));
    }
    return out.toString();
}

private String shortestRoot(WordNode root, String word) {
    WordNode cur = root;
    for (int i = 0; i < word.length(); i++) {
        cur = cur.next[word.charAt(i) - 'a'];
        if (cur == null) break;
        if (cur.isWord) return word.substring(0, i + 1);   // the first root we meet is the shortest
    }
    return word;
}
```

The first word-ending node met while walking down is the shortest root, so return immediately. Recording the *last* one instead gives the **longest prefix match** that IP routers perform over address bits: see [binary tries](lesson:binary-tries).

### Longest Word in Dictionary (LC 720)

The longest word that can be built one letter at a time, with every prefix also a word. Break ties by the smallest word.

```java
// LC 720: the longest word buildable one letter at a time from other words; ties: smallest.
public String longestWord(String[] words) {
    WordNode root = new WordNode();
    for (String w : words) insert(root, w);
    String[] best = { "" };
    dfs(root, new StringBuilder(), best);
    return best[0];
}

private void dfs(WordNode node, StringBuilder path, String[] best) {
    // a..z order: first is smallest
    if (path.length() > best[0].length()) best[0] = path.toString();
    for (int c = 0; c < 26; c++) {
        WordNode child = node.next[c];
        if (child == null || !child.isWord) continue;     // every prefix must itself be a word
        path.append((char) ('a' + c));
        dfs(child, path, best);
        path.deleteCharAt(path.length() - 1);
    }
}
```

The DFS goes only through children that are themselves words. Visiting `'a'..'z'` in order means the first word found at any length is the smallest one, so a strict `>` comparison keeps it, and no explicit tie-break is needed.

### Palindrome Pairs (LC 336): a trie of reversed words

Find every pair `(i, j)`, `i ≠ j`, such that `words[i] + words[j]` is a palindrome.

**Idea.** `words[i] + words[j]` is a palindrome when `words[i]` *starts with the reverse of `words[j]`* and what's left over in the middle is itself a palindrome. Put every word into a trie **reversed**, then walk each `words[i]` forwards through it. There are two ways to match:

1. **The partner is shorter:** while walking `words[i]`, you reach a node where a reversed word ends. If the rest of `words[i]` is a palindrome, it's a pair.
2. **The partner is longer, or the same length:** `words[i]` is used up at some node. Any reversed word passing through that node whose *unread part* is a palindrome is a pair. Precompute those indexes on each node during insertion (`restIsPalindrome`).

```java
// LC 336: all (i, j), i != j, with words[i] + words[j] a palindrome. A trie of REVERSED words.
public List<List<Integer>> palindromePairs(String[] words) {
    PalNode root = new PalNode();
    for (int i = 0; i < words.length; i++) addReversed(root, words[i], i);
    List<List<Integer>> result = new ArrayList<>();
    for (int i = 0; i < words.length; i++) findPartners(root, words, i, result);
    return result;
}

private static final class PalNode {
    final PalNode[] next = new PalNode[26];
    int wordIndex = -1;                                     // a reversed word ends here
    // words whose not-yet-inserted part is a palindrome
    final List<Integer> restIsPalindrome = new ArrayList<>();
}

private void addReversed(PalNode root, String word, int i) {
    PalNode cur = root;
    for (int j = word.length() - 1; j >= 0; j--) {
        if (isPalindrome(word, 0, j)) cur.restIsPalindrome.add(i);
        int c = word.charAt(j) - 'a';
        if (cur.next[c] == null) cur.next[c] = new PalNode();
        cur = cur.next[c];
    }
    cur.restIsPalindrome.add(i);                            // the empty rest is a palindrome
    cur.wordIndex = i;
}

private void findPartners(PalNode root, String[] words, int i, List<List<Integer>> result) {
    String word = words[i];
    PalNode cur = root;
    for (int j = 0; j < word.length(); j++) {
        // case 1: a shorter partner ended here, and the rest of words[i] is a palindrome
        if (cur.wordIndex >= 0 && cur.wordIndex != i && isPalindrome(word, j, word.length() - 1)) {
            result.add(List.of(i, cur.wordIndex));
        }
        cur = cur.next[word.charAt(j) - 'a'];
        if (cur == null) return;
    }
    for (int k : cur.restIsPalindrome) {                  // case 2: words[i] used up; the partner's
        if (k != i) result.add(List.of(i, k));            // remaining part is a palindrome
    }
}

private static boolean isPalindrome(String s, int lo, int hi) {
    while (lo < hi) {
        if (s.charAt(lo++) != s.charAt(hi--)) return false;
    }
    return true;
}
```

Empty strings work naturally: `""` pairs with every palindrome, in both orders.

### Distinct substrings: a suffix trie

**Every substring is a prefix of some suffix.** Insert all the suffixes of `s` into a trie, and every node is one distinct substring:

```java
// Every substring is a prefix of some suffix: insert all suffixes, count the nodes. O(n^2).
public int countDistinctSubstrings(String s) {
    WordNode root = new WordNode();
    int nodes = 0;
    for (int i = 0; i < s.length(); i++) {
        WordNode cur = root;
        for (int j = i; j < s.length(); j++) {
            int c = s.charAt(j) - 'a';
            if (cur.next[c] == null) {
                cur.next[c] = new WordNode();
                nodes++;                              // a new node = a substring never seen before
            }
            cur = cur.next[c];
        }
    }
    return nodes;
}
```

## Complexity

| Problem | Time | Space |
|---|---|---|
| Replace Words | O(total characters) | the trie of roots |
| Longest Word in Dictionary | O(total characters) | the trie |
| Palindrome Pairs | O(n · k²), for n words of length up to k, against O(n² · k) for checking every pair | O(n · k) nodes, plus the palindrome lists |
| Distinct substrings | O(n²) | O(n²) nodes |

## Variations

### Stream of Characters (LC 1032)

After each letter of a stream, report whether some word ends exactly at the newest letter. Insert the words **reversed**, then walk backwards from the newest letter, stopping at the first word end:

```java
class StreamChecker {
    private final WordNode root = new WordNode();
    private final StringBuilder stream = new StringBuilder();
    private int maxLen;

    public StreamChecker(String[] words) {
        for (String w : words) {
            insert(root, new StringBuilder(w).reverse().toString());
            maxLen = Math.max(maxLen, w.length());
        }
    }

    public boolean query(char letter) {
        stream.append(letter);
        WordNode cur = root;
        for (int i = stream.length() - 1; i >= 0 && stream.length() - i <= maxLen; i--) {
            cur = cur.next[stream.charAt(i) - 'a'];
            if (cur == null) return false;                 // no word ends with these letters
            if (cur.isWord) return true;
        }
        return false;
    }
}
```

Each query costs at most the longest word's length. An [Aho–Corasick automaton](lesson:autocomplete-and-aho-corasick) answers it in O(1) per letter.

### Suffix structures at scale

The suffix trie is O(n²) in time and nodes, which is fine for n ≈ 10³. For larger inputs, the same idea compressed is the **suffix tree** (O(n) nodes), and the practical alternatives are the **[suffix array](lesson:suffix-arrays) with its LCP array** (distinct substrings = `n(n+1)/2 − Σ LCP`) and the **suffix automaton**. Know that they exist and what they're for; they're rarely coded in interviews.

## Common mistakes

- **Returning the last word end instead of the first** when the shortest root is wanted, or the reverse for the longest.
- **Following children that aren't words** in LC 720: every prefix must itself be a word.
- **Pairing a word with itself** in Palindrome Pairs: check `i != j`, but do pair a palindrome with the empty string, both ways round.
- **Building a suffix trie for large n**: it has O(n²) nodes; use a suffix array or automaton.
- **Reversing the query as well as the words**: only one side is reversed.

## Practice

Replace Words (LC 648), Longest Word in Dictionary (LC 720), Short Encoding of Words (LC 820), Stream of Characters (LC 1032), Palindrome Pairs (LC 336), Number of Distinct Substrings in a String (LC 1698).

## Key takeaways

- The first word end on the walk is the shortest dictionary prefix; the last one is the longest.
- In LC 720, recurse only through children that are words, in a..z order, to get the smallest of the longest.
- A trie of reversed words answers questions about word endings with a forward walk.
- Every substring is a prefix of a suffix: inserting all suffixes gives one node per distinct substring, in O(n²).
- Beyond small n, suffix arrays and suffix automata do the same job in near-linear space.

## Knowledge check

```quiz
? The dictionary holds the roots "cat" and "ca". What does Replace Words turn "cattle" into?
+ "ca": the walk meets the word end at "ca" first
- "cat"
! "cat" is longer; the shortest root wins.
- "cattle"
! Two roots are prefixes of it.
- "c"
! "c" isn't a root.
> Return at the first word end.

? The words are a, ap, app, appl, apple and apply. Which word does LC 720 return?
+ "apple": both apple and apply can be built, and the a..z DFS reaches apple first
- "apply"
! It ties with apple on length, and apple is smaller.
- "appl"
! Longer buildable words exist.
- ""
! "a" is a word, so building can start.
> The strict > comparison keeps the first word found at each length.

? Why does Palindrome Pairs insert the words reversed?
+ So that walking words[i] forwards checks whether it starts with the reverse of a partner, which is what the palindrome needs
- To save memory
! The trie holds the same number of characters either way.
- Because palindromes read the same backwards, so the order doesn't matter
! The partners themselves aren't palindromes.
- To sort the pairs
! Reversal has nothing to do with order.
> The leftover middle part must be a palindrome too.

? How many nodes does the suffix trie of "aaa" have, not counting the root?
+ 3: "a", "aa" and "aaa"
- 6
! The suffixes share one path.
- 1
! Each length is a different substring.
- 9
! That counts characters, not distinct substrings.
> Each node is one distinct substring.
```
