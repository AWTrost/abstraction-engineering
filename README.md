# Abstraction engineering

Agents make individual pieces of work cheap: code, reviews, research. The engineering moves into designing the shared, reusable process that work comes from, the way a developer designs a class instead of writing the same script again.

This repo holds the papers on that idea and the one class built to test it.

## Papers

- [Paper 1: classes in the abstract](papers/paper-1-classes-in-the-abstract.md). This paper covers what a class declares and what a team's setup supplies. It explains why the program drives and the model only fills typed functions, and how a class is pinned by version. It rests on one build, scored against long hand-run agent sessions, with the caveats stated.
- [Paper 2 material](papers/paper-2-material.md). These are notes toward the second paper, on classes in action: memory, promotion, and the evidence from running a class. It is not a finished text.

## The class

[`agent-classes/release-review/`](agent-classes/release-review/) is an agent-class packaged for npm. It compares a release's planned tickets with the changes that shipped, and writes a gap report for a person to sign off. Everything exact is code. One judgement, whether a ticket's changes do what it asked, is a typed function that setup binds to a model or a command.

    cd agent-classes/release-review && npm ci && npm run check

The tests never call a model.

## How to use this repo

The repo is the idea plus one worked example. It is not a library of classes; it holds a few, starting with one. Pick the path that fits what you want.

**To understand the idea**, read paper 1 first. Its "Words used here" section defines the terms the rest of the repo uses. Then read the paper 2 material for what running a class has shown so far.

**To see how a class is built**, read [`agent-classes/release-review/`](agent-classes/release-review/) next to paper 1. Start with `class.json` (the contract), then `src/release-review/` (the class) and `src/runtime/` (what any class needs); the class README's [Code layout](agent-classes/release-review/README.md#code-layout) explains the split. The tests in `test/` run the whole flow on demo data with no model, so they are the quickest way to watch it work.

**To run the class on your own releases**, follow these steps from your own project's root. You need Node 20 or later, SSH access to GitHub, and the `claude` CLI if the fuzzy function is bound to a model. The [class README](agent-classes/release-review/README.md) has the detail behind each step.

1. Install the class from its release tag, and link its skill for Claude Code ([Install](agent-classes/release-review/README.md#install)):

       npm i -D "git+ssh://git@github.com/AWTrost/abstraction-engineering.git#release-review-v0.2.1"
       npx --no release-review install-skill

2. Copy the example setup into your project:

       cp node_modules/@agent-class/release-review/setup.example.json release-review.setup.json

3. Write the three read-only commands the setup's `bindings` point at, one each for `planned_tickets`, `tickets` and `release_changes`. Each prints JSON in the shapes `class.json` defines ([The contract](agent-classes/release-review/README.md#the-contract)).

4. Fill in the rest of the setup: `status_map`, `expected_states`, `report_dir`, `signoff`, and the model for `change_matches_ticket`.

5. Check the setup. This calls each capability once but not the model:

       npx --no release-review check-setup --setup release-review.setup.json --release <release id>

6. Run the review. It writes a draft report, Markdown and JSON, for a person to sign off:

       npx --no release-review run --setup release-review.setup.json --release <release id>

7. Optionally, score the model binding before you trust it. This spends money:

       npx --no release-review conformance --setup release-review.setup.json

Read the class README's [Known limits](agent-classes/release-review/README.md#known-limits) before you rely on a report.

**To build a class of your own**, build it in your own repo and use this one as the pattern. Copy the shape: a `class.json` contract, a setup file per team that binds the capabilities, code for everything exact, and typed functions for the judgements code cannot make. `src/runtime/` does not import class code, so it can be copied as a starting point.

## Status

This is a working paper: one class, one team's setup, one runtime. Paper 1 lists what the evidence does and does not show.
