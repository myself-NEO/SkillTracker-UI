## The idea

The stack holds **what's still open**, or **the result so far**. Each new element either goes on top, or resolves (cancels, matches, collapses into) the element on top.

## When to use it

- **Matching and balancing:** brackets, tags, nesting; "valid", "balanced", "remove the fewest characters to make it valid".
- **Simulation and collapse:** adjacent elements cancel, merge or destroy each other; "remove k digits to make the number smallest"; "simplify the path".
- Any time a new element interacts only with the **most recent unresolved** one.

## How it works

**Matching.** Push openers. On a closer, the top of the stack must be its matching opener; pop it. The string is valid if no closer ever meets an empty stack and nothing is left open at the end.

**Collapse.** The stack holds the result so far. Each incoming element may collapse backwards into it, popping as many elements as it resolves, before it's pushed itself (or destroyed).

**Indexes instead of characters.** Storing *indexes* rather than characters turns "validate" problems into "repair or report" problems: you know exactly which positions are unmatched.

## Java template

```java
Deque<Character> stack = new ArrayDeque<>();
for (char c : s.toCharArray()) {
    if (/* c opens something */) stack.push(c);
    else if (stack.isEmpty() || !matches(stack.pop(), c)) return false;   // nothing (or the wrong thing) open
}
return stack.isEmpty();                                                   // nothing left open
```

## Worked examples

### Valid Parentheses (LC 20)

```java
public boolean isValid(String s) {
    Deque<Character> stack = new ArrayDeque<>();
    for (char c : s.toCharArray()) {
        switch (c) {
            case '(': case '[': case '{':
                stack.push(c);
                break;
            default:
                if (stack.isEmpty()) return false;   // closer with nothing open
                char open = stack.pop();
                if ((c == ')' && open != '(')
                 || (c == ']' && open != '[')
                 || (c == '}' && open != '{')) return false;
        }
    }
    return stack.isEmpty();   // nothing left unclosed
}
```

**Two failure modes people miss**; say both out loud:
1. a closer arriving on an empty stack (`")("`);
2. leftovers at the end (`"(("`). Returning `true` without the final `isEmpty()` check is the single most common bug here.

**A neat trick for the push side:** push the *expected closer* instead of the opener, so the comparison becomes a single equality:

```java
for (char c : s.toCharArray()) {
    if (c == '(') stack.push(')');
    else if (c == '[') stack.push(']');
    else if (c == '{') stack.push('}');
    else if (stack.isEmpty() || stack.pop() != c) return false;
}
return stack.isEmpty();
```

### Minimum Remove to Make Valid Parentheses (LC 1249)

**Approach:** the stack holds *indexes* of unmatched `(`. Anything left in the stack at the end is unmatched; any `)` that finds an empty stack is unmatched. Mark them, then delete.

```java
public String minRemoveToMakeValid(String s) {
    char[] a = s.toCharArray();
    Deque<Integer> open = new ArrayDeque<>();
    for (int i = 0; i < a.length; i++) {
        if (a[i] == '(') open.push(i);
        else if (a[i] == ')') {
            if (open.isEmpty()) a[i] = '#';   // unmatched closer
            else open.pop();
        }
    }
    while (!open.isEmpty()) a[open.pop()] = '#';   // unmatched openers

    StringBuilder sb = new StringBuilder();
    for (char c : a) if (c != '#') sb.append(c);
    return sb.toString();
}
```

### Asteroid Collision (LC 735)

```java
public int[] asteroidCollision(int[] asteroids) {
    Deque<Integer> stack = new ArrayDeque<>();   // used as a growable result list
    for (int a : asteroids) {
        boolean alive = true;
        // only collide when stack top moves right (>0) and a moves left (<0)
        while (alive && a < 0 && !stack.isEmpty() && stack.peek() > 0) {
            if (stack.peek() < -a) { stack.pop(); continue; }   // top destroyed, keep going
            if (stack.peek() == -a) stack.pop();                // both destroyed
            alive = false;                                      // a destroyed (or mutual)
        }
        if (alive) stack.push(a);
    }
    int[] res = new int[stack.size()];
    for (int i = res.length - 1; i >= 0; i--) res[i] = stack.pop();  // stack is top-first
    return res;
}
```

**The collision condition `stack.peek() > 0 && a < 0` is the whole problem.** Two right-movers never collide; two left-movers never collide; a left-mover followed by a right-mover diverge. Only right-then-left collides.

## Complexity

O(n) time and O(n) space for every example: each element is pushed at most once and popped at most once, however many pops one element triggers.

## Variations

### Remove K Digits (LC 402): the smallest number after removing k digits

**Approach:** greedy plus a [monotonic stack](lesson:monotonic-stack). To make the number small, you want the leftmost digits small, so whenever a smaller digit arrives, pop larger digits before it (while you still have removals left).

```java
public String removeKdigits(String num, int k) {
    Deque<Character> stack = new ArrayDeque<>();   // will hold digits, increasing-ish
    for (char c : num.toCharArray()) {
        while (k > 0 && !stack.isEmpty() && stack.peek() > c) { stack.pop(); k--; }
        stack.push(c);
    }
    while (k-- > 0) stack.pop();                  // still have removals: drop from the end

    StringBuilder sb = new StringBuilder();
    while (!stack.isEmpty()) sb.append(stack.pop());
    sb.reverse();
    while (sb.length() > 1 && sb.charAt(0) == '0') sb.deleteCharAt(0);  // strip leading zeros
    return sb.length() == 0 ? "0" : sb.toString();
}
```

**Three edge cases that are always tested:** leftover `k` (the input is already increasing, e.g. `"12345"`), leading zeros (`"10200", k=1` → `"200"`), and everything removed (`"9", k=1` → `"0"`).

**The same family:** Remove Duplicate Letters (LC 316) and Smallest Subsequence of Distinct Characters (LC 1081) use a monotonic stack plus a "last occurrence" array and an "in stack" boolean array; Remove All Adjacent Duplicates in String (LC 1047) is the simplest collapse.

### Simplify Path (LC 71): `"/a/./b/../../c/"` → `"/c"`

```java
public String simplifyPath(String path) {
    Deque<String> stack = new ArrayDeque<>();    // bottom = first directory
    for (String part : path.split("/")) {
        if (part.isEmpty() || part.equals(".")) continue;
        if (part.equals("..")) { if (!stack.isEmpty()) stack.pollLast(); }
        else stack.offerLast(part);
    }
    return "/" + String.join("/", stack);        // ArrayDeque iterates first→last here
}
```

Using `offerLast`/`pollLast` keeps the iteration order natural for the final join: a small trick that avoids a reverse.

## Common mistakes

- **Forgetting the final `isEmpty()` check**, so `"(("` counts as valid.
- **Popping an empty stack** when a closer arrives first; check `isEmpty()` before `pop()`.
- **Storing characters when you need positions.** Repair and report problems need indexes.
- **Colliding the wrong pairs** in Asteroid Collision: only a right-mover on the stack and an incoming left-mover collide.
- **Missing Remove K Digits' edge cases**: leftover `k`, leading zeros, and an empty result that must become `"0"`.

## Practice

Valid Parentheses (LC 20), Minimum Add to Make Parentheses Valid (LC 921), Minimum Remove to Make Valid Parentheses (LC 1249), Asteroid Collision (LC 735), Remove All Adjacent Duplicates in String (LC 1047), Remove K Digits (LC 402), Remove Duplicate Letters (LC 316), Simplify Path (LC 71), Longest Valid Parentheses (LC 32).

## Key takeaways

- The stack holds what's still open, or the result so far; each new element pushes or resolves the top.
- A bracket string is valid if no closer meets an empty stack and nothing is left open at the end.
- Store indexes when you need to repair or report positions, not just validate.
- Collapse problems pop as long as the new element resolves the top, then push it if it survives.
- Each element is pushed and popped at most once, so these solutions are O(n).

## Knowledge check

```quiz
? A Valid Parentheses solution returns `true` for "((". What's missing?
+ The final check that the stack is empty
- A check for a closer on an empty stack
! That catches ")(", not leftover openers.
- Support for square brackets
! Only round brackets appear here.
- A counter instead of a stack
! A counter alone can't check bracket types.
> Anything still on the stack at the end was never closed.

? Why does Minimum Remove to Make Valid Parentheses push indexes instead of characters?
+ So it knows exactly which positions are unmatched and can delete them
- Because characters can't be stored in a Deque
! Character objects work fine.
- To sort the brackets
! Nothing is sorted.
- To save memory
! An Integer index is no smaller than a Character.
> Indexes turn "is it valid?" into "which characters must go?".

? In Asteroid Collision, which pair of asteroids collides?
+ One moving right on top of the stack, and an incoming one moving left
- Any two asteroids of equal size
! Direction decides collisions; size decides the winner.
- One moving left on the stack, and an incoming one moving right
! They move apart.
- Two asteroids moving in the same direction
! They never meet.
> Right-then-left is the only order in which two asteroids approach each other.

? `num = "12345"`, `k = 2`. Why does Remove K Digits need the extra loop after the main scan?
+ No digit was ever larger than the next, so the removals are still unused and must come off the end
- To strip leading zeros
! That's a separate step.
- Because the stack is in reverse order
! Reversal happens when building the string.
- It doesn't; the main scan always uses all k removals
! An increasing input never triggers a pop.
> For increasing input, dropping the last digits gives the smallest number: "123".
```
