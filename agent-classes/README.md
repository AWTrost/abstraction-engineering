# agent-classes

An agent-class is a shared, versioned process that a team installs as an npm package. The class owns the steps, the capability contracts (JSON Schema in its `class.json`), the typed fuzzy functions and the tests. A team's setup file, kept outside this repo, binds each capability to the team's own commands, so the class runs with the provider and auth of whoever runs it and takes only the inputs its contract declares.

Each folder here is one package, copied here to show the code. Nothing is published from this repo. Each class's README says how a team uses it.

| Class | Package | Does |
|---|---|---|
| `release-review/` | `@agent-class/release-review` | Reports planned-vs-shipped gaps for a release. Read only. |
