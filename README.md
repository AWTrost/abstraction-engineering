# Abstraction engineering

Agents make individual pieces of work cheap: code, reviews, research. The engineering moves into designing the shared, reusable process that work comes from, the way a developer designs a class instead of writing the same script again.

This repo holds the papers on that idea and the one class built to test it.

## Papers

- [Paper 1: classes in the abstract](papers/paper-1-classes-in-the-abstract.md). This paper covers what a class declares and what a team's setup supplies. It explains why the program drives and the model only fills typed functions, and how a class is pinned by version. It rests on one build, scored against long hand-run agent sessions, with the caveats stated.
- [Paper 2 material](papers/paper-2-material.md). These are notes toward the second paper, on classes in action: memory, promotion, and the evidence from running a class. It is not a finished text.

## The class

[`agent-classes/release-review/`](agent-classes/release-review/) is a concept: an agent-class written as an npm package, here to show the code. It compares a release's planned tickets with the changes that shipped, and writes a gap report for a person to sign off. Everything exact is code. One judgement, whether a ticket's changes do what it asked, is a typed function that setup binds to a model or a command. Nothing is published or deployed from this repo. The class is developed and released in a private repo, and each released version is copied here.

    cd agent-classes/release-review && npm ci && npm run check

The tests never call a model.

## How to use this repo

The repo is the idea plus one worked example. It is not a library of classes; it holds a few, starting with one. Pick the path that fits what you want.

**To understand the idea**, read paper 1 first. Its "Words used here" section defines the terms the rest of the repo uses. Then read the paper 2 material for what running a class has shown so far.

**To see how a class is built**, read [`agent-classes/release-review/`](agent-classes/release-review/) next to paper 1. Start with `class.json` (the contract), then `src/release-review/` (the class) and `src/runtime/` (what any class needs); the class README's [Code layout](agent-classes/release-review/README.md#code-layout) explains the split. The tests in `test/` run the whole flow on demo data with no model, so they are the quickest way to watch it work.

**To see how a team would use it**, read the class README's [Commands](agent-classes/release-review/README.md#commands) and [The contract](agent-classes/release-review/README.md#the-contract). In use, a team installs the class as a pinned dev dependency, writes one read-only command per capability (`planned_tickets`, `tickets`, `release_changes` and `change_diffs`), fills in a setup file, checks it with `check-setup`, runs the review, and signs off the draft report. This repo does not publish the package, so there is nothing here to install. The class README's [Known limits](agent-classes/release-review/README.md#known-limits) say what a report cannot be trusted for.

**To build a class of your own**, build it in your own repo and use this one as the pattern. Copy the shape: a `class.json` contract, a setup file per team that binds the capabilities, code for everything exact, and typed functions for the judgements code cannot make. `src/runtime/` does not import class code, so it can be copied as a starting point.

## Status

This is a working paper and a proof of concept: one class, one team, one runtime. Paper 1 lists what the evidence does and does not show.
