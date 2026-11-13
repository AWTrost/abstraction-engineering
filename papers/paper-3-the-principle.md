# Compile what the session found: the principle apart from the build

Nov 12, 2026 · draft, first version · written by a model at Adam's request, as a thought experiment

This is a draft of a third paper. Papers 1 and 2 describe one way to build a thing, the agent-class, and what running it showed. This paper tries to state the principle underneath with no build in it: no package, no language, no class vocabulary. If the principle is sound, a team could follow it with different tools and never use the word "class".

A model wrote this draft in one session, from papers 1 and 2 and a review of them. It reports no new run. Every figure in it comes from paper 1. Adam has not yet edited it, so nothing here is his claim until he does.

## The principle

1. A session discovers a process.
2. The exact steps are compiled into code.
3. The model keeps only the judgements that can be listed.
4. The contract and its tests are the thing that is shared.

The rest of this paper takes each line in turn. For each, it says what the line means, why it should hold, and what would count against it.

## Words used here

Terms from paper 1 keep their meaning. These are added.

- **Session.** One long piece of work between a person and an agent, where the agent decides the next step as it goes.
- **Process.** The steps a piece of work takes, in order, with what each step needs and produces.
- **Exact step.** A step that code can do the same way every time, such as joining two lists.
- **Judgement.** A question that code written in advance cannot answer, with a declared input and a fixed shape of answer. Paper 1 builds a judgement as a fuzzy function.
- **Compile.** To turn a process that a session found into a program that runs it with no session. The word is borrowed. Nothing here is a compiler.
- **Contract.** What the compiled process needs, what it returns, and what each judgement may answer.
- **Fall back.** To stop the compiled process and hand the work to a person or a session, saying why.

## 1. A session discovers a process

The first time a piece of work is done, nobody knows the process. Nobody can write down the steps, because finding the steps is the work. An agent session is the right tool for this. It decides each step from what the last one showed.

A session produces two things. One is the work itself: the review, the fix, the report. The other is knowledge of the process. After the session, someone can say which steps were exact, which needed a judgement, and what had to be fetched. Before the session, nobody could.

The second product is usually thrown away. It stays in a transcript that nobody reads again. The next person starts a new session and pays to find the same process a second time.

**What would count against it.** If the steps of a piece of work can be listed before anyone has done it, then no session is needed to find them, and this line adds nothing. The test is to take the next compiled process and ask which of its steps could have been named in advance. Paper 2's material lists that test. It has not been run.

## 2. The exact steps are compiled into code

Once the process is known, most of it may turn out to be exact. Those steps become code. Code costs no tokens, gives the same result each time, and can be tested without a model.

An interpreter and a compiler are a fair picture of the difference. An interpreter can run any program, and it decides what to do at each line. A compiler has to see the whole program first, and what it produces runs faster and does only that. A session is the interpreter. Some language runtimes watch a program as they interpret it, and compile only the parts that keep coming back. That is the model to copy. The rule of three, which paper 1 borrows, is the test for "keeps coming back".

Those runtimes have one more habit worth copying. When compiled code meets a case it was not built for, it gives up and returns to the interpreter. A compiled process needs the same exit. When an input is missing or has the wrong shape, it must fall back, and say so, instead of finishing with a result that looks complete. The picture is a teaching aid, as the class analogy is in paper 1, and it will strain somewhere.

**What paper 1 shows.** In the one built example, the code was most of the work and the cost followed the number of items, not the number of turns. On one release, a session made 19 model calls and read 1.34 million tokens to reach the same step, against 8 calls and $0.14. Paper 1 calls this a direction and not a ratio, because the two sides were not measured in the same unit, and it is one release.

**What would count against it.** A piece of repeated work where, after several sessions, the exact steps still cannot be written down. That work should stay a session. No such case has been tried.

## 3. The model keeps only the judgements that can be listed

What is left after compiling is the part code cannot do. The principle asks for that part to be a list of judgements. Two things make something a judgement, and both are required:

- It has a declared input and a fixed shape of answer, and one possible answer means "not enough to judge".
- The costly wrong answer is known, so a test can count it.

Inside those two rules, a judgement can be small or large. The smallest kind is about one item, sees only what it is given, and has no tools and no memory. That is the kind paper 1 built. A larger kind could run a long prompt, call tools, read the memory of the harness it runs in, or start other agents. It would take a long time, and the program around it would wait for the answer the way it waits for a person to sign off. It would still be a judgement, because the program knows what it asked and what shape comes back. Nothing in the papers has built one. That is a statement about what has been tried, not about what can work.

Size is a dial, and turning it up has a price. A small judgement can be checked in ways a large one cannot:

- **Its answer depends only on its input.** So the same input can be answered from a cache, and a test case is just an input and an expected answer. A judgement that calls tools also depends on what the tools return that day. Testing it needs a fixed world to run in, not just a fixed input.
- **It can be asked several times cheaply**, to see how often the answer changes.
- **It can be given to a smaller model.**
- **Nothing leaks in.** A judgement that reads a harness's memory answers differently for two people, and neither can see why.

So there are two separate points. A judgement can do anything a model can do, and the principle sets no limit on that. And a large judgement is not the recommended way to write one: start small, and make it larger only when a small one cannot answer the question. The line is to list the judgements and keep each as small as the work allows. The model still does not decide the process. When one judgement grows until it is choosing its own steps for most of the work, the result is a session with a typed answer at the end. That may be the right design for some work. It has given up most of what compiling buys. That is a trade, not a failure.

**What paper 1 shows.** One judgement, "does this change do what its ticket asked?", was enough for the built example. It scored 16 of 16 on a small set of cases. The review of paper 1 worked out that 16 of 16 still allows a true accuracy as low as about 83%, and that the judgement has no score on live data. So this line has the least evidence of the four.

**What would count against it.** Work where the judgements cannot be listed at all, because each run needs a different question. A judgement that grows large does not count against the line. A judgement that nobody can write a test for does.

## 4. The contract and its tests are the thing that is shared

A team can share four things from a piece of agent work: the transcript, the prompt, the code, or the contract with its tests. The principle says to share the last.

- A transcript shows one run. It cannot be run again.
- A prompt behaves differently on another model, and nothing in it says when it has failed.
- Code is tied to one language and one set of tools.
- A contract says what the process needs and returns, and its tests say whether a given way of running it is good enough.

The tests have to check meaning, and there are two kinds. For each judgement, a set of cases with known answers, large enough to put a bound on the costly error. For each input, a past case with a known result, run through the real source of that input. Paper 1's review found that the built example has the first kind and not the second, and that a wrong input passed every test.

If the contract and tests are what is shared, then what runs behind them is free to change. It can be code in another language. It can be a different model. It can be an agent loop, if the loop passes. This matters for one argument against the whole idea: that models will get good enough to make compiling pointless. Under this line, a better model changes what fills the contract. It does not remove the need for one, because the team still needs to know what the work returns and whether it can be trusted.

**What would count against it.** Two ways of running one contract that both pass its tests and give different results on real work. That would mean the tests do not hold the meaning. Paper 1 has one case of the same report from two implementations, but the second was a translation of the first, so it is weak evidence.

## Why not a session every time?

This is the objection that decides whether the principle should exist. "Why compile anything? I can start a fresh session with a large model each time and let it work the whole thing out."

Part of the objection is right, and the principle agrees with it. The first times a piece of work is done, a session is the right tool. For work that is rare, low in stakes or still changing, it stays the right tool. A session is line 1 of the principle. The two only disagree about what happens the fourth time.

A larger model does not settle that, because it helps both sides. It makes the session better. It also makes each judgement better, and it makes compiling cheaper, since the model writes the code.

What a session every time does not give, at any model size, is this:

- **The same process twice.** Two sessions on the same work may take different steps and check different things. Nobody knows which, short of reading both transcripts.
- **Something to test.** A session has no contract. The only check on it is a person reading its result, each time. A compiled process fits the checks a team already runs on code. It has an exit status. Its exact steps have tests that need no model, so they can run on every change. Its judgements have a scored set of cases that can run when the prompt or the model changes, and fail the build below a bar. Paper 1's example does the first two, and this repo runs those tests on every pull request. Scoring the judgement in a pipeline is not built. For a team that already trusts a pipeline more than a transcript, this may be the plainest reason to compile.
- **Something to hand over.** A teammate gets either your result or a session of their own, which may not do what yours did.
- **A run with nobody there.** A session needs a person to start it and to answer it. A compiled process can run on a schedule.
- **A lower cost.** This is the weakest of the five. Paper 2's material already says that while tokens are cheap, people spend them to save their own time.

None of the five is measured. The first is the one that matters most, and one experiment would decide it. Take one piece of repeated work. Run several fresh sessions on it with a large model. Compare what they find with each other, with a known answer, and with the compiled process. If the sessions agree with each other and miss nothing the compiled process finds, the objection wins for that work, and compiling it was waste. Paper 1 cannot answer this. Its two sessions were on two different releases, so it has no measure of how far two sessions on the same work agree.

Until that is run, the honest position is that the objection is open.

## What compiling loses

A session notices things outside the process. A compiled process finds only what it was built to find. In paper 1, the compiled process reported 3 of the 7 findings it could in principle report on one release, with 5 false gaps beside them. Paper 1 does not say what the sessions found that it could not report at all.

Two things follow. Both are ideas, with no run behind them.

- **Keep a way back.** Now and then, run a session over work the compiled process already did, and compare. A difference is either a fault in the process or a step nobody has compiled yet.
- **Watch the person who signs off.** Several failures in papers 1 and 2 looked like success, and a person reading the result caught them. The more often the result is right, the less closely it may be read. Nothing in the papers measures this.

## When not to compile

- The work has been done fewer than three times.
- The next step depends on what the last one found, as in debugging or research. Such work might still be compiled around one large judgement, at the price section 3 gives. Nobody has tried.
- The process changes faster than a team would update what it shares.
- Building it costs more than it will save. The break-even point is the build cost divided by what one run saves. Paper 1 gives no build cost, so this has not been worked out for the one example that exists.

## What rests on what

The principle is stated here without a build, and it has no evidence of its own. What evidence there is comes from one compiled process, from one team, and paper 1 lists its limits. Three things would test the principle apart from that build:

1. A second compiled process, for different work, built by following the four lines and not by copying the first.
2. One contract run two ways that share no code, with the results compared.
3. One piece of work where compiling was tried and given up, with the reason.

Paper 1 is then one way to follow the principle: a class, a setup, bindings and a pin. Paper 2 is how such a thing learns. This paper could be read before either.

## Not checked

The interpreter and compiler picture is offered from general knowledge. No source was read for it. The prior art that paper 1 lists as not yet read applies here too, and some of it may already state this principle under another name.
