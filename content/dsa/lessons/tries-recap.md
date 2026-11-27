Tries come up less often than arrays or graphs, but when they do, the trie is usually the whole idea. This recap gathers the signals, the design checklist, the costs and the mistakes for the module.

## Recognizing the pattern

| The problem says… | Trie shape |
|---|---|
| prefix, starts with, autocomplete, "as the user types" | a standard trie, perhaps with data on its nodes ([counting tries](lesson:counting-tries), [prefix search](lesson:prefix-search-and-wildcards), [autocomplete](lesson:autocomplete-and-aho-corasick)) |
| many words and a grid or board | a trie plus a DFS with pruning ([backtracking and DP](lesson:tries-with-backtracking-and-dp)) |
| a dictionary, and "can the string be split into (or built from) words" | a trie plus DP ([backtracking and DP](lesson:tries-with-backtracking-and-dp)) |
| shortest root, longest prefix match | walk and stop at the first or last word end ([prefix tries](lesson:prefix-reversed-and-suffix-tries)) |
| `.` or `?` wildcards | a DFS that branches on the wildcard ([wildcards](lesson:prefix-search-and-wildcards)) |
| maximum XOR, "XOR with limits" | a binary trie, top bit first, greedily taking the opposite bit ([binary tries](lesson:binary-tries)) |
| palindrome pairs, suffix matching | a trie of reversed words ([reversed tries](lesson:prefix-reversed-and-suffix-tries)) |
| count the distinct substrings | a suffix trie for small n, a [suffix array](lesson:suffix-arrays) beyond |
| find many patterns in one text | [Aho–Corasick](lesson:autocomplete-and-aho-corasick) |

**If none of these apply, you probably don't need a trie.** A `HashSet` answers exact lookups more cheaply.

## Decision procedure

Before coding, decide:
1. **The alphabet:** a small fixed one (use an array), or a large or unknown one (use a map)? Is the input case-sensitive?
2. **What does a node store?** `isWord`, counts, the word itself, a value, a top-k list, an index.
3. **Do you need deletion?** If so, prune ([design choices](lesson:trie-design-choices)), or use counts ([counting tries](lesson:counting-tries)).
4. **Do you need sorted output?** Array children give it for free; with maps you must sort.
5. **The memory budget:** at around 10⁶ nodes, consider sorting plus binary search, or a compressed trie.
6. **Why a trie?** Say what it buys over a `HashSet` or a sorted array here: many prefix queries, one step per typed character, or pruning a search.

### Complexity cheat sheet

| Operation | Time | Notes |
|---|---|---|
| insert / search / startsWith | O(L) | independent of the number of words |
| list the words with a prefix | O(L + total characters output) | sorted for free with array children |
| wildcard search, `d` dots | O(26ᵈ · L) worst case | usually far less |
| Word Search II | O(R·C·4·3^(L−1)) worst case | pruning matters in practice |
| max XOR of n numbers | O(n · B) | B = the number of bits (31) |
| Aho–Corasick | O(Σ patterns · σ + text + matches) | σ = the alphabet size, for the automaton build |
| space | O(total characters × σ) worst case | array children cost σ slots per node |

## Edge cases to test

- **The empty string:** `insert("")` marks the root as a word. Decide what `startsWith("")` means (here it's always `true`).
- **A word that's a prefix of another** (`car` and `cart`): this tests `isWord` versus path existence, and pruning on delete.
- **Duplicates:** use counts ([counting tries](lesson:counting-tries)), and don't report a word twice ([Word Search II](lesson:tries-with-backtracking-and-dp)).
- **Characters outside the alphabet:** uppercase letters, digits or spaces throw with a `[26]` array.
- **Deleting a word that isn't there**, or deleting it twice.
- **Binary tries:** negative numbers (handle the sign bit explicitly, or offset the values), and the bit width.

## Common mistakes

1. **Confusing "the path exists" with "the word exists"**: forgetting `isWord` in `search`.
2. **Deleting by clearing `isWord` only**, which leaves dead branches, so `startsWith` lies afterwards.
3. **A `[26]` array with uppercase letters, spaces or digits**: `ArrayIndexOutOfBoundsException`.
4. **Rebuilding the word from the path** on every match, instead of storing it on the end node.
5. **Reporting duplicates** in Word Search II (fix: `node.word = null`), and not pruning (timeouts).
6. **Binary trie bit order:** inserting the least significant bit first makes the greedy choice wrong.
7. **Restarting from the root on every keystroke** in autocomplete, instead of keeping the current node.
8. **Using a trie where a `HashSet` or a sorted array is simpler.** Say why the trie is needed.
9. **Forgetting the memory cost.** Interviewers often follow up with "what if there are 10⁸ words?"

## Practice ladder

**Foundation**
- Implement Trie (208)
- Longest Common Prefix (14), solved with a trie as a warm-up
- Implement Trie II (1804)
- Map Sum Pairs (677)
- Replace Words (648)
- Longest Word in Dictionary (720)

**Core patterns**
- Design Add and Search Words Data Structure (211)
- Search Suggestions System (1268)
- Word Search II (212)
- Word Break (139), the trie version
- Maximum XOR of Two Numbers in an Array (421)
- Sum of Prefix Scores of Strings (2416)
- Count Prefix and Suffix Pairs II (3045)

**Hard**
- Concatenated Words (472)
- Palindrome Pairs (336)
- Maximum XOR With an Element From Array (1707)
- Design Search Autocomplete System (642)
- Stream of Characters (1032): a trie of reversed words, or Aho–Corasick
- Word Squares (425)
- Count Pairs With XOR in a Range (1803)

## The one-page summary

```text
TRIE        node = prefix; edge = character; isWord marks word ends
            insert/search/startsWith: walk the string, O(L), independent of word count
            search needs isWord; startsWith only needs the path
CHILDREN    Node[26] for a-z (fast, sorted, ~144 B/node); HashMap for big/unknown alphabets
DELETE      clear isWord, then prune childless non-word nodes on the way back up
NODE DATA   passCount/endCount (prefix counts), sums (map sum), top-k lists (suggestions)
PATTERNS    typing     -> keep the current node, one step per character
            wildcard   -> DFS into every child on '.'
            grid       -> one DFS per cell following the trie; store word at end node,
                          null it when found, mark cells in place, prune empty branches
            word break -> from each reachable i walk the trie, mark every word end
            XOR        -> binary trie MSB first, greedily take the opposite bit
            palindrome -> trie of reversed words + "rest is palindrome" lists
            substrings -> insert all suffixes; nodes = distinct substrings
ADVANCED    autocomplete = trie + counts/top-k per node + current-node pointer
            Aho-Corasick = trie + BFS failure links -> all patterns in one pass
ALTERNATIVE sorted array + binary search answers static prefix queries with no extra memory
```

## Key takeaways

- Reach for a trie for many prefix queries, character-by-character extension, or pruning a search by prefix; otherwise a `HashSet` is simpler.
- Decide the alphabet, the node data, deletion, ordering and the memory budget before coding.
- Most trie work is O(L) per word, independent of the number of words; memory is the cost.
- The advanced shapes reuse the same walk: over reversed words, suffixes, bits, or failure links.
- Sorting plus binary search is a strong alternative for static prefix queries: say so.

## Knowledge check

```quiz
? "Return every dictionary word that can be traced on a 12×12 letter board." Which approach fits?
+ A trie of the words, with one DFS from each cell that follows the trie and prunes dead prefixes
- One Word Search per dictionary word
! That repeats the grid walks for every shared prefix.
- A HashSet of the words, checked after every step
! It can't tell when no word continues a prefix.
- Sorting the board's letters
! The paths matter, not the letters alone.
> Store each word on its end node and prune exhausted branches.

? "The maximum XOR of any two numbers in an array of 2 · 10⁵ integers." Which approach fits?
+ A binary trie over the bits, most significant first, taking the opposite bit greedily
- Checking every pair
! That's about 2 · 10¹⁰ pairs.
- Sorting and comparing neighbours
! The best XOR partner isn't necessarily a neighbour.
- A HashSet of the numbers
! A hash set can't steer toward opposite bits.
> O(31 · n) instead of O(n²).

? A service needs only "is this exact word in the dictionary?" for 10⁶ words. What do you use?
+ A HashSet: a trie's memory buys nothing for exact lookups
- A trie, because lookups are O(L)
! A hash lookup is O(L) too, with far less memory.
- A sorted array with binary search
! It works, but a hash set is simpler and faster for exact lookups.
- Aho–Corasick
! That's for finding many patterns inside a text.
> Use a trie when prefixes matter.

? Which input breaks a trie with Node[26] children?
+ A word containing an uppercase letter, a digit or a space
- The empty string
! insert("") just marks the root as a word.
- A word that's a prefix of another
! isWord handles that.
- The same word inserted twice
! It just sets isWord again (or bumps a count).
> Check the alphabet in the constraints, or use map children.
```
