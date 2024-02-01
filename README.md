Interaction Calculus of Constructions
=====================================

What is the most elegant system capable of verifying mathematical proofs? By
extending interaction combinators with a single new symbol, the annotator, we
obtain an interaction-net analogue of the Calculus of Constructions (CC).
Despite its simplicity, a wide range of CC primitives, including dependent
functions (`Π(x: A). B[x]`), can be constructed in ICC with annotators.
Moreover, many features that aren't available in vanilla CC, including as
inductive families, quotient types and function extensionality, can be
constructed natively in ICC with no further extensions. Thanks to interaction
net semantics, ICC type-checking can also be performed B-optimality. These
features make ICC a minimal, expressive and efficient type theory.

Introduction
------------

...

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
