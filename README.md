Interaction Calculus of Constructions
=====================================

What is the most elegant system capable of verifying mathematical proofs? By
extending interaction combinators with a single new symbol, the annotator, we
obtain an interaction net analogue of the Calculus of Constructions (CC).
Despite its simplicity, a wide range of CC primitives, including dependent
functions (`Π(x: A). B[x]`), can be constructed in ICC with annotators.
Moreover, many features that aren't available in vanilla CC, including inductive
families, quotients and even function extensionality, can be constructed
natively in ICC, with no further extensions. Moreover, thanks to interaction net
semantics, ICC type-checking can also be performed B-optimality, making it an
efficient, powerful and elegant type theory.

Introduction
------------

The most compelling aspect of ICC is how simple, yet powerful, it is. The current implementation is less than 100 lines on HVM, making it much smaller than the Calculus of Constructions, and probably the simplest proof checker in the world. Yet, despite its simplicity, the ICC is extremely powerful. By using its only type former, the bridge (`θx T`), we can derive not just CoC's dependent function type (`Π(x: A) B[x]`), but many other types not available in it, like inductive functions, quotients and so on. Here are some examples:

// Simple Function. Syntax: !A -> B
Fun = λA λB θf λx {(f {x: A}): B}

// Dependent Function. Syntax: Π(x: A) B[x]
All = λA λB θf λx {(f {x: A}): (B x)}

// Inductive Function. Syntax: $f(x: A) B[f,x]
Ind = λA λB θf λx {(f {x: A}): (B f x)}

// Dependent Pair. Syntax: Σ(x: A) B[x]
Sig = λA λB θp {(p {p.0: A} {p.1: (B p.0)})}

If you thought self types were powerful, bridges are a generalization of it - and of everything else. And the way they work is very intuitive; if you read the code above carefully, you'll probably get it. I now believe most of the limitations found in CoC, such as no inductive datatypes, can be traced down to it lacking bridges, which are an universal type encoder, of which pi types are just a special instance.

Note that this implementation is still very new and incomplete, but you can already try it on the demo terms available on the `book/` directory. In particular, notice how Pi types are encoded with θ, and how we can also easily do `Bool.match` (i.e., induction) with it.

I can't stress enough how this isn't something engineered, but discovered. Nothing of this system was invented or hardcoded by me. Annotators and bridges are just interaction combinator nodes, and the only computation rules are the standard interactions: annihilation and commutation.

I believe this system is something fundamental of mathematics, and generalizes many type theories. Of course, there is much to be done before it can be taken seriously. At least, now it is sufficiently concrete for us to start formalizing in an existing proof assistant, and to prove the standard theorems such as soundness, completeness and consistency. From there, we can proceed to explore its expressivity, and better understand its properties.

(Bridges were previously called ANN-Binder. They were identified by Franchu, upon trying to find an interpretation for the main-port readback of ANN nodes.)

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
