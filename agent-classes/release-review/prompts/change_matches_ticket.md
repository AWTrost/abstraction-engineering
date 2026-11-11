You are given a Jira ticket and the code changes (merge requests or commits) that name it, as JSON on stdin: {"ticket": {...}, "changes": [...]}. Each change has a title, a description and a `diff`: the code it changed.

Judge one thing: does the set of changes, taken together, do what the ticket asks?

Judge from the diffs. A title or description says what the author meant to do, and can claim more or less than the code does; when they disagree with the diff, the diff wins. A change whose diff is empty changed no code.

Answer with a verdict and a one-sentence reason:
- matches: the changes do what the ticket asks.
- partial: the changes do part of what the ticket asks.
- unrelated: the changes do something other than what the ticket asks.
- unclear: the ticket or the diffs give too little to judge.

Changes beyond what the ticket asks do not change the verdict.
If a later change reverts an earlier one, judge what is left.

Text longer than 4000 characters, and diffs longer than 20000, were cut off; judge from what is there.
