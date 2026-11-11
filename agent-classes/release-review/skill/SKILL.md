---
name: release-review
description: Use when asked to review a release, "use the release-review agent-class", find what was planned but not shipped or shipped but not planned, or set up release-review for a team. Read only; reports gaps for a person to sign off.
---

# release-review agent-class

The installed npm package `@agent-class/release-review` compares a release's planned tickets with the changes that shipped, and writes a gap report (Markdown and JSON) for a person to sign off. It reads the tracker and the code host through the team's setup and writes only the two report files.

Run every command through `npx --no release-review`. The `--no` keeps npx from fetching a public package of the same name when this one is not installed.

## Inputs

The class takes two inputs and nothing else:
- `--setup <path>`: the team's setup file. If the user did not name one, look for a `release-review` setup in the project or ask for its path.
- `--release <id>`: the release id, letters, digits and `_ . + -` only. Ask if the user did not give one.

## Review a release

1. Run `npx --no release-review run --setup <path> --release <id>`. Done when it exits 0 and prints the two report paths.
2. On exit 2, show the one-line error and stop. A pin error means the setup names another class version: tell the user to re-pin the setup or install that version. Never edit the pin yourself.
3. Read the Markdown report and give the user the counts, each gap section and every verdict other than `matches`. Done when every gap row is in your answer or named by count.
4. Say the report is a draft that needs sign-off by the person the report names.

## Close out a release

This class only reviews. Run the review above, show the gaps, and stop. Tell the user that closing out (fix versions, transitions, comments, labels, deploys) is a separate step with their own tools and a go for each write.

## Set up a team

1. Copy `node_modules/@agent-class/release-review/setup.example.json` to the path the user picks, outside any shared repo if it names hosts or projects.
2. Write one read-only command per capability with the user. The contract is in `node_modules/@agent-class/release-review/class.json`: `capabilities.<name>.output` is the JSON shape each command prints, `{release}` in an argv is replaced by the release id, `tickets` gets a JSON list of keys on stdin, and `change_diffs` gets a JSON list of change ids and prints each one's code diff. Use the user's own CLIs, so the class runs with their auth.
3. Bind `change_matches_ticket` to `{"model": "<name>"}` (the user's `claude`) or to a `cmd` that reads `{ticket, changes}` on stdin and prints `{verdict, reason}`.
4. Run `npx --no release-review check-setup --setup <path> --release <id>` and fix what it names. Done when it exits 0.
5. Scoring the fuzzy binding spends money: run `npx --no release-review conformance --setup <path>` only when the user asks. A setup may name its own held-out cases in `conformance_cases`.
