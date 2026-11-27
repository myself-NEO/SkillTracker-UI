## The idea

An expression evaluator keeps **pending work** on a stack: terms that are waiting to be added up, or the outer context to come back to when a bracket closes. `(` means *save the context and start fresh*; `)` means *restore the context and merge*. That's exactly what a call stack does, and it's the shape of every nested-parsing problem.

## When to use it

- **Evaluate an expression string**: `"3+2*2"`, or nested ones like `"2*(5+5*2)/3"`.
- **Postfix (Reverse Polish) notation**: `["2", "1", "+", "3", "*"]`.
- **Decode a nested string**: `"3[a2[c]]"` → `"accaccacc"`.
- "Build a calculator" or "build an expression evaluator" in a design round.

## How it works

- **Precedence without a table.** Keep a stack of *terms*. `+` and `-` push a new (signed) term and defer it; `*` and `/` fold immediately into the top term. Summing the stack at the end gives the result. The trick is to apply the operator that came *before* the current number.
- **Parentheses as context switches.** On `(`, push the current partial result (and its sign) and start a fresh sub-expression; on `)`, finish the sub-expression and combine it with the saved context.
- **Postfix needs neither precedence nor parentheses.** Push operands; each operator pops its two operands and pushes the result. That's why compilers convert expressions to postfix.
- **Multi-digit numbers** accumulate with `num = num * 10 + digit`.

## Java template

```java
// The save/restore shape behind every nested parser.
Deque<Context> saved = new ArrayDeque<>();
Context cur = new Context();
for (char c : s.toCharArray()) {
    if (c == '(') { saved.push(cur); cur = new Context(); }    // save the outer context, start fresh
    else if (c == ')') cur = saved.pop().merge(cur);           // restore it and fold the inner result in
    else cur.consume(c);                                       // digits and operators
}
return cur.result();
```

## Worked examples

### Basic Calculator II (LC 227): `+ - * /`, no parentheses

```java
public int calculate(String s) {
    Deque<Integer> stack = new ArrayDeque<>();
    int num = 0;
    char op = '+';                       // pretend a leading '+'
    for (int i = 0; i < s.length(); i++) {
        char c = s.charAt(i);
        if (Character.isDigit(c)) num = num * 10 + (c - '0');

        if ((!Character.isDigit(c) && c != ' ') || i == s.length() - 1) {
            switch (op) {
                case '+': stack.push(num); break;
                case '-': stack.push(-num); break;
                case '*': stack.push(stack.pop() * num); break;
                case '/': stack.push(stack.pop() / num); break;
            }
            op = c;
            num = 0;
        }
    }
    int sum = 0;
    while (!stack.isEmpty()) sum += stack.pop();
    return sum;
}
```

**Explanation:** precedence is handled without any precedence table: `*` and `/` fold immediately into the top term while `+` and `-` defer by pushing. The `i == s.length()-1` condition flushes the final number. Java's `/` truncates toward zero, which is what the problem asks for.

### Basic Calculator (LC 224): `+ -` with parentheses

**Approach.** A different shape: track a running `result` and a `sign`. On `(`, push the current `result` and `sign` and reset. On `)`, pop and combine.

```java
public int calculate(String s) {
    Deque<Integer> stack = new ArrayDeque<>();
    int result = 0, num = 0, sign = 1;
    for (char c : s.toCharArray()) {
        if (Character.isDigit(c)) {
            num = num * 10 + (c - '0');
        } else if (c == '+') {
            result += sign * num; num = 0; sign = 1;
        } else if (c == '-') {
            result += sign * num; num = 0; sign = -1;
        } else if (c == '(') {
            stack.push(result);          // save outer context
            stack.push(sign);
            result = 0; sign = 1;        // fresh sub-expression
        } else if (c == ')') {
            result += sign * num; num = 0;
            result *= stack.pop();       // the sign before '('
            result += stack.pop();       // the result before '('
            sign = 1;
        }
    }
    return result + sign * num;          // flush trailing number
}
```

### Evaluate Reverse Polish Notation (LC 150)

```java
public int evalRPN(String[] tokens) {
    Deque<Integer> stack = new ArrayDeque<>();
    for (String t : tokens) {
        switch (t) {
            case "+": stack.push(stack.pop() + stack.pop()); break;
            case "*": stack.push(stack.pop() * stack.pop()); break;
            case "-": { int b = stack.pop(), a = stack.pop(); stack.push(a - b); break; }
            case "/": { int b = stack.pop(), a = stack.pop(); stack.push(a / b); break; }
            default:  stack.push(Integer.parseInt(t));
        }
    }
    return stack.pop();
}
```

**Watch the order for non-commutative operators**: `a - b`, not `b - a`. Popping gives you the *second* operand first. This is the #1 bug in RPN questions.

## Complexity

O(n) time for each evaluator: every character or token is handled once. The stacks hold at most O(n) entries; with parentheses, the context stack grows with the nesting depth.

## Variations

### Decode String (LC 394): `"3[a2[c]]"` → `"accaccacc"`

The same save/restore shape, with two stacks:

```java
public String decodeString(String s) {
    Deque<Integer> counts = new ArrayDeque<>();
    Deque<StringBuilder> parts = new ArrayDeque<>();
    StringBuilder cur = new StringBuilder();
    int k = 0;

    for (char c : s.toCharArray()) {
        if (Character.isDigit(c)) {
            k = k * 10 + (c - '0');
        } else if (c == '[') {
            counts.push(k);
            parts.push(cur);
            k = 0;
            cur = new StringBuilder();
        } else if (c == ']') {
            StringBuilder decoded = parts.pop();
            int times = counts.pop();
            for (int i = 0; i < times; i++) decoded.append(cur);
            cur = decoded;
        } else {
            cur.append(c);
        }
    }
    return cur.toString();
}
```

### All four operators with parentheses

Basic Calculator III (LC 772) combines both shapes: run the Calculator II loop, and treat `(` as the start of a recursive call (or a pushed context) whose value becomes one number in the outer expression.

### Infix to postfix (shunting-yard): good to know, rarely coded

Scan left to right: operands go straight to the output; an operator first pops operators of higher or equal precedence off the stack into the output, then is pushed; `(` is pushed; `)` pops until the matching `(`. Mention it by name if you're asked to "build an expression evaluator": it signals compiler literacy.

## Common mistakes

- **Popping RPN operands in the wrong order**: the first pop is the right-hand operand.
- **Forgetting to flush the last number**, at the end of the string or before `)`.
- **Single-digit parsing.** Accumulate with `num * 10 + digit`, or `"12+3"` becomes 1, 2, 3.
- **Treating spaces as operators.** Skip them, or they trigger an operator step with a stale number.
- **Ignoring unary minus**, as in `"-(2+3)"`: the leading `-` is a sign, not a subtraction.

## Practice

Basic Calculator II (LC 227), Basic Calculator (LC 224), Evaluate Reverse Polish Notation (LC 150), Decode String (LC 394), Basic Calculator III (LC 772), Parsing A Boolean Expression (LC 1106).

## Key takeaways

- `(` saves the context and starts fresh; `)` restores it and merges: the shape of every nested parser.
- Handle precedence by deferring `+` and `-` (push a term) and folding `*` and `/` into the top term immediately.
- Apply the operator that came *before* the current number, and flush the last number at the end.
- In postfix, each operator pops two operands: the first pop is the right-hand one.
- Every evaluator here is O(n) time, with stack space up to the nesting depth.

## Knowledge check

```quiz
? Evaluating the RPN tokens ["7", "2", "-"]: you pop 2, then 7. What's the result?
+ 5, because the first value popped is the right-hand operand: 7 − 2
- −5
! That computes 2 − 7, the classic order bug.
- 9
! The operator is subtraction, not addition.
- It depends on the stack implementation
! Any stack pops the most recent value first.
> Pop b, then a, and compute a − b.

? How does Basic Calculator II respect `*` before `+` without a precedence table?
+ `+` and `-` push a new term, while `*` and `/` fold immediately into the top term
- It evaluates the string twice, once per precedence level
! A single pass is enough.
- It sorts the operators by precedence first
! Operators are applied in order; terms are deferred.
- It converts the expression to postfix first
! That's the shunting-yard approach, not this one.
> Summing the stack at the end applies the deferred additions.

? In Basic Calculator, what happens when the parser reads `(`?
+ It pushes the current result and sign, then starts a fresh sub-expression
- It pushes the `(` character and keeps going
! The stack holds context, not characters.
- It evaluates everything before the bracket and discards it
! The outer result is saved, not discarded.
- It calls the parser recursively on the whole string
! It continues in the same loop with a fresh context.
> On `)` the saved sign and result are popped and combined.

? Why must the calculators accumulate digits with `num = num * 10 + digit`?
+ Numbers can have several digits, and each new digit shifts the earlier ones one place left
- To convert characters to integers
! `c - '0'` does the conversion; the accumulation builds multi-digit numbers.
- To handle negative numbers
! Signs are handled separately.
- To avoid integer overflow
! The accumulation can overflow; it doesn't prevent it.
> Without it, "12" would be read as 1 and then 2.
```
