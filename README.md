# Abstraction engineering

Agents make individual pieces of work cheap: code, reviews, research. The engineering moves into designing the shared, reusable process that work comes from, the way a developer designs a class instead of writing the same script again.

This repo holds the papers on that idea and the one class built to test it.

## Papers

- [Paper 1: classes in the abstract](papers/paper-1-classes-in-the-abstract.md). This paper covers what a class declares and what a team's setup supplies. It explains why the program drives and the model only fills typed functions, and how a class is pinned by version. It rests on one build, scored against long hand-run agent sessions, with the caveats stated.
- [Paper 2 material](papers/paper-2-material.md). These are notes toward the second paper, on classes in action: memory, promotion, and the evidence from running a class. It is not a finished text.

## The class

[`agent-classes/release-review/`](agent-classes/release-review/) is an agent-class packaged for npm. It compares a release's planned tickets with the changes that shipped, and writes a gap report for a person to sign off. Everything exact is code. One judgement, whether a ticket's changes do what it asked, is a typed function that setup binds to a model or a command.

    cd agent-classes/release-review && npm test

The tests never call a model.

## Status

This is a working paper: one class, one team's setup, one runtime. Paper 1 lists what the evidence does and does not show.
