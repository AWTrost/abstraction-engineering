# abstraction-engineering

The papers on abstraction engineering (designing the shared, versioned process that agent work comes from, called a class) and the agent-classes built to test them. This repo is meant to be public, so everything in it must be safe for anyone to read.

## Map

- `papers/paper-1-classes-in-the-abstract.md`: paper 1, classes in the abstract. It is a finished, versioned text: the date and version are on line 3, and "the first version" in the text means the Nov 8 original.
- `papers/paper-2-material.md`: notes toward paper 2, classes in action. They are not a finished text. Each item is an observation from a run, except the section "Where the model sits", which holds ideas, each with what would test it.
- `agent-classes/`: the agent-classes, one folder each; its `README.md` lists them.
- `agent-classes/release-review/`: the release-review agent-class as an npm package. This is a showcase copy. The class is developed and released from a private repo, and each version is ported here once it is released there, with no work content. Don't develop the class here first. Its `README.md` has the contract, commands, known limits and how to release; `class.json` is the contract in JSON Schema. A new agent-class goes in its own folder under `agent-classes/`, released the same way.
- `README.md`: what a visitor reads first.
- `.github/workflows/ci.yml`: on every PR, runs the class tests and fails on a home path anywhere in the repo.

## Commands

- Class checks: `cd agent-classes/release-review && npm ci && npm run check` (type-check, rebuild, fail if the committed `dist/` is stale, then the tests). There are no tests at the repo root. The tests never call a model.
- After changing a class's `src/`, run `npm run build` in its folder and commit `dist/` with the change.
- Home path check: `! git grep -nE '/(home|Users)/[A-Za-z0-9_.-]+' -- ':!.github'` (the same check CI runs).

## Rules for the papers

- **No work content, ever.** The evidence comes from one team's real releases. Never add a ticket key, project, team, person, host, repo or path from that setup, in the papers, in commit messages or in PR text. The class's fixtures use `DEMO-*` keys only. Before every push, read the diff for such names.
- **Every figure traces to a source.** A count, cost or score must come from a report, a transcript or a test run, not from an estimate. If a figure is worked out, not recorded, say how, as paper 1 does for the class's 8 calls. Estimates written as fact are the error reviewers found most often.
- **Keep the hedges.** The evidence is one class, one team's setup, one runtime. Do not drop a caveat to make a claim read stronger. A claim the evidence weakens goes under "It weakens or qualifies" in paper 1, not out of the paper.
- **Plain words.** Short sentences, no hype, terms from paper 1's "Words used here" used the way it defines them. Define a new term there before using it.
- **Paper 2 material is observations.** Add a new item to the section it fits. An idea not yet seen in a run goes under "Where the model sits" with what would test it. Do not repeat what paper 1's "For paper 2" list already says.
- **Cold-read before merging a paper change.** Changes to paper 1 get a cold read by a reviewer with no context of the edit, and its must-fix items are fixed before merge.

## Rules for the class

- A class change starts in the private home repo. Port it here only after that version is released there, and keep the two copies' class code equal; this copy's fixtures may differ only to pass the home-path check.
- Each class is released by a tag on a `git subtree split` of its folder, because npm cannot install a subfolder of a repo. The class README's Releasing section has the command. Push a release tag only with the owner's go.
- Installed copies pin a tag. A change reaches a team only when they re-pin, so a change to what a setup or binding may contain is a new version.
- Keep `version` in `package.json` and `class.json` equal; a change to what a setup or binding may contain is a new version.

## Git

- Branch and PR; the owner merges. Never push to `main`.
- PR bodies use the sections What and why, Changes, Testing, Decisions and open questions, After merging and Session, and end with the attribution line.
