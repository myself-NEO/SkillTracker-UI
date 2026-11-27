## The idea

A trie can steer another search. Walk it **alongside** that search (a DFS over a grid, or a DP over a string), one character at a time, and stop the moment the characters so far spell a prefix that no word has. One walk then finds every word that shares the prefix, instead of one search per word.

## When to use it

- **Many words, one grid**: find every dictionary word that can be traced on a board (Word Search II).
- **Splitting a string into dictionary words**: Word Break, Concatenated Words, the fewest extra characters.
- Any search that asks "is `s[i..j]` a dictionary word?" for many `j` at once.

## How it works

- **On a grid**, start a DFS from every cell and move a trie pointer in step with it. When the next cell's letter has no child, no word continues that way, so the DFS backs off. Store each word on its end node, so a match is reported without rebuilding it from the path.
- **In a DP**, from each reachable start index, walk the trie along the string: every word end you pass marks the index after it as reachable. The walk stops as soon as no word continues, so it costs at most the longest word's length per start, instead of hashing every substring.

## Java template

The bare node used in this lesson and [the next](lesson:prefix-reversed-and-suffix-tries), and the usual insert:

```java
// The bare node used by the problems below, and the usual insert.
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

### Word Search II (LC 212)

Given a letter grid and a list of words, return every word that can be traced through horizontally or vertically adjacent cells, using each cell at most once per word.

**Why a trie:** running the single-word search ([Word Search](lesson:backtracking-choices), LC 79) once per word repeats the same grid walks for every word that shares a prefix. With a trie, **one** DFS from each cell follows the trie alongside the grid path. It stops the moment the path spells a prefix that no word has, and it finds all the words sharing that prefix in the same walk.

```java
// LC 212 Word Search II: every dictionary word that can be traced on the board.
public List<String> findWords(char[][] board, String[] words) {
    WsNode root = new WsNode();
    for (String w : words) {
        WsNode cur = root;
        for (char ch : w.toCharArray()) {
            int c = ch - 'a';
            if (cur.next[c] == null) {
                cur.next[c] = new WsNode();
                cur.children++;
            }
            cur = cur.next[c];
        }
        cur.word = w;                                   // store the whole word at its last node
    }
    List<String> found = new ArrayList<>();
    for (int r = 0; r < board.length; r++) {
        for (int c = 0; c < board[0].length; c++) dfs(board, r, c, root, found);
    }
    return found;
}

private void dfs(char[][] board, int r, int c, WsNode parent, List<String> found) {
    if (r < 0 || c < 0 || r >= board.length || c >= board[0].length) return;
    char ch = board[r][c];
    // visited, or no word continues this way
    if (ch == '#' || parent.next[ch - 'a'] == null) return;
    WsNode node = parent.next[ch - 'a'];
    if (node.word != null) {
        found.add(node.word);
        node.word = null;                               // report each word once
    }
    board[r][c] = '#';                                  // mark visited, in place
    dfs(board, r + 1, c, node, found);
    dfs(board, r - 1, c, node, found);
    dfs(board, r, c + 1, node, found);
    dfs(board, r, c - 1, node, found);
    board[r][c] = ch;                                // restore
    if (node.word == null && node.children == 0) {   // nothing left to find below: prune the branch
        parent.next[ch - 'a'] = null;
        parent.children--;
    }
}

private static final class WsNode {
    final WsNode[] next = new WsNode[26];
    int children;                                       // non-null entries in next[]
    String word;
}
```

**The details that make it fast enough:**
1. **Store the word on its end node**, so you don't have to rebuild it from the path.
2. **Set `node.word = null` after reporting it**, so each word is reported once, without a `Set`.
3. **Mark cells in place** (`'#'`) instead of keeping a `visited[][]` array, and restore them on the way back.
4. **Prune exhausted branches:** when a node has no word and no children left, unlink it from its parent. Later DFS calls then stop earlier. On grids full of the same letter, this is the difference between passing and timing out. The `children` counter makes the check O(1).

### Word Break (LC 139)

Can `s` be split into dictionary words? A trie turns "is `s[i..j]` a dictionary word?" into a **single walk** from `i`, which stops as soon as no word continues.

```java
// LC 139: can s be split into dictionary words? Walk the trie from every reachable start.
public boolean wordBreak(String s, List<String> wordDict) {
    WordNode root = new WordNode();
    for (String w : wordDict) insert(root, w);
    int n = s.length();
    boolean[] reachable = new boolean[n + 1];      // reachable[i]: s[0, i) splits into words
    reachable[0] = true;
    for (int start = 0; start < n; start++) {
        if (!reachable[start]) continue;
        WordNode cur = root;
        for (int end = start; end < n; end++) {
            cur = cur.next[s.charAt(end) - 'a'];
            if (cur == null) break;                 // no dictionary word continues: stop early
            if (cur.isWord) reachable[end + 1] = true;
        }
    }
    return reachable[n];
}
```

`reachable[i]` means "the first `i` characters can be split into words". From every reachable `start`, walk the trie along `s`; each word that ends at `end` makes `end + 1` reachable. The cost is O(n · L) for a longest word of length L, instead of creating O(n²) substrings, and each walk stops early at dead prefixes. The DP itself is covered in [sequence DP](lesson:sequence-dp).

### Concatenated Words (LC 472)

Which words are concatenations of at least two other words from the list?

```java
// LC 472: words that are concatenations of at least two shorter words from the same list.
public List<String> findAllConcatenatedWordsInADict(String[] words) {
    String[] byLength = words.clone();
    Arrays.sort(byLength, Comparator.comparingInt(String::length));   // shorter words first
    WordNode root = new WordNode();
    List<String> result = new ArrayList<>();
    for (String w : byLength) {
        if (w.isEmpty()) continue;
        // the trie holds only shorter (or equal-length, different) words
        if (canBuild(w, root)) result.add(w);
        insert(root, w);
    }
    return result;
}

private boolean canBuild(String w, WordNode root) {   // the word-break DP above
    boolean[] reachable = new boolean[w.length() + 1];
    reachable[0] = true;
    for (int start = 0; start < w.length(); start++) {
        if (!reachable[start]) continue;
        WordNode cur = root;
        for (int end = start; end < w.length(); end++) {
            cur = cur.next[w.charAt(end) - 'a'];
            if (cur == null) break;
            if (cur.isWord) reachable[end + 1] = true;
        }
    }
    return reachable[w.length()];
}
```

**The trick:** process the words **from shortest to longest**, checking each one against a trie that holds only the words seen so far, then insert it. The trie never contains the word itself, and any equal-length word in it differs, so a successful split uses strictly shorter words: at least two of them. That's how the "at least two parts" rule is satisfied without counting parts.

## Complexity

| Problem | Time |
|---|---|
| Word Search II | O(R·C·4·3^(L−1)) worst case (4 directions for the first step, 3 after that), L = the longest word; plus O(total characters) to build the trie |
| Word Break | O(n · L), L = the longest word; plus O(total characters) to build the trie |
| Concatenated Words | the sort, plus a word-break DP for each word: O(len · L) each |

The extra space is the trie, plus O(n) for the DP array, or O(L) recursion depth on the grid.

## Variations

- **Word Break II (LC 140):** return every split, not just whether one exists. Do the same trie walk from each start index, and [memoise](lesson:recursion-in-practice) the list of sentences for each start. The output itself can be exponential.
- **Extra Characters in a String (LC 2707):** the fewest characters left over. `dp[i] = min(dp[i + 1] + 1, dp[end + 1])`, over every word `s[i..end]` found by walking the trie from `i`.
- **Word Squares (LC 425):** build the square row by row. The columns so far fix the prefix the next row must start with, so store on each node the words passing through it, and the candidates for the next row are a single lookup.
- **Without a trie:** Word Break with a `HashSet` checks every substring `s[start..end]`. Capping `end − start` at the longest word helps, but the trie also stops at the first dead prefix and never builds substrings.

## Common mistakes

- **Running the single-word search once per word**, which repeats the same grid walks for every word with a shared prefix.
- **Reporting a word twice** in Word Search II: clear `node.word` after reporting it.
- **Not restoring the cell** after marking it `'#'`, which blocks later paths through it.
- **Not pruning exhausted branches**: on boards full of one letter, that's the difference between passing and timing out.
- **Letting a word build itself** in LC 472: check it before inserting it.

## Practice

Word Search II (LC 212), Word Break (LC 139), Word Break II (LC 140), Concatenated Words (LC 472), Extra Characters in a String (LC 2707), Word Squares (LC 425).

## Key takeaways

- Walk the trie in step with the other search, and stop at the first prefix no word has.
- Word Search II: one DFS per cell follows the trie; store each word on its end node, clear it once found, mark cells in place, and prune empty branches.
- Word Break: from each reachable start, walk the trie and mark the index after every word end.
- Process words from shortest to longest, so a word can only be built from shorter ones.
- The trie bounds each walk by the longest word, and ends it early at dead prefixes.

## Knowledge check

```quiz
? Why does Word Search II set node.word = null after reporting a word?
+ So each word is reported once, even if it can be traced in several places, without a separate Set
- To free memory
! It's about duplicates, not memory.
- To stop the DFS early
! The DFS continues; other words may share the prefix.
- Because the word can't be found twice on a board
! It can be traced along several paths.
> Pruning can then remove the node once its children are gone too.

? In Word Search II, why unlink a node that has no word and no children left?
+ Later DFS calls stop earlier, which on grids full of one letter prevents timeouts
- It's required for correctness
! The answer is the same without it; only the speed changes.
- To report words in sorted order
! Pruning doesn't affect order.
- To allow cells to be reused
! Cells are restored by the backtracking, not by pruning.
> The children counter makes the check O(1).

? In the trie version of Word Break, what does it mean when cur becomes null during the walk from start?
+ No dictionary word begins with s[start..end], so the walk from this start can stop
- s can't be split at all
! Another start may still succeed.
- The dictionary is empty
! It only means no word continues this way.
- reachable[end] must be set to false
! Nothing is marked; the walk just stops.
> That early stop is the trie's advantage over checking every substring.

? Concatenated Words checks the words from shortest to longest. Why?
+ The trie then holds only words that could be parts, so a word never matches itself and any split uses at least two words
- Sorting makes the DP faster
! The DP's cost is the same; the order is about correctness.
- Because LeetCode requires sorted output
! Any order is accepted.
- Longer words can't contain shorter ones otherwise
! The order of checking doesn't change what words contain.
> Check first, then insert.
```
