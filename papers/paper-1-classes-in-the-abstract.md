# Abstraction engineering: classes for agent work

Nov 12, 2026 · Adam · third version

The first of two papers. This one is about classes in the abstract: the shared process that agent work comes from. The second, classes in action, covers how a class learns: memory, promotion, and the evidence for them.

The first version was a design paper. The second version, of Nov 9, rests on a build. On 2026-11-09 I built one class, bound it to a fixture setup and to one team's real setup, ran it live, and scored it against long hand-run sessions whose work included the same step. The build confirmed the main split and broke several of my assumptions about the domain. Each is reported here. Where this paper says "the first version", it means the original paper of Nov 8.

This third version follows a review of the second on 2026-11-12. The reviewer was a larger model from the same vendor as the models that built the class, in a session with no part in the build. The review added no run. It narrowed the claim, moved several claims under "It weakens or qualifies", and named prior art I have not read yet. Text that comes from the review says so. Figures from version 0.3.0 of the class come from the paper 2 material or from the class's files in this repo.

## The 30-second version

- **What it is.** Abstraction engineering is designing the shared, reusable process that agent work comes from, the way a developer designs a class instead of writing the same script again. The design principle is object-oriented design.
- **Why now.** Agents make the individual pieces of work cheap. Writing the code is no longer the scarce part.
- **What a class holds.** Steps written as code, the capabilities it needs ("fetch this release's tickets"), typed functions with no body (called fuzzy functions below) for the judgements that cannot be written as code ahead of time, the shape of its output, and conformance tests.
- **What setup supplies.** The commands that fill each capability, the binding for each typed function (a model or a command), the house rules, and the class version it is pinned to. The person running the class supplies the per-run values.
- **What it is not.** A class is not an agent loop with fewer pieces. The code decides the steps of a run, and the model does not. In the built class, the model fills one typed function per item, with no tools and no memory. A fuzzy function could do more than that, up to a loop of its own inside the one function, and none that does has been built. In the built class, the agent's open-ended work does not go away. It moves to building the class and to setting it up.
- **Where a class comes from.** The first time a piece of work is done, nobody knows the process, and a long agent session finds it. A session discovers a process, and a class is what that process is compiled into.
- **What is new versus harness engineering.** Harness engineering steers agents with instructions given before they act and checks run after. It sketches templates to share them across teams. Classes add declared capabilities, bound at setup, so a team depends on a versioned class instead of copying and editing it.
- **What exists.** One class, built in Python and then ported to an npm package. The scored runs that called a model cost $0.08 to $0.14 each. It was scored against two long hand-run sessions, on seven findings per release that it could in principle report. On release B it reported 3 of the 7 outright. On release A it scored 0 of 7 as briefed, for a setup reason, and 1 of 7 after a corrected window. It also raised false gaps: six on release A and five on release B. The caveats are in the worked example.
- **What the evidence does not reach.** A plain script with one model call should get the same cost result, though none was measured. What a class adds to that script is the sharing, and the sharing has been tried on one team.

## The claim

Agents make instances cheap: code, reviews, research. The engineering has been refactored into designing the shareable classes they come from.

In plain words: the mechanics are now the easy part, whether that means writing the code, running a review or configuring a tool. The hard part is everything beyond the mechanics, as it always was. It means deciding what to build, how the pieces fit, and how the work gets checked and shared. A class captures that part, so it is designed once and reused.

"Refactored" names a direction. It is not meant literally. A refactor keeps behaviour and changes structure. At the level of a whole team, the behaviour, shipping working software, stays the same, but that is true of any change in practice, so it tests nothing. At the level of one process, behaviour did not stay the same: the built class did not report everything the hand-run sessions found (see the worked example). What the word keeps is where the engineering lives. It moves out of each piece of work and into the class the work comes from.

Every step up in programming traded direct control for leverage: from machine code to languages, to frameworks, and now to agents. Each step also moved the design work up a level. A class is not one more step in that direction. It takes control back from the agent and puts it in code.

The two fit together like this. The first time a piece of work is done, nobody knows the process. A long agent session makes it up as it goes, and that is the right tool for the job. Once the answer is known, the steps that turned out to be exact can be written as code. Nobody knew those steps existed before the session. So a session discovers a process, and a class is what that process is compiled into. The design work at this step is deciding what to compile, and where the model still has to judge.

The build sharpened one part of the claim. A class does not hand the work to an agent. It hands the agent's judgement to a function. The program runs the process, and the model is called only where a judgement cannot be written as code. The aim is to make a non-deterministic model behave like a function with a fixed contract. The shape of each answer is checked and fixed. The answer itself is not, which is why the next version is planned to cache answers and measure how often they flip.

The claim is narrow on purpose. A class pays off when work repeats, outlives a session, runs in parallel, carries stakes, or changes hands. A one-off task in one sitting needs no class.

A class pays off most when the work has two more properties. The order of the steps is known before the run, and the judgements are few enough to list.

The built class goes further. Each of its judgements is about one item, with no tools and no memory. That is the smallest kind of fuzzy function, and it is not the only kind. A fuzzy function could do anything a model can do, such as calling tools or judging many items at once. It would be harder to test and to cache, and none has been built. So the small kind is where to start. It is not a limit on what a class can hold.

Where the next step depends on what the last one found, as in debugging, research or incident triage, there are few exact steps to write as code, so a class buys less. A contract and its tests may still be worth having for such work. No such work has been tried as a class. That is a statement about what has been tried, not about what can work.

One more limit comes from the review. A plain script with one schema-checked model call is the baseline, and scripts are older than agents. No such script was measured, but nothing in the cost result in this paper depends on more than that. What a class adds to it is what lets teams share the script: declared capabilities, bindings, a pin and conformance tests. That part is the claim, and it has the least evidence.

## Words used here

- **Class, or agent-class.** A shared, versioned process: what a task is, how it runs, what it produces, how it closes. It declares the capabilities it needs and the typed functions a model fills. It is installed as a package and bound at setup by the team that runs it. "Agent-class" is the name for the built thing; this paper says "class" for short.
- **Instance.** One piece of work made from a class: a code change, a review, a release report, a research report.
- **Agent.** A model plus a harness: the tools, instructions and checks around the model.
- **Coding agent.** An agent a person works with to read and change code, such as Claude Code. A class is started from a coding agent or from a shell.
- **Runtime.** The program that runs the class. For an agent-class, that is the class's own code, run from a coding agent or a shell.
- **Setup.** What a class is bound to when it is installed. It plays the constructor's part. Its values are fixed for every run by that team.
- **Run input.** A value the person running the class names for one run, such as which release to review. It plays the part of a method argument.
- **Instance state.** One instance's own state: where it stands, what is next, what happened. It lives as long as the task, across sessions, and closes with it. (My own setup keeps it in a "work note".)
- **Capability.** Something a class needs without caring who provides it, such as "fetch the tickets for this release". In ports-and-adapters terms, a port.
- **Binding.** What fills a capability at setup. In the built class it is a command that prints JSON. In ports-and-adapters terms, an adapter.
- **Fuzzy function.** A typed function with no body, declared by the class with its input and output schema. Setup binds it to a model or to a plain command. The class's code calls it a typed function.
- **Conformance test.** A test any binding must pass to be valid. It is the Liskov check (see below).
- **Hard miss.** A fuzzy function's answer that hides a gap. For the built class, that is a `partial` or `unrelated` case answered `matches`.
- **Gate.** A point where a human decides, such as merging a change or signing off a release.

## Where it sits

Abstraction engineering builds on harness engineering, as Birgitta Böckeler describes it on Martin Fowler's site. A harness is everything around the model, and a team adds two kinds of control to it. Guides steer the agent before it acts (AGENTS.md, skills). Sensors check it afterwards (linters, tests, review agents).

[Diagram: one class, three teams · each team depends on it and passes its own values in]

Each team keeps its own model, context and harness, plus a small config. Harness engineering, itself one form of context engineering, builds each team's harness. Abstraction engineering builds the class above them that every team depends on.

When an issue recurs, harness engineering has a person improve the controls. The article also sketches a next step, harness templates: bundles of guides and sensors for common kinds of service. It names their weak point too. Once a team copies a template, it drifts from upstream improvements. A class answers that drift for the process. A template bundles concrete guides and sensors. A class declares what it needs, and setup supplies it. Teams then depend on one versioned class instead of copying and editing it. The drift does not all go away. Some of it moves to the bindings: the paper 2 material records bindings copied between two repos, with fixes ported by hand.

The article also lists what an agent lacks: "no social accountability, no aesthetic disgust at a 300-line function, no intuition that 'we don't do it that way here,' and no organisational memory." Classes partly answer two of these. A class's written conventions, checked by a reviewer, cover known matters of taste but not new ones. A class's gates put accountability on a named human. Memory and "we don't do it that way here" belong to the second paper.

One principle is shared, not new: keep deterministic whatever can be, and leave only the fuzzy step to the model. 12-Factor Agents finds that many products sold as agents are "mostly deterministic code, with LLM steps sprinkled in at just the right points". The harness engineering article splits its checks the same way: cheap computational ones on every change, costlier inferential ones on top. The common split between workflows and agents puts a class on the workflow side. A class is a fixed program with model calls inside it.

## Classes and instances

If you know object-oriented code, you already have the model. A first agent setup is usually a script with hard-coded values: one person's habits, paths and tools. Sharing it means refactoring the script into a class. The behaviour stays and the values become parameters.

[Diagram: class vs instance · one class, many instances, values passed in at setup]

Read it left to right. Each run of the class, under one setup, makes one instance. Each instance keeps its own state.

| Object-oriented idea | In an agent-class |
|---|---|
| Class | the versioned package: steps, capabilities, fuzzy functions, report shape, tests |
| Constructor arguments | the setup: bindings, status names, where the report goes, who signs off, the pinned version |
| Method arguments | the run inputs the person running it names, such as the release |
| Injected dependencies | the commands bound to each capability |
| Abstract method | a fuzzy function: a signature and a schema, with the body supplied by a binding |
| Stack frame | the instance's state, kept as long as the task runs |

The split between constructor and method arguments came from the build. I first treated every value as setup. One per-run value, which code branches a release covers, ended up guessed by a binding and then patched in a setup file. A value that changes every run belongs to the person running it. A value that is the same for every run belongs to setup.

The analogy is a teaching aid, not a spec, and it strains in three places.

- **At the word "instance".** In object-oriented code, a class plus its constructor arguments makes an object. By the table above, that object is one team's bound setup. One run of it is then a method call, and a stack frame belongs to a call. This paper's "instance" is that call and the work it produces. It is not the object. I keep the word, because "agents make instances cheap" is about pieces of work. The cost is one gap. State shared across the runs of one setup, such as a cache of verdicts or a memory store, is the object's own state, and the table has no row for it. The second paper needs that row.
- **At "abstract method".** A subclass fills an abstract method. Here setup injects the body, the same way it injects a capability's command, so the two rows describe one mechanism. With a model binding, the class also still owns half the body, its prompt. Setup names only the model.
- **At memory.** Short-lived instances need nothing always running. Each piece of work starts, does its job and ends. What persists is the class, its setup, each open task's state, and whatever store a class binds for memory.

The build used no inheritance. What it used from object-oriented design is interfaces, injected dependencies and packaging.

### SOLID, mapped onto classes

The principles of object-oriented design carry over with little change.

| Principle | In a class for agent work |
|---|---|
| Single responsibility | Each class does one job. For an agent the matching rule is least privilege: it holds only its job's permissions. The worked example starts with such a split of agents. |
| Open/closed | A team extends a class through setup (its bindings, status names, house rules), not by editing a copy. That held for values. A missing input needed a new class version (0.3.0, in the paper 2 material). |
| Liskov substitution | Any binding for a capability or a fuzzy function must pass the class's tests. That includes a model. |
| Interface segregation | Small ports, such as "fetch the tickets for this release", not one big port per tracker. |
| Dependency inversion | The class depends on capabilities, and setup injects the commands. |

**Conformance is a Liskov check.** The first version said each model or runtime needs its own conformance tests. Liskov substitution makes that precise. A binding is valid if the class's tests still pass with it plugged in. A fixture command, a real tracker query and a model are all bindings, held to the same tests. The build ran all three kinds:

- A fixture binding: the deterministic tests run the class against a fixture setup, whose bindings print fixture JSON.
- A real binding: the live runs bind the same capabilities to one team's tracker and code host.
- A model binding: the fuzzy conformance set scores a model against ticket and change pairs with known verdicts.

The build also swapped the class's own implementation. The same release, run by the Python class and by the npm port with the fuzzy function bound to a constant command, gave the same gaps, counts and verdicts. Both were written by the same model family.

**Passing the tests is necessary, not sufficient.** Liskov substitution is about meaning, and the class's tests check meaning for only one kind of binding. For a capability, they check the shape of the output and nothing else. The binding that gave release A's wrong window (in the worked example) printed JSON of the right shape, so no test of the class could have caught it. Only the fuzzy function has a test of meaning, the conformance set. A capability needs one as well: a past release with a known answer, kept by the team and run through its real bindings. That is not built.

A model is a strange thing to hold to Liskov, because it can pass a case once and fail it the next time. The shape of its output is checked by schema on every call. The verdict inside it is not stable. So the next version is planned to cache each verdict by a hash of its exact inputs, so a re-run on the same release gives the same report. It would also measure how often each conformance case flips over several runs. A substitution test for a non-deterministic binding needs a rate, not a single pass.

A cache alone would hide that rate from the person reading the report. A verdict that flips often would look as settled as one that never flips. So a report should carry how far several samples agreed, and not only the first answer.

## What a class declares, what setup supplies

A class should not care which tool provides what it needs. A proofreader needs the text of a document. Whether the text came from a local file, a wiki page or a shared doc is the setup's business. This is ports and adapters: the class declares a port, and each setup plugs in an adapter.

The first version drew this table in the abstract. This is the table the built class used on Nov 9, through version 0.2.0. Version 0.3.0 added a fourth capability, the diff of each change. The paper 2 material has why.

| The class owns | Supplied by setup | Supplied per run |
|---|---|---|
| The steps, as code | The command bound to each capability | Which release to review |
| Three capabilities and their JSON shapes | The tracker's status names, mapped to the class's five states | Which code branches it covers (designed, not built) |
| The fuzzy function, its prompt and its output schema | The binding for the fuzzy function: a model name or a command | |
| The gap kinds and the report shape | Where the report is written, and who signs off | |
| Conformance tests | The class version this setup is pinned to | |

**A binding is a command that prints JSON.** A capability's binding is an argument list. The class fills the release id into it, passes any list on standard input, and reads JSON from standard output. A nonzero exit or a wrong shape stops the run, and no partial report is written. A report built on a half-read system would look complete and be wrong. Any language works, and a test can bind a fixture with no mocking. The cost is one process per call. I chose this over a tool server per source, which needs a server running and a model in the loop to call it. The choice is still marked proposed in my notes.

**A binding can also be a closure.** For a class that runs as a subagent, the simplest binding fetches the text before the class runs and hands it over, so the class needs no tools at all. 12-Factor Agents recommends the same move inside one agent loop, as pre-fetching context (its bonus "factor 13"). In Claude Code, a PreToolUse hook on the call that starts the subagent can rewrite the subagent's prompt, so the text arrives without passing through the parent's context. A PostToolUse hook on the parent's own fetch can save the raw result to a file and hand the parent a short note instead. Both hooks are now merged, and the proofreader uses them. A command that prints JSON is the same idea for a class that runs as a program.

**Setup is checked when it is made.** The npm port has a command that validates a setup file against the contract and calls each capability once. A team proves its bindings before the first real run, the way a constructor rejects bad arguments.

**An agent's place moves to setup time.** The port has no agent binding kind yet. Instead, its skill tells a coding agent how to write a command binding for a new team, once, and prove it with that check. The agent's open-ended work happens when the class is set up. A run of the built class has none.

Declared capabilities make a class portable across tools. The prompt side is less portable. The same instructions act differently on another model, so each model needs the conformance check above. The build ran it on two models from one vendor, and under no other coding agent.

Memory is one more capability. A class declares a store the way it declares anything else, and setup binds it. How a class learns into that store, and how the store stays true, is the subject of the second paper.

## The program drives, the model fills functions

A fuzzy function is a typed function with no body. The class declares its signature and output schema. Setup binds it.

```js
/** Does this change do what its ticket asked? */
async function changeMatchesTicket(ticket, changes): {verdict, reason}  // no body
```

The verdict is one of `matches`, `partial`, `unrelated` or `unclear`. In the built class, a model binding runs the class's own prompt as a one-shot call with a JSON schema, and reads the result from the structured output. A command binding gets the same input and prints the result. If the call fails, times out, or returns output that does not match the schema, the verdict is `unclear`. The caller never handles an exception.

**The call must strip the runner's own agent configuration.** This is the coding agent's configuration on the runner's machine. It is not the class's setup. A plain one-shot call to a coding agent loads all of it: instructions, hooks, skills and tool servers. A three-word call to a small model cost $0.149 that way. With the tools, settings and tool servers switched off, the same call cost $0.0011. That is what the configuration costs on every call. It is not how much cheaper a real call gets, because a real call also carries a ticket and its changes. The stripped call is also the right shape for a small function. It should see only its inputs. Whatever a larger function might be given on purpose, such as tools, the runner's own configuration should not leak into it by accident.

**The runner's own provider and auth.** The class runs with the provider and authentication of whoever runs it, and takes only the inputs its contract declares. One catch turned up. The stripped call ignores provider settings kept in the coding agent's own config file. A provider must be configured in the shell, or the model binding never reaches it. The package's documentation and its failure message now say so.

**One small call per item is enough for now.** The class calls the function once for each ticket that was both planned and shipped. The scored runs that called a model cost between $0.08 and $0.14 with a mid-size model. Batching or caching for cost can wait until a release is large enough to need it. Caching for stable answers is a separate matter, covered above. The class makes its calls one after another today. Each call depends on no other call, so they could run side by side, go to a batch interface, or be skipped on a re-run when an item has not changed. The paper 2 material lists these as ideas to test.

**Not an agent loop.** My first summary was that a class recreates a very simple agent loop with only the pieces it needs. The build showed something sharper. In an agent loop, the model decides the next step. In a class, the code decides the steps of the run. In the built class, the model fills one typed function per item, with no tools and no memory, schema-checked. A real loop comes back only where a step needs open-ended exploration. There are three shapes for that. One is an agent binding for one capability. One is a fuzzy function that runs a loop of its own, with tools, inside the one function. In both of those the code still drives, and the loop stays inside one step. The third is the shape where an agent drives and calls scripts for the exact parts. That shape may be more powerful. All three are harder to test, and none is built.

**An event-loop reading.** A JavaScript programmer would see the same split. The event loop is the part that must be exact, and replacing it with an agent goes against the principle. A loop inside one function body is a different thing, and leaves the event loop exact. The useful version is the inversion: the program is the runtime, and the model fills some function bodies. A human gate is an awaited promise. A failed handoff with nowhere to go is an unhandled rejection, which is the dead-letter question under Open questions.

## Pinning

The first version said a team should "depend on a versioned class" and gave no way to do it. The build gave one.

The class is an npm package installed from a git tag. npm resolves the tag, and the lockfile pins the exact commit. A setup names the version it was written for, such as `release-review@0.2.0`. The class refuses to run a setup pinned to another version, and names both. So a class change never silently reinterprets an old setup. Updating is a deliberate re-pin, not whatever is on the main branch.

The pin is fixed when the class is set up, and every run uses it until someone re-pins.

**What the pin does not cover.** The review found this. The pin covers the class's code and contract. It does not cover the two parts most likely to change under it. A setup binds the fuzzy function to a model name, and the example setup in this repo uses a short alias. A vendor can point an alias at a newer model. Every verdict could then change with no new class version and no re-pin. The coding agent's command-line tool, which makes the call, is not pinned either, and the stripped call depends on how its flags behave. So "a class change never silently reinterprets an old setup" is true, and a model change still can. A setup should name a dated model id, and each report should record the exact model and tool version that produced it. Neither is built.

One detail cost time. npm cannot install a package from a subfolder of a git repo. It ignores the syntax for a subfolder and installs the repo root, with no error. So each release is a tag on a split commit that holds only the class's folder.

## When is a repeated thing worth a class?

The harness engineering article says neither kind of check reliably catches "overengineering and unnecessary features". That points at one more thing worth naming: judgement about whether a thing should exist at all. Fred Brooks's conceptual integrity is a neighbouring idea. It is better for a system to "omit certain anomalous features and improvements, but to reflect one [coherent] set of design ideas".

Agents make it easy to build things nobody needed, often by accident, like a helper script written for a one-off. A one-off is an instance with no class. It has three possible fates:

1. Delete it.
2. Keep it local to the task.
3. Make it part of a class.

Once a thing has earned its place, the next question is whether it belongs to one task or to every task. Move it into the class only when both hold:

- It keeps coming back (the rule of three, as Fowler tells it in Refactoring: refactor the third time you do something similar).
- It holds for every instance, not just this one.

A one-off that keeps coming back is a missing piece of the class. The same rule held back the build. The code for a typed model call stays inside this one class. It moves into a shared library only when a second and third class need it.

## Worked example: release review

**How setups get shared today.** Agent setups are often shared by copying files into your own folder and editing them until they fit. That copies a finished setup, not the process behind it. It drifts as soon as you edit it, and the author's later fixes never reach you. Claude Code plugins fix much of this. A plugin is a versioned bundle of skills, agents, hooks, tool servers and more, installed from a marketplace per user or per project, and it can ask for settings when it is enabled. That is a constructor. Spec Kit goes further: presets and workflow overlays let a team adapt an installed process without forking it. What both lack is declared capabilities. Their parts name specific tools, servers and plugins, rather than declaring a need that any tool could fill.

[Diagram: release review · one agent split by job, and a class built for the step with no agent]

**Before: one agent, then a split.** I built a release-review agent for one team's release process. It mixed the process with that team's details: their repo, their release skills, my names and note paths. In early November I split it by job, following single responsibility. Code review went to a review agent. Preparing tickets and handing the release to testing went to a hand-off agent. Closing tickets that skip testing went to a script. The exact work moved into a script, and each agent kept only the permissions its step needed.

One step was left with no owner: compare what shipped with what was planned, and flag the gaps. That step was the first class.

**Why that step.** It had all the parts a class needs, already present:
- The exact part is most of the work. Joining tickets to changes and finding the gaps is plain code.
- There is one fuzzy step that is easy to name: does a change do what its ticket asked?
- There is a gate already: a named person signs off a release.
- The status map had real work from the start. The one real setup covers two projects in the tracker, and they name the same release states differently.

**The class.** This is the class as built on Nov 9, before 0.3.0 added a step that fetches diffs. For one release, the program:
1. loads the setup and checks the pin;
2. calls the three capabilities: the planned tickets, the release's changes, and the tickets those changes name;
3. joins tickets to changes and computes seven kinds of gap, such as "shipped but not planned" and "a change with no ticket";
4. calls the fuzzy function once per ticket that is both planned and shipped;
5. writes a report for people and the same data as JSON, marked as a draft that needs sign-off.

The class never writes to the tracker or to the code host. Its five states (to do, in progress, awaiting testing, in testing, done) are the class's own. Setup maps the tracker's status names onto them, and a status that is not in the map is always reported, never treated as fine.

**The class/setup split, tested.** I bound the class twice. A fixture setup binds every capability to a command that prints fixture JSON, with a planted case for every gap kind. One real setup binds the same capabilities to the team's tracker and code host. The class holds no ticket keys, project names, hosts or paths from the real setup. A test in my process repo fails if any of the real setup's names appear in it. Binding the real setup took no commits to the class. The live runs then exposed limits in the class's own rules, below, which are documented and not yet fixed. The tests are deliberately able to fail: with one gap rule removed, six tests fail, and with it restored they pass.

**Where a port ends and a binding begins.** The first version listed a risk: a capability can quietly carry one tracker's meaning. The build showed it, three times.

- **A release's name is not its identity.** The class treats the release id as an opaque string, and the binding turned it into code branches. The binding assumed that a release's fix version names its branch, and that branches sort by the date in their name. Both were false. One fix version was renamed after the release shipped, under the same tracker id. One branch named for an earlier date was cut after a branch named for a later date. Each gave a wrong release window with no error, and a report that looked complete.
- **The class's own rules leaked the domain too.** The class lists "earlier work" apart from gaps: a done ticket that carries another release's fix version. But fix versions are opaque to the class, so it cannot tell earlier from later. Tickets stamped for a later release, or for a hotfix, were listed as earlier work.
- **A rule assumed when the review runs.** The setup names which states a shipped ticket should be in at review time. That fits a review at hand-off. On a release reviewed weeks later, every ticket had moved on, and the rule gave false alarms.

The review found a fourth leak, by reading the class and not from a run.

- **The class's own words name one kind of tracker.** The prompt says "Jira ticket". A gap message says "MR". The setup has a field for a fix version. The test for real names does not catch these, because they are a vendor's vocabulary and not the team's names. A team whose tracker has no fix versions would meet this before anything else.

The lesson is about where a port ends. A port can carry an opaque id across the line. It cannot ask the binding to derive facts from that id that only a person knows. When I guessed the branches from the fix version, the guess was subtly wrong in ways no test caught. When I had to fix one run, the fix was a per-run value smuggled into a setup file. The design now has the person running the class name the branches as run inputs, which setup declares and fills into the binding's arguments. That is designed and not yet built. An order of fix versions, for earlier work, would come from setup. That is also not built.

**Scored against long hand-run sessions.** Before the release skills existed, two of this team's releases were each reviewed in one long session or a pair of sessions. Their work notes record what each session found when it reconciled planned against shipped. I wrote those findings down as ground truth, committed them, and then ran the class on both releases. Each release had seven findings the class could in principle report.

The labels mean this. A hit is a finding the class reported under the matching gap kind. Plausible means the report is consistent with the finding, but the items could not be paired or shown. Matching by kind only means the class reports the right kind today only because the ticket has since moved; on the day it would have said something else. Partial covers part of a finding.

| Release | Result | Model cost | Session cost (upper bound) |
|---|---|---|---|
| A, as briefed | 0 of 7. A setup failure: the renamed fix version and the misordered branches. | $0.00 | $58.49 |
| A, re-run with a corrected window | 1 hit, 2 plausible, 1 matching by kind only, 3 missed because the tickets have moved since | $0.08 | |
| B | 3 hits, 1 partial, 2 matching by kind only, 1 missed because the ticket moved since | $0.14 | $10.26 |

Beyond the ground truth, the class found one real new gap on each release, and two false ones on B. It also raised false gaps on tickets the ground truth already covered: six on A and three on B. Four of these nine came from one binding defect: some merge requests label their ticket line differently, and the binding read only one label. The other five were status gaps.

Two things follow about what the table measures.

- **It shows what was found, not how much of the report was right.** Release B's 3 hits came with 5 false gaps: the two false new ones and the three on covered tickets. Release A came with 6. A person signing off has to read through those.
- **It scores the code, not the model.** Every hit is a gap kind, and the join code computes the gap kinds. The fuzzy function's verdicts are no part of this score.

The seven findings per release are the ones the class could report. This paper does not give how many findings the sessions recorded in all. So the table says nothing about what a session finds that a class cannot.

On human effort, release B is the fair point. The session took 3 typed messages and 81 words to reach its first hand-off list. The class takes one command and a sign-off. Release A's count measures mostly code review and skill building, so it is not comparable.

Caveats on the scored comparison:
- **Release A as briefed failed.** The re-run is a diagnostic. Its window is wider than A's branch, so its counts are not purely A's.
- **The tracker has drifted.** The class raised eleven gaps for a ticket in an unexpected state across both releases. Every one fired because the ticket moved after the sessions. No status row shows what the class would have said on the day.
- **The session costs are upper bounds.** Those sessions also reviewed code, wrote to the tracker and ran the deploy.
- **The ground truth is only what the sessions wrote down.** A gap the sessions never noted can be checked live but not scored.
- **The ground truth may not be blind.** A class run on an overlapping window wrote its report four minutes before the ground truth was committed. Git cannot show whether its author read it.
- **The same model family built the class and scored it.** The first scoring counted 4 hits on A and 6 on B. A review on the day of the build, not the review of Nov 12, downgraded six rows. The table above is the second round of scoring.
- **The numbers are small.** Seven findings per release, two releases.

**Token use, release B.** The session's dollar cost includes unrelated work, so I counted tokens in its transcript up to the first message naming the tickets to hand to testing. That list is the session's answer to the step the class does, though it gives no verdict per ticket. This is a direction from one release, not a ratio: the class's calls were recorded in dollars, not tokens, and the session ran on a larger model than the class.

| | Hand-run session, to the hand-off list | Hand-run session, whole | Class, run from a shell |
|---|---|---|---|
| Model calls | 19 | 178 | 8, worked out from the report: one per ticket both planned and shipped |
| Tokens | 1.34 million | 29.8 million | not recorded |
| Share read from the prompt cache | 94% | 99% | not recorded |
| Output tokens | 8,762 | 111,919 | not recorded |
| Cost | under $10.26 | $10.26 | $0.14 |

The session's cost up to the hand-off list is not known exactly, because the token meter reads each session's total and keeps no price table.

The two costs have different shapes:
- **The session.** Each call re-read the conversation so far, about 71,000 tokens a call up to the hand-off list, nearly all from the cache. The conversation held the agent's setup, the skill's text and every tracker and git result.
- **The class.** Each call starts with the runner's agent configuration stripped and sees only the prompt, one ticket and its changes. The tracker and git work is code, so it costs no tokens.

So an agent's cost should grow with its turns, each costing more as the context fills, while the class's grows with the number of tickets. One release cannot show the growth itself.

The class column is the class run from a shell. Run by an agent through its skill, the class costs more, about three times as much on the one release where both were run (below).

**The fuzzy function, scored.** The conformance set has 16 ticket and change pairs with known verdicts. A model passes at 80% correct. It also fails on any hard miss: a `partial` or `unrelated` case answered `matches`, because that error hides a gap, while the others only add noise. The 80% bar is a placeholder. A small model scored 16 of 16 for about a cent. A mid-size model scored 15 of 16, and its one miss was soft. The same agent wrote the cases and the prompt, so I reviewed the cases and decided the borderline ones myself. They are still not held out.

The review added three limits to these scores.

- **The set is too small to certify much.** With no misses in 16 cases, the true accuracy could still be as low as about 83%. That is the 95% bound, worked out as 0.05 to the power 1/16. The set in this repo, at 0.3.0, has 19 cases, and 10 of them expect `partial` or `unrelated`. The paper 2 material records a score of 17 of 19 on it with no hard miss. No hard miss in 10 cases still allows a hard-miss rate of up to about 26%, worked out the same way as 1 minus 0.05 to the power 1/10. The hard miss is the error the class cares about most, and the set cannot rule it out.
- **Version 0.2.0 judged text, not code.** Its function saw each change's title and description and no diff. The paper 2 material tells how a later run showed that. So these scores, and every live verdict in this paper, compare a ticket with what a commit message says.
- **The function has not been scored on live data.** The paper 2 material records live runs where 29 of 29 and 8 of 8 verdicts were `matches`, and nobody scored them. A function that always answers `matches` would print the same. The conformance set is the only evidence so far that the function can tell a gap from a match.

**A smaller example: a proofreader.** A cold-read proofreading agent splits the same way. The class fixes how it reads: once, with no prior context, contradictions and seams first, report only. Each setup adds its house rules, such as a workplace style guide, and binds where the text comes from. Its closure binding is the one described above, and it is merged.

## What exists today, and what it does not show

**Built and run:**

- **One class, two implementations.** The release-review class was built in Python (version 0.1.0) and ported to an npm package (0.2.0). The port carries all 66 Python tests under the same names, plus 29 new ones. Its contract is written as JSON Schema.
- **Two setups.** One fixture setup and one real setup, with no real names in the class. The paper 2 material records a second real setup a day later, in another repo of the same team. It bound version 0.2.1 with no class edits. Its first run then showed a missing input, and that became 0.3.0.
- **Three live runs** on one team's past releases, at up to $0.14 each in model calls.
- **A scored comparison** against two long hand-run sessions, with the results and caveats above.
- **Conformance scores** on two models.
- **An agent can run it from the contract alone.** A fresh coding-agent session, in a scratch project with the package installed by tag, was told to use the agent-class to review a release. It loaded the class's skill, ran it with only the two declared inputs, a setup file and a release id, read the report and asked for sign-off. That was a fourth live run, of release A's corrected window with the real setup. It took 5 turns and cost $0.19 for the agent, on top of $0.07 for the class's own model calls. The same review run from a shell cost $0.08, so the agent route cost about three times as much. Most of the agent's share was context: its first turn wrote 39,000 tokens of setup to the prompt cache, and later turns re-read them.
- **Pinning by tag**, and refusal of a setup pinned to another version.
- **The proofreader's closure binding**, merged and in use.
- **Fixed commands for repeated one-offs.** My agents kept editing task notes with hand-written scripts, which broke twice in one night on apostrophes. Two small fixed commands replaced them, and a full day of use followed without a failure.
- **The gate caught what every check passed.** The first version of the closure binding passed its tests, a live run and a review agent. It started a second agent session just to turn a tool result into text, with waits and retries. I rejected it as the wrong design, and the rework removed every timeout. The reviewer covered the known cases, and a human caught the new one.

**Not built or not shown:**

- **One user, one class, one team's setup.** Sharing across people and teams is untested. A second team's setup with no class edits is the next test.
- **One coding agent, one vendor.** The class ran from Claude Code and a shell. The two models scored are from the same vendor.
- **A pinned model**, by a dated model id, and a report that records the model and tool version, are not built.
- **A test of meaning for capabilities**, a past release with a known answer, is not built.
- **No live score for the fuzzy function.** No person has scored its verdicts on a real release.
- **No build cost.** This paper gives the cost of a run and not the cost of building the class. Without it there is no break-even point: the build cost divided by what one run saves.
- **No work where a class does not fit.** The step was chosen because it fit. Nothing built shows where the pattern stops.
- **Run inputs** for the per-run branches, and an order of fix versions, are designed and not built.
- **Stable answers** for the fuzzy function, by cache and flip rate, are planned and not built.
- **No agent binding kind.** An agent writes bindings at setup, but no capability is filled by an agent at run time.
- **Composition** is untested. No class uses another.

## Where the evidence supports or weakens the claim

**It supports:**

- **The exact/fuzzy split holds, on a step picked for it.** Almost all of the work was code, and the one judgement cost cents per release. By line count, the class's source in this repo is 884 lines, and the two files that call the model are 89 of them. The hand-run sessions cost $10 and $58, but those are upper bounds that include other work, so the comparison is not like for like. The token table above has the closer comparison, for release B up to the hand-off list. It is a direction and not a ratio. The step was chosen because its exact part was most of the work. The split is confirmed where it was expected, not in general.
- **The class/setup split holds at the smallest scale.** A fixture setup and one real setup bound the class with no change to its code. A fixture is a test double, not a second team. A second real setup, of the same team, also bound with no change, but its first run showed an input the contract lacked, and the class changed (paper 2 material). So the split held for binding and not for what the contract asked for. A fresh agent ran the class knowing only the contract.
- **The tests fix the report, whatever the language.** Two implementations in two languages gave the same report on a real release, with the fuzzy function held constant. The second version read this as "the contract is the class, not the code". That is more than it shows. The port was written with the first implementation's source in view, as a translation, and it carried that implementation's tests across. An implementation written from the contract file alone would test the stronger claim. It might also be shaped differently, since a translation keeps the first language's habits.
- **The pinning mechanism is cheap once a class is a package.** npm and a lockfile already do it. Running it was not free. The paper 2 material lists what it met: a tag on a split commit, squash merges, a package name open on the public registry, and one repo's install scripts.

**It weakens or qualifies:**

- **The domain leaks.** Ports drawn in the abstract carried wrong assumptions about the domain in three places: the binding, the class's own rule, and a setup rule. A class design needs a live run against a real setup before its ports are trusted.
- **A class can fail silently and look complete.** The worst result, 0 of 7, came with no error. The class's own guard, a gap for an empty release, did not fire, because the wrong window was small, not empty.
- **Evidence for the class's value is thin.** Two releases, drifted tracker state, a ground truth that may not be blind, and one model family on both sides of the scoring.
- **A model held to Liskov needs a rate.** One pass on a conformance set says little about the next run.

The review of 2026-11-12 added these.

- **The supported part is not the new part.** The cost result belongs to a script with one model call. The part a class adds, sharing through capabilities, bindings, a pin and conformance, rests on one team.
- **The Liskov check tests shape, not meaning, for capabilities.** A binding can pass every test and still be wrong, and one was.
- **The fuzzy function is the least tested part.** Its scores come from 16 cases written with its prompt, on a version that saw no code, and it has no score on live data.
- **The pin leaves the model unpinned.** A model alias can change every verdict with no new version.
- **"Refactored" is not literal.** The class did not reproduce the sessions' findings.
- **Drift moves, it does not vanish.** Bindings were copied between two repos and fixed by hand in each.
- **The class names one kind of tracker in its own text.** That is a fourth domain leak.
- **The report carries false gaps.** Release B's 3 hits came with 5 of them.

## Prior art and credits

Most of the parts have names elsewhere. What I have not found in the sources I have read is the combination: a class that owns its steps, declared capabilities, typed fuzzy functions, output shape and tests, bound at setup to commands and a model, and pinned by version.

I read the harness engineering article, every factor of 12-Factor Agents and the Claude Code plugin docs in full, and checked the Spec Kit README against the paper. The other rows come from each source's main page or README.

| Source | What it covers | What it leaves out, next to this paper |
|---|---|---|
| Harness engineering (Birgitta Böckeler, April 2026) | Guides and sensors, the outer harness, a steering loop, harness templates as a possible next step and their drift from upstream | Declared capabilities bound at setup |
| 12-Factor Agents (Dex Horthy, HumanLayer) | Building one production agent: mostly deterministic code, tools as structured outputs, pre-fetching context, contacting humans through tool calls | Sharing a setup across teams |
| Effective harnesses for long-running agents (Anthropic, November 2025) | An initializer session and later coding sessions, with a progress file, a JSON feature list and git history, so each fresh session knows where the work stands | Declared capabilities; sharing the process across teams |
| Beads and Backlog.md | Work items for agents: Beads as a dependency-graph issue tracker, Backlog.md as Markdown files in the repo | The process that does the work |
| GitHub Spec Kit | Shared processes installed into a project for many coding agents, adapted through presets, extensions, workflow overlays and team bundles | Declared capabilities |
| Claude Code plugins | Versioned bundles of skills, agents, hooks and tool servers, installed from marketplaces, with settings asked for at setup | Declared capabilities (parts name concrete servers and plugins) |
| Context engineering (term popularized by Tobi Lütke and Andrej Karpathy, June 2025; summary by Philipp Schmid) | The system that assembles what each model call sees, including memory and tools | How the process that makes those calls is shared and bound |
| DSPy signatures and Marvin's AI functions | A typed function whose body a model supplies | Not yet read against this paper, and the closest prior art to the fuzzy function. Until it is read, the novelty claim above is provisional. |

**Raised in review, not yet read.** The review of 2026-11-12 named these as close prior art. The reviewer described them from memory. I have not read any of them against this paper, so each row is a lead to check, not a finding. Like the DSPy row, they keep the novelty claim provisional.

| Source | Why the review called it close |
|---|---|
| Workflow engines, such as Temporal and Dagster | A fixed program that calls out to bound resources, with a step that waits for a person |
| Reusable CI workflows, such as GitHub Actions reusable workflows and GitLab CI components | A shared, versioned process with declared inputs, pinned by commit |
| Compatibility test kits, such as the Java TCK and the Kubernetes conformance suite | Tests that any implementation of an interface must pass |
| Record linkage, after Fellegi and Sunter | Exact blocking, a fuzzy match on each pair, and a band of pairs sent to a clerk. It has long-standing methods for error rates |
| BAML, Instructor and TypeChat | A typed, schema-checked model call |
| Compound AI systems (Berkeley AI Research, 2024) | A name for a program with model calls inside it |
| Inter-rater reliability, such as Cohen's kappa | An existing measure for how often two readings of one item agree, which is what a flip rate is |

**Borrowed ideas.**

- Object-oriented design: classes, constructors, abstract methods, and the SOLID principles, with Barbara Liskov's substitution principle as the conformance test.
- Ports and adapters (Alistair Cockburn's hexagonal architecture) and dependency injection, for declared capabilities and bindings.
- The split between workflows and agents, which puts a class on the workflow side.
- The rule of three, credited to Don Roberts in Martin Fowler's Refactoring.
- Fred Brooks's The Mythical Man-Month, for conceptual integrity, and his essay No Silver Bullet, whose split between essential and accidental complexity is the plain-words split between the mechanics and everything beyond them.
- Package managers and lockfiles, for pinning.
- The Twelve-Factor App, which wrote cloud patterns down years after cloud took off. It is the model for writing these down once the agent layer settles.

## Open questions

- **Composition.** Is a team's extra check an override, an added step, or a second class? Can one class use another, such as a release review that calls a proofreader? Nothing built so far answers this.
- **Run inputs.** Which values does a class declare as per-run, and how does a binding receive them? The design fills them into the binding's arguments.
- **Where an agent belongs.** Today an agent writes bindings at setup. When does a capability need an agent at run time, and how is that binding tested? The same question holds for a fuzzy function that runs a loop of its own. One answer to try: if the contract and its tests are the class, then an agent loop that passes them is a valid way to run it. That would give up the exact steps and keep the contract. Better models would then change what fills a class, not whether to have one.
- **The smallest class format** that works across coding agents. JSON Schema in one file worked for one class under one coding agent.
- **Failed handoffs.** A dead-letter channel, where undeliverable messages go, asks where a failed handoff goes. The class stops the run and writes nothing, which is one answer.
- **Structured briefs.** Do handoff briefs with named fields beat prose ones?

## Questions for the thesis

The thesis rests on one user, one class and one coding agent. These are the questions that decide whether it holds beyond that.

1. **Does the class/setup split survive a second team?** A second team's real setup, bound with no edits to the class, is the test. The domain leaks found so far suggest the first draft of any port will need changes.
2. **Does a class stay valid on another model and under another coding agent?** So far it has run on two models from one vendor and one coding agent. The Liskov claim needs a different vendor and a different coding agent.
3. **Is a class worth more than a good session?** The comparison is two releases, scored by the same model family that built the class, against drifted state. A held-out ground truth, scored by someone else, on a release reviewed at hand-off time, would be a fair test.
4. **Can a non-deterministic function honour a fixed contract?** Caching gives the same report on a re-run. It does not make the first answer right. The flip rate will show how far a model binding is from a function.
5. **Where does the line between port and binding go, in general?** One rule from today is that a port may carry an opaque id but not ask a binding to infer facts a person knows. It is one data point.
6. **Do classes compose?** A thesis about classes needs at least one class that uses another.
7. **Does the rule of three hold for the class runtime itself?** A shared library for typed model calls waits for three classes. Only one exists.
8. **What does a class add to a script with one model call?** The answer on offer is sharing. A second team, and the build cost set against the runs it saves, would test it.
9. **Where does a class not fit?** One piece of work tried as a class and given up would mark the edge. So would a rule that says in advance which work fits.
10. **Can the fuzzy function tell a gap from a match on live data?** Live verdicts scored by a person would show it. So would real tickets paired on purpose with the wrong changes.

## Where else the shape may fit

This section is from the review and rests on no run. It is a list of places to try a class, not a result.

The release review has a shape. Code joins two or more lists. A model judges one item at a time against a fixed question. One kind of wrong answer costs far more than the others. A person already signs off the result. Other work may have the same shape.

| Work | The exact part | The fuzzy function | The costly error |
|---|---|---|---|
| Audit evidence for a security standard | join each control to its evidence | does this evidence satisfy this control? | accepting weak evidence |
| Invoice, order and receipt matching | the three-way join and the totals | are these two lines the same goods? | paying a mismatch |
| Contract review against a house playbook | split into clauses, walk the checklist | does this clause conform? | passing a clause that deviates |
| Triage of static-analysis and vulnerability findings | join each finding to its code | does this finding apply here? | dismissing a real one |
| Screening papers for a systematic review | remove duplicates, list the criteria | include or exclude this abstract? | excluding a relevant study |
| Translation checks | placeholders and lengths | does the meaning survive? | passing a wrong meaning |
| Action items after an incident | join each action to its ticket and change | did this change do the action? | closing an action nobody did |
| Documentation drift | join each documented command to its code | does this paragraph still describe this code? | passing a stale page |

Two of these would test open questions here. Audit evidence is work many organisations share while their tools differ, which is the second-team test. Action items after an incident could reuse the release review's own fuzzy function, which tests composition and the rule of three.

The shape fits less well where the next thing to fetch depends on the last result, or where a judgement needs several items at once. Such work might still be done with a larger fuzzy function, at a cost in what can be tested. None has been tried. A process that changes faster than a team re-pins is also a poor fit.

## The second paper: classes in action

This paper describes a class at rest: what it declares, what setup supplies, and how it is shared. The second describes a class at work, and how it learns from its own runs:

- memory: the store a class binds, kept true as of now, against each instance's own state, true as of when it was written;
- promotion: how a lesson from one run becomes part of the class, and the gate it passes;
- self-maintenance: counting friction across runs, repairing forward, and a scheduled cleanup in place of a gate on every write;
- traps, and one-line warnings an agent sees unprompted;
- scope: one store per subject, layered like nested scopes;
- the evidence: a trap A/B test where a written fact changed what agents built.

## For paper 2

Material from 2026-11-09 that belongs in the second paper:

- **Work notes as ground truth.** The scored comparison was possible only because the hand-run sessions had written their findings into work notes. Those notes were the instance state of finished work, read back later as evidence.
- **True as of when written.** The tracker drifted after the sessions, and every status gap fired because of it. That is the memory paper's split between a note true as of when it was written and a store true as of now, showing up in a test.
- **Human decisions promoted into tests.** Borderline conformance cases were decided by me ("partial" means only that part of the ask is done) and then written into the class's test set. That is promotion through a gate.
- **Three traps from one day.** A plain one-shot model call loads the whole user setup. npm cannot install from a subfolder of a git repo. A release's fix version and branch name do not identify it. Each was silent, tempting and real, which is the bar for a trap.
- **A review that downgraded its own score.** The first scoring overstated the hits, a review caught it, and the correction was logged beside the original line rather than replacing it.
