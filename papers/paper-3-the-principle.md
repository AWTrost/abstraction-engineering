# Compile what the session found: the principle apart from the build

Nov 12, 2026 · draft, first version · written by a model at Adam's request, as a thought experiment

This is a draft of a third paper. Paper 1 describes one way to build a thing, the agent-class, and the paper 2 material holds notes on what running it showed. This paper tries to state the principle underneath with no build in it: no package, no language, and no need for the word "class". If the principle is sound, a team could follow it with different tools.

A model wrote this draft in one session, from paper 1, the paper 2 material and a review of paper 1. It reports no new run. Every figure in it comes from paper 1. Adam reviewed it and directed its changes. It is still a draft.

## The principle

1. A session discovers a process.
2. The exact steps are compiled into code.
3. The model keeps only the judgements that can be listed.
4. The contract and its tests are the thing that is shared.

The next four sections take each line in turn. Each says what the line means, what paper 1 shows for it, and what would count against it. The sections after those cover the main objection, what compiling loses, and when it buys little.

Lines 2 and 4 buy different things, and a team can have one without the other. Line 2 buys speed, low cost and the same steps every time. Line 4 buys something to test and something to hand over. This matters later, for work whose steps cannot be written down.

## Words used here

The paper needs only these words. Where it points at paper 1, it uses paper 1's terms as paper 1 defines them.

- **Session.** One long piece of work between a person and an agent, where the agent decides the next step as it goes.
- **Process.** The steps a piece of work takes, in order, with what each step needs and produces.
- **Exact step.** A step that code can do the same way every time, such as joining two lists.
- **Judgement.** A question that code written in advance cannot answer. It has a declared input, a fixed shape of answer that includes "not enough to judge", and a known costly wrong answer. Section 3 has the detail. Paper 1 builds a judgement as a fuzzy function.
- **Compile.** To turn a process that a session found into a program that runs it with no session. The word is borrowed. Nothing here is a compiler.
- **Contract.** What the compiled process needs, what it returns, and what each judgement may answer.
- **Fall back.** To stop the compiled process and hand the work to a person or a session, saying why.

## 1. A session discovers a process

The first time a piece of work is done, nobody knows the process. Nobody can write down the steps, because finding the steps is the work. An agent session is the right tool for this. It decides each step from what the last one showed.

A session produces two things. One is the work itself: the review, the fix, the report. The other is knowledge of the process. After the session, someone can say which steps were exact, which needed a judgement, and what had to be fetched. Before the session, nobody could.

The second product is usually thrown away. It stays in a transcript that nobody reads again. The next person starts a new session and pays to find the same process a second time.

**What paper 1 shows.** The built example came after long hand-run sessions on the same work. Paper 1 does not record which of its steps were unknown before those sessions.

**What would count against it.** If the steps of a piece of work can be listed before anyone has done it, then no session is needed to find them, and this line adds nothing. The test is to take the next compiled process and ask which of its steps could have been named in advance. The paper 2 material lists that test. It has not been run.

## 2. The exact steps are compiled into code

Once the process is known, most of it may turn out to be exact. Those steps become code. Code costs no tokens, gives the same result each time, and can be tested without a model.

An interpreter and a compiler are a fair picture of the difference. An interpreter can run any program, and it decides what to do at each line. A compiler has to see the whole program first, and what it produces runs faster and does only that. A session is the interpreter. Some language runtimes watch a program as they interpret it, and compile only the parts that keep coming back. That is the pattern to copy. The rule of three, which paper 1 borrows, is the test for "keeps coming back".

Those runtimes have one more habit worth copying. When compiled code meets a case it was not built for, it gives up and returns to the interpreter. A compiled process needs the same exit. When something it needs is missing or has the wrong shape, it must fall back, and say so, instead of finishing with a result that looks complete. Paper 1's example does half of this: it stops the run and writes nothing. Handing the work on is not built. The picture is a teaching aid, as the class analogy is in paper 1, and it will strain somewhere.

**What paper 1 shows.** In the one built example, the code was most of the work. Paper 1 expects the cost of a compiled process to follow the number of items, and a session's cost to follow its turns. It also says one release cannot show that. On that release, a session made 19 model calls and read 1.34 million tokens to reach its hand-off list. That list is the nearest thing to the same step, though it gives no verdict per item. The compiled process made 8 calls, a count paper 1 works out from its report, for $0.14. Paper 1 calls this a direction and not a ratio. One side was measured in tokens and the other in dollars, the session ran on a larger model, and it is one release.

**What would count against it.** A piece of repeated work where, after several sessions, the exact steps still cannot be written down. Line 2 gives that work nothing. Line 4 still can: section 3 says how. No such case has been tried.

## 3. The model keeps only the judgements that can be listed

What is left after compiling is the part code cannot do. The principle asks for that part to be a list of judgements. Three things make something a judgement, and all are required:

- It has a declared input.
- It has a fixed shape of answer, and one possible answer means "not enough to judge".
- The costly wrong answer is known, so a test can count it.

Inside those rules, a judgement can be small or large. The smallest kind is about one item, sees only its declared input, and has no tools and no memory. That is the kind paper 1 built. A larger kind could run a long prompt, call tools, read the memory of the harness it runs in, or start other agents. It would take a long time, and the program around it would wait for the answer the way it waits for a person to sign off. It would still be a judgement, because the program knows what it asked and what shape comes back. Nothing in the papers has built one. That is a statement about what has been tried, not about what can work.

**Paper 1 built the small end.** Its class fills one function per item, with no tools and no memory. It says a fuzzy function could do more, and that none that does has been built. This draft says the same of judgements, and adds what turning the dial up costs.

Size is a dial, and turning it up has a price. A small judgement is easier to check, in four ways:

- **Its answer comes from its declared input and the model, and nothing else.** So an answer can be kept in a cache and reused for the same input, and a test case is just an input and an expected answer. A judgement that calls tools also depends on what the tools return that day. What it reads that way is not in its declared input. Testing it needs a fixed world to run in, not just a fixed input.
- **It is cheap to ask several times.** The same input can still get different answers from a model. Asking again shows how often.
- **It can be given to a smaller model.**
- **Two people get the same thing.** A judgement that reads a harness's memory can answer differently for two people, and neither can see why.

So there are two separate points. Beyond the three rules, the principle sets no limit: a judgement can do anything a model can do. And a large judgement is not the recommended way to write one. Start small, and make it larger only when a small one cannot answer the question.

At the far end of the dial, one judgement chooses its own steps for most of the work. That is a session with a declared input and a typed answer. It has given up what line 2 buys: the steps are no longer the same each time, and they cost tokens. It keeps what line 4 buys, because there is still a contract to test and to hand over. That is a trade, not a failure, and for work whose steps cannot be written down it may be the right design.

**What paper 1 shows.** One judgement, "does this change do what its ticket asked?", was enough for the built example. A small model scored 16 of 16 on its set of cases, and a mid-size model 15 of 16. The same agent wrote the cases and the prompt, and the cases are not held out. The review of paper 1 worked out that 16 of 16 still allows a true accuracy as low as about 83%, and that the judgement has no score on live data. So this line has very little evidence.

**What would count against it.** Work where no question can be fixed in advance, because each run needs a different one. That is not the same as work where the steps vary and the question stays the same, which is one large judgement. A judgement that grows large does not count against the line. A judgement that nobody can write a test for does.

## 4. The contract and its tests are the thing that is shared

A team can share four things from a piece of agent work: the transcript, the prompt, the code, or the contract with its tests. The principle says to share the last.

- A transcript shows one run. It cannot be run again.
- A prompt behaves differently on another model, and nothing in it says when it has failed.
- Code is tied to one language and one set of tools.
- A contract says what the process needs and returns, and its tests say whether a given way of running it is good enough.

The tests have to check meaning, and there are two kinds. For each judgement, a set of cases with known answers, large enough to put a bound on the costly error. For each thing the process needs from outside, a past case with a known result, run through the real source. Paper 1's review found that the built example has the first kind and not the second, and that a wrong source passed every test.

If the contract and tests are what is shared, then what runs behind them is free to change. It can be code in another language. It can be a different model. It can even be an agent loop for the whole process, if the loop passes. That last choice gives up line 2 and keeps line 4, as section 3 says of a very large judgement.

This matters for one argument against the whole idea: that models will get good enough to make compiling pointless. Under this line, a better model changes what fills the contract. It does not remove the need for one, because the team still needs to know what the work returns and whether it can be trusted.

**What paper 1 shows, and what would count against it.** Two ways of running one contract that both pass its tests and give different results on real work would count against this line. That would mean the tests do not hold the meaning. Paper 1 has one case of the same report from two implementations. The second was a translation of the first, so it is weak evidence.

## Why not a session every time?

This is the objection that decides whether the principle should exist. "Why compile anything? I can start a fresh session with a large model each time and let it work the whole thing out."

Part of the objection is right, and the principle agrees with it. The first times a piece of work is done, a session is the right tool. For work that is rare, low in stakes or still changing, it stays the right tool. A session is line 1 of the principle. The two only disagree about what happens once the work has come back a third time.

A larger model does not settle that, because it helps both sides. It makes the session better. It also makes each judgement better. It should make compiling cheaper too, since a model writes the code. That last point is an argument and not a measurement.

What a session every time does not give, at any model size, is this:

- **The same process twice.** Two sessions on the same work may take different steps and check different things. Nobody knows which, short of reading both transcripts.
- **Something to test.** A session has no contract. The only check on it is a person reading its result, each time. A compiled process fits the checks a team already runs on code. It has an exit status. Its exact steps have tests that need no model and can run on every change. Its judgements have a scored set of cases that can run when the prompt or the model changes, and fail the build below a bar. The built example has the exit status and the model-free tests, by its README, and this repo runs those tests on every pull request. Scoring the judgement in a pipeline is not built. For a team that already trusts a pipeline more than a transcript, this may be the plainest reason to compile.
- **Something to hand over.** A teammate gets either your result or a session of their own, which may not do what yours did.
- **A run with nobody there.** A session needs a person to start it and to answer it. A compiled process can run on a schedule.
- **A lower cost.** This is the weakest of the five. The paper 2 material already says that while tokens are cheap, people spend them to save their own time.

None of the five is measured. The first is the one an experiment can most directly decide. Take one piece of repeated work. Run several fresh sessions on it with a large model. Compare what they find with each other, with a known answer, and with the compiled process. If the sessions agree with each other and miss nothing the compiled process finds, the first reason falls for that work. The case for compiling it would then rest on the other four. Paper 1 cannot answer this. Its two sessions were on two different releases, so it has no measure of how far two sessions on the same work agree.

Until that is run, the honest position is that the objection is open.

## What compiling loses

A session can notice things outside the process. A compiled process reports only what it was built to report. Paper 1 has no measure of this. Its score counts only findings the compiled process could in principle report, and it does not say what the sessions found beyond those. So this section is an argument and not a result.

Two things follow. Both are ideas, with no run behind them.

- **Keep a way back.** Now and then, run a session over work the compiled process already did, and compare. A difference is either a fault in the process or a step nobody has compiled yet.
- **Watch the person who signs off.** Several failures in paper 1 and the paper 2 material looked like success, and a person reading the result caught them. The more often the result is right, the less closely it may be read. Nothing in the papers measures this.

## When compiling buys little

- **The work has been done fewer than three times.** Stay with a session.
- **The next step depends on what the last one found**, as in debugging or research. There are no exact steps to compile, so line 2 buys nothing. Line 4 may still be worth having, as one large judgement with a contract around it. Nobody has tried.
- **The process changes faster than a team would update what it shares.**
- **Building it costs more than it will save.** The break-even point is the build cost divided by what one run saves. Paper 1 gives no build cost, so this has not been worked out for the one example that exists.

## What rests on what

The principle is stated here without a build, and it has no evidence of its own. What evidence there is comes from one compiled process, from one team, and paper 1 lists its limits. Three things would test the principle apart from that build:

1. A second compiled process, for different work, built by following the four lines and not by copying the first.
2. One contract run two ways that share no code, with the results compared.
3. One piece of work where compiling was tried and given up, with the reason.

Paper 1 is then one way to follow the principle: a class, a setup, bindings and a pin. The second paper will be about how such a thing learns. This paper is meant to be readable first, though all of its evidence is in paper 1.

## Not checked

The interpreter and compiler picture is offered from general knowledge. No source was read for it. The prior art that paper 1 lists as not yet read applies here too, and some of it may already state this principle under another name.
