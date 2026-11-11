# @agent-class/release-review

An agent-class: a shared, versioned process that a team installs with npm and binds to its own systems through a setup file. This one compares a release's planned tickets with the changes that shipped and writes a gap report for a person to sign off. It reads; it never writes to the tracker or the code host.

The program drives and the model fills one typed function. Everything exact (the joins, the gap rules, the report) is code. The one judgement code cannot make, whether a ticket's changes do what it asks, is `change_matches_ticket`, and a setup binds it to a model or a command.

## Install

The package is installed from a git tag, not a registry:

    npm i -D "git+ssh://git@github.com/AWTrost/abstraction-engineering.git#release-review-v<version>"
    npx --no release-review install-skill

The tag points at a commit holding only this folder (see Releasing), because npm cannot install a subfolder of a repo. The lockfile pins the commit. `install-skill` links `.claude/skills/release-review` to the skill in `node_modules`, so the skill follows upgrades; with `--copy`, or where a link cannot be made, it copies and you re-run it after each upgrade. An agent other than Claude Code reads `node_modules/@agent-class/release-review/skill/SKILL.md`.

Use `npx --no`: the name `release-review` is not reserved on the public registry, and plain `npx` would fetch a public package of that name when this one is missing. `package.json` is `private` so it cannot be published there by mistake.

## Commands

    release-review run --setup <path> --release <id>          write the report, print its two paths
    release-review check-setup --setup <path> --release <id>  validate the setup, call each capability once
    release-review conformance (--model <name> | --setup <path>)  score the fuzzy binding; spends money
    release-review install-skill [--project <dir>] [--copy]

Exit 2 means a refusal (bad setup, pin, binding failure, bad release id) with one line on stderr; no report is written. `conformance` exits 1 when a scored set is below 0.8 or has a hard miss: a `partial` or `unrelated` case answered `matches`, because that hides a gap.

## The contract

`class.json` is the contract, in JSON Schema: the `Ticket`, `Change`, `JudgedChange`, `ChangeDiff`, `Gap` and `Case` shapes, each capability's `stdin` and `output`, the fuzzy function's `input` and `output`, and the `setup` file. A binding in any language can be checked against it with any validator. The class checks it with `lib/validate.js`, which supports only the keywords the file uses; a test fails if `class.json` uses another.

A capability binding is `{"cmd": [argv...]}`. `{release}` in the argv is replaced by the release id. `tickets` also gets a JSON list of keys on stdin, and `change_diffs` a JSON list of change ids. Output is JSON on stdout. A nonzero exit, a timeout (300 s) or a shape miss stops the run, because a report built on a half-read system would look complete and be wrong.

`change_diffs` is required because the verdicts are judged from the code, not from what a commit message says it did. The class calls it once per run, with only the ids of the changes it will judge, and every id must come back: a missing one stops the run. An empty string is a valid diff, for a change with no code.

`change_matches_ticket` is bound to `{"model": "<name>"}`, which runs the class's prompt and schema through the runner's `claude -p` with the user's setup stripped (`--tools "" --setting-sources "" --strict-mcp-config --no-session-persistence`), or to `{"cmd": [...]}`, which gets `{ticket, changes}` on stdin, each change with its `diff`, and prints `{verdict, reason}`. A runner on another provider uses `cmd`. Any failure comes back as verdict `unclear`.

A setup may add `conformance_cases`: a path, relative to the setup file, to a JSON list of `Case` from the team's own past releases. `conformance --setup` scores them apart from the class's cases, as a held-out set. Keep that file outside every shared repo; it is work content.

A setup is pinned (`"class": "release-review@0.3.0"`) and another version's setup is refused, so a class change never silently reinterprets an old setup.

## Scope

The class reads through its capabilities and writes only its two report files. Every capability is a read, and a setup cannot bind one the class does not declare. A `cmd` binding is the team's own code, so keep it read-only. Closing out a release (fix versions, transitions, comments, deploys) is beyond the class: the report is signed off by a person, and any write is the team's own tool with its own approval.

## Known limits

- Earlier work treats fix versions as opaque, so a ticket stamped for a later or hotfix release is also listed as earlier work. Read the fix versions printed beside each entry.
- `expected_states` describes a review at hand-off time, so on a release reviewed later, `unexpected_status` gives false alarms.
- A relative `report_dir` is resolved from the current directory.
- Variables set in `~/.claude/settings.json` `env` do not reach a `model` binding, because `--setting-sources ""` skips that file (checked 2026-11-09). A provider configured there (Bedrock, Vertex, a gateway) must be set in the shell environment, or bound through `cmd`. A failed model call's reason says so.

## Code layout

The source is TypeScript in `src/`, in two halves:

- `src/runtime/`: what any class needs. It loads the contract and a setup, checks the pin, validates JSON against the contract, calls capabilities and typed functions, writes output files all or nothing, installs the skill, and runs the CLI. It never imports class code; `test/seam.test.ts` fails if it does. When a second or third class arrives, this folder moves out into a shared package as it is.
- `src/release-review/`: this class: the gap rules, the review flow, the typed function's input and fallback, conformance scoring, the report and the commands.

`dist/` is the compiled JavaScript, and it is committed. Node does not strip types from files under `node_modules`, so an installed package must ship JavaScript, and committing it means a git install needs no build step and no dependencies. CI fails if `dist/` does not match a fresh build.

## Tests

    npm ci
    npm run check

`check` type-checks the source and tests, rebuilds `dist/`, fails if `dist/` changed, and runs the tests. The tests run the TypeScript directly, which needs Node 22.18 or later; the installed package runs on Node 20. After changing `src/`, run `npm run build` and commit `dist/` with it.

Unit tests never call a model. The fixtures are JSON and small Node commands in `test/fixtures/`.

## Releasing

From the repo root, with the change merged:

    git tag release-review-v<version> "$(git subtree split --prefix agent-classes/release-review)"

Install by the tag, never by the split's bare commit id: git does not fetch a commit no ref reaches, so `#<sha>` fails with "unknown git error". Push the tag only with the owner's go. Bump `version` in `package.json` and `class.json` together; a change to what a setup or binding may contain is a new version.
