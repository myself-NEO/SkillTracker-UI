## The idea

Two advanced uses of a trie, both built on keeping a pointer to the **current node** and moving it one step per character:
- **Ranked autocomplete:** each node stores the frequencies of the sentences below it, so each keystroke is one step plus a small top-k selection.
- **Aho–Corasick:** give every node of a trie of patterns a **failure link**, and the trie becomes an automaton that finds every occurrence of every pattern in one pass over a text.

## When to use it

- "As the user types, return the top k past entries with this prefix", ranked by frequency.
- "Find every occurrence of many patterns in a long text": banned words in chat messages, virus signatures, keyword tagging.
- "After each character of a stream, did some pattern just end?"

## How it works

**Autocomplete.** Keep a pointer to the node for the text typed so far. Each new character moves it one step; once the prefix falls off the trie, it stays off until the sentence ends. Each node keeps a map of the counts of every sentence below it, so the top three come from one map and a size-3 heap.

**Aho–Corasick.** Running [KMP](lesson:kmp) once per pattern costs O(patterns × text). **Aho–Corasick** does it in **one pass** over the text: O(text + total pattern length + matches). Build a trie of the patterns, then add a **failure link** to every node: it points to the node for the **longest proper suffix** of that node's string that's also in the trie. It's KMP's failure function, generalised from one pattern to a trie. While scanning the text, when the next character has no edge, follow failure links instead of restarting. Precomputing every missing transition turns the trie into an automaton with exactly one step per text character.

```text
patterns: he, she, his, hers         text: ushers

trie path "she" --fail--> "he"   (the longest suffix of "she" in the trie)
scanning "ushers": at 'e' (end of "she") we also report "he" via the fail link;
at 's' after "her" we reach "hers".
matches: she@1, he@2, hers@2
```

## Java template

```java
Node cur = root;
for (char ch : text.toCharArray()) {
    cur = step(cur, ch);    // autocomplete: cur.next.get(ch), staying off the trie once null
                            // Aho–Corasick: cur.next[ch - 'a'], with the missing edges filled in
    report(cur);            // the top suggestions, or the patterns that end here
}
```

## Worked examples

### Design Search Autocomplete System (LC 642)

As the user types, return the top three past sentences with the current prefix, by frequency, with ties broken alphabetically. `'#'` ends a sentence and records it.

```java
// LC 642 (simplified autocomplete): after each typed character, the top 3 past sentences with that
// prefix by frequency, ties broken alphabetically. '#' ends the sentence and records it.
class AutocompleteSystem {
    private static final class Node {
        final Map<Character, Node> next = new HashMap<>();     // letters and spaces
        final Map<String, Integer> counts = new HashMap<>();   // every sentence below this node
    }

    private final Node root = new Node();
    private final StringBuilder typed = new StringBuilder();
    private Node cur = root;                                   // node for the text typed so far

    public AutocompleteSystem(String[] sentences, int[] times) {
        for (int i = 0; i < sentences.length; i++) add(sentences[i], times[i]);
    }

    public List<String> input(char c) {
        if (c == '#') {
            add(typed.toString(), 1);
            typed.setLength(0);
            cur = root;
            return List.of();
        }
        typed.append(c);
        cur = (cur == null) ? null : cur.next.get(c);          // once we fall off, stay off
        if (cur == null) return List.of();
        PriorityQueue<Map.Entry<String, Integer>> worstFirst = new PriorityQueue<>((a, b) ->
                a.getValue().equals(b.getValue())
                        ? b.getKey().compareTo(a.getKey())
                        : Integer.compare(a.getValue(), b.getValue()));
        for (Map.Entry<String, Integer> e : cur.counts.entrySet()) {
            worstFirst.offer(e);
            if (worstFirst.size() > 3) worstFirst.poll();       // keep the best 3
        }
        List<String> result = new ArrayList<>();
        while (!worstFirst.isEmpty()) result.add(worstFirst.poll().getKey());
        Collections.reverse(result);
        return result;
    }

    private void add(String sentence, int times) {
        Node node = root;
        for (char ch : sentence.toCharArray()) {
            node = node.next.computeIfAbsent(ch, k -> new Node());
            node.counts.merge(sentence, times, Integer::sum);
        }
    }
}
```

**Design choices worth saying out loud:**
- **Keep a pointer to the current node** between keystrokes. Each character costs one step, not a walk from the root. Once the prefix falls off the trie, it stays off until `'#'`.
- **Each node stores the counts of the sentences below it.** That costs memory (roughly every sentence repeated once per character), but it makes a query "scan one node's map with a size-3 heap" instead of a DFS over the whole subtree.
- **Top-k with a min-heap of size 3** ([top k](lesson:top-k-and-two-heaps)). Its comparator puts the *worst* candidate on top (the lowest count, then the alphabetically larger), so `poll` evicts it.

### Aho–Corasick: many patterns, one pass

```java
// Every occurrence of every pattern in a text, in O(text + total pattern length + matches).
class AhoCorasick {
    private static final class Node {
        final Node[] next = new Node[26];
        // longest proper suffix that is also in the trie
        Node fail;
        // patterns ending here, directly or via fail links
        final List<Integer> output = new ArrayList<>();
    }

    private final Node root = new Node();
    private final int[] lengths;

    AhoCorasick(String[] patterns) {
        lengths = new int[patterns.length];
        for (int p = 0; p < patterns.length; p++) {        // 1. an ordinary trie of the patterns
            lengths[p] = patterns[p].length();
            Node cur = root;
            for (char ch : patterns[p].toCharArray()) {
                int c = ch - 'a';
                if (cur.next[c] == null) cur.next[c] = new Node();
                cur = cur.next[c];
            }
            cur.output.add(p);
        }
        Deque<Node> queue = new ArrayDeque<>();            // 2. failure links, level by level (BFS)
        root.fail = root;
        for (int c = 0; c < 26; c++) {
            if (root.next[c] != null) {
                root.next[c].fail = root;
                queue.add(root.next[c]);
            } else {
                root.next[c] = root;                       // a missing edge at the root loops back
            }
        }
        while (!queue.isEmpty()) {
            Node node = queue.poll();
            node.output.addAll(node.fail.output);     // matches that end in our suffix end here too
            for (int c = 0; c < 26; c++) {
                Node child = node.next[c];
                if (child != null) {
                    // the fail node is shallower: already complete
                    child.fail = node.fail.next[c];
                    queue.add(child);
                } else {
                    // fill the gap: the trie becomes an automaton
                    node.next[c] = node.fail.next[c];
                }
            }
        }
    }

    // {patternIndex, startIndex} for every match, in order of where the match ends.
    List<int[]> findAll(String text) {
        List<int[]> matches = new ArrayList<>();
        Node cur = root;
        for (int i = 0; i < text.length(); i++) {
            // exactly one step per character, no backtracking
            cur = cur.next[text.charAt(i) - 'a'];
            for (int p : cur.output) matches.add(new int[] { p, i - lengths[p] + 1 });
        }
        return matches;
    }
}
```

**The details:**
- Failure links are computed **breadth-first**, because a node's link points to a shallower node, whose own link and transitions must already be complete.
- `output` merges the fail node's patterns, so a node reports every pattern that ends at this position, including shorter ones that are suffixes (`he` inside `she`).
- Missing edges are filled with the fail node's transition (`node.next[c] = node.fail.next[c]`), so `findAll` never loops: it moves exactly one step per character.

## Complexity

| | Build | Per character | Memory |
|---|---|---|---|
| Autocomplete | O(total sentence length) map updates | O(m) to scan the m sentences under the node, with a size-3 heap | each sentence stored once per character of it |
| Aho–Corasick | O(total pattern length · σ), σ = the alphabet size | O(1), plus each match reported | O(total pattern length · σ) |

## Variations

### Autocomplete at scale

Search engines precompute and store only the top k suggestions per node, update them in offline batches rather than on every keystroke, shard the trie by prefix, cache hot prefixes, and add typo tolerance (an edit-distance search over the trie).

### Output links instead of copied lists

Merging each fail node's `output` into its own list is simple, but long chains of nested patterns copy the same indexes many times. Larger implementations store a **dictionary link** instead: a pointer to the nearest node along the failure chain where a pattern ends, followed at report time.

### Stream of Characters (LC 1032)

Feed each letter of the stream to the automaton, and answer `true` when the current node's `output` isn't empty: O(1) per letter. A [trie of reversed words](lesson:prefix-reversed-and-suffix-tries) is the simpler alternative.

### Tries in real systems

| Where | Which trie |
|---|---|
| IP routing (longest prefix match) | binary or Patricia tries over address bits ([binary tries](lesson:binary-tries)) |
| HTTP routers (`/users/{id}/orders`) | radix trees over path segments |
| Search boxes, IDE completion | tries with a top-k list per node |
| Spell checkers | a trie plus an edit-distance search |
| Content filtering, intrusion detection | Aho–Corasick automata |
| Linux kernel page cache | a radix tree (now the "XArray"), keyed by page index |
| Ethereum state | a Merkle Patricia trie |

## Common mistakes

- **Restarting from the root on every keystroke** instead of keeping the current node.
- **The wrong heap order**: a size-k min-heap must keep the *worst* candidate on top (the lowest count, then the alphabetically larger), so `poll` evicts it.
- **Computing failure links depth-first.** A node's link points to a shallower node, which must be finished first: use BFS.
- **Not merging outputs along failure links**, which misses patterns that are suffixes of other patterns (`he` inside `she`).
- **Leaving transitions unfilled**, so the scan must loop over failure links; filling them makes every character one step.

## Practice

Design Search Autocomplete System (LC 642), Search Suggestions System (LC 1268), Stream of Characters (LC 1032), Construct String with Minimum Cost (LC 3213).

## Key takeaways

- Keep a pointer to the current node: each character is one step.
- Store per-node counts for ranked suggestions, and pick the top k with a size-k min-heap.
- Aho–Corasick adds failure links (the longest proper suffix that's in the trie), built breadth-first.
- Filling every missing transition turns the trie into an automaton: one step per text character.
- It finds every occurrence of every pattern in O(text + total pattern length · σ + matches).

## Knowledge check

```quiz
? Why are Aho–Corasick's failure links computed breadth-first?
+ A node's link points to a shallower node, whose own link and transitions must already be complete
- Because BFS uses less memory than DFS
! Memory isn't the reason.
- To report matches in order
! Reporting order comes from the scan, not the build.
- It doesn't matter; DFS works too
! A DFS can reach a node before its fail target is finished.
> Shallower nodes are finished first in a BFS.

? Patterns he, she, his and hers; text "ushers". Which patterns are reported at the 'e' of "she"?
+ she and he
- she only
! "he" is a suffix of "she", merged in through the failure link.
- he only
! "she" ends there too.
- she, he and hers
! "hers" ends two characters later.
> Merged outputs report the shorter suffix patterns too.

? In the autocomplete heap, why does the comparator put the alphabetically larger sentence on top when counts are equal?
+ Among equal counts it's the worse candidate, so poll evicts it and the best three remain
- To return the results in reverse order
! The reversal at the end handles the output order.
- Because PriorityQueue requires it
! Any comparator works; this one encodes "worst first".
- So the largest sentence is suggested first
! Ties go to the alphabetically smaller sentence.
> A size-k min-heap keeps the worst of the best k on top.

? Searching a text of length n for p patterns, how does Aho–Corasick's scan compare with running KMP once per pattern?
+ One pass of O(n + matches), against O(p · n) for p separate scans
- They're the same: O(p · n)
! Aho–Corasick scans the text once.
- Aho–Corasick is O(n²)
! Each character is one step of the automaton.
- KMP is faster for many patterns
! KMP handles one pattern per pass.
> Building the automaton costs O(total pattern length · σ) once.
```
