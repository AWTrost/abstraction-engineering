# agent-classes

An agent-class is a shared, versioned process that a team installs with npm. The class owns the steps, the capability contracts (JSON Schema in its `class.json`), the typed fuzzy functions and the tests. A team's setup file, kept outside this repo, binds each capability to the team's own commands, so the class runs with the provider and auth of whoever runs it and takes only the inputs its contract declares.

Each folder here is one package. A package is released by a tag on a `git subtree split` of its folder, because npm cannot install a subfolder of a git repo. Each class's README has its install and release commands.

| Class | Package | Does |
|---|---|---|
| `release-review/` | `@agent-class/release-review` | Reports planned-vs-shipped gaps for a release. Read only. |
