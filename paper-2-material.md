# Paper 2 material

Paper 2 is classes in action: a class at work, and how it learns from its own runs. This note gathers what the v0 build of release-review showed about that, from the session that ported the class to an npm package, installed it for one team and measured it. It adds to the "For paper 2" list at the end of paper 1 and repeats none of it. It is one class, one team and one day, so every item is an observation, not a result.

## Memory and instance state

- **Two sessions, one work item, one Now block.** Two sessions worked on the same work note on the same day. One rewrote the Now block after the other had updated it, so it still asked for a review of a pull request that had already merged. The checkpoint rule (verify every claim against live state before writing) caught it. Instance state that several sessions write needs either a merge rule or a check on read, not just a timestamp.
- **A class's output was overwritten as evidence.** Reports are named by release id only. A later run of the same release, from another session, overwrote the report the paper's Release B score came from. The figures survived only because they had been copied into the comparison note. A report is instance state of a finished run, and a class that keys it only by its input loses history. A run id or an append-only report folder would keep it.
- **The class did not record its own token use.** The report keeps `cost_usd` and nothing else, though the model call returns full usage. The comparison in paper 1 had token counts for the hand-run session and only dollars for the class. A class that is meant to be measured across runs has to record what is measured, from the first run.

## Failure that looks like success

- **The never-throw contract hid a setup error.** The fuzzy function turns any failure into the verdict `unclear`, so a bad binding never crashes a run. But stripping the user's setup for cost also strips variables set in the agent's settings file, which is where some people configure their model provider. For them every call fails, every verdict comes back `unclear`, and the report looks complete. Fail-soft per item is right; fail-soft for a cause that hits every item is a silent outage. The fix shipped was a hint in the failure reason. A better one is a run-level check: if every verdict failed the same way, stop.
- **Isolation and identity pull against each other.** The class runs "with the provider and auth of whoever runs it". Stripping the setup keeps house context out of the judgement and cuts cost about 140 times, but the setup is also where part of that identity lives. A class has to say which parts of the runner's environment it inherits.

## Promotion and gates

- **Each reviewer caught a different kind of error.** On one paper edit, percy (a cold reader with no context) found four must-fix problems, including a call count the drafting agent had estimated and written as fact ("about 6"; it was 8). Cody (the code reviewer) then found a per-call figure that counted only cache reads. The tests and the marker check passed throughout. Estimates turn into facts as text is drafted, and a reader without the author's context is what catches them.
- **A plan cold-read before building.** Percy read the implementation plan before any code and found four must-fix problems: a comparison that could not run, a "no behaviour change" claim that the design contradicted, a schema the planned validator could not express, and a command that could not find its data once installed. All four would have surfaced later as bugs or rework.
- **The human decision changed the build, and a cheap experiment settled it.** I chose to keep the package in the existing repo. That made "npm installs a subfolder" a premise, and a two-minute test in a scratch repo showed it false. The release mechanism (a tag on a subtree split) came from that test, not from reading documentation.

## Self-maintenance

- **A closed set of keywords.** The class checks its contract with a small validator that supports only the JSON Schema keywords the contract uses. A test walks the contract and fails on any other keyword, so a keyword the validator would silently skip cannot enter the contract unnoticed. This is a pattern for any partial implementation of a standard: keep the set closed, and test that it is.
- **A contract change is a version bump, and the pin makes it deliberate.** Tightening the accepted shapes made the class 0.2.0, and the real setup pinned to 0.1.0 was refused until re-pinned. The tightening was checked against the real binding's output before it landed, and the re-pinned setup passed on the first run.
- **Release identity is content, not history.** A squash merge forced a rebase after the release tag was pushed. The tag stayed valid because the package's tree was identical before and after. Pinning by tag works because the lockfile records a commit, and the check that matters is the tree.

## Sharing and adoption

- **A try that touches nothing.** The class was installed for one team's repo as a trial without editing any tracked file: a global install, and the skill linked into a folder the repo already ignores. The team path is a committed devDependency. A trial that needs no change to the team's repo lowers the cost of a first run.
- **A fresh agent needed nothing but the contract.** Told only to "use the release-review agent-class", an agent found the skill, passed the two declared inputs and stopped at sign-off. Through the agent, though, the run cost about three times running the class from a shell, mostly the agent's own setup.
- **The public registry is part of the threat model.** The package name was unclaimed on the public npm registry, so a plain `npx release-review` with the package missing would fetch whatever someone later published under that name. The skill uses `npx --no`, and the package is marked private.

## Open, for paper 2's evidence

- How often do fuzzy verdicts flip on the same input? Not measured; the cache and flip-rate item is planned.
- Does a second team's setup bind the class with no class edits? Not tried.
- Is the token gap between an agent loop and a class the same on a larger release? One release so far.
