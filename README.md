Interaction Calculus of Constructions
=====================================

This repository is exploring the following question: what is the simplest type
system capable of checking mathematical proofs? The Calculus of Constructions is
often regarded as such, but 1. it isn't capable of proving induction (and other
facts); 2. it isn't clear whether it can be further broken down. By extending
interaction combinators with a single new primitive, an annotation node (`{t:
T}`), we obtain a system that is simpler than the CC, *and* is capable of
expressing and proving arbitrary theorems.

In the [Interaction
Calculus](https://github.com/VictorTaelin/Interaction-Calculus) interpretation
of Interaction Combinators, a lambda can be seen as the opposite of an
application, and a duplication can be seen as the opposite of a superposition.
Likewise, the opposite of an annotation node is the bridge (`θx. T`), and it can
be used to express a variety of types, including dependent functions (`Π(x: A)
B[x]`), dependent pairs (`Σ(x: A) B[x]`) and even self types. None of these are
primitives; the only added primitive is the annotator node, which is identical
to a lambda in form, shape and computation; yet, by just reducing the annotator
via the conventional interaction combinator rules, the result is a process that
is effectively equivalent to dependent type checking. Below are some encodings
that emerge from this construction:

```c
// Simple Function. Syntax: !A -> B
Fun = λA λB θf λx {(f {x: A}): B}

// Dependent Function. Syntax: Π(x: A) B[x]
All = λA λB θf λx {(f {x: A}): (B x)}

// Inductive Function. Syntax: $f(x: A) B[f,x]
Ind = λA λB θf λx {(f {x: A}): (B f x)}

// Dependent Pair. Syntax: Σ(x: A) B[x]
Sig = λA λB θp {(p {p.0: A} {p.1: (B p.0)})}
```

This repostiory includes a simple, toy implementation of this concept. It is
still new and many aspects are not clear, so, it should be seen as an idea
taking shape, but not quite ready yet. This is an evolution of the
[ITT](https://github.com/VictorTaelin/Interaction-Type-Theory) repository, which
has some nice drawings of the overall idea. Some concepts there are outdated,
like coherence; but the images are very helpful to form an intuition. This repo
also includes some example terms and proofs in the `book` directory. Note how
most of it looks identical to the Calculus of Constructions. The only surprising
bit is that `Π` and `Σ` are encoded (see
[All.icc](https://github.com/VictorTaelin/interaction-calculus-of-constructions/blob/main/book/All.icc))
rather than primitives of the language. And we can also express induction by
encoding Self Types which, surprisingly, can be expressed by bridges too.

Terms
-----

```
term ::=
    | λx. term    -- lambdas
    | (term term) -- applications
    | θx. term    -- bridges
    | {term:term} -- annotations
    | x           -- variables
```

> TODO: complete the README

> see [this tweet](https://x.com/VictorTaelin/status/1831798521755812118) for more info
