# abstraction-engineering

The papers on abstraction engineering (designing the shared, versioned process that agent work comes from, called a class) and a snapshot of the one class built to test them. This repo is meant to be public, so everything in it must be safe for anyone to read.

## Map

- `papers/paper-1-classes-in-the-abstract.md`: paper 1, classes in the abstract. It is a finished, versioned text: the date and version are on line 3, and "the first version" in the text means the Nov 8 original.
- `papers/paper-2-material.md`: notes toward paper 2, classes in action. They are not a finished text. Each item is an observation from a run, except the section "Where the model sits", which holds ideas, each with what would test it.
- `release-review/`: the release-review agent-class as an npm package, a snapshot at 0.2.0. It is developed and released from the ai-workflow repo (`agent-classes/release-review`), so a change made here does not reach installed copies. Its `README.md` has the contract, commands and known limits; `class.json` is the contract in JSON Schema.
- `README.md`: what a visitor reads first.

## Commands

- Class tests: `cd release-review && npm test`. There are no tests at the repo root. The tests never call a model.

## Rules for the papers

- **No work content, ever.** The evidence comes from one team's real releases. Never add a ticket key, project, team, person, host, repo or path from that setup, in the papers, in commit messages or in PR text. The class's fixtures use `DEMO-*` keys only. Before every push, read the diff for such names.
- **Every figure traces to a source.** A count, cost or score must come from a report, a transcript or a test run, not from an estimate. If a figure is worked out, not recorded, say how, as paper 1 does for the class's 8 calls. Estimates written as fact are the error reviewers found most often.
- **Keep the hedges.** The evidence is one class, one team's setup, one runtime. Do not drop a caveat to make a claim read stronger. A claim the evidence weakens goes under "It weakens or qualifies" in paper 1, not out of the paper.
- **Plain words.** Short sentences, no hype, terms from paper 1's "Words used here" used the way it defines them. Define a new term there before using it.
- **Paper 2 material is observations.** Add a new item to the section it fits. An idea not yet seen in a run goes under "Where the model sits" with what would test it. Do not repeat what paper 1's "For paper 2" list already says.
- **Cold-read before merging a paper change.** Changes to paper 1 get a cold read by a reviewer with no context of the edit, and its must-fix items are fixed before merge.

## Rules for the class

- `release-review/` mirrors the ai-workflow copy. Make class changes there and refresh this snapshot. A change made only here is a fork.
- Keep `version` in `package.json` and `class.json` equal; a change to what a setup or binding may contain is a new version.

## Git

- Branch and PR; the owner merges. Never push to `main`.
- PR bodies use the sections What and why, Changes, Testing, Decisions and open questions, After merging and Session, and end with the attribution line.
